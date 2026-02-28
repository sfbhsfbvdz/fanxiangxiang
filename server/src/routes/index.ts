import { Router } from 'express';
import authRoutes from './auth.js';
import restaurantRoutes from './restaurants.js';
import orderRoutes from './orders.js';
import userRoutes from './users.js';
import merchantRoutes from './merchant.js';
import riderRoutes from './rider.js';
import adminRoutes from './admin.js';

const router = Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/restaurants', restaurantRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/merchant', merchantRoutes);
router.use('/rider', riderRoutes);
router.use('/admin', adminRoutes);

export default router;
