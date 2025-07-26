// Simple test script to verify payment system functionality
const testPaymentSystem = async () => {
  const baseUrl = 'http://localhost:5000/api';
  
  console.log('🧪 Testing Payment System...');
  
  try {
    // Test 1: Check if server is running
    console.log('\n1. Testing server health...');
    const healthResponse = await fetch(`${baseUrl.replace('/api', '')}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server is running:', healthData.status);
    
    // Test 2: Test authentication (you'll need to replace with actual credentials)
    console.log('\n2. Testing authentication...');
    const loginResponse = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@gymflow.com', // Replace with actual gym owner email
        password: 'password123' // Replace with actual password
      })
    });
    
    if (!loginResponse.ok) {
      console.log('❌ Authentication failed. Please check credentials.');
      return;
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Authentication successful');
    
    // Test 3: Test member payments endpoint
    console.log('\n3. Testing member payments endpoint...');
    const paymentsResponse = await fetch(`${baseUrl}/payments/member-payments`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (paymentsResponse.ok) {
      const paymentsData = await paymentsResponse.json();
      console.log('✅ Member payments endpoint working');
      console.log('📊 Payment stats:', paymentsData.data?.stats);
    } else {
      console.log('❌ Member payments endpoint failed:', paymentsResponse.status);
    }
    
    // Test 4: Test payment stats endpoint
    console.log('\n4. Testing payment stats endpoint...');
    const statsResponse = await fetch(`${baseUrl}/payments/member-payments/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Payment stats endpoint working');
      console.log('📈 Revenue stats:', statsData.data?.revenueStats);
    } else {
      console.log('❌ Payment stats endpoint failed:', statsResponse.status);
    }
    
    console.log('\n🎉 Payment system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
};

// Run the test if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testPaymentSystem();
} else {
  // Browser environment
  console.log('Run this in the browser console after logging in as a gym owner');
  window.testPaymentSystem = testPaymentSystem;
}