import { Router } from 'express';
import {
	addCorrectiveAction,
	getAlerts,
	getCorrectiveActionsByAlert,
	updateAlertStatus,
} from '../controllers/alert.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', protect, getAlerts);
router.patch('/:id/status', protect, updateAlertStatus);
router.post('/:id/corrective-actions', protect, addCorrectiveAction);
router.get('/:id/corrective-actions', protect, getCorrectiveActionsByAlert);

export default router;
