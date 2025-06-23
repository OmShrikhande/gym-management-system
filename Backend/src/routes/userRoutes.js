import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import * as userController from '../controllers/userController.js';

const router = express.Router();

// All routes below this middleware are protected
router.use(protect);

// Routes accessible by all authenticated users
router.get('/me', userController.getMe);
router.patch('/update-me', userController.updateMe);

// Routes restricted to super admin only
router.get('/stats/new-gym-owners', restrictTo('super-admin'), userController.getNewGymOwnersCount);
router.get('/stats/monthly-gym-owners', restrictTo('super-admin'), userController.getMonthlyGymOwnerStats);

// Trainer routes
router.get('/trainer/:trainerId/members', userController.getTrainerMembers);
router.post('/trainers/update-member-counts', restrictTo('super-admin', 'gym-owner'), userController.updateAllTrainerMemberCounts);

// Routes restricted to admin users
router.use(restrictTo('super-admin', 'gym-owner'));
router.get('/', userController.getAllUsers);
router.get('/gym-owner/:gymOwnerId/members', userController.getGymOwnerMembers);
router.get('/:id', userController.getUser);
router.patch('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;