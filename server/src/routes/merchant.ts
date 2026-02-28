import { Router, Request, Response } from 'express';
import { db } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.js';

const router = Router();

// All merchant routes require auth + merchant role
router.use(authenticate, requireRole('merchant'));

// Helper: get restaurant_id for current merchant
function getMerchantRestaurantId(userId: number): number {
  const row = db.prepare(
    'SELECT restaurant_id FROM restaurant_managers WHERE user_id = ?'
  ).get(userId) as { restaurant_id: number } | undefined;
  if (!row) throw new BadRequestError('未绑定餐厅');
  return row.restaurant_id;
}

// GET /api/merchant/orders — 查看本餐厅当前订单
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);

  const orders = db.prepare(`
    SELECT o.*, u.username, u.phone as user_phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.restaurant_id = ?
    ORDER BY o.created_at DESC
  `).all(restaurantId) as any[];

  const ordersWithItems = orders.map(order => {
    const items = db.prepare(
      'SELECT * FROM order_items WHERE order_id = ?'
    ).all(order.id);
    return { ...order, items };
  });

  res.json({ success: true, data: ordersWithItems });
}));

// PUT /api/merchant/orders/:id/accept — 接单 (paid → preparing)
router.put('/orders/:id/accept', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const orderId = parseInt(req.params.id as string);

  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND restaurant_id = ?'
  ).get(orderId, restaurantId) as any;

  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'paid') throw new BadRequestError('只能接受已支付的订单');

  db.prepare(
    `UPDATE orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(orderId);

  res.json({ success: true, message: '已接单' });
}));

// PUT /api/merchant/orders/:id/ready — 备餐完成 (preparing → delivering)
router.put('/orders/:id/ready', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const orderId = parseInt(req.params.id as string);

  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND restaurant_id = ?'
  ).get(orderId, restaurantId) as any;

  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'preparing') throw new BadRequestError('只能标记备餐中的订单');

  db.prepare(
    `UPDATE orders SET status = 'delivering', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(orderId);

  res.json({ success: true, message: '备餐完成，等待骑手取餐' });
}));

// GET /api/merchant/menu — 获取本餐厅菜单
router.get('/menu', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);

  const categories = db.prepare(
    'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order'
  ).all(restaurantId) as any[];

  const result = categories.map(cat => {
    const items = db.prepare(
      'SELECT * FROM menu_items WHERE category_id = ? ORDER BY id'
    ).all(cat.id);
    return { ...cat, items };
  });

  res.json({ success: true, data: result });
}));

// POST /api/merchant/menu/categories — 新增分类
router.post('/menu/categories', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const { name, sort_order = 0 } = req.body;

  if (!name) throw new BadRequestError('分类名称不能为空');

  const result = db.prepare(
    'INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)'
  ).run(restaurantId, name, sort_order);

  res.status(201).json({ success: true, data: { id: result.lastInsertRowid, name, sort_order } });
}));

// PUT /api/merchant/menu/categories/:id — 编辑分类
router.put('/menu/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const catId = parseInt(req.params.id as string);
  const { name, sort_order } = req.body;

  const cat = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND restaurant_id = ?'
  ).get(catId, restaurantId);
  if (!cat) throw new NotFoundError('分类不存在');

  db.prepare(
    'UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?'
  ).run(name ?? null, sort_order ?? null, catId);

  res.json({ success: true, message: '分类已更新' });
}));

// DELETE /api/merchant/menu/categories/:id — 删除分类
router.delete('/menu/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const catId = parseInt(req.params.id as string);

  const cat = db.prepare(
    'SELECT * FROM categories WHERE id = ? AND restaurant_id = ?'
  ).get(catId, restaurantId);
  if (!cat) throw new NotFoundError('分类不存在');

  db.prepare('DELETE FROM categories WHERE id = ?').run(catId);
  res.json({ success: true, message: '分类已删除' });
}));

// POST /api/merchant/menu/items — 新增菜品
router.post('/menu/items', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const { category_id, name, description, price, image, status = 'available' } = req.body;

  if (!name || price === undefined) throw new BadRequestError('菜品名称和价格不能为空');

  // Verify category belongs to this restaurant
  const cat = db.prepare(
    'SELECT id FROM categories WHERE id = ? AND restaurant_id = ?'
  ).get(category_id, restaurantId);
  if (!cat) throw new BadRequestError('分类不存在');

  const result = db.prepare(
    `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(restaurantId, category_id, name, description || null, price, image || null, status);

  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } });
}));

// PUT /api/merchant/menu/items/:id — 编辑菜品
router.put('/menu/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const itemId = parseInt(req.params.id as string);
  const { name, description, price, image, status } = req.body;

  const item = db.prepare(
    'SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?'
  ).get(itemId, restaurantId);
  if (!item) throw new NotFoundError('菜品不存在');

  db.prepare(`
    UPDATE menu_items SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      image = COALESCE(?, image),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(name ?? null, description ?? null, price ?? null, image ?? null, status ?? null, itemId);

  res.json({ success: true, message: '菜品已更新' });
}));

// DELETE /api/merchant/menu/items/:id — 删除菜品
router.delete('/menu/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const itemId = parseInt(req.params.id as string);

  const item = db.prepare(
    'SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?'
  ).get(itemId, restaurantId);
  if (!item) throw new NotFoundError('菜品不存在');

  db.prepare('DELETE FROM menu_items WHERE id = ?').run(itemId);
  res.json({ success: true, message: '菜品已删除' });
}));

// GET /api/merchant/restaurant — 获取餐厅信息
router.get('/restaurant', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);

  const restaurant = db.prepare(
    'SELECT * FROM restaurants WHERE id = ?'
  ).get(restaurantId);

  res.json({ success: true, data: restaurant });
}));

// PUT /api/merchant/restaurant — 修改餐厅信息
router.put('/restaurant', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = getMerchantRestaurantId(req.user!.userId);
  const { name, description, delivery_fee, min_order, delivery_time, status } = req.body;

  db.prepare(`
    UPDATE restaurants SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      delivery_fee = COALESCE(?, delivery_fee),
      min_order = COALESCE(?, min_order),
      delivery_time = COALESCE(?, delivery_time),
      status = COALESCE(?, status)
    WHERE id = ?
  `).run(
    name ?? null, description ?? null, delivery_fee ?? null,
    min_order ?? null, delivery_time ?? null, status ?? null,
    restaurantId
  );

  res.json({ success: true, message: '餐厅信息已更新' });
}));

export default router;
