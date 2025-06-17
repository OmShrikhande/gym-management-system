import express from 'express';
import { 
  createDietPlan, 
  getAllDietPlans, 
  getDietPlansByGym, 
  getDietPlansByTrainer, 
  getDietPlansByMember, 
  getDietPlanById, 
  updateDietPlan, 
  deleteDietPlan 
} from '../controllers/dietPlanController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new diet plan (trainer only)
router.post('/', 
  protect, 
  restrictTo('trainer'), 
  createDietPlan
);

// Get all diet plans (admin and gym owner only)
router.get('/', 
  protect, 
  restrictTo('super-admin', 'gym-owner'), 
  getAllDietPlans
);

// Get diet plans by gym
router.get('/gym/:gymId', 
  protect, 
  getDietPlansByGym
);

// Get diet plans by trainer
router.get('/trainer/:trainerId', 
  protect, 
  getDietPlansByTrainer
);

// Get diet plans by member
router.get('/member/:memberId', 
  protect, 
  getDietPlansByMember
);

// Get a single diet plan by ID
router.get('/:dietPlanId', 
  protect, 
  getDietPlanById
);

// Update a diet plan (trainer who created it or admin)
router.put('/:dietPlanId', 
  protect, 
  updateDietPlan
);

// Delete a diet plan (trainer who created it or admin)
router.delete('/:dietPlanId', 
  protect, 
  deleteDietPlan
);

export default router;