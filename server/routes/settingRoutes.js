const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getGlobalSettings,
  updateGlobalSettings,
  getGymSettings,
  updateGymSettings
} = require('../controllers/settingController');

// Global settings routes
router.get('/', protect, getGlobalSettings);
router.post('/', protect, updateGlobalSettings);

// Gym-specific settings routes
router.get('/gym/:gymId', protect, getGymSettings);
router.post('/gym/:gymId', protect, updateGymSettings);

module.exports = router;