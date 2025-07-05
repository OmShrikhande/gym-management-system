import express from 'express';
import * as membershipPlanController from '../controllers/membershipPlanController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for gym owners and super admins
router.get('/', membershipPlanController.getAllMembershipPlans);
router.get('/default', membershipPlanController.getOrCreateDefaultPlans);
router.get('/:id', membershipPlanController.getMembershipPlan);

// Routes restricted to gym owners (they manage their own membership plans)
router.use(restrictTo('gym-owner'));

router.post('/', membershipPlanController.createMembershipPlan);
router.patch('/:id', membershipPlanController.updateMembershipPlan);
router.delete('/:id', membershipPlanController.deleteMembershipPlan);

export default router;