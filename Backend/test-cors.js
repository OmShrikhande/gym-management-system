#!/usr/bin/env node

/**
 * CORS Test Script
 * Tests if the backend CORS configuration is working correctly
 */

import https from 'https';
import http from 'http';

const API_BASE = 'https://gym-management-system-ckb0.onrender.com';
const FRONTEND_ORIGIN = 'https://gentle-gingersnap-9fde09.netlify.app';

console.log('🧪 Testing CORS Configuration...\n');

// Test 1: OPTIONS preflight request
function testPreflight() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣ Testing OPTIONS preflight request...');
    
    const options = {
      hostname: 'gym-management-system-ckb0.onrender.com',
      port: 443,
      path: '/api/cors-test',
      method: 'OPTIONS',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization,content-type'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log('   Headers:');
      Object.keys(res.headers).filter(h => h.startsWith('access-control')).forEach(header => {
        console.log(`   - ${header}: ${res.headers[header]}`);
      });
      
      if (res.headers['access-control-allow-origin']) {
        console.log('   ✅ CORS preflight successful\n');
        resolve(true);
      } else {
        console.log('   ❌ CORS preflight failed - missing Access-Control-Allow-Origin\n');
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`   ❌ Preflight request failed: ${err.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// Test 2: Actual GET request
function testGetRequest() {
  return new Promise((resolve, reject) => {
    console.log('2️⃣ Testing GET request...');
    
    const options = {
      hostname: 'gym-management-system-ckb0.onrender.com',
      port: 443,
      path: '/api/cors-test',
      method: 'GET',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log('   CORS Headers:');
      Object.keys(res.headers).filter(h => h.startsWith('access-control')).forEach(header => {
        console.log(`   - ${header}: ${res.headers[header]}`);
      });

      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('   Response:', response);
          
          if (res.headers['access-control-allow-origin']) {
            console.log('   ✅ GET request successful\n');
            resolve(true);
          } else {
            console.log('   ❌ GET request failed - missing CORS headers\n');
            resolve(false);
          }
        } catch (err) {
          console.log('   ❌ Invalid JSON response\n');
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.log(`   ❌ GET request failed: ${err.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// Test 3: Auth endpoint test
function testAuthEndpoint() {
  return new Promise((resolve, reject) => {
    console.log('3️⃣ Testing /api/auth/verify-token endpoint...');
    
    const options = {
      hostname: 'gym-management-system-ckb0.onrender.com',
      port: 443,
      path: '/api/auth/verify-token',
      method: 'GET',
      headers: {
        'Origin': FRONTEND_ORIGIN,
        'Authorization': 'Bearer dummy-token'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`   Status: ${res.statusCode}`);
      console.log('   CORS Headers:');
      Object.keys(res.headers).filter(h => h.startsWith('access-control')).forEach(header => {
        console.log(`   - ${header}: ${res.headers[header]}`);
      });
      
      if (res.headers['access-control-allow-origin']) {
        console.log('   ✅ Auth endpoint CORS working (even with dummy token)\n');
        resolve(true);
      } else {
        console.log('   ❌ Auth endpoint CORS failed\n');
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`   ❌ Auth endpoint test failed: ${err.message}\n`);
      resolve(false);
    });

    req.end();
  });
}

// Run all tests
async function runTests() {
  console.log(`🎯 Target: ${API_BASE}`);
  console.log(`🌐 Origin: ${FRONTEND_ORIGIN}\n`);
  
  const results = [];
  
  results.push(await testPreflight());
  results.push(await testGetRequest());
  results.push(await testAuthEndpoint());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('📊 CORS Test Results:');
  console.log(`   Passed: ${passed}/${total}`);
  
  if (passed === total) {
    console.log('   🎉 All CORS tests passed! Your frontend should work now.');
  } else {
    console.log('   ⚠️  Some tests failed. Backend deployment may be needed.');
    console.log('\n💡 Next steps:');
    console.log('   1. Deploy the updated backend to Render');
    console.log('   2. Check Render logs for any errors');
    console.log('   3. Verify environment variables are set correctly');
  }
}

// Run the tests
runTests().catch(console.error);