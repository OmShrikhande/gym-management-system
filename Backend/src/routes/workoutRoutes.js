import express from 'express';
import { 
  createWorkout, 
  getAllWorkouts, 
  getWorkoutsByGym, 
  getWorkoutsByTrainer, 
  getWorkoutsByMember, 
  getWorkoutById, 
  updateWorkout, 
  deleteWorkout, 
  markWorkoutCompleted,
  assignWorkout 
} from '../controllers/workoutController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a new workout (trainer only)
router.post('/', 
  protect, 
  restrictTo('trainer'), 
  createWorkout
);

// Get all workouts (admin, gym owner, and trainer)
router.get('/', 
  protect, 
  restrictTo('super-admin', 'gym-owner', 'trainer'), 
  getAllWorkouts
);

// Get workouts by gym
router.get('/gym/:gymId', 
  protect, 
  getWorkoutsByGym
);

// Get workouts by trainer
router.get('/trainer/:trainerId', 
  protect, 
  getWorkoutsByTrainer
);

// Get workouts by member
router.get('/member/:memberId', 
  protect, 
  getWorkoutsByMember
);

// Get a single workout by ID
router.get('/:workoutId', 
  protect, 
  getWorkoutById
);

// Update a workout (trainer who created it or admin)
router.put('/:workoutId', 
  protect, 
  updateWorkout
);

// Delete a workout (trainer who created it or admin)
router.delete('/:workoutId', 
  protect, 
  deleteWorkout
);

// Mark workout as completed (member only)
router.patch('/:workoutId/complete', 
  protect, 
  restrictTo('member'), 
  markWorkoutCompleted
);

export default router;