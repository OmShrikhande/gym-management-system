import { rateLimit } from 'express-rate-limit';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs for general API
  message: {
    success: false,
    error: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs (like health checks)
  skip: (req) => {
    const skipIPs = ['127.0.0.1', '::1'];
    return skipIPs.includes(req.ip);
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per windowMs
  message: {
    success: false,
    error: 'AUTH_RATE_LIMIT_EXCEEDED',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Increase attempts for successful logins
  skipSuccessfulRequests: true
});

// Payment endpoints rate limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Limit each IP to 50 payment requests per hour
  message: {
    success: false,
    error: 'PAYMENT_RATE_LIMIT_EXCEEDED',
    message: 'Too many payment attempts, please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 upload requests per windowMs
  message: {
    success: false,
    error: 'UPLOAD_RATE_LIMIT_EXCEEDED',
    message: 'Too many file upload attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// WebSocket connection rate limiter
export const wsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // Limit each IP to 10 WebSocket connection attempts per 5 minutes
  message: {
    success: false,
    error: 'WS_RATE_LIMIT_EXCEEDED',
    message: 'Too many WebSocket connection attempts, please try again later.',
    retryAfter: '5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});