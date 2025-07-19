/**
 * Comprehensive test script to verify system optimizations
 * Tests the system's ability to handle 200-400 concurrent users
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = 200; // Test with 200 concurrent users
const TEST_DURATION = 60000; // 1 minute test

class LoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      minResponseTime: Infinity,
      maxResponseTime: 0,
      responseTimes: [],
      errors: [],
      startTime: null,
      endTime: null
    };
  }

  async makeRequest(endpoint, method = 'GET', data = null) {
    const startTime = performance.now();
    
    try {
      const config = {
        method,
        url: `${BASE_URL}${endpoint}`,
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.totalRequests++;
      this.results.successfulRequests++;
      this.results.responseTimes.push(responseTime);
      this.results.minResponseTime = Math.min(this.results.minResponseTime, responseTime);
      this.results.maxResponseTime = Math.max(this.results.maxResponseTime, responseTime);

      return { success: true, responseTime, status: response.status };
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.results.totalRequests++;
      this.results.failedRequests++;
      this.results.errors.push({
        endpoint,
        error: error.message,
        responseTime
      });

      return { success: false, responseTime, error: error.message };
    }
  }

  async simulateUser(userId) {
    const userRequests = [
      '/health',
      '/ping',
      '/',
      '/api/stats/dashboard',
      '/api/users',
      '/api/subscriptions',
      '/api/notifications'
    ];

    const results = [];
    
    for (let i = 0; i < 10; i++) { // Each user makes 10 requests
      const endpoint = userRequests[Math.floor(Math.random() * userRequests.length)];
      const result = await this.makeRequest(endpoint);
      results.push(result);
      
      // Random delay between requests (100-500ms)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 100));
    }

    return results;
  }

  async runLoadTest() {
    console.log(`🚀 Starting load test with ${CONCURRENT_USERS} concurrent users`);
    console.log(`📊 Test duration: ${TEST_DURATION / 1000} seconds`);
    console.log(`🎯 Target: ${BASE_URL}`);
    
    this.results.startTime = Date.now();

    // Create array of user simulation promises
    const userPromises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      userPromises.push(this.simulateUser(i));
    }

    // Run all users concurrently
    try {
      await Promise.all(userPromises);
    } catch (error) {
      console.error('Load test error:', error);
    }

    this.results.endTime = Date.now();
    this.calculateStats();
    this.printResults();
  }

  calculateStats() {
    if (this.results.responseTimes.length > 0) {
      this.results.averageResponseTime = 
        this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    }
  }

  printResults() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const requestsPerSecond = this.results.totalRequests / duration;
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;

    console.log('\n📈 LOAD TEST RESULTS');
    console.log('='.repeat(50));
    console.log(`⏱️  Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total Requests: ${this.results.totalRequests}`);
    console.log(`✅ Successful Requests: ${this.results.successfulRequests}`);
    console.log(`❌ Failed Requests: ${this.results.failedRequests}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⚡ Requests/Second: ${requestsPerSecond.toFixed(2)}`);
    console.log(`⏱️  Average Response Time: ${this.results.averageResponseTime.toFixed(2)}ms`);
    console.log(`🚀 Min Response Time: ${this.results.minResponseTime.toFixed(2)}ms`);
    console.log(`🐌 Max Response Time: ${this.results.maxResponseTime.toFixed(2)}ms`);

    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('='.repeat(50));
    
    if (successRate >= 99) {
      console.log('✅ Excellent: Success rate > 99%');
    } else if (successRate >= 95) {
      console.log('🟡 Good: Success rate > 95%');
    } else {
      console.log('❌ Poor: Success rate < 95%');
    }

    if (this.results.averageResponseTime < 500) {
      console.log('✅ Excellent: Average response time < 500ms');
    } else if (this.results.averageResponseTime < 1000) {
      console.log('🟡 Good: Average response time < 1000ms');
    } else {
      console.log('❌ Poor: Average response time > 1000ms');
    }

    if (requestsPerSecond > 100) {
      console.log('✅ Excellent: Handling > 100 requests/second');
    } else if (requestsPerSecond > 50) {
      console.log('🟡 Good: Handling > 50 requests/second');
    } else {
      console.log('❌ Poor: Handling < 50 requests/second');
    }

    // Error summary
    if (this.results.errors.length > 0) {
      console.log('\n❌ ERROR SUMMARY');
      console.log('='.repeat(50));
      const errorCounts = {};
      this.results.errors.forEach(error => {
        errorCounts[error.error] = (errorCounts[error.error] || 0) + 1;
      });
      
      Object.entries(errorCounts).forEach(([error, count]) => {
        console.log(`${error}: ${count} occurrences`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS');
    console.log('='.repeat(50));
    
    if (successRate < 95) {
      console.log('• Investigate and fix error causes');
      console.log('• Consider implementing circuit breakers');
    }
    
    if (this.results.averageResponseTime > 1000) {
      console.log('• Optimize database queries');
      console.log('• Implement more aggressive caching');
      console.log('• Consider database indexing');
    }
    
    if (requestsPerSecond < 50) {
      console.log('• Scale horizontally with load balancers');
      console.log('• Optimize server configuration');
      console.log('• Consider upgrading server resources');
    }

    console.log('\n🏁 Load test completed!');
  }
}

// System health check before load test
async function systemHealthCheck() {
  console.log('🔍 Performing system health check...');
  
  try {
    const healthResponse = await axios.get(`${BASE_URL}/health`, { timeout: 5000 });
    console.log('✅ Health check passed');
    
    const pingResponse = await axios.get(`${BASE_URL}/ping`, { timeout: 5000 });
    console.log('✅ Ping check passed');
    
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🧪 GYM MANAGEMENT SYSTEM - LOAD TEST');
  console.log('='.repeat(50));
  
  // Check if server is running
  const isHealthy = await systemHealthCheck();
  if (!isHealthy) {
    console.log('❌ Server is not responding. Please start the server first.');
    process.exit(1);
  }

  // Run load test
  const tester = new LoadTester();
  await tester.runLoadTest();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Load test interrupted by user');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n⏹️  Load test terminated');
  process.exit(0);
});

// Run the test
main().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});