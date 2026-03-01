import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, authValidation } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';
import { RegisterBody, LoginBody } from '../types/index.js';

const router = Router();

// POST /api/auth/register - User registration
router.post(
  '/register',
  validate(authValidation.register),
  asyncHandler(async (req: Request<{}, {}, RegisterBody>, res: Response) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功',
    });
  })
);

// POST /api/auth/login - User login
router.post(
  '/login',
  validate(authValidation.login),
  asyncHandler(async (req: Request<{}, {}, LoginBody>, res: Response) => {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
      message: '登录成功',
    });
  })
);

// GET /api/auth/profile - Get current user profile
router.get(
  '/profile',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getProfile(req.user!);

    res.json({
      success: true,
      data: user,
    });
  })
);

export default router;
