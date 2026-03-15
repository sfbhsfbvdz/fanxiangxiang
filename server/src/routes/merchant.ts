import { Router, Request, Response } from 'express';
import { queryOne, queryAll, execute } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.js';

const router = Router();

// All merchant routes require auth + merchant role
router.use(authenticate, requireRole('merchant'));

// Helper: get restaurant_id for current merchant
async function getMerchantRestaurantId(userId: number): Promise<number> {
  const row = await queryOne<{ restaurant_id: number }>(
    'SELECT restaurant_id FROM restaurant_managers WHERE user_id = ?',
    [userId]
  );
  if (!row) throw new BadRequestError('未绑定餐厅');
  return row.restaurant_id;
}

// GET /api/merchant/orders — 查看本餐厅当前订单
router.get('/orders', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);

  const orders = await queryAll<any>(`
    SELECT o.*, u.username, u.phone as user_phone
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.restaurant_id = ?
    ORDER BY o.created_at DESC
  `, [restaurantId]);

  const ordersWithItems = await Promise.all(orders.map(async order => {
    const items = await queryAll<any>('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
    return { ...order, items };
  }));

  res.json({ success: true, data: ordersWithItems });
}));

// PUT /api/merchant/orders/:id/accept — 接单 (paid → preparing)
router.put('/orders/:id/accept', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const orderId = parseInt(req.params.id as string);

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE id = ? AND restaurant_id = ?',
    [orderId, restaurantId]
  );

  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'paid') throw new BadRequestError('只能接受已支付的订单');

  await execute(
    `UPDATE orders SET status = 'preparing', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [orderId]
  );

  res.json({ success: true, message: '已接单' });
}));

// PUT /api/merchant/orders/:id/ready — 备餐完成 (preparing → delivering)
router.put('/orders/:id/ready', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const orderId = parseInt(req.params.id as string);

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE id = ? AND restaurant_id = ?',
    [orderId, restaurantId]
  );

  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'preparing') throw new BadRequestError('只能标记备餐中的订单');

  await execute(
    `UPDATE orders SET status = 'delivering', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [orderId]
  );

  res.json({ success: true, message: '备餐完成，等待骑手取餐' });
}));

// PUT /api/merchant/orders/:id/extra-charge — 加价
router.put('/orders/:id/extra-charge', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const orderId = parseInt(req.params.id as string);
  const { extra_charge, extra_charge_note } = req.body;

  if (extra_charge === undefined || isNaN(parseFloat(extra_charge)) || parseFloat(extra_charge) < 0) {
    throw new BadRequestError('加价金额不合法');
  }

  const order = await queryOne<any>(
    'SELECT * FROM orders WHERE id = ? AND restaurant_id = ?',
    [orderId, restaurantId]
  );
  if (!order) throw new NotFoundError('订单不存在');
  if (!['paid', 'preparing'].includes(order.status)) {
    throw new BadRequestError('当前订单状态不允许加价');
  }

  const amount = parseFloat(extra_charge);
  const diff = amount - parseFloat(String(order.extra_charge ?? 0));
  await execute(
    `UPDATE orders SET extra_charge = ?, extra_charge_note = ?, total_price = total_price + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [amount, extra_charge_note || null, diff, orderId]
  );

  res.json({ success: true, message: '加价成功' });
}));

// GET /api/merchant/menu — 获取本餐厅菜单
router.get('/menu', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);

  const categories = await queryAll<any>(
    'SELECT * FROM categories WHERE restaurant_id = ? ORDER BY sort_order',
    [restaurantId]
  );

  const result = await Promise.all(categories.map(async cat => {
    const items = await queryAll<any>('SELECT * FROM menu_items WHERE category_id = ? ORDER BY id', [cat.id]);
    return { ...cat, items };
  }));

  res.json({ success: true, data: result });
}));

// POST /api/merchant/menu/categories — 新增分类
router.post('/menu/categories', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const { name, sort_order = 0 } = req.body;

  if (!name) throw new BadRequestError('分类名称不能为空');

  const result = await execute(
    'INSERT INTO categories (restaurant_id, name, sort_order) VALUES (?, ?, ?)',
    [restaurantId, name, sort_order]
  );

  res.status(201).json({ success: true, data: { id: result.insertId, name, sort_order } });
}));

// PUT /api/merchant/menu/categories/:id — 编辑分类
router.put('/menu/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const catId = parseInt(req.params.id as string);
  const { name, sort_order } = req.body;

  const cat = await queryOne<any>(
    'SELECT * FROM categories WHERE id = ? AND restaurant_id = ?',
    [catId, restaurantId]
  );
  if (!cat) throw new NotFoundError('分类不存在');

  await execute(
    'UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?',
    [name ?? null, sort_order ?? null, catId]
  );

  res.json({ success: true, message: '分类已更新' });
}));

// DELETE /api/merchant/menu/categories/:id — 删除分类
router.delete('/menu/categories/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const catId = parseInt(req.params.id as string);

  const cat = await queryOne<any>(
    'SELECT * FROM categories WHERE id = ? AND restaurant_id = ?',
    [catId, restaurantId]
  );
  if (!cat) throw new NotFoundError('分类不存在');

  await execute('DELETE FROM categories WHERE id = ?', [catId]);
  res.json({ success: true, message: '分类已删除' });
}));

// POST /api/merchant/menu/items — 新增菜品
router.post('/menu/items', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const { category_id, name, description, price, image, status = 'available' } = req.body;

  if (!name || price === undefined) throw new BadRequestError('菜品名称和价格不能为空');

  // Verify category belongs to this restaurant
  const cat = await queryOne<any>(
    'SELECT id FROM categories WHERE id = ? AND restaurant_id = ?',
    [category_id, restaurantId]
  );
  if (!cat) throw new BadRequestError('分类不存在');

  const result = await execute(
    `INSERT INTO menu_items (restaurant_id, category_id, name, description, price, image, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [restaurantId, category_id, name, description || null, price, image || null, status]
  );

  res.status(201).json({ success: true, data: { id: result.insertId } });
}));

// PUT /api/merchant/menu/items/:id — 编辑菜品
router.put('/menu/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const itemId = parseInt(req.params.id as string);
  const { name, description, price, image, status } = req.body;

  const item = await queryOne<any>(
    'SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?',
    [itemId, restaurantId]
  );
  if (!item) throw new NotFoundError('菜品不存在');

  await execute(`
    UPDATE menu_items SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      price = COALESCE(?, price),
      image = COALESCE(?, image),
      status = COALESCE(?, status)
    WHERE id = ?
  `, [name ?? null, description ?? null, price ?? null, image ?? null, status ?? null, itemId]);

  res.json({ success: true, message: '菜品已更新' });
}));

// DELETE /api/merchant/menu/items/:id — 删除菜品
router.delete('/menu/items/:id', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const itemId = parseInt(req.params.id as string);

  const item = await queryOne<any>(
    'SELECT * FROM menu_items WHERE id = ? AND restaurant_id = ?',
    [itemId, restaurantId]
  );
  if (!item) throw new NotFoundError('菜品不存在');

  await execute('DELETE FROM menu_items WHERE id = ?', [itemId]);
  res.json({ success: true, message: '菜品已删除' });
}));

// GET /api/merchant/restaurant — 获取餐厅信息
router.get('/restaurant', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);

  const restaurant = await queryOne<any>(
    'SELECT * FROM restaurants WHERE id = ?',
    [restaurantId]
  );

  res.json({ success: true, data: restaurant });
}));

// PUT /api/merchant/restaurant — 修改餐厅信息
router.put('/restaurant', asyncHandler(async (req: Request, res: Response) => {
  const restaurantId = await getMerchantRestaurantId(req.user!.userId);
  const { name, description, delivery_fee, min_order, delivery_time, status } = req.body;

  await execute(`
    UPDATE restaurants SET
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      delivery_fee = COALESCE(?, delivery_fee),
      min_order = COALESCE(?, min_order),
      delivery_time = COALESCE(?, delivery_time),
      status = COALESCE(?, status)
    WHERE id = ?
  `, [
    name ?? null, description ?? null, delivery_fee ?? null,
    min_order ?? null, delivery_time ?? null, status ?? null,
    restaurantId
  ]);

  res.json({ success: true, message: '餐厅信息已更新' });
}));

export default router;
