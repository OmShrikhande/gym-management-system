// Utility functions for Razorpay integration

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Fetch Razorpay public key from backend
 * This ensures we always use the correct key (test/live) based on environment
 */
export const getRazorpayKey = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Authentication token not found');
    }

    const response = await fetch(`${API_URL}/payments/razorpay/key`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Razorpay key: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.status === 'success' && data.data.keyId) {
      console.log(`🔑 Razorpay key fetched successfully (${data.data.mode} mode)`);
      return data.data.keyId;
    } else {
      throw new Error('Invalid response format from Razorpay key endpoint');
    }
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    // Fallback to hardcoded test key for development
    console.warn('⚠️ Falling back to hardcoded test key');
    return 'rzp_test_VUpggvAt3u75cZ';
  }
};

/**
 * Load Razorpay checkout script
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};