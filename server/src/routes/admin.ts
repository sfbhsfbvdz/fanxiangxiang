import { Router, Request, Response } from 'express';
import { queryOne, queryAll, execute } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats — 汇总统计
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const [totalOrdersRow, totalRevenueRow, totalUsersRow, activeRestaurantsRow, dailyOrders] =
    await Promise.all([
      queryOne<{ count: number }>('SELECT COUNT(*) as count FROM orders'),
      queryOne<{ total: number }>(
        `SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = 'completed'`
      ),
      queryOne<{ count: number }>('SELECT COUNT(*) as count FROM users'),
      queryOne<{ count: number }>(
        `SELECT COUNT(*) as count FROM restaurants WHERE status = 'active'`
      ),
      queryAll<any>(`
        SELECT DATE(created_at) as date, COUNT(*) as count,
               COALESCE(SUM(total_price), 0) as revenue
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `),
    ]);

  res.json({
    success: true,
    data: {
      totalOrders: totalOrdersRow?.count ?? 0,
      totalRevenue: totalRevenueRow?.total ?? 0,
      totalUsers: totalUsersRow?.count ?? 0,
      activeRestaurants: activeRestaurantsRow?.count ?? 0,
      dailyOrders,
    },
  });
}));

// GET /api/admin/orders — 全平台订单
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const { status, restaurant_id, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (status) {
    conditions.push('o.status = ?');
    params.push(status);
  }
  if (restaurant_id) {
    conditions.push('o.restaurant_id = ?');
    params.push(parseInt(restaurant_id));
  }

  const where = conditions.join(' AND ');

  const totalRow = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM orders o WHERE ${where}`,
    params
  );
  const total = totalRow?.count ?? 0;

  const orders = await queryAll<any>(
    `SELECT o.*, r.name as restaurant_name, u.username, u.email
     FROM orders o
     JOIN restaurants r ON o.restaurant_id = r.id
     JOIN users u ON o.user_id = u.id
     WHERE ${where}
     ORDER BY o.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  res.json({
    success: true,
    data: { items: orders, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
  });
}));

// GET /api/admin/users — 用户列表
router.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const { role, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  const conditions: string[] = ['1=1'];
  const params: unknown[] = [];

  if (role) {
    conditions.push('role = ?');
    params.push(role);
  }

  const where = conditions.join(' AND ');

  const totalRow = await queryOne<{ count: number }>(
    `SELECT COUNT(*) as count FROM users WHERE ${where}`,
    params
  );
  const total = totalRow?.count ?? 0;

  const users = await queryAll<any>(
    `SELECT id, username, email, phone, avatar, role, created_at FROM users
     WHERE ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limitNum, offset]
  );

  res.json({
    success: true,
    data: { items: users, total, page: pageNum, totalPages: Math.ceil(total / limitNum) },
  });
}));

// PUT /api/admin/users/:id/role — 修改用户角色
router.put('/users/:id/role', asyncHandler(async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id as string);
  const { role, restaurant_id } = req.body;

  const validRoles = ['customer', 'merchant', 'rider', 'admin'];
  if (!validRoles.includes(role)) throw new BadRequestError('角色不合法');

  const user = await queryOne<{ id: number }>('SELECT id FROM users WHERE id = ?', [userId]);
  if (!user) throw new NotFoundError('用户不存在');

  await execute('UPDATE users SET role = ? WHERE id = ?', [role, userId]);

  // If assigning merchant role, bind restaurant
  if (role === 'merchant' && restaurant_id) {
    const existing = await queryOne<{ id: number }>(
      'SELECT id FROM restaurant_managers WHERE user_id = ?',
      [userId]
    );
    if (existing) {
      await execute(
        'UPDATE restaurant_managers SET restaurant_id = ? WHERE user_id = ?',
        [restaurant_id, userId]
      );
    } else {
      await execute(
        'INSERT INTO restaurant_managers (user_id, restaurant_id) VALUES (?, ?)',
        [userId, restaurant_id]
      );
    }
  }

  // If assigning rider role, ensure rider record exists
  if (role === 'rider') {
    const existing = await queryOne<{ id: number }>('SELECT id FROM riders WHERE user_id = ?', [userId]);
    if (!existing) {
      await execute('INSERT INTO riders (user_id) VALUES (?)', [userId]);
    }
  }

  res.json({ success: true, message: '用户角色已更新' });
}));

// GET /api/admin/restaurants — 餐厅列表
router.get('/restaurants', asyncHandler(async (_req: Request, res: Response) => {
  const restaurants = await queryAll<any>(`
    SELECT r.*, COUNT(o.id) as order_count
    FROM restaurants r
    LEFT JOIN orders o ON r.id = o.restaurant_id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `);

  res.json({ success: true, data: restaurants });
}));

// PUT /api/admin/restaurants/:id/status — 启用/禁用餐厅
router.put('/restaurants/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = parseInt(req.params.id as string);
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) throw new BadRequestError('状态值不合法');

  const restaurant = await queryOne<{ id: number }>(
    'SELECT id FROM restaurants WHERE id = ?',
    [restaurantId]
  );
  if (!restaurant) throw new NotFoundError('餐厅不存在');

  await execute('UPDATE restaurants SET status = ? WHERE id = ?', [status, restaurantId]);
  res.json({ success: true, message: '餐厅状态已更新' });
}));

export default router;
