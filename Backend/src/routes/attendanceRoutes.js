import express from 'express';
import { protect } from '../controllers/authController.js';
import { verifyMembership, markAttendance, getGymAttendanceStats } from '../controllers/memberController.js';
import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User from '../models/userModel.js';

const router = express.Router();

// Optional authentication middleware - parses token if present but doesn't require it
const optionalAuth = async (req, res, next) => {
  try {
    // 1) Get token from request headers
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
      try {
        // 2) Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
        
        // 3) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (currentUser) {
          req.user = currentUser;
          console.log('✅ Optional auth: User authenticated:', currentUser._id.toString(), currentUser.role);
        } else {
          console.log('⚠️ Optional auth: Token valid but user not found');
        }
      } catch (error) {
        console.log('⚠️ Optional auth: Token verification failed:', error.message);
        // Don't set req.user, but continue processing
      }
    } else {
      console.log('ℹ️ Optional auth: No token provided');
    }
  } catch (error) {
    console.log('⚠️ Optional auth error:', error.message);
  }
  
  next();
};

// Attendance routes (keeping only used endpoints)
router.post('/verify', optionalAuth, verifyMembership);

// Mark attendance for a member (requires authentication)
router.post('/mark', protect, markAttendance);

// Get gym-wide attendance statistics (requires authentication)
router.get('/gym/stats', protect, getGymAttendanceStats);

export default router;
