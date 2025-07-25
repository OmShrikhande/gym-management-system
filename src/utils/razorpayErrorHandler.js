/**
 * Razorpay Error Handler Utility
 * Handles Razorpay-specific errors and console warnings gracefully
 */

import { forceError, forceWarn, forceLog } from './consoleErrorHandler.js';

/**
 * Enhanced Razorpay script loader with error suppression
 */
export const loadRazorpayScriptSafely = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      forceLog('✅ Razorpay script already loaded');
      resolve(true);
      return;
    }

    forceLog('📥 Loading Razorpay checkout script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    
    // Add attributes to prevent some console warnings
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    
    script.onload = () => {
      forceLog('✅ Razorpay script loaded successfully');
      
      // Suppress known Razorpay console warnings after loading
      suppressRazorpayWarnings();
      
      resolve(true);
    };
    
    script.onerror = (error) => {
      forceError('❌ Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};

/**
 * Suppress known Razorpay-related console warnings
 */
const suppressRazorpayWarnings = () => {
  // Override navigator.vibrate to prevent cross-origin iframe warnings
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const originalVibrate = navigator.vibrate;
    navigator.vibrate = function(...args) {
      try {
        return originalVibrate.apply(this, args);
      } catch (error) {
        // Silently ignore vibrate errors in cross-origin contexts
        return false;
      }
    };
  }
  
  // Intercept and filter XMLHttpRequest errors for Razorpay
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const result = originalXHROpen.apply(this, [method, url, ...args]);
    
    // Add timeout handling for Razorpay requests
    if (url && url.includes('razorpay') || url.includes('checkout')) {
      this.timeout = 30000; // 30 second timeout
      
      this.addEventListener('timeout', () => {
        // Don't log timeout errors for Razorpay - they're handled gracefully
        forceLog('🕐 Razorpay request timeout (handled gracefully)');
      });
      
      this.addEventListener('error', (event) => {
        // Only log critical Razorpay errors
        if (!isNonCriticalRazorpayError(event)) {
          forceError('❌ Critical Razorpay request error:', event);
        }
      });
    }
    
    return result;
  };
};

/**
 * Check if a Razorpay error is non-critical
 */
const isNonCriticalRazorpayError = (error) => {
  const errorMessage = String(error.message || error.type || '');
  
  const nonCriticalPatterns = [
    /timeout/i,
    /x-rtb-fingerprint-id/i,
    /navigator\.vibrate/i,
    /cross-origin/i,
    /unsafe header/i
  ];
  
  return nonCriticalPatterns.some(pattern => pattern.test(errorMessage));
};

/**
 * Enhanced Razorpay checkout initialization with error handling
 */
export const createRazorpayCheckoutSafely = (options) => {
  try {
    if (!window.Razorpay) {
      throw new Error('Razorpay script not loaded');
    }
    
    // Enhanced options with error handling
    const enhancedOptions = {
      ...options,
      modal: {
        ...options.modal,
        ondismiss: function() {
          forceLog('💳 Payment modal dismissed by user');
          if (options.modal?.ondismiss) {
            options.modal.ondismiss();
          }
        },
        escape: true,
        backdropclose: true,
        handleback: true,
        confirm_close: false,
        animation: true
      },
      retry: {
        enabled: true,
        max_count: 3
      },
      timeout: 300, // 5 minutes
      remember_customer: false,
      readonly: {
        email: false,
        contact: false,
        name: false
      }
    };
    
    const razorpay = new window.Razorpay(enhancedOptions);
    
    // Add error event listeners
    razorpay.on('payment.failed', function(response) {
      forceError('💳 Payment failed:', response.error);
      if (options.onPaymentFailed) {
        options.onPaymentFailed(response);
      }
    });
    
    razorpay.on('payment.captured', function(response) {
      forceLog('💳 Payment captured successfully:', response);
      if (options.onPaymentCaptured) {
        options.onPaymentCaptured(response);
      }
    });
    
    return razorpay;
    
  } catch (error) {
    forceError('❌ Failed to create Razorpay checkout:', error);
    throw error;
  }
};

/**
 * Safe Razorpay order creation with enhanced error handling
 */
export const createRazorpayOrderSafely = async (authFetch, orderData) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided');
    }

    if (!orderData.amount || orderData.amount <= 0) {
      throw new Error('Please provide a valid amount');
    }

    forceLog('🔄 Creating Razorpay order...', orderData);
    
    // Add timeout and retry logic
    const createOrderWithRetry = async (retryCount = 0) => {
      try {
        const response = await authFetch('/payments/razorpay/create-order', {
          method: 'POST',
          body: JSON.stringify({
            amount: orderData.amount,
            currency: orderData.currency || 'INR',
            receipt: orderData.receipt || `order_${Date.now()}`,
            notes: orderData.notes || {},
            planId: orderData.planId,
            userFormData: orderData.userFormData
          }),
          timeout: 15000 // 15 second timeout
        });

        if (response.success || response.status === 'success') {
          const order = response.data?.order;
          
          if (order && order.id) {
            forceLog('✅ Razorpay order created successfully:', order.id);
            return order;
          } else {
            throw new Error('Invalid response format from order creation endpoint');
          }
        } else {
          throw new Error(response.message || 'Failed to create payment order');
        }
      } catch (error) {
        if (retryCount < 2 && (error.message.includes('timeout') || error.message.includes('network'))) {
          forceWarn(`⚠️ Order creation attempt ${retryCount + 1} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          return createOrderWithRetry(retryCount + 1);
        }
        throw error;
      }
    };

    return await createOrderWithRetry();
    
  } catch (error) {
    forceError('❌ Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Safe payment verification with enhanced error handling
 */
export const verifyRazorpayPaymentSafely = async (authFetch, paymentData) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData } = paymentData;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification parameters');
    }

    forceLog('🔍 Verifying Razorpay payment...', { razorpay_order_id, razorpay_payment_id });
    
    const response = await authFetch('/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        gymOwnerData
      }),
      timeout: 15000 // 15 second timeout
    });

    if (response.success || response.status === 'success') {
      forceLog('✅ Payment verified successfully');
      return response;
    } else {
      throw new Error(response.message || 'Payment verification failed');
    }
  } catch (error) {
    forceError('❌ Error verifying Razorpay payment:', error);
    throw error;
  }
};

/**
 * Initialize Razorpay with comprehensive error handling
 */
export const initializeRazorpaySafely = async () => {
  try {
    forceLog('🚀 Initializing Razorpay with enhanced error handling...');
    
    // Load script safely
    const scriptLoaded = await loadRazorpayScriptSafely();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout script');
    }
    
    // Set up global error handlers for Razorpay
    window.addEventListener('error', (event) => {
      if (event.filename && event.filename.includes('checkout.razorpay.com')) {
        // Handle Razorpay script errors gracefully
        if (isNonCriticalRazorpayError(event.error)) {
          event.preventDefault(); // Prevent the error from being logged
          return false;
        }
      }
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && String(event.reason).includes('razorpay')) {
        if (isNonCriticalRazorpayError(event.reason)) {
          event.preventDefault(); // Prevent the error from being logged
          return false;
        }
      }
    });
    
    forceLog('✅ Razorpay initialized successfully with error handling');
    return true;
    
  } catch (error) {
    forceError('❌ Failed to initialize Razorpay:', error);
    return false;
  }
};

/**
 * Clean up Razorpay resources and error handlers
 */
export const cleanupRazorpay = () => {
  try {
    // Remove Razorpay script if needed
    const razorpayScripts = document.querySelectorAll('script[src*="checkout.razorpay.com"]');
    razorpayScripts.forEach(script => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    });
    
    // Clear Razorpay from window object
    if (window.Razorpay) {
      delete window.Razorpay;
    }
    
    forceLog('🧹 Razorpay resources cleaned up');
  } catch (error) {
    forceWarn('⚠️ Error during Razorpay cleanup:', error);
  }
};

export default {
  loadRazorpayScriptSafely,
  createRazorpayCheckoutSafely,
  createRazorpayOrderSafely,
  verifyRazorpayPaymentSafely,
  initializeRazorpaySafely,
  cleanupRazorpay
};