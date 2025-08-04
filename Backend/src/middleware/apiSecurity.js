import crypto from 'crypto';
import rateLimit from 'express-rate-limit';

// API Key validation middleware
export const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({
      status: 'error',
      message: 'API key is required',
      code: 'API_KEY_MISSING'
    });
  }
  
  // Validate API key (implement your API key validation logic)
  if (!isValidApiKey(apiKey)) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid API key',
      code: 'INVALID_API_KEY'
    });
  }
  
  next();
};

// Request signature validation
export const validateRequestSignature = (req, res, next) => {
  const signature = req.headers['x-signature'];
  const timestamp = req.headers['x-timestamp'];
  const body = JSON.stringify(req.body);
  
  if (!signature || !timestamp) {
    return res.status(400).json({
      status: 'error',
      message: 'Request signature and timestamp are required',
      code: 'SIGNATURE_MISSING'
    });
  }
  
  // Check timestamp (prevent replay attacks)
  const now = Date.now();
  const requestTime = parseInt(timestamp);
  const timeDiff = Math.abs(now - requestTime);
  
  if (timeDiff > 300000) { // 5 minutes
    return res.status(400).json({
      status: 'error',
      message: 'Request timestamp is too old',
      code: 'TIMESTAMP_EXPIRED'
    });
  }
  
  // Validate signature
  const expectedSignature = generateSignature(body, timestamp);
  if (signature !== expectedSignature) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid request signature',
      code: 'INVALID_SIGNATURE'
    });
  }
  
  next();
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    
    if (!allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        status: 'error',
        message: 'Access denied from this IP address',
        code: 'IP_NOT_ALLOWED'
      });
    }
    
    next();
  };
};

// Advanced rate limiting with different tiers
export const advancedRateLimit = {
  // Premium users get higher limits
  premium: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Higher limit for premium users
    message: {
      status: 'error',
      message: 'Too many requests from this IP (Premium tier)',
      code: 'RATE_LIMIT_PREMIUM'
    }
  }),
  
  // Standard users
  standard: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: {
      status: 'error',
      message: 'Too many requests from this IP (Standard tier)',
      code: 'RATE_LIMIT_STANDARD'
    }
  }),
  
  // Basic users
  basic: rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 500,
    message: {
      status: 'error',
      message: 'Too many requests from this IP (Basic tier)',
      code: 'RATE_LIMIT_BASIC'
    }
  })
};

// Request logging and monitoring
export const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const requestLog = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    headers: req.headers,
    body: req.method !== 'GET' ? req.body : undefined
  };
  
  console.log('Request:', JSON.stringify(requestLog, null, 2));
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseLog = {
      timestamp: new Date().toISOString(),
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };
    
    console.log('Response:', JSON.stringify(responseLog, null, 2));
  });
  
  next();
};

// Content type validation
export const validateContentType = (allowedTypes) => {
  return (req, res, next) => {
    const contentType = req.get('Content-Type');
    
    if (!contentType || !allowedTypes.some(type => contentType.includes(type))) {
      return res.status(415).json({
        status: 'error',
        message: 'Unsupported content type',
        code: 'UNSUPPORTED_CONTENT_TYPE',
        allowedTypes
      });
    }
    
    next();
  };
};

// Helper functions
function isValidApiKey(apiKey) {
  // Implement your API key validation logic
  const validApiKeys = process.env.VALID_API_KEYS?.split(',') || [];
  return validApiKeys.includes(apiKey);
}

function generateSignature(body, timestamp) {
  const secret = process.env.SIGNATURE_SECRET || 'default-secret';
  const payload = `${body}${timestamp}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export default {
  validateApiKey,
  validateRequestSignature,
  ipWhitelist,
  advancedRateLimit,
  requestLogger,
  validateContentType
};