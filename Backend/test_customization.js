// Test script to verify gym customization endpoints work
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api/gym'; // Change to your deployment URL
const DEPLOYMENT_URL = 'https://gym-management-system-ckb0.onrender.com/api/gym';

// Test data
const testGymId = '686ba1ee3194c16d80074232';
const testToken = 'your-jwt-token-here'; // Replace with actual token

const testCustomization = {
  branding: {
    gymName: 'Test Gym',
    systemName: 'Test System',
    primaryColor: '#3B82F6',
    secondaryColor: '#8B5CF6',
    backgroundColor: '#111827',
    cardColor: '#1F2937',
    sidebarColor: '#1F2937',
    textColor: '#FFFFFF',
    accentColor: '#06B6D4',
    darkMode: true
  },
  settings: {
    allowMemberCustomization: false,
    allowTrainerCustomization: false,
    customCss: ''
  }
};

async function testEndpoint(url, method = 'GET', data = null) {
  const options = {
    method: method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    }
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    console.log(`Testing ${method} ${url}`);
    const response = await fetch(url, options);
    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));
    console.log('---');
    
    return result;
  } catch (error) {
    console.error(`Error testing ${method} ${url}:`, error.message);
    return null;
  }
}

async function runTests() {
  console.log('Testing Gym Customization Endpoints');
  console.log('=====================================');

  // Test 1: Test route
  await testEndpoint(`${BASE_URL}/test`);

  // Test 2: Get customization
  await testEndpoint(`${BASE_URL}/${testGymId}/customization`);

  // Test 3: Update customization
  await testEndpoint(`${BASE_URL}/${testGymId}/customization`, 'PUT', testCustomization);

  console.log('Tests completed.');
}

// Run tests
runTests().catch(console.error);