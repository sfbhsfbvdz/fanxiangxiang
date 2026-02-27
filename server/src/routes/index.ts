import { Router } from 'express';
import authRoutes from './auth.js';
import restaurantRoutes from './restaurants.js';
import orderRoutes from './orders.js';
import userRoutes from './users.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);

export default router;
