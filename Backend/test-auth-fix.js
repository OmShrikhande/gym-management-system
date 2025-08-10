import fetch from 'node-fetch';

const API_URL = 'https://gym-management-system-ckb0.onrender.com/api';

async function testAuthenticationFix() {
  console.log('🧪 Testing Authentication Fix...\n');

  try {
    // Step 1: Try to login with a test user
    console.log('Step 1: Attempting login...');
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'a@g.c', // Using the user from the database
        password: 'test123' // You'll need to use the correct password
      }),
    });

    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', JSON.stringify(loginData, null, 2));

    if (!loginResponse.ok) {
      console.log('❌ Login failed. This test requires a valid user account.');
      console.log('Please ensure you have a user with email "a@g.c" and password "test123"');
      return;
    }

    const token = loginData.token;
    const user = loginData.data.user;
    console.log(`✅ Login successful! User: ${user.name} (${user.role})`);

    // Step 2: Test the settings endpoint that was causing 401 errors
    console.log('\nStep 2: Testing /api/settings endpoint...');
    const settingsResponse = await fetch(`${API_URL}/settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const settingsData = await settingsResponse.json();
    console.log('Settings response status:', settingsResponse.status);
    console.log('Settings response:', JSON.stringify(settingsData, null, 2));

    if (settingsResponse.ok) {
      console.log('✅ Settings endpoint now accessible!');
    } else {
      console.log('❌ Settings endpoint still returning error');
    }

    // Step 3: Test token verification endpoint
    console.log('\nStep 3: Testing token verification...');
    const verifyResponse = await fetch(`${API_URL}/auth/verify-token`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Token verification status:', verifyResponse.status);
    if (verifyResponse.ok) {
      console.log('✅ Token verification successful!');
    } else {
      console.log('❌ Token verification failed');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testAuthenticationFix().then(() => {
  console.log('\n🏁 Test completed');
});