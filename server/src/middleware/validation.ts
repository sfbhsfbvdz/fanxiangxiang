import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain, body, param, query } from 'express-validator';
import { BadRequestError } from './error.js';

// Middleware to handle validation errors
export function validate(validations: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const errorMessages = errors.array().map(err => {
      if ('path' in err) {
        return `${err.path}: ${err.msg}`;
      }
      return err.msg;
    });

    next(new BadRequestError(errorMessages.join('; ')));
  };
}

// Common validation rules
export const authValidation = {
  register: [
    body('username')
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('用户名长度应为2-50个字符'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .isLength({ min: 6, max: 100 })
      .withMessage('密码长度应为6-100个字符'),
    body('phone')
      .optional()
      .trim()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
  ],
  login: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('请输入有效的邮箱地址'),
    body('password')
      .notEmpty()
      .withMessage('请输入密码'),
  ],
};

export const orderValidation = {
  create: [
    body('restaurantId')
      .isInt({ min: 1 })
      .withMessage('请选择有效的餐厅'),
    body('items')
      .isArray({ min: 1 })
      .withMessage('订单至少需要一个商品'),
    body('items.*.menuItemId')
      .isInt({ min: 1 })
      .withMessage('无效的菜品ID'),
    body('items.*.quantity')
      .isInt({ min: 1, max: 99 })
      .withMessage('商品数量应为1-99'),
    body('deliveryAddressId')
      .isInt({ min: 1 })
      .withMessage('请选择配送地址'),
    body('notes')
      .optional()
      .trim()
      .isLength({ max: 500 })
      .withMessage('备注不能超过500个字符'),
  ],
};

export const addressValidation = {
  create: [
    body('name')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('联系人姓名长度应为1-50个字符'),
    body('phone')
      .trim()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('address')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('地址长度应为1-255个字符'),
    body('detail')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('详细地址不能超过255个字符'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault 应为布尔值'),
  ],
  update: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('无效的地址ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('联系人姓名长度应为1-50个字符'),
    body('phone')
      .optional()
      .trim()
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入有效的手机号码'),
    body('address')
      .optional()
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('地址长度应为1-255个字符'),
    body('detail')
      .optional()
      .trim()
      .isLength({ max: 255 })
      .withMessage('详细地址不能超过255个字符'),
    body('isDefault')
      .optional()
      .isBoolean()
      .withMessage('isDefault 应为布尔值'),
  ],
};

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('页码应为正整数'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('每页数量应为1-100'),
];

export { body, param, query };
