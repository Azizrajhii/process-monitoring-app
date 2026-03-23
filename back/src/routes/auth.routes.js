import { Router } from 'express';
import {
  createUser,
  deleteUser,
  forgotPassword,
  getMe,
  getUserById,
  getUsers,
  login,
  register,
  resetPassword,
  updateMe,
  updateUser,
} from '../controllers/auth.controller.js';
import { protect, restrictTo } from '../middlewares/auth.middleware.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

// Authenticated user — own profile
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

// Manager-only — user management
router.get('/users', protect, restrictTo('manager'), getUsers);
router.post('/users', protect, restrictTo('manager'), createUser);
router.get('/users/:id', protect, restrictTo('manager'), getUserById);
router.put('/users/:id', protect, restrictTo('manager'), updateUser);
router.delete('/users/:id', protect, restrictTo('manager'), deleteUser);

export default router;
