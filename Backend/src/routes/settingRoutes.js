import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getGlobalSettings,
  updateGlobalSettings,
  getGymSettings,
  updateGymSettings,
  getUserSettings,
  updateUserSettings,
  bulkUpdateSettings
} from '../controllers/settingController.js';

const router = express.Router();

// Global settings routes (Super Admin only)
router.get('/', protect, restrictTo('super-admin'), getGlobalSettings);
router.post('/', protect, restrictTo('super-admin'), updateGlobalSettings);

// User-specific settings routes (All authenticated users)
router.get('/user/:userId', protect, getUserSettings);
router.post('/user/:userId', protect, updateUserSettings);

// Gym-specific settings routes 
// GET: Allow gym-owner, trainer, and member to read settings
// POST: Only gym-owner can update settings
router.get('/gym/:gymId', protect, restrictTo('gym-owner', 'trainer', 'member', 'super-admin'), getGymSettings);
router.post('/gym/:gymId', protect, restrictTo('gym-owner'), updateGymSettings);

// Bulk update settings (Gym owners and Super Admin only)
router.post('/bulk', protect, restrictTo('gym-owner', 'super-admin'), bulkUpdateSettings);

export default router;