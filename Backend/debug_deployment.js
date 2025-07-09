#!/usr/bin/env node

// Simple script to test the deployment and debug the issue

const BASE_URL = 'https://gym-management-system-ckb0.onrender.com';

async function testEndpoint(endpoint, method = 'GET', headers = {}, body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    console.log(`\n🔍 Testing ${method} ${endpoint}`);
    console.log(`📡 Full URL: ${BASE_URL}${endpoint}`);
    
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Response:`, JSON.stringify(data, null, 2));
    console.log('─'.repeat(50));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ Error testing ${endpoint}:`, error.message);
    return { error: error.message };
  }
}

async function runDiagnostics() {
  console.log('🚀 Starting Deployment Diagnostics');
  console.log('=' .repeat(50));

  // Test 1: Check if server is running
  await testEndpoint('/health');
  
  // Test 2: Check deployment status
  await testEndpoint('/deployment-status');
  
  // Test 3: Test basic gym route
  await testEndpoint('/api/gym/test');
  
  // Test 4: Debug specific gym ID
  await testEndpoint('/debug-gym/686ba1ee3194c16d80074232');
  
  // Test 5: Try to access the failing endpoint without auth (should fail with 401)
  // await testEndpoint('/api/gym/686ba1ee3194c16d80074232/customization');
  
  console.log('\n✅ Diagnostics complete!');
  console.log('\n📝 Next steps:');
  console.log('1. Check if deployment has latest code (codeVersion should be v2.0-enhanced-error-handling)');
  console.log('2. If not, redeploy the application');
  console.log('3. Try the failing request again with proper authentication');
}

// Import fetch for Node.js if needed
import fetch from 'node-fetch';

runDiagnostics().catch(console.error);