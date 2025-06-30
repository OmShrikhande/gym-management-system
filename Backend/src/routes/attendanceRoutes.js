import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance } from '../controllers/memberController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Attendance routes
router.post('/verify', verifyMembership);
router.post('/mark', markAttendance);

export default router;