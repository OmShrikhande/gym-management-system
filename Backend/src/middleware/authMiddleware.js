import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// Protect routes - only authenticated users can access
export const protect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.'
      });
    }

    // 2) Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('CRITICAL ERROR: JWT_SECRET is not defined in environment variables');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error. Please contact administrator.'
      });
    }

    // 3) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      console.log('User not found for token:', { decodedId: decoded.id });
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.'
      });
    }

    // Enhanced debugging for settings requests
    if (req.path.includes('/settings')) {
      console.log('Settings request authenticated:', {
        userId: currentUser._id.toString(),
        userRole: currentUser.role,
        requestPath: req.path,
        requestMethod: req.method
      });
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', {
      name: error.name,
      message: error.message,
      token: token ? `${token.substring(0, 20)}...` : 'No token',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      userId: error.name === 'JsonWebTokenError' ? 'Invalid token' : 'Unknown'
    });

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid token. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Your token has expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    // General JWT error
    return res.status(401).json({
      status: 'error',
      message: 'Authentication failed. Please log in again.',
      code: 'AUTH_FAILED'
    });
  }
};

// Restrict to certain roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // Enhanced debugging for settings requests
    if (req.path.includes('/settings')) {
      console.log('Role restriction check:', {
        userRole: req.user.role,
        allowedRoles: roles,
        hasPermission: roles.includes(req.user.role),
        requestPath: req.path
      });
    }
    
    // roles is an array ['admin', 'gym-owner', etc]
    if (!roles.includes(req.user.role)) {
      console.log('Role restriction failed:', {
        userRole: req.user.role,
        allowedRoles: roles,
        requestPath: req.path
      });
      
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};