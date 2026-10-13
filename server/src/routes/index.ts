import { Router } from 'express';
import authRoutes from './authRoutes.js';
import reportsRoutes from './reportsRoutes.js';
import usersRoutes from './usersRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/reports', reportsRoutes);
router.use('/users', usersRoutes);
router.use('/stats', statsRoutes);

export default router;
