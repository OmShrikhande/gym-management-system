/**
 * Advanced stress test for 200-400 concurrent users
 * Tests all critical endpoints under high load
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const CONCURRENT_USERS = parseInt(process.env.CONCURRENT_USERS) || 300;
const TEST_DURATION = parseInt(process.env.TEST_DURATION) || 120000; // 2 minutes
const RAMP_UP_TIME = 30000; // 30 seconds to ramp up

class AdvancedLoadTester {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errors: new Map(),
      endpointStats: new Map(),
      startTime: null,
      endTime: null,
      peakMemory: 0,
      connectionErrors: 0,
      timeoutErrors: 0
    };
    
    this.isRunning = false;
    this.activeUsers = 0;
    this.maxActiveUsers = 0;
  }

  async makeRequest(endpoint, method = 'GET', data = null, headers = {}) {
    const startTime = performance.now();
    const fullUrl = `${BASE_URL}${endpoint}`;
    
    try {
      const config = {
        method,
        url: fullUrl,
        timeout: 15000, // 15 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'LoadTester/1.0',
          ...headers
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      const endTime = performance.now();
      const responseTime = endTime - startTime;

      this.recordSuccess(endpoint, responseTime, response.status);
      return { success: true, responseTime, status: response.status, data: response.data };
      
    } catch (error) {
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.recordError(endpoint, error, responseTime);
      return { success: false, responseTime, error: error.message };
    }
  }

  recordSuccess(endpoint, responseTime, status) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    this.results.responseTimes.push(responseTime);
    
    if (!this.results.endpointStats.has(endpoint)) {
      this.results.endpointStats.set(endpoint, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }
    
    const stats = this.results.endpointStats.get(endpoint);
    stats.requests++;
    stats.successes++;
    stats.totalTime += responseTime;
    stats.avgTime = stats.totalTime / stats.requests;
    stats.minTime = Math.min(stats.minTime, responseTime);
    stats.maxTime = Math.max(stats.maxTime, responseTime);
  }

  recordError(endpoint, error, responseTime) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    
    // Categorize errors
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      this.results.connectionErrors++;
    } else if (error.code === 'ECONNABORTED') {
      this.results.timeoutErrors++;
    }
    
    const errorKey = error.response?.status || error.code || 'Unknown';
    this.results.errors.set(errorKey, (this.results.errors.get(errorKey) || 0) + 1);
    
    if (!this.results.endpointStats.has(endpoint)) {
      this.results.endpointStats.set(endpoint, {
        requests: 0,
        successes: 0,
        failures: 0,
        totalTime: 0,
        avgTime: 0,
        minTime: Infinity,
        maxTime: 0
      });
    }
    
    const stats = this.results.endpointStats.get(endpoint);
    stats.requests++;
    stats.failures++;
  }

  async simulateRealisticUser(userId) {
    const userScenarios = [
      // Health check scenario
      async () => {
        await this.makeRequest('/health');
        await this.makeRequest('/ping');
      },
      
      // Dashboard scenario
      async () => {
        await this.makeRequest('/health');
        await this.sleep(100);
        await this.makeRequest('/ws-status');
      },
      
      // API exploration scenario
      async () => {
        await this.makeRequest('/');
        await this.sleep(200);
        await this.makeRequest('/health');
        await this.sleep(150);
        await this.makeRequest('/ping');
      },
      
      // System monitoring scenario
      async () => {
        await this.makeRequest('/health');
        await this.sleep(300);
        await this.makeRequest('/ws-status');
        await this.sleep(200);
        await this.makeRequest('/ping');
      }
    ];

    this.activeUsers++;
    this.maxActiveUsers = Math.max(this.maxActiveUsers, this.activeUsers);

    try {
      while (this.isRunning) {
        // Choose random scenario
        const scenario = userScenarios[Math.floor(Math.random() * userScenarios.length)];
        await scenario();
        
        // Random think time between scenarios (500ms - 2s)
        await this.sleep(Math.random() * 1500 + 500);
      }
    } finally {
      this.activeUsers--;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async rampUpUsers() {
    console.log(`🚀 Ramping up ${CONCURRENT_USERS} users over ${RAMP_UP_TIME / 1000} seconds...`);
    
    const userPromises = [];
    const usersPerSecond = CONCURRENT_USERS / (RAMP_UP_TIME / 1000);
    
    for (let i = 0; i < CONCURRENT_USERS; i++) {
      const delay = (i / usersPerSecond) * 1000;
      
      setTimeout(() => {
        if (this.isRunning) {
          userPromises.push(this.simulateRealisticUser(i));
        }
      }, delay);
    }
    
    return userPromises;
  }

  async monitorSystemHealth() {
    const healthChecks = [];
    
    while (this.isRunning) {
      try {
        const healthResponse = await this.makeRequest('/health');
        if (healthResponse.success && healthResponse.data) {
          const memory = healthResponse.data.metrics?.memory;
          if (memory) {
            const memoryMB = parseFloat(memory.heapUsed);
            this.results.peakMemory = Math.max(this.results.peakMemory, memoryMB);
          }
        }
        healthChecks.push(healthResponse);
      } catch (error) {
        console.warn('Health check failed:', error.message);
      }
      
      await this.sleep(5000); // Check every 5 seconds
    }
    
    return healthChecks;
  }

  async runStressTest() {
    console.log('🧪 ADVANCED STRESS TEST - GYM MANAGEMENT SYSTEM');
    console.log('='.repeat(60));
    console.log(`🎯 Target: ${CONCURRENT_USERS} concurrent users`);
    console.log(`⏱️  Duration: ${TEST_DURATION / 1000} seconds`);
    console.log(`🌐 Endpoint: ${BASE_URL}`);
    console.log(`📈 Ramp-up: ${RAMP_UP_TIME / 1000} seconds`);
    console.log('='.repeat(60));

    // Pre-test health check
    console.log('🔍 Pre-test system health check...');
    const preTestHealth = await this.makeRequest('/health');
    if (!preTestHealth.success) {
      console.error('❌ Pre-test health check failed. Server may not be running.');
      return;
    }
    console.log('✅ Pre-test health check passed');

    this.results.startTime = Date.now();
    this.isRunning = true;

    // Start system monitoring
    const healthMonitoring = this.monitorSystemHealth();

    // Ramp up users
    const userPromises = await this.rampUpUsers();

    // Run test for specified duration
    console.log(`⏳ Running stress test for ${TEST_DURATION / 1000} seconds...`);
    await this.sleep(TEST_DURATION);

    // Stop test
    this.isRunning = false;
    this.results.endTime = Date.now();

    console.log('🛑 Stopping test and collecting final metrics...');
    
    // Wait a bit for cleanup
    await this.sleep(2000);

    // Final health check
    const postTestHealth = await this.makeRequest('/health');
    
    this.analyzeResults();
    this.printDetailedResults(preTestHealth.data, postTestHealth.data);
  }

  analyzeResults() {
    if (this.results.responseTimes.length > 0) {
      this.results.responseTimes.sort((a, b) => a - b);
      
      this.results.avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
      this.results.minResponseTime = this.results.responseTimes[0];
      this.results.maxResponseTime = this.results.responseTimes[this.results.responseTimes.length - 1];
      this.results.p95ResponseTime = this.results.responseTimes[Math.floor(this.results.responseTimes.length * 0.95)];
      this.results.p99ResponseTime = this.results.responseTimes[Math.floor(this.results.responseTimes.length * 0.99)];
    }
  }

  printDetailedResults(preTestHealth, postTestHealth) {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    const requestsPerSecond = this.results.totalRequests / duration;
    const successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;

    console.log('\n📊 DETAILED STRESS TEST RESULTS');
    console.log('='.repeat(60));
    
    // Basic metrics
    console.log('📈 PERFORMANCE METRICS');
    console.log(`⏱️  Test Duration: ${duration.toFixed(2)} seconds`);
    console.log(`👥 Max Concurrent Users: ${this.maxActiveUsers}`);
    console.log(`📊 Total Requests: ${this.results.totalRequests}`);
    console.log(`✅ Successful Requests: ${this.results.successfulRequests}`);
    console.log(`❌ Failed Requests: ${this.results.failedRequests}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(2)}%`);
    console.log(`⚡ Requests/Second: ${requestsPerSecond.toFixed(2)}`);

    // Response time metrics
    if (this.results.responseTimes.length > 0) {
      console.log('\n⏱️  RESPONSE TIME ANALYSIS');
      console.log(`📊 Average: ${this.results.avgResponseTime.toFixed(2)}ms`);
      console.log(`🚀 Minimum: ${this.results.minResponseTime.toFixed(2)}ms`);
      console.log(`🐌 Maximum: ${this.results.maxResponseTime.toFixed(2)}ms`);
      console.log(`📈 95th Percentile: ${this.results.p95ResponseTime.toFixed(2)}ms`);
      console.log(`📈 99th Percentile: ${this.results.p99ResponseTime.toFixed(2)}ms`);
    }

    // Memory analysis
    console.log('\n💾 MEMORY ANALYSIS');
    if (preTestHealth?.metrics?.memory && postTestHealth?.metrics?.memory) {
      console.log(`📊 Pre-test Memory: ${preTestHealth.metrics.memory.heapUsed}`);
      console.log(`📊 Post-test Memory: ${postTestHealth.metrics.memory.heapUsed}`);
      console.log(`📈 Peak Memory: ${this.results.peakMemory.toFixed(2)}MB`);
    }

    // Error analysis
    if (this.results.errors.size > 0) {
      console.log('\n❌ ERROR ANALYSIS');
      this.results.errors.forEach((count, error) => {
        console.log(`${error}: ${count} occurrences`);
      });
      
      if (this.results.connectionErrors > 0) {
        console.log(`🔌 Connection Errors: ${this.results.connectionErrors}`);
      }
      if (this.results.timeoutErrors > 0) {
        console.log(`⏰ Timeout Errors: ${this.results.timeoutErrors}`);
      }
    }

    // Endpoint performance
    console.log('\n🎯 ENDPOINT PERFORMANCE');
    this.results.endpointStats.forEach((stats, endpoint) => {
      const successRate = (stats.successes / stats.requests) * 100;
      console.log(`${endpoint}:`);
      console.log(`  📊 Requests: ${stats.requests}`);
      console.log(`  ✅ Success Rate: ${successRate.toFixed(2)}%`);
      console.log(`  ⏱️  Avg Response: ${stats.avgTime.toFixed(2)}ms`);
      console.log(`  📈 Min/Max: ${stats.minTime.toFixed(2)}ms / ${stats.maxTime.toFixed(2)}ms`);
    });

    // Performance assessment
    console.log('\n🎯 PERFORMANCE ASSESSMENT');
    console.log('='.repeat(60));
    
    const assessments = [];
    
    if (successRate >= 99) {
      assessments.push('✅ EXCELLENT: Success rate > 99%');
    } else if (successRate >= 95) {
      assessments.push('🟡 GOOD: Success rate > 95%');
    } else {
      assessments.push('❌ POOR: Success rate < 95%');
    }

    if (this.results.avgResponseTime < 500) {
      assessments.push('✅ EXCELLENT: Average response time < 500ms');
    } else if (this.results.avgResponseTime < 1000) {
      assessments.push('🟡 GOOD: Average response time < 1000ms');
    } else {
      assessments.push('❌ POOR: Average response time > 1000ms');
    }

    if (requestsPerSecond > 100) {
      assessments.push('✅ EXCELLENT: Handling > 100 requests/second');
    } else if (requestsPerSecond > 50) {
      assessments.push('🟡 GOOD: Handling > 50 requests/second');
    } else {
      assessments.push('❌ POOR: Handling < 50 requests/second');
    }

    if (this.maxActiveUsers >= CONCURRENT_USERS * 0.9) {
      assessments.push('✅ EXCELLENT: Handled target concurrent users');
    } else {
      assessments.push('🟡 WARNING: Did not reach target concurrent users');
    }

    assessments.forEach(assessment => console.log(assessment));

    // Final verdict
    console.log('\n🏆 FINAL VERDICT');
    console.log('='.repeat(60));
    
    const excellentCount = assessments.filter(a => a.includes('EXCELLENT')).length;
    const goodCount = assessments.filter(a => a.includes('GOOD')).length;
    const poorCount = assessments.filter(a => a.includes('POOR')).length;

    if (excellentCount >= 3) {
      console.log('🏆 SYSTEM STATUS: PRODUCTION READY');
      console.log('✅ System can handle 200-400 concurrent users efficiently');
    } else if (goodCount >= 2 && poorCount === 0) {
      console.log('🟡 SYSTEM STATUS: GOOD PERFORMANCE');
      console.log('✅ System can handle target load with minor optimizations');
    } else {
      console.log('❌ SYSTEM STATUS: NEEDS OPTIMIZATION');
      console.log('⚠️  System requires further optimization for target load');
    }

    console.log('\n🏁 Stress test completed!');
  }
}

// Main execution
async function main() {
  const tester = new AdvancedLoadTester();
  await tester.runStressTest();
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stress test interrupted by user');
  process.exit(0);
});

// Run the test
main().catch(error => {
  console.error('❌ Stress test failed:', error);
  process.exit(1);
});