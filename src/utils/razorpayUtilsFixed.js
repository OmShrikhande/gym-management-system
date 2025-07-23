// Enhanced Razorpay utilities with better error handling and authentication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Get authentication token from various storage locations
 */
const getAuthToken = () => {
  // Try multiple token sources in order of preference
  const tokenSources = [
    () => localStorage.getItem('gymflow_token'),
    () => localStorage.getItem('token'),
    () => sessionStorage.getItem('gymflow_token'),
    () => sessionStorage.getItem('token')
  ];

  for (const getToken of tokenSources) {
    const token = getToken();
    if (token && token.trim()) {
      return token.trim();
    }
  }

  return null;
};

/**
 * Validate Razorpay key format
 */
export const validateRazorpayKey = (key) => {
  if (!key || typeof key !== 'string') return false;
  
  // Razorpay keys should start with rzp_test_ or rzp_live_
  const keyPattern = /^rzp_(test|live)_[A-Za-z0-9]+$/;
  return keyPattern.test(key);
};

/**
 * Fetch Razorpay public key from backend with enhanced error handling
 */
export const getRazorpayKey = async () => {
  console.log('🔍 Starting Razorpay key fetch process...');
  
  try {
    // Step 1: Get authentication token
    const token = getAuthToken();
    
    if (!token) {
      console.warn('⚠️ No authentication token found');
      throw new Error('Authentication token not found. Please log in again.');
    }

    console.log('✅ Authentication token found');

    // Step 2: Make API request
    console.log('📡 Fetching Razorpay key from backend...');
    
    const response = await fetch(`${API_URL}/payments/razorpay/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    // Step 3: Handle response
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 503) {
        throw new Error('Payment service is temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('📦 Backend response:', data);
    
    if (data.status === 'success' && data.data && data.data.keyId) {
      const keyId = data.data.keyId;
      
      // Step 4: Validate the key format
      if (!validateRazorpayKey(keyId)) {
        throw new Error(`Invalid Razorpay key format received: ${keyId}`);
      }
      
      console.log(`🔑 Razorpay key fetched successfully (${data.data.mode} mode)`);
      return keyId;
    } else {
      console.error('❌ Invalid response format:', data);
      throw new Error('Invalid response format from Razorpay key endpoint');
    }
  } catch (error) {
    console.error('❌ Error fetching Razorpay key:', error);
    
    // Enhanced fallback logic
    const isDevelopment = import.meta.env.DEV || 
                         import.meta.env.MODE === 'development' || 
                         window.location.hostname === 'localhost';
    
    if (isDevelopment && error.message.includes('Authentication')) {
      console.warn('⚠️ Development mode: Using hardcoded test key due to auth issue');
      const fallbackKey = 'rzp_test_VUpggvAt3u75cZ';
      
      if (validateRazorpayKey(fallbackKey)) {
        return fallbackKey;
      }
    }
    
    // Re-throw the error for proper handling upstream
    throw error;
  }
};

/**
 * Load Razorpay checkout script with enhanced error handling
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve, reject) => {
    // Check if Razorpay is already loaded
    if (window.Razorpay) {
      console.log('✅ Razorpay script already loaded');
      resolve(true);
      return;
    }

    console.log('📥 Loading Razorpay checkout script...');
    
    // Remove any existing Razorpay scripts
    const existingScripts = document.querySelectorAll('script[src*="razorpay"]');
    existingScripts.forEach(script => script.remove());
    
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      
      // Verify that Razorpay object is available
      if (window.Razorpay) {
        resolve(true);
      } else {
        console.error('❌ Razorpay object not available after script load');
        resolve(false);
      }
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Razorpay script:', error);
      resolve(false);
    };
    
    // Set a timeout for script loading
    setTimeout(() => {
      if (!window.Razorpay) {
        console.error('❌ Razorpay script loading timed out');
        resolve(false);
      }
    }, 10000); // 10 second timeout
    
    document.head.appendChild(script);
  });
};

/**
 * Get Razorpay key with comprehensive validation and error handling
 */
export const getRazorpayKeyWithValidation = async () => {
  try {
    console.log('🔄 Getting Razorpay key with validation...');
    
    const key = await getRazorpayKey();
    
    if (!key) {
      throw new Error('No Razorpay key received');
    }
    
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
 * Initialize Razorpay checkout with comprehensive error handling
 */
export const initializeRazorpayCheckout = async (options) => {
  try {
    console.log('🚀 Initializing Razorpay checkout...');
    
    // Step 1: Load script
    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      throw new Error('Failed to load Razorpay checkout script');
    }
    
    // Step 2: Get and validate key
    const razorpayKey = await getRazorpayKeyWithValidation();
    
    // Step 3: Create checkout options
    const checkoutOptions = {
      ...options,
      key: razorpayKey
    };
    
    console.log('💳 Creating Razorpay checkout instance...');
    
    // Step 4: Create and open checkout
    const razorpay = new window.Razorpay(checkoutOptions);
    
    return razorpay;
  } catch (error) {
    console.error('❌ Failed to initialize Razorpay checkout:', error);
    throw error;
  }
};

export default {
  getRazorpayKey,
  getRazorpayKeyWithValidation,
  loadRazorpayScript,
  validateRazorpayKey,
  initializeRazorpayCheckout
};