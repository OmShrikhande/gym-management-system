const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGlobalSettings,
  updateGlobalSettings,
  getGymSettings,
  updateGymSettings,
  getUserSettings,
  updateUserSettings
} = require('../controllers/settingController');

// Global settings routes
router.get('/', protect, getGlobalSettings);
router.post('/', protect, updateGlobalSettings);

// Gym-specific settings routes
router.get('/gym/:gymId', protect, getGymSettings);
router.post('/gym/:gymId', protect, updateGymSettings);

// User-specific settings routes
router.get('/user/:userId', protect, getUserSettings);
router.post('/user/:userId', protect, updateUserSettings);

module.exports = router;