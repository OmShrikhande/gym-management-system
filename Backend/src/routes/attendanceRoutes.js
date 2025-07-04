import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance, verifyDeviceAccess, verifyMemberQRScan, verifyNodeMCUMemberAccess } from '../controllers/memberController.js';

const router = express.Router();



// Attendance routes
router.post('/verify', verifyMembership);
router.post('/mark', markAttendance);

// Member QR scan route (requires authentication)
router.post('/member-scan', protect, verifyMemberQRScan);

// Device access route (for NodeMCU - no authentication required)
router.post('/device-verify', verifyDeviceAccess);

// NodeMCU member verification route (no authentication required)
router.post('/nodemcu-member-verify', verifyNodeMCUMemberAccess);

export default router;
