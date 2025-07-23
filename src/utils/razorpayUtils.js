// Utility functions for Razorpay integration

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch Razorpay public key from backend
 * This ensures we always use the correct key (test/live) based on environment
 */
export const getRazorpayKey = async () => {
  try {
    // Try multiple token sources in the correct order
    const token = localStorage.getItem('gymflow_token') || 
                  localStorage.getItem('token') || 
                  sessionStorage.getItem('gymflow_token') ||
                  sessionStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No authentication token found');
      console.log('Available storage keys:', {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage)
      });
      throw new Error('Authentication token not found. Please log in again.');
    }

    console.log('🔍 Attempting to fetch Razorpay key from backend...');
    console.log('Using token:', token.substring(0, 20) + '...');
    
    const response = await fetch(`${API_URL}/payments/razorpay/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      let errorText;
      try {
        errorText = await response.text();
      } catch (e) {
        errorText = 'Unable to read error response';
      }
      
      console.error('Backend response error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      } else if (response.status === 503) {
        throw new Error('Payment service temporarily unavailable. Please try again later.');
      } else {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log('Backend response:', data);
    
    if (data.status === 'success' && data.data && data.data.keyId) {
      console.log(`🔑 Razorpay key fetched successfully (${data.data.mode} mode)`);
      return data.data.keyId;
    } else {
      console.error('Invalid response format:', data);
      throw new Error('Invalid response format from Razorpay key endpoint');
    }
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    
    // Enhanced fallback logic
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
 * Load Razorpay checkout script
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
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      resolve(true);
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
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
 */
export const getRazorpayKeyWithValidation = async () => {
  try {
    const key = await getRazorpayKey();
    
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