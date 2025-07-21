import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000/api';

// Test the create-order endpoint
async function testCreateOrder() {
  try {
    console.log('🧪 Testing create-order API endpoint...');
    
    const response = await fetch(`${API_URL}/payments/razorpay/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You'll need a real token
      },
      body: JSON.stringify({
        amount: 100,
        currency: 'INR',
        receipt: 'test_receipt_' + Date.now(),
        notes: {
          test: 'API test'
        }
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testCreateOrder();