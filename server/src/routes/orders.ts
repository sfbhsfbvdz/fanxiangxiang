import { Router, Request, Response } from 'express';
import { orderService } from '../services/order.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, orderValidation, paginationValidation, param, query } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { CreateOrderBody, OrderStatus } from '../types/index.js';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// POST /api/orders - Create a new order
router.post(
  '/',
  validate(orderValidation.create),
  asyncHandler(async (req: Request<{}, {}, CreateOrderBody>, res: Response) => {
    const userId = req.user!.userId;
    const result = await orderService.createOrder(userId, req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: '订单创建成功',
    });
  })
);

// GET /api/orders - Get user's orders
router.get(
  '/',
  validate([
    ...paginationValidation,
    query('status')
      .optional()
      .isIn(['pending', 'paid', 'preparing', 'delivering', 'completed', 'cancelled']),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const status = req.query.status as OrderStatus | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await orderService.getUserOrders(userId, status, page, limit);

    res.json({
      success: true,
      data: {
        orders: result.items,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  })
);

// GET /api/orders/:id - Get order detail
router.get(
  '/:id',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = parseInt(req.params.id as string);

    const order = await orderService.getOrderById(orderId, userId);

    res.json({
      success: true,
      data: order,
    });
  })
);

// PUT /api/orders/:id/cancel - Cancel order
router.put(
  '/:id/cancel',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const orderId = parseInt(req.params.id as string);

    await orderService.cancelOrder(orderId, userId);

    res.json({
      success: true,
      message: '订单已取消',
    });
  })
);

export default router;
