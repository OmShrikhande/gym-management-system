// Test server endpoints
const API_URL = 'https://gym-management-system-ckb0.onrender.com';

// Test server health and basic functionality
const testServer = async () => {
  try {
    console.log('=== Testing Server Health ===');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    console.log('=== Testing API Root ===');
    const rootResponse = await fetch(`${API_URL}/`);
    const rootData = await rootResponse.json();
    console.log('Root response:', rootData);
    
    console.log('=== Testing CORS ===');
    const corsResponse = await fetch(`${API_URL}/cors-test`);
    const corsData = await corsResponse.json();
    console.log('CORS response:', corsData);
    
    console.log('=== Testing Subscription Endpoint Without Auth ===');
    const subResponse = await fetch(`${API_URL}/api/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        gymOwnerId: '686a9e61d8e5a11f0271c01e',
        plan: 'Premium',
        price: 999,
        paymentMethod: 'test_mode',
        transactionId: 'test_123'
      })
    });
    
    console.log('Subscription response status:', subResponse.status);
    console.log('Subscription response headers:', Object.fromEntries(subResponse.headers));
    
    if (subResponse.headers.get('content-type')?.includes('application/json')) {
      const subData = await subResponse.json();
      console.log('Subscription response data:', subData);
    } else {
      const subText = await subResponse.text();
      console.log('Subscription response text:', subText);
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

testServer();