import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getGlobalSettings,
  updateGlobalSettings,
  getGymSettings,
  updateGymSettings,
  getUserSettings,
  updateUserSettings
} from '../controllers/settingController.js';

const router = express.Router();

// Global settings routes (Super Admin only)
router.get('/', protect, restrictTo('super-admin'), getGlobalSettings);
router.post('/', protect, restrictTo('super-admin'), updateGlobalSettings);

// User-specific settings routes (All authenticated users)
router.get('/user/:userId', protect, getUserSettings);
router.post('/user/:userId', protect, updateUserSettings);

// Gym-specific settings routes (Gym owners only)
router.get('/gym/:gymId', protect, restrictTo('gym-owner'), getGymSettings);
router.post('/gym/:gymId', protect, restrictTo('gym-owner'), updateGymSettings);

export default router;