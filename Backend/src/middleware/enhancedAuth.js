import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// Enhanced authentication with additional security features
export const enhancedProtect = async (req, res, next) => {
  try {
    // 1) Get token and check if it exists
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'You are not logged in. Please log in to get access.',
        code: 'NO_TOKEN'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id).select('+active');
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'The user belonging to this token no longer exists.',
        code: 'USER_NOT_FOUND'
      });
    }

    // 4) Check if user is active
    if (!currentUser.active) {
      return res.status(401).json({
        status: 'error',
        message: 'Your account has been deactivated. Please contact support.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // 5) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter && currentUser.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        status: 'error',
        message: 'User recently changed password! Please log in again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // 6) Check for suspicious activity (multiple failed attempts)
    const failedAttempts = await getFailedLoginAttempts(currentUser.email);
    if (failedAttempts > 5) {
      return res.status(423).json({
        status: 'error',
        message: 'Account temporarily locked due to suspicious activity.',
        code: 'ACCOUNT_LOCKED'
      });
    }

    // 7) Log successful authentication
    await logAuthActivity(currentUser._id, req.ip, 'SUCCESS');

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
  } catch (error) {
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
    next(error);
  }
};

// Two-Factor Authentication middleware
export const requireTwoFactor = async (req, res, next) => {
  try {
    const { twoFactorCode } = req.body;
    
    if (!twoFactorCode) {
      return res.status(400).json({
        status: 'error',
        message: 'Two-factor authentication code is required.',
        code: 'TWO_FACTOR_REQUIRED'
      });
    }

    // Verify 2FA code (implement your 2FA logic here)
    const isValidCode = await verifyTwoFactorCode(req.user._id, twoFactorCode);
    
    if (!isValidCode) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid two-factor authentication code.',
        code: 'INVALID_TWO_FACTOR'
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Session management
export const sessionManager = {
  // Create session
  createSession: async (userId, deviceInfo) => {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const session = {
      sessionId,
      userId,
      deviceInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    };
    
    // Store session in database or Redis
    await storeSession(session);
    return sessionId;
  },

  // Validate session
  validateSession: async (sessionId) => {
    const session = await getSession(sessionId);
    if (!session || !session.isActive) {
      return false;
    }
    
    // Update last activity
    await updateSessionActivity(sessionId);
    return true;
  },

  // Revoke session
  revokeSession: async (sessionId) => {
    await updateSession(sessionId, { isActive: false });
  }
};

// Helper functions (implement based on your storage choice)
async function getFailedLoginAttempts(email) {
  // Implement failed login attempt tracking
  return 0;
}

async function logAuthActivity(userId, ip, status) {
  // Implement authentication activity logging
  console.log(`Auth activity: User ${userId} from ${ip} - ${status}`);
}

async function verifyTwoFactorCode(userId, code) {
  // Implement 2FA verification logic
  return true;
}

async function storeSession(session) {
  // Implement session storage
}

async function getSession(sessionId) {
  // Implement session retrieval
}

async function updateSessionActivity(sessionId) {
  // Implement session activity update
}

async function updateSession(sessionId, updates) {
  // Implement session update
}