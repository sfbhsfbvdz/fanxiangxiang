import { Router, Request, Response } from 'express';
import { userService } from '../services/user.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, addressValidation, param, body } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { UpdateProfileBody, CreateAddressBody, UpdateAddressBody } from '../types/index.js';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// GET /api/users/profile - Get current user profile
router.get(
  '/profile',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await userService.getProfile(userId);

    res.json({
      success: true,
      data: user,
    });
  })
);

// PUT /api/users/profile - Update user profile
router.put(
  '/profile',
  validate([
    body('username')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('用户名长度应为2-50个字符'),
    body('phone')
      .optional()
      .trim()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('avatar')
      .optional()
      .trim()
      .isURL()
      .withMessage('请输入有效的头像URL'),
  ]),
  asyncHandler(async (req: Request<{}, {}, UpdateProfileBody>, res: Response) => {
    const userId = req.user!.userId;
    const user = await userService.updateProfile(userId, req.body);

    res.json({
      success: true,
      data: user,
      message: '资料更新成功',
    });
  })
);

// GET /api/users/addresses - Get user addresses
router.get(
  '/addresses',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const addresses = await userService.getAddresses(userId);

    res.json({
      success: true,
      data: addresses,
    });
  })
);

// POST /api/users/addresses - Create address
router.post(
  '/addresses',
  validate(addressValidation.create),
  asyncHandler(async (req: Request<{}, {}, CreateAddressBody>, res: Response) => {
    const userId = req.user!.userId;
    const address = await userService.createAddress(userId, req.body);

    res.status(201).json({
      success: true,
      data: address,
      message: '地址添加成功',
    });
  })
);

// GET /api/users/addresses/:id - Get single address
router.get(
  '/addresses/:id',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const addressId = parseInt(req.params.id as string);

    const address = await userService.getAddress(addressId, userId);

    res.json({
      success: true,
      data: address,
    });
  })
);

// PUT /api/users/addresses/:id - Update address
router.put(
  '/addresses/:id',
  validate(addressValidation.update),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const addressId = parseInt(req.params.id as string);

    const address = await userService.updateAddress(addressId, userId, req.body);

    res.json({
      success: true,
      data: address,
      message: '地址更新成功',
    });
  })
);

// DELETE /api/users/addresses/:id - Delete address
router.delete(
  '/addresses/:id',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const addressId = parseInt(req.params.id as string);

    await userService.deleteAddress(addressId, userId);

    res.json({
      success: true,
      message: '地址删除成功',
    });
  })
);

export default router;
