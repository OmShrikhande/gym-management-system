// Test script to verify Razorpay integration improvements
// Run this in the browser console after logging in

console.log('🧪 Testing improved Razorpay integration...');

// Test 1: Check if AuthContext is available
const testAuthContext = () => {
  console.log('\n1️⃣ Testing AuthContext availability...');
  
  // This would be available in a React component context
  const hasAuthContext = typeof window.React !== 'undefined';
  console.log('React available:', hasAuthContext);
  
  // Check if tokens are in storage
  const tokens = {
    gymflow_token: localStorage.getItem('gymflow_token'),
    token: localStorage.getItem('token'),
    sessionGymflow: sessionStorage.getItem('gymflow_token'),
    sessionToken: sessionStorage.getItem('token')
  };
  
  console.log('Available tokens:', tokens);
  
  const hasValidToken = Object.values(tokens).some(token => token && token.length > 10);
  console.log('Has valid token:', hasValidToken);
  
  return hasValidToken;
};

// Test 2: Check API endpoint accessibility
const testAPIEndpoint = async () => {
  console.log('\n2️⃣ Testing API endpoint accessibility...');
  
  const API_URL = 'https://gym-management-system-ckb0.onrender.com/api';
  const token = localStorage.getItem('gymflow_token') || localStorage.getItem('token');
  
  if (!token) {
    console.error('❌ No authentication token found');
    return false;
  }
  
  try {
    const response = await fetch(`${API_URL}/payments/razorpay/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('API Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API endpoint accessible:', data);
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ API endpoint error:', response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Network error:', error);
    return false;
  }
};

// Test 3: Check Razorpay script loading
const testRazorpayScript = () => {
  console.log('\n3️⃣ Testing Razorpay script loading...');
  
  const hasRazorpay = typeof window.Razorpay !== 'undefined';
  console.log('Razorpay script loaded:', hasRazorpay);
  
  if (!hasRazorpay) {
    console.log('Loading Razorpay script...');
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
    };
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
    };
    document.head.appendChild(script);
  }
  
  return hasRazorpay;
};

// Test 4: Validate environment setup
const testEnvironment = () => {
  console.log('\n4️⃣ Testing environment setup...');
  
  const env = {
    isDevelopment: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    currentHost: window.location.hostname,
    currentProtocol: window.location.protocol,
    userAgent: navigator.userAgent.substring(0, 50) + '...'
  };
  
  console.log('Environment info:', env);
  
  return env;
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting Razorpay integration tests...\n');
  
  const results = {
    authContext: testAuthContext(),
    environment: testEnvironment(),
    razorpayScript: testRazorpayScript(),
    apiEndpoint: await testAPIEndpoint()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  Object.entries(results).forEach(([test, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${test}: ${status}`);
  });
  
  const allPassed = Object.values(results).every(result => result === true);
  console.log(`\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
  
  if (!allPassed) {
    console.log('\n💡 Troubleshooting Tips:');
    if (!results.authContext) {
      console.log('- Make sure you are logged in');
      console.log('- Check if authentication tokens are present in localStorage');
    }
    if (!results.apiEndpoint) {
      console.log('- Check your internet connection');
      console.log('- Verify the backend server is running');
      console.log('- Check if your authentication token is valid');
    }
    if (!results.razorpayScript) {
      console.log('- Check if Razorpay CDN is accessible');
      console.log('- Verify there are no content blockers preventing script loading');
    }
  }
  
  return results;
};

// Export for manual testing
window.testRazorpayIntegration = runAllTests;

// Auto-run tests
runAllTests().catch(error => {
  console.error('❌ Test execution failed:', error);
});

console.log('\n📝 Note: You can run tests manually by calling: testRazorpayIntegration()');