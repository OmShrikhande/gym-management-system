import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getGymStats } from '../controllers/statsController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Get gym statistics for gym owners
router.get('/gym', restrictTo('gym-owner'), getGymStats);

export default router;