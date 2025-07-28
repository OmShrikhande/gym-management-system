import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, getGymAttendanceStats } from '../controllers/memberController.js';

const router = express.Router();



// Attendance routes (keeping only used endpoints)
router.post('/verify', verifyMembership);

// Get gym-wide attendance statistics (requires authentication)
router.get('/gym/stats', protect, getGymAttendanceStats);

export default router;
