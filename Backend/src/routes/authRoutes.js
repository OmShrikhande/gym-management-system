import express from 'express';
import * as authController from '../controllers/authController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Super Admin routes - can ONLY create gym owners
router.post('/create-gym-owner', protect, restrictTo('super-admin'), authController.createGymOwner);

// Gym Owner routes - can ONLY create trainers and members
router.post('/create-trainer', protect, restrictTo('gym-owner'), authController.createTrainer);
router.post('/create-user', protect, restrictTo('gym-owner'), authController.createUser);

// Protected routes
router.get('/verify-token', protect, authController.verifyToken);
router.post('/logout', protect, authController.logout);
router.get('/me', protect, authController.getMe);
router.get('/users', protect, restrictTo('super-admin', 'gym-owner'), authController.getUsers);
router.put('/users/:id', protect, restrictTo('super-admin', 'gym-owner'), authController.updateUser);

export default router;