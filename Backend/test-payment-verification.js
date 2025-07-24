// Test script to verify payment verification endpoint
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

// Test data
const testPaymentData = {
  razorpay_order_id: 'order_test_123',
  razorpay_payment_id: 'pay_test_123',
  razorpay_signature: 'test_signature_123',
  planData: {
    id: 'basic',
    name: 'Basic',
    price: 49,
    maxMembers: 200,
    maxTrainers: 5
  }
};

async function testPaymentVerification() {
  try {
    console.log('🧪 Testing payment verification endpoint...');
    console.log('📋 Test data:', JSON.stringify(testPaymentData, null, 2));
    
    const response = await fetch(`${API_URL}/payments/razorpay/verify-activation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test_token' // You'll need a real token
      },
      body: JSON.stringify(testPaymentData)
    });
    
    const result = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response data:', JSON.stringify(result, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Test passed - Payment verification successful');
    } else {
      console.log('❌ Test failed - Payment verification failed');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testPaymentVerification();