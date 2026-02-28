import { Router, Request, Response } from 'express';
import { db } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.js';

const router = Router();

// All admin routes require auth + admin role
router.use(authenticate, requireRole('admin'));

// GET /api/admin/stats — 汇总统计
router.get('/stats', asyncHandler(async (_req: Request, res: Response) => {
  const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM orders').get() as any).count;
  const totalRevenue = (db.prepare(
    `SELECT COALESCE(SUM(total_price), 0) as total FROM orders WHERE status = 'completed'`
  ).get() as any).total;
  const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
  const activeRestaurants = (db.prepare(
    `SELECT COUNT(*) as count FROM restaurants WHERE status = 'active'`
  ).get() as any).count;

  // Last 7 days daily orders
  const dailyOrders = db.prepare(`
    SELECT DATE(created_at) as date, COUNT(*) as count,
           COALESCE(SUM(total_price), 0) as revenue
    FROM orders
    WHERE created_at >= DATE('now', '-6 days')
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `).all();

  res.json({
    success: true,
    data: { totalOrders, totalRevenue, totalUsers, activeRestaurants, dailyOrders },
  });
}));

// GET /api/admin/orders — 全平台订单
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const { status, restaurant_id, page = '1', limit = '20' } = req.query as Record<string, string>;
  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  // Build filter SQL inline to avoid spread type issues
  const statusFilter = status ? `AND o.status = '${status.replace(/'/g, "''")}'` : '';
  const restFilter = restaurant_id ? `AND o.restaurant_id = ${parseInt(restaurant_id)}` : '';
  const where = `1=1 ${statusFilter} ${restFilter}`;

  const total = (db.prepare(
    `SELECT COUNT(*) as count FROM orders o WHERE ${where}`
  ).get() as any).count;

  const orders = db.prepare(`
    SELECT o.*, r.name as restaurant_name, u.username, u.email
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    JOIN users u ON o.user_id = u.id
    WHERE ${where}
    ORDER BY o.created_at DESC
    LIMIT ${limitNum} OFFSET ${offset}
  `).all();

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

  const roleFilter = role ? `AND role = '${role.replace(/'/g, "''")}'` : '';
  const where = `1=1 ${roleFilter}`;

  const total = (db.prepare(
    `SELECT COUNT(*) as count FROM users WHERE ${where}`
  ).get() as any).count;

  const users = db.prepare(`
    SELECT id, username, email, phone, avatar, role, created_at FROM users
    WHERE ${where}
    ORDER BY created_at DESC
    LIMIT ${limitNum} OFFSET ${offset}
  `).all();

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

  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  if (!user) throw new NotFoundError('用户不存在');

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);

  // If assigning merchant role, bind restaurant
  if (role === 'merchant' && restaurant_id) {
    const existing = db.prepare(
      'SELECT id FROM restaurant_managers WHERE user_id = ?'
    ).get(userId);
    if (existing) {
      db.prepare(
        'UPDATE restaurant_managers SET restaurant_id = ? WHERE user_id = ?'
      ).run(restaurant_id, userId);
    } else {
      db.prepare(
        'INSERT INTO restaurant_managers (user_id, restaurant_id) VALUES (?, ?)'
      ).run(userId, restaurant_id);
    }
  }

  // If assigning rider role, ensure rider record exists
  if (role === 'rider') {
    const existing = db.prepare('SELECT id FROM riders WHERE user_id = ?').get(userId);
    if (!existing) {
      db.prepare('INSERT INTO riders (user_id) VALUES (?)').run(userId);
    }
  }

  res.json({ success: true, message: '用户角色已更新' });
}));

// GET /api/admin/restaurants — 餐厅列表
router.get('/restaurants', asyncHandler(async (_req: Request, res: Response) => {
  const restaurants = db.prepare(`
    SELECT r.*, COUNT(o.id) as order_count
    FROM restaurants r
    LEFT JOIN orders o ON r.id = o.restaurant_id
    GROUP BY r.id
    ORDER BY r.created_at DESC
  `).all();

  res.json({ success: true, data: restaurants });
}));

// PUT /api/admin/restaurants/:id/status — 启用/禁用餐厅
router.put('/restaurants/:id/status', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = parseInt(req.params.id as string);
  const { status } = req.body;

  if (!['active', 'inactive'].includes(status)) throw new BadRequestError('状态值不合法');

  const restaurant = db.prepare('SELECT id FROM restaurants WHERE id = ?').get(restaurantId);
  if (!restaurant) throw new NotFoundError('餐厅不存在');

  db.prepare('UPDATE restaurants SET status = ? WHERE id = ?').run(status, restaurantId);
  res.json({ success: true, message: '餐厅状态已更新' });
}));

export default router;
