
import { Router } from 'express';
import authRoutes from './auth.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import processRoutes from './process.routes.js';
import reportsRoutes from './reports.routes.js';
import measurementsRoutes from './measurements.routes.js';
import auditRoutes from './audit.routes.js';
import alertsRoutes from './alerts.routes.js';
import predictRoutes from './predict.routes.js';

const router = Router();


router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/processes', processRoutes);
router.use('/reports', reportsRoutes);
router.use('/measurements', measurementsRoutes);
router.use('/alerts', alertsRoutes);
router.use('/audit', auditRoutes);
router.use('/predict', predictRoutes);
router.use('/api', auditRoutes);

export default router;
