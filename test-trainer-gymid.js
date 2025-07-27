// test-trainer-gymid.js
// Simple test to check if trainer has gymId field set correctly

const API_URL = 'https://gym-management-system-ckb0.onrender.com/api';

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

// Test authentication and get user profile
async function testTrainerProfile(email, password) {
  console.log(`\n🔐 Testing trainer authentication and profile...`);
  
  // First, authenticate
  const authResult = await makeRequest('/auth/login', 'POST', {
    email: email,
    password: password
  });

  if (!authResult.success) {
    console.log(`❌ Authentication failed:`, authResult.data?.message || authResult.error);
    return null;
  }

  console.log(`✅ Authentication successful`);
  const token = authResult.data.token;
  const user = authResult.data.user;
  
  console.log('User data from auth:', {
    id: user._id || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    gymId: user.gymId,
    assignedTrainer: user.assignedTrainer
  });

  // Get full profile
  const profileResult = await makeRequest('/users/profile', 'GET', null, token);
  
  if (profileResult.success) {
    console.log('Full profile data:', {
      id: profileResult.data.user._id,
      name: profileResult.data.user.name,
      role: profileResult.data.user.role,
      gymId: profileResult.data.user.gymId,
      createdBy: profileResult.data.user.createdBy
    });
  }

  return { token, user };
}

// Test gate toggle with detailed error info
async function testGateToggleDetailed(token, userType) {
  console.log(`\n🚪 Testing gate toggle for ${userType} with detailed error info...`);
  
  const result = await makeRequest('/gate/toggle', 'POST', { status: true }, token);
  
  if (result.success) {
    console.log(`✅ Gate opened successfully for ${userType}`);
    console.log('Response data:', result.data);
    return true;
  } else {
    console.log(`❌ Gate opening failed for ${userType}`);
    console.log('Error details:', {
      status: result.status,
      message: result.data?.message,
      error: result.error,
      fullResponse: result.data
    });
    return false;
  }
}

// Main test function
async function runTrainerTest() {
  console.log('🧪 Starting Trainer Gate Control Test...\n');
  
  // You'll need to replace these with actual trainer credentials
  const trainerEmail = 'trainer@example.com'; // Replace with actual trainer email
  const trainerPassword = 'password123'; // Replace with actual trainer password
  
  console.log(`Testing with trainer: ${trainerEmail}`);
  
  const trainerAuth = await testTrainerProfile(trainerEmail, trainerPassword);
  
  if (trainerAuth) {
    await testGateToggleDetailed(trainerAuth.token, 'trainer');
  } else {
    console.log('❌ Cannot test gate control without valid trainer authentication');
  }
}

// Run test
if (typeof window === 'undefined') {
  // Node.js environment
  runTrainerTest().catch(console.error);
} else {
  // Browser environment
  window.testTrainerGate = runTrainerTest;
  console.log('Trainer gate test loaded. Run window.testTrainerGate() to start testing.');
}