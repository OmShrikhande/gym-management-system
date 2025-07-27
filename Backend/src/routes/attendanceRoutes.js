import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance, verifyMemberQRScan, joinGym, getAttendanceData, getGymAttendanceStats, ownerGateAccess } from '../controllers/memberController.js';

const router = express.Router();



// Attendance routes
router.post('/verify', verifyMembership);
router.post('/mark', protect, markAttendance);

// Gym owner direct gate access
router.post('/owner-gate-access', protect, ownerGateAccess);

// Member QR scan route (requires authentication)
router.post('/member-scan', protect, verifyMemberQRScan);

// Join gym route (requires authentication)
router.post('/join-gym', protect, joinGym);

// Get attendance data for a specific member (requires authentication)
router.get('/member/:memberId', protect, getAttendanceData);

// Get gym-wide attendance statistics (requires authentication)
router.get('/gym/stats', protect, getGymAttendanceStats);

export default router;
