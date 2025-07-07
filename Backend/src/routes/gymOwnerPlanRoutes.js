import express from 'express';
import * as gymOwnerPlanController from '../controllers/gymOwnerPlanController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for gym owners
router.get('/', restrictTo('gym-owner'), gymOwnerPlanController.getGymOwnerPlans);
router.get('/default', restrictTo('gym-owner'), gymOwnerPlanController.getOrCreateDefaultPlans);
router.get('/:id', restrictTo('gym-owner'), gymOwnerPlanController.getGymOwnerPlan);
router.post('/', restrictTo('gym-owner'), gymOwnerPlanController.createGymOwnerPlan);
router.patch('/:id', restrictTo('gym-owner'), gymOwnerPlanController.updateGymOwnerPlan);
router.delete('/:id', restrictTo('gym-owner'), gymOwnerPlanController.deleteGymOwnerPlan);

// Routes for super admin (to view any gym owner's plans)
router.get('/gym/:gymOwnerId', restrictTo('super-admin'), gymOwnerPlanController.getGymOwnerPlansByGymId);

export default router;