import express from 'express';
import { 
  createDietPlan, 
  getAllDietPlans, 
  getDietPlansByGym, 
  getDietPlansByTrainer, 
  getDietPlansByMember, 
  getDietPlanById, 
  updateDietPlan, 
  deleteDietPlan,
  assignDietPlan 
} from '../controllers/dietPlanController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new diet plan (trainer only)
router.post('/', 
  protect, 
  restrictTo('trainer'), 
  createDietPlan
);

// Get all diet plans (admin, gym owner, and trainer)
router.get('/', 
  protect, 
  restrictTo('super-admin', 'gym-owner', 'trainer'), 
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


// Assign diet plan to members (trainer only) - DISABLED: All members can now see all trainer diet plans
router.post('/:dietPlanId/assign', 
  protect, 
  restrictTo('trainer', 'gym-owner'), 
  assignDietPlan
);



export default router;