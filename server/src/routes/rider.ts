import { Router, Request, Response } from 'express';
import { db } from '../config/database.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, BadRequestError } from '../middleware/error.js';

const router = Router();

// All rider routes require auth + rider role
router.use(authenticate, requireRole('rider'));

// GET /api/rider/orders/available — 获取可接单列表 (delivering状态、未分配骑手)
router.get('/orders/available', asyncHandler(async (_req: Request, res: Response) => {
  const orders = db.prepare(`
    SELECT o.*, r.name as restaurant_name, r.image as restaurant_image
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.status = 'delivering' AND o.rider_id IS NULL
    ORDER BY o.updated_at DESC
  `).all();

  res.json({ success: true, data: orders });
}));

// GET /api/rider/orders/mine — 我的配送（当前+历史）
router.get('/orders/mine', asyncHandler(async (req: Request, res: Response) => {
  const orders = db.prepare(`
    SELECT o.*, r.name as restaurant_name, r.image as restaurant_image
    FROM orders o
    JOIN restaurants r ON o.restaurant_id = r.id
    WHERE o.rider_id = ?
    ORDER BY o.updated_at DESC
  `).all(req.user!.userId);

  res.json({ success: true, data: orders });
}));

// PUT /api/rider/orders/:id/accept — 抢单
router.put('/orders/:id/accept', asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id as string);
  const riderId = req.user!.userId;

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId) as any;
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'delivering') throw new BadRequestError('该订单无法接单');
  if (order.rider_id !== null) throw new BadRequestError('该订单已被其他骑手接单');

  db.prepare(
    `UPDATE orders SET rider_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(riderId, orderId);

  res.json({ success: true, message: '抢单成功' });
}));

// PUT /api/rider/orders/:id/picked — 已取餐
router.put('/orders/:id/picked', asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id as string);
  const riderId = req.user!.userId;

  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND rider_id = ?'
  ).get(orderId, riderId) as any;
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'delivering') throw new BadRequestError('订单状态不正确');

  // Already in delivering state, just confirm picked up (status stays delivering)
  res.json({ success: true, message: '已确认取餐' });
}));

// PUT /api/rider/orders/:id/delivered — 已送达 (delivering → completed)
router.put('/orders/:id/delivered', asyncHandler(async (req: Request, res: Response) => {
  const orderId = parseInt(req.params.id as string);
  const riderId = req.user!.userId;

  const order = db.prepare(
    'SELECT * FROM orders WHERE id = ? AND rider_id = ?'
  ).get(orderId, riderId) as any;
  if (!order) throw new NotFoundError('订单不存在');
  if (order.status !== 'delivering') throw new BadRequestError('订单状态不正确');

  db.prepare(
    `UPDATE orders SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(orderId);

  res.json({ success: true, message: '配送完成' });
}));

// GET /api/rider/status — 获取骑手状态
router.get('/status', asyncHandler(async (req: Request, res: Response) => {
  const rider = db.prepare(
    'SELECT * FROM riders WHERE user_id = ?'
  ).get(req.user!.userId) as any;

  res.json({ success: true, data: rider || { status: 'offline', vehicle_type: 'bike' } });
}));

// PUT /api/rider/status — 更新在线状态
router.put('/status', asyncHandler(async (req: Request, res: Response) => {
  const { status } = req.body;
  const userId = req.user!.userId;

  if (!['offline', 'online', 'delivering'].includes(status)) {
    throw new BadRequestError('状态值不合法');
  }

  const existing = db.prepare('SELECT id FROM riders WHERE user_id = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE riders SET status = ? WHERE user_id = ?').run(status, userId);
  } else {
    db.prepare('INSERT INTO riders (user_id, status) VALUES (?, ?)').run(userId, status);
  }

  res.json({ success: true, message: '状态已更新' });
}));

export default router;
