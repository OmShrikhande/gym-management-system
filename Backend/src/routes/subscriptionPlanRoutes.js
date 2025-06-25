import express from 'express';
import * as subscriptionPlanController from '../controllers/subscriptionPlanController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Public routes (accessible to all authenticated users)
router.get('/', subscriptionPlanController.getAllPlans);
router.get('/:id', subscriptionPlanController.getPlan);

// Routes restricted to super admin
router.use(restrictTo('super-admin'));

router.post('/', subscriptionPlanController.createPlan);
router.patch('/:id', subscriptionPlanController.updatePlan);
router.delete('/:id', subscriptionPlanController.deletePlan);
router.get('/:id/stats', subscriptionPlanController.getPlanStats);

export default router;