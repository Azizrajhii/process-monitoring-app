import { Router } from 'express';
import {
	createProcess,
	getProcessById,
	getProcesses,
	updateProcess,
	updateProcessStatus,
} from '../controllers/process.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';
import { getProcessHistory, compareProcessVersions } from '../controllers/process.controller.js';

const router = Router();

router.get('/', protect, getProcesses);
router.get('/:id', protect, getProcessById);
router.get('/:id/history', protect, getProcessHistory);
router.get('/:id/compare', protect, compareProcessVersions);

router.post('/', protect, restrictTo('manager'), createProcess);
router.put('/:id', protect, restrictTo('manager'), updateProcess);
router.patch('/:id/status', protect, restrictTo('manager'), updateProcessStatus);

export default router;
