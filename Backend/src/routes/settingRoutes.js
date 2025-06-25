import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getGlobalSettings,
  updateGlobalSettings,
  getGymSettings,
  updateGymSettings
} from '../controllers/settingController.js';

const router = express.Router();

// Global settings routes
router.get('/', protect, getGlobalSettings);
router.post('/', protect, updateGlobalSettings);

// Gym-specific settings routes
router.get('/gym/:gymId', protect, getGymSettings);
router.post('/gym/:gymId', protect, updateGymSettings);

export default router;