import { Router, Request, Response } from 'express';
import { restaurantService } from '../services/restaurant.service.js';
import { validate, paginationValidation, param, query } from '../middleware/validation.js';
import { asyncHandler } from '../middleware/error.js';

const router = Router();

// GET /api/restaurants - Get restaurant list
router.get(
  '/',
  validate([
    ...paginationValidation,
    query('search').optional().trim().isLength({ max: 100 }),
  ]),
  asyncHandler(async (req: Request, res: Response) => {
    const search = req.query.search as string | undefined;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = restaurantService.getRestaurants(search, page, limit);

    res.json({
      success: true,
      data: {
        restaurants: result.items,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  })
);

// GET /api/restaurants/:id - Get restaurant detail
router.get(
  '/:id',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const restaurant = restaurantService.getRestaurantById(id);

    res.json({
      success: true,
      data: restaurant,
    });
  })
);

// GET /api/restaurants/:id/menu - Get restaurant menu
router.get(
  '/:id/menu',
  validate([param('id').isInt({ min: 1 })]),
  asyncHandler(async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    const menu = restaurantService.getRestaurantMenu(id);

    res.json({
      success: true,
      data: menu,
    });
  })
);

export default router;
