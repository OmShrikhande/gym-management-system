// Test script to verify backend authentication
const API_URL = 'https://gym-management-system-ckb0.onrender.com/api';

async function testBackendAuth() {
  try {
    console.log('Testing backend authentication...');
    
    // First, let's test if the server is responding
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log('Health check status:', healthResponse.status);
    
    // Test the settings endpoint without auth (should get 401)
    const settingsResponse = await fetch(`${API_URL}/settings/gym/686ba1ee3194c16d80074232`);
    console.log('Settings without auth status:', settingsResponse.status);
    const settingsData = await settingsResponse.text();
    console.log('Settings response:', settingsData);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBackendAuth();