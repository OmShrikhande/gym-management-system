// test-gate-control.js
// Test script for gate control functionality

const API_URL = 'https://gym-management-system-ckb0.onrender.com/api';

// Test data - replace with actual user credentials
const testUsers = {
  gymOwner: {
    email: 'test-gym-owner@example.com',
    password: 'testpassword123',
    role: 'gym-owner'
  },
  trainer: {
    email: 'test-trainer@example.com', 
    password: 'testpassword123',
    role: 'trainer'
  }
};

// Helper function to make API requests
async function makeRequest(endpoint, method = 'GET', data = null, token = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    }
  };

  if (token) {
    options.headers['Authorization'] = `Bearer ${token}`;
  }

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();
    
    console.log(`${method} ${endpoint}:`, {
      status: response.status,
      success: response.ok,
      data: result
    });
    
    return { success: response.ok, data: result, status: response.status };
  } catch (error) {
    console.error(`Error with ${method} ${endpoint}:`, error);
    return { success: false, error: error.message };
  }
}

// Test authentication
async function testAuth(userType) {
  console.log(`\n🔐 Testing authentication for ${userType}...`);
  
  const user = testUsers[userType];
  const result = await makeRequest('/auth/login', 'POST', {
    email: user.email,
    password: user.password
  });

  if (result.success && result.data.token) {
    console.log(`✅ ${userType} authentication successful`);
    return {
      token: result.data.token,
      user: result.data.user
    };
  } else {
    console.log(`❌ ${userType} authentication failed:`, result.data?.message || result.error);
    return null;
  }
}

// Test gate toggle functionality
async function testGateToggle(token, userType, status) {
  console.log(`\n🚪 Testing gate ${status ? 'opening' : 'closing'} for ${userType}...`);
  
  const result = await makeRequest('/gate/toggle', 'POST', { status }, token);
  
  if (result.success) {
    console.log(`✅ Gate ${status ? 'opened' : 'closed'} successfully for ${userType}`);
    console.log('Response data:', result.data);
    
    // Check if Firebase path is mentioned in response
    if (result.data.data?.firebase) {
      console.log('Firebase update info:', result.data.data.firebase);
    }
    
    return true;
  } else {
    console.log(`❌ Gate ${status ? 'opening' : 'closing'} failed for ${userType}:`, result.data?.message || result.error);
    return false;
  }
}

// Test gate status check
async function testGateStatus(token, userType) {
  console.log(`\n📊 Testing gate status check for ${userType}...`);
  
  const result = await makeRequest('/gate/status', 'GET', null, token);
  
  if (result.success) {
    console.log(`✅ Gate status retrieved successfully for ${userType}`);
    console.log('Status data:', result.data);
    return true;
  } else {
    console.log(`❌ Gate status check failed for ${userType}:`, result.data?.message || result.error);
    return false;
  }
}

// Test emergency gate access
async function testEmergencyGate(token, userType) {
  console.log(`\n🚨 Testing emergency gate access for ${userType}...`);
  
  const result = await makeRequest('/gate/emergency', 'POST', {
    reason: 'Testing emergency access functionality'
  }, token);
  
  if (result.success) {
    console.log(`✅ Emergency gate access successful for ${userType}`);
    console.log('Response data:', result.data);
    return true;
  } else {
    console.log(`❌ Emergency gate access failed for ${userType}:`, result.data?.message || result.error);
    return false;
  }
}

// Test unauthorized access
async function testUnauthorizedAccess() {
  console.log('\n🚫 Testing unauthorized access...');
  
  const result = await makeRequest('/gate/toggle', 'POST', { status: true });
  
  if (!result.success && result.status === 401) {
    console.log('✅ Unauthorized access properly blocked');
    return true;
  } else {
    console.log('❌ Unauthorized access not properly blocked');
    return false;
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Starting Gate Control Tests...\n');
  
  const results = {
    gymOwnerAuth: false,
    trainerAuth: false,
    gymOwnerGateOpen: false,
    gymOwnerGateClose: false,
    trainerGateOpen: false,
    trainerGateClose: false,
    gymOwnerStatus: false,
    trainerStatus: false,
    gymOwnerEmergency: false,
    trainerEmergency: false,
    unauthorizedBlocked: false
  };

  // Test unauthorized access first
  results.unauthorizedBlocked = await testUnauthorizedAccess();

  // Test gym owner functionality
  const gymOwnerAuth = await testAuth('gymOwner');
  if (gymOwnerAuth) {
    results.gymOwnerAuth = true;
    results.gymOwnerGateOpen = await testGateToggle(gymOwnerAuth.token, 'gym-owner', true);
    results.gymOwnerStatus = await testGateStatus(gymOwnerAuth.token, 'gym-owner');
    results.gymOwnerGateClose = await testGateToggle(gymOwnerAuth.token, 'gym-owner', false);
    results.gymOwnerEmergency = await testEmergencyGate(gymOwnerAuth.token, 'gym-owner');
  }

  // Test trainer functionality
  const trainerAuth = await testAuth('trainer');
  if (trainerAuth) {
    results.trainerAuth = true;
    results.trainerGateOpen = await testGateToggle(trainerAuth.token, 'trainer', true);
    results.trainerStatus = await testGateStatus(trainerAuth.token, 'trainer');
    results.trainerGateClose = await testGateToggle(trainerAuth.token, 'trainer', false);
    results.trainerEmergency = await testEmergencyGate(trainerAuth.token, 'trainer');
  }

  // Print test summary
  console.log('\n📋 Test Results Summary:');
  console.log('========================');
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} ${test}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n📊 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Gate control is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Please check the implementation.');
  }

  return results;
}

// Run tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment - use built-in fetch (Node 18+)
  runTests().catch(console.error);
} else {
  // Browser environment
  window.testGateControl = runTests;
  console.log('Gate control tests loaded. Run window.testGateControl() to start testing.');
}