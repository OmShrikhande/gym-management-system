/**
 * Razorpay Security Utilities
 * Enhanced security measures for Razorpay payment processing
 */

import { forceLog, forceError, forceWarn } from './consoleErrorHandler.js';

// Security configuration
const SECURITY_CONFIG = {
  // Rate limiting configuration
  rateLimiting: {
    maxOrderCreationAttempts: 3, // Max order creation attempts per minute
    maxVerificationAttempts: 5, // Max verification attempts per minute
    maxKeyFetchAttempts: 10, // Max key fetch attempts per minute
    windowMs: 60 * 1000, // 1 minute window
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block duration
  },
  
  // Payment validation
  paymentValidation: {
    minAmount: 1, // Minimum payment amount in INR
    maxAmount: 100000, // Maximum payment amount in INR
    allowedCurrencies: ['INR'],
    orderExpiryMs: 15 * 60 * 1000, // 15 minutes order expiry
  },
  
  // Security headers and validation
  security: {
    validateOrigin: true,
    requireHTTPS: true,
    maxRetries: 3,
    retryDelayMs: 1000,
  }
};

// Rate limiting storage (in-memory for client-side)
const rateLimitStore = new Map();

/**
 * Rate limiting implementation
 */
class RateLimiter {
  constructor(config) {
    this.config = config;
    this.attempts = new Map();
    this.blocked = new Map();
  }

  /**
   * Check if action is rate limited
   * @param {string} action - Action type (order-creation, verification, key-fetch)
   * @param {string} identifier - User identifier (user ID or IP)
   * @returns {boolean} - True if rate limited
   */
  isRateLimited(action, identifier) {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    
    // Check if currently blocked
    const blockUntil = this.blocked.get(key);
    if (blockUntil && now < blockUntil) {
      const remainingMs = blockUntil - now;
      forceWarn(`🚫 Rate limited: ${action} blocked for ${Math.ceil(remainingMs / 1000)}s`);
      return true;
    }
    
    // Clean expired blocks
    if (blockUntil && now >= blockUntil) {
      this.blocked.delete(key);
    }
    
    // Get current attempts
    const attempts = this.attempts.get(key) || [];
    const windowStart = now - this.config.rateLimiting.windowMs;
    
    // Filter attempts within current window
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    
    // Get max attempts for this action
    const maxAttempts = this.getMaxAttempts(action);
    
    if (recentAttempts.length >= maxAttempts) {
      // Block the action
      this.blocked.set(key, now + this.config.rateLimiting.blockDurationMs);
      forceWarn(`🚫 Rate limit exceeded: ${action} blocked for ${this.config.rateLimiting.blockDurationMs / 1000}s`);
      return true;
    }
    
    return false;
  }

  /**
   * Record an attempt
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   */
  recordAttempt(action, identifier) {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    attempts.push(now);
    this.attempts.set(key, attempts);
    
    // Clean old attempts
    this.cleanOldAttempts();
  }

  /**
   * Get max attempts for action type
   * @param {string} action - Action type
   * @returns {number} - Max attempts
   */
  getMaxAttempts(action) {
    switch (action) {
      case 'order-creation':
        return this.config.rateLimiting.maxOrderCreationAttempts;
      case 'verification':
        return this.config.rateLimiting.maxVerificationAttempts;
      case 'key-fetch':
        return this.config.rateLimiting.maxKeyFetchAttempts;
      default:
        return 5;
    }
  }

  /**
   * Clean old attempts from memory
   */
  cleanOldAttempts() {
    const now = Date.now();
    const windowStart = now - this.config.rateLimiting.windowMs;
    
    for (const [key, attempts] of this.attempts.entries()) {
      const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
      if (recentAttempts.length === 0) {
        this.attempts.delete(key);
      } else {
        this.attempts.set(key, recentAttempts);
      }
    }
  }

  /**
   * Get rate limit status for debugging
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   * @returns {Object} - Rate limit status
   */
  getStatus(action, identifier) {
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    const windowStart = now - this.config.rateLimiting.windowMs;
    const recentAttempts = attempts.filter(timestamp => timestamp > windowStart);
    const blockUntil = this.blocked.get(key);
    
    return {
      action,
      identifier,
      recentAttempts: recentAttempts.length,
      maxAttempts: this.getMaxAttempts(action),
      isBlocked: blockUntil && now < blockUntil,
      blockUntil: blockUntil || null,
      remainingAttempts: Math.max(0, this.getMaxAttempts(action) - recentAttempts.length)
    };
  }
}

// Global rate limiter instance
const rateLimiter = new RateLimiter(SECURITY_CONFIG);

/**
 * Payment amount validation
 * @param {number} amount - Payment amount in INR
 * @returns {Object} - Validation result
 */
export const validatePaymentAmount = (amount) => {
  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return {
      valid: false,
      error: 'Invalid payment amount format'
    };
  }
  
  if (numAmount < SECURITY_CONFIG.paymentValidation.minAmount) {
    return {
      valid: false,
      error: `Minimum payment amount is ₹${SECURITY_CONFIG.paymentValidation.minAmount}`
    };
  }
  
  if (numAmount > SECURITY_CONFIG.paymentValidation.maxAmount) {
    return {
      valid: false,
      error: `Maximum payment amount is ₹${SECURITY_CONFIG.paymentValidation.maxAmount}`
    };
  }
  
  return {
    valid: true,
    amount: numAmount
  };
};

/**
 * Order expiry validation
 * @param {string} orderCreatedAt - Order creation timestamp
 * @returns {Object} - Validation result
 */
export const validateOrderExpiry = (orderCreatedAt) => {
  const createdAt = new Date(orderCreatedAt);
  const now = new Date();
  const expiryTime = new Date(createdAt.getTime() + SECURITY_CONFIG.paymentValidation.orderExpiryMs);
  
  if (now > expiryTime) {
    return {
      valid: false,
      error: 'Payment order has expired. Please create a new order.',
      expiredAt: expiryTime
    };
  }
  
  const remainingMs = expiryTime.getTime() - now.getTime();
  return {
    valid: true,
    expiresAt: expiryTime,
    remainingMs
  };
};

/**
 * Secure order creation with rate limiting
 * @param {Function} authFetch - Authenticated fetch function
 * @param {Object} orderData - Order data
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Order creation result
 */
export const createSecureRazorpayOrder = async (authFetch, orderData, userId) => {
  try {
    // Rate limiting check
    if (rateLimiter.isRateLimited('order-creation', userId)) {
      throw new Error('Too many order creation attempts. Please wait before trying again.');
    }
    
    // Validate payment amount
    const amountValidation = validatePaymentAmount(orderData.amount);
    if (!amountValidation.valid) {
      throw new Error(amountValidation.error);
    }
    
    // Validate currency
    if (orderData.currency && !SECURITY_CONFIG.paymentValidation.allowedCurrencies.includes(orderData.currency)) {
      throw new Error(`Currency ${orderData.currency} is not supported`);
    }
    
    // Record attempt
    rateLimiter.recordAttempt('order-creation', userId);
    
    forceLog('🔒 Creating secure Razorpay order...', {
      amount: amountValidation.amount,
      currency: orderData.currency || 'INR',
      userId
    });
    
    // Add security headers and timestamp
    const secureOrderData = {
      ...orderData,
      amount: amountValidation.amount,
      currency: orderData.currency || 'INR',
      timestamp: new Date().toISOString(),
      clientVersion: '1.0.0',
      securityVersion: '1.0.0'
    };
    
    const response = await authFetch('/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(secureOrderData),
      timeout: 15000,
      headers: {
        'X-Security-Version': '1.0.0',
        'X-Client-Timestamp': new Date().toISOString()
      }
    });
    
    if (response.success || response.status === 'success') {
      const order = response.data?.order;
      
      if (order && order.id) {
        // Store order creation time for expiry validation
        const orderInfo = {
          id: order.id,
          createdAt: new Date().toISOString(),
          amount: amountValidation.amount,
          currency: orderData.currency || 'INR'
        };
        
        // Store in session storage for expiry validation
        sessionStorage.setItem(`razorpay_order_${order.id}`, JSON.stringify(orderInfo));
        
        forceLog('✅ Secure order created successfully:', order.id);
        return order;
      } else {
        throw new Error('Invalid response format from order creation endpoint');
      }
    } else {
      throw new Error(response.message || 'Failed to create payment order');
    }
    
  } catch (error) {
    forceError('❌ Secure order creation failed:', error);
    throw error;
  }
};

/**
 * Secure payment verification with enhanced validation
 * @param {Function} authFetch - Authenticated fetch function
 * @param {Object} paymentData - Payment verification data
 * @param {string} userId - User identifier
 * @returns {Promise<Object>} - Verification result
 */
export const verifySecureRazorpayPayment = async (authFetch, paymentData, userId) => {
  try {
    // Rate limiting check
    if (rateLimiter.isRateLimited('verification', userId)) {
      throw new Error('Too many verification attempts. Please wait before trying again.');
    }
    
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData } = paymentData;
    
    // Validate required parameters
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification parameters');
    }
    
    // Validate order expiry
    const storedOrderInfo = sessionStorage.getItem(`razorpay_order_${razorpay_order_id}`);
    if (storedOrderInfo) {
      try {
        const orderInfo = JSON.parse(storedOrderInfo);
        const expiryValidation = validateOrderExpiry(orderInfo.createdAt);
        
        if (!expiryValidation.valid) {
          // Clean up expired order
          sessionStorage.removeItem(`razorpay_order_${razorpay_order_id}`);
          throw new Error(expiryValidation.error);
        }
        
        forceLog(`⏰ Order expires in ${Math.ceil(expiryValidation.remainingMs / 1000)}s`);
      } catch (parseError) {
        forceWarn('⚠️ Could not parse stored order info:', parseError);
      }
    }
    
    // Record attempt
    rateLimiter.recordAttempt('verification', userId);
    
    forceLog('🔍 Verifying secure Razorpay payment...', { 
      razorpay_order_id, 
      razorpay_payment_id,
      userId 
    });
    
    const response = await authFetch('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        gymOwnerData,
        timestamp: new Date().toISOString(),
        clientVersion: '1.0.0',
        securityVersion: '1.0.0'
      }),
      timeout: 15000,
      headers: {
        'X-Security-Version': '1.0.0',
        'X-Client-Timestamp': new Date().toISOString()
      }
    });
    
    if (response.success || response.status === 'success') {
      // Clean up order info after successful verification
      sessionStorage.removeItem(`razorpay_order_${razorpay_order_id}`);
      
      forceLog('✅ Payment verified successfully');
      return response;
    } else {
      throw new Error(response.message || 'Payment verification failed');
    }
    
  } catch (error) {
    forceError('❌ Secure payment verification failed:', error);
    throw error;
  }
};

/**
 * Secure Razorpay key fetch with rate limiting
 * @param {Function} authFetch - Authenticated fetch function
 * @param {string} userId - User identifier
 * @returns {Promise<string>} - Razorpay key
 */
export const getSecureRazorpayKey = async (authFetch, userId) => {
  try {
    // Rate limiting check
    if (rateLimiter.isRateLimited('key-fetch', userId)) {
      throw new Error('Too many key fetch attempts. Please wait before trying again.');
    }
    
    // Record attempt
    rateLimiter.recordAttempt('key-fetch', userId);
    
    forceLog('🔑 Fetching secure Razorpay key...');
    
    const response = await authFetch('/payments/razorpay/key', {
      method: 'GET',
      timeout: 10000,
      headers: {
        'X-Security-Version': '1.0.0',
        'X-Client-Timestamp': new Date().toISOString()
      }
    });
    
    if (response.success && response.data?.key) {
      forceLog('✅ Razorpay key fetched successfully');
      return response.data.key;
    } else {
      throw new Error(response.message || 'Failed to fetch Razorpay key');
    }
    
  } catch (error) {
    forceError('❌ Secure key fetch failed:', error);
    throw error;
  }
};

/**
 * Security monitoring and reporting
 */
export const getSecurityStatus = (userId) => {
  return {
    rateLimiting: {
      orderCreation: rateLimiter.getStatus('order-creation', userId),
      verification: rateLimiter.getStatus('verification', userId),
      keyFetch: rateLimiter.getStatus('key-fetch', userId)
    },
    config: SECURITY_CONFIG,
    timestamp: new Date().toISOString()
  };
};

/**
 * Reset rate limiting for a user (admin function)
 * @param {string} userId - User identifier
 */
export const resetRateLimiting = (userId) => {
  const actions = ['order-creation', 'verification', 'key-fetch'];
  
  actions.forEach(action => {
    const key = `${action}:${userId}`;
    rateLimiter.attempts.delete(key);
    rateLimiter.blocked.delete(key);
  });
  
  forceLog(`🔄 Rate limiting reset for user: ${userId}`);
};

/**
 * Initialize security monitoring
 */
export const initializeRazorpaySecurity = () => {
  forceLog('🛡️ Initializing Razorpay security measures...');
  
  // Set up periodic cleanup
  setInterval(() => {
    rateLimiter.cleanOldAttempts();
  }, 60000); // Clean every minute
  
  // Add to global scope for debugging
  if (import.meta.env.DEV) {
    window.razorpaySecurity = {
      getStatus: getSecurityStatus,
      resetRateLimiting,
      rateLimiter,
      config: SECURITY_CONFIG
    };
  }
  
  forceLog('✅ Razorpay security initialized successfully');
};

export default {
  validatePaymentAmount,
  validateOrderExpiry,
  createSecureRazorpayOrder,
  verifySecureRazorpayPayment,
  getSecureRazorpayKey,
  getSecurityStatus,
  resetRateLimiting,
  initializeRazorpaySecurity,
  SECURITY_CONFIG
};