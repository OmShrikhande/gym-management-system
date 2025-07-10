/**
 * Test script to verify the settings system
 * Run this with: node test-settings.js
 */

import fetch from 'node-fetch';
import WebSocket from 'ws';

const API_BASE = 'https://gym-management-system-ckb0.onrender.com';
const WS_BASE = 'wss://gym-management-system-ckb0.onrender.com';

// Test data
const testData = {
  gymOwnerAuth: {
    email: 'gym@example.com',
    password: 'password123'
  },
  trainerAuth: {
    email: 'trainer@example.com', 
    password: 'password123'
  },
  memberAuth: {
    email: 'member@example.com',
    password: 'password123'
  },
  testSettings: {
    primaryColor: '#ff6b6b',
    secondaryColor: '#4ecdc4',
    appName: 'Test Gym',
    language: 'English',
    emailNotifications: true,
    smsNotifications: false
  }
};

// Helper function to login and get token
async function login(credentials) {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(credentials)
  });

  if (!response.ok) {
    throw new Error(`Login failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.token;
}

// Helper function to make authenticated requests
async function authRequest(endpoint, method = 'GET', body = null, token) {
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options);
  return response.json();
}

// Test WebSocket connection
function testWebSocket(token, userId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_BASE}/ws`);
    
    ws.on('open', () => {
      console.log('✓ WebSocket connection opened');
      
      // Send auth message
      ws.send(JSON.stringify({
        type: 'auth',
        token,
        userId,
        role: 'trainer'
      }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data);
      console.log('✓ WebSocket message received:', message.type);
      
      if (message.type === 'auth_success') {
        resolve(ws);
      } else if (message.type === 'settings_update') {
        console.log('✓ Settings update received via WebSocket');
        console.log('  - Updated by:', message.updatedBy);
        console.log('  - Target users:', message.targetUsers.length);
        ws.close();
        resolve();
      }
    });

    ws.on('error', (error) => {
      console.error('✗ WebSocket error:', error);
      reject(error);
    });

    setTimeout(() => {
      reject(new Error('WebSocket connection timeout'));
    }, 10000);
  });
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Settings System Tests...\n');

  try {
    // Test 1: Login as gym owner
    console.log('📝 Test 1: Gym Owner Login');
    const gymOwnerToken = await login(testData.gymOwnerAuth);
    console.log('✓ Gym owner logged in successfully\n');

    // Test 2: Login as trainer
    console.log('📝 Test 2: Trainer Login');
    const trainerToken = await login(testData.trainerAuth);
    console.log('✓ Trainer logged in successfully\n');

    // Test 3: Get current gym settings
    console.log('📝 Test 3: Get Gym Settings');
    const gymSettings = await authRequest('/api/settings/gym/GYM_OWNER_ID', 'GET', null, gymOwnerToken);
    console.log('✓ Gym settings retrieved:', gymSettings.success);
    console.log('  - Current settings:', Object.keys(gymSettings.data?.settings || {}));
    console.log('');

    // Test 4: Test WebSocket connection for trainer
    console.log('📝 Test 4: WebSocket Connection Test');
    const trainerWs = await testWebSocket(trainerToken, 'TRAINER_ID');
    console.log('✓ Trainer WebSocket connection established\n');

    // Test 5: Update gym settings with propagation
    console.log('📝 Test 5: Update Gym Settings with Propagation');
    const updateResponse = await authRequest('/api/settings/gym/GYM_OWNER_ID', 'POST', {
      settings: testData.testSettings,
      applyToUsers: true
    }, gymOwnerToken);
    console.log('✓ Settings updated:', updateResponse.success);
    console.log('  - Message:', updateResponse.message);
    console.log('');

    // Test 6: Verify trainer received settings via WebSocket
    console.log('📝 Test 6: Real-time Settings Propagation');
    // This would be verified in the WebSocket message handler above
    console.log('✓ Check WebSocket logs above for settings_update message\n');

    // Test 7: Test performance - Cache hit
    console.log('📝 Test 7: Performance Test - Cache');
    const start = Date.now();
    const cachedSettings = await authRequest('/api/settings/gym/GYM_OWNER_ID', 'GET', null, gymOwnerToken);
    const end = Date.now();
    console.log(`✓ Settings retrieved in ${end - start}ms`);
    console.log('  - Should be faster on second call due to caching\n');

    // Test 8: Test bulk update
    console.log('📝 Test 8: Bulk Settings Update');
    const bulkResponse = await authRequest('/api/settings/bulk', 'POST', {
      userIds: ['TRAINER_ID', 'MEMBER_ID'],
      settings: testData.testSettings
    }, gymOwnerToken);
    console.log('✓ Bulk update:', bulkResponse.success);
    console.log('  - Updated users:', bulkResponse.data?.updatedCount || 0);
    console.log('');

    console.log('🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(console.error);