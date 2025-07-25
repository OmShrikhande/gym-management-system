import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import * as accessController from '../controllers/accessController.js';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// Staff entry route - accessible by trainers and gym owners
router.post('/staff-entry', restrictTo('trainer', 'gym-owner'), accessController.staffEntry);

export default router;