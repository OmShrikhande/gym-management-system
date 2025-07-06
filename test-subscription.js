// Simple test to debug the subscription issue
const API_URL = 'https://gym-management-system-ckb0.onrender.com';

// Test subscription creation
const testSubscription = async () => {
  try {
    // First, let's test the health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', healthData);
    
    // Test basic API response
    console.log('Testing API root...');
    const apiResponse = await fetch(`${API_URL}/`);
    const apiData = await apiResponse.json();
    console.log('API root response:', apiData);
    
    console.log('Tests completed');
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Run the test
testSubscription();