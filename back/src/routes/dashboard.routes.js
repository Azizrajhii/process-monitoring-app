import { Router } from 'express';
import { getDashboardOverview } from '../controllers/dashboard.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getDashboardOverview);

export default router;
