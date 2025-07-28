import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getCacheStats } from '../middleware/cache.js';

const router = express.Router();

// Cache management endpoints (keeping only used endpoint)
router.get('/cache/stats', protect, restrictTo('super-admin'), getCacheStats);

export default router;