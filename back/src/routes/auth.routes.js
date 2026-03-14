import { Router } from 'express';
import {
	forgotPassword,
	getUsers,
	login,
	register,
	resetPassword,
} from '../controllers/auth.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/users', protect, getUsers);
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

export default router;
