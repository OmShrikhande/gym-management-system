import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance, getGymAttendanceStats } from '../controllers/memberController.js';

const router = express.Router();



// Attendance routes (keeping only used endpoints)
router.post('/verify', verifyMembership);

// Mark attendance for a member (requires authentication)
router.post('/mark', protect, markAttendance);

// Get gym-wide attendance statistics (requires authentication)
router.get('/gym/stats', protect, getGymAttendanceStats);

export default router;
