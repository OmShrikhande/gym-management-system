// Utility functions for Razorpay integration with improved authentication
import { 
  createSecureRazorpayOrder, 
  verifySecureRazorpayPayment, 
  getSecureRazorpayKey,
  initializeRazorpaySecurity 
} from './razorpaySecurityUtils.js';

/**
 * Fetch Razorpay public key from backend using authenticated fetch
 * This ensures we always use the correct key (test/live) based on environment
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @returns {Promise<string>} Razorpay public key
 */
export const getRazorpayKey = async (authFetch) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided. Please ensure you are logged in.');
    }

    console.log('🔍 Attempting to fetch Razorpay key from backend...');
    
    const response = await authFetch('/payments/razorpay/key', {
      method: 'GET',
      timeout: 10000 // 10 second timeout
    });

    console.log('Backend response:', response);
    
    if (response.success || response.status === 'success') {
      const keyId = response.data?.keyId;
      const mode = response.data?.mode || 'unknown';
      
      if (keyId) {
        console.log(`🔑 Razorpay key fetched successfully (${mode} mode)`);
        return keyId;
      } else {
        console.error('Invalid response format - missing keyId:', response);
        throw new Error('Invalid response format from Razorpay key endpoint');
      }
    } else {
      console.error('Failed to fetch Razorpay key:', response);
      
      if (response.message?.includes('Authentication') || response.message?.includes('token')) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.message?.includes('unavailable') || response.message?.includes('503')) {
        throw new Error('Payment service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(response.message || 'Failed to fetch Razorpay key');
      }
    }
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    
    // Enhanced fallback logic for development
    const isDevelopment = import.meta.env.DEV || 
                         import.meta.env.MODE === 'development' ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1';
    
    if (isDevelopment && (error.message.includes('Authentication') || error.message.includes('token'))) {
      console.warn('⚠️ Development mode: Using hardcoded test key due to auth issue');
      return 'rzp_test_VUpggvAt3u75cZ';
    }
    
    // Re-throw the error for proper handling upstream
    throw error;
  }
};

/**
 * Load Razorpay checkout script with enhanced error handling
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay script already loaded');
      resolve(true);
      return;
    }

    console.log('📥 Loading Razorpay checkout script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    
    // Add attributes to prevent some console warnings
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      
      // Set up error suppression for Razorpay
      if (window.Razorpay) {
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
      }
      
      resolve(true);
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};

/**
 * Validate Razorpay key format
 */
export const validateRazorpayKey = (key) => {
  if (!key) return false;
  
  // Razorpay keys should start with rzp_test_ or rzp_live_
  const keyPattern = /^rzp_(test|live)_[A-Za-z0-9]+$/;
  return keyPattern.test(key);
};

/**
 * Get Razorpay key with enhanced error handling and validation
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @returns {Promise<string>} Validated Razorpay public key
 */
export const getRazorpayKeyWithValidation = async (authFetch) => {
  try {
    const key = await getRazorpayKey(authFetch);
    
    if (!validateRazorpayKey(key)) {
      throw new Error(`Invalid Razorpay key format: ${key}`);
    }
    
    console.log('✅ Razorpay key validated successfully');
    return key;
  } catch (error) {
    console.error('❌ Failed to get valid Razorpay key:', error);
    throw error;
  }
};

/**
 * Create a Razorpay order using authenticated fetch
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @param {Object} orderData - Order data (amount, currency, receipt, notes)
 * @returns {Promise<Object>} Razorpay order object
 */
export const createRazorpayOrder = async (authFetch, orderData) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided. Please ensure you are logged in.');
    }

    if (!orderData.amount || orderData.amount <= 0) {
      throw new Error('Please provide a valid amount');
    }

    console.log('🔄 Creating Razorpay order...', orderData);
    
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

    console.log('Order creation response:', response);
    
    if (response.success || response.status === 'success') {
      const order = response.data?.order;
      
      if (order && order.id) {
        console.log('✅ Razorpay order created successfully:', order.id);
        return order;
      } else {
        console.error('Invalid order response format:', response);
        throw new Error('Invalid response format from order creation endpoint');
      }
    } else {
      console.error('Failed to create Razorpay order:', response);
      throw new Error(response.message || 'Failed to create payment order');
    }
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    throw error;
  }
};

/**
 * Verify Razorpay payment using authenticated fetch
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @param {Object} paymentData - Payment verification data
 * @returns {Promise<Object>} Verification response
 */
export const verifyRazorpayPayment = async (authFetch, paymentData) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided. Please ensure you are logged in.');
    }

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData } = paymentData;
    
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      throw new Error('Missing payment verification parameters');
    }

    console.log('🔍 Verifying Razorpay payment...', { razorpay_order_id, razorpay_payment_id });
    
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

    console.log('Payment verification response:', response);
    
    if (response.success || response.status === 'success') {
      console.log('✅ Payment verified successfully');
      return response;
    } else {
      console.error('Payment verification failed:', response);
      throw new Error(response.message || 'Payment verification failed');
    }
  } catch (error) {
    console.error('❌ Error verifying Razorpay payment:', error);
    throw error;
  }
};

/**
 * Initialize complete Razorpay checkout process
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @param {Object} options - Checkout options
 * @returns {Promise<Object>} Razorpay checkout instance
 */
export const initializeRazorpayCheckout = async (authFetch, options) => {
  try {
    console.log('🚀 Initializing Razorpay checkout process...');
    
    // Step 1: Load Razorpay script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout script');
    }

    // Step 2: Get Razorpay key
    const razorpayKey = await getRazorpayKeyWithValidation(authFetch);

    // Step 3: Create order if not provided
    let order = options.order;
    if (!order) {
      order = await createRazorpayOrder(authFetch, {
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes,
        planId: options.planId,
        userFormData: options.userFormData
      });
    }

    // Step 4: Prepare Razorpay options
    const razorpayOptions = {
      key: razorpayKey,
      amount: order.amount,
      currency: order.currency,
      name: options.name || 'GymFlow',
      description: options.description || 'Payment',
      order_id: order.id,
      handler: options.handler,
      prefill: options.prefill || {},
      theme: options.theme || { color: '#3B82F6' },
      modal: {
        ondismiss: options.onDismiss || (() => {
          console.log('Payment modal dismissed');
        })
      }
    };

    console.log('✅ Razorpay checkout initialized successfully');
    
    // Step 5: Create and return Razorpay instance
    const razorpay = new window.Razorpay(razorpayOptions);
    
    return {
      razorpay,
      order,
      key: razorpayKey,
      open: () => razorpay.open()
    };
    
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay checkout:', error);
    throw error;
  }
};

/**
 * Check Razorpay service health
 * @param {Function} authFetch - Authenticated fetch function from AuthContext
 * @returns {Promise<Object>} Health check response
 */
export const checkRazorpayHealth = async (authFetch) => {
  try {
    if (!authFetch) {
      throw new Error('Authentication function not provided. Please ensure you are logged in.');
    }

    console.log('🏥 Checking Razorpay service health...');
    
    const response = await authFetch('/payments/razorpay/health', {
      method: 'GET',
      timeout: 10000 // 10 second timeout
    });

    console.log('Razorpay health check response:', response);
    
    if (response.success || response.status === 'success') {
      console.log('✅ Razorpay service is healthy');
      return response.data;
    } else {
      console.warn('⚠️ Razorpay service health check failed:', response);
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking Razorpay health:', error);
    return null;
  }
};

// Export security-enhanced functions
export {
  createSecureRazorpayOrder,
  verifySecureRazorpayPayment,
  getSecureRazorpayKey,
  initializeRazorpaySecurity
};