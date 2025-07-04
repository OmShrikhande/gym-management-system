import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance, verifyMemberQRScan, joinGym } from '../controllers/memberController.js';

const router = express.Router();



// Attendance routes
router.post('/verify', verifyMembership);
router.post('/mark', markAttendance);

// Member QR scan route (requires authentication)
router.post('/member-scan', protect, verifyMemberQRScan);

// Join gym route (requires authentication)
router.post('/join-gym', protect, joinGym);

export default router;
