/**
 * Performance monitoring middleware for tracking request metrics
 */

// Store performance metrics
const performanceMetrics = {
  requests: {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    slowRequests: 0 // Requests taking more than 1 second
  },
  endpoints: new Map(),
  errors: new Map(),
  activeConnections: 0,
  peakConnections: 0,
  startTime: Date.now()
};

/**
 * Request performance tracking middleware
 */
export const performanceTracker = (req, res, next) => {
  const startTime = Date.now();
  
  // Increment active connections
  performanceMetrics.activeConnections++;
  if (performanceMetrics.activeConnections > performanceMetrics.peakConnections) {
    performanceMetrics.peakConnections = performanceMetrics.activeConnections;
  }
  
  // Track endpoint usage
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  if (!performanceMetrics.endpoints.has(endpoint)) {
    performanceMetrics.endpoints.set(endpoint, {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      errors: 0
    });
  }
  
  // Override res.end to capture response time
  const originalEnd = res.end;
  res.end = function(...args) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    // Update metrics
    performanceMetrics.requests.total++;
    performanceMetrics.activeConnections--;
    
    // Update endpoint metrics
    const endpointStats = performanceMetrics.endpoints.get(endpoint);
    endpointStats.count++;
    endpointStats.totalTime += responseTime;
    endpointStats.averageTime = endpointStats.totalTime / endpointStats.count;
    
    // Track slow requests (> 1 second)
    if (responseTime > 1000) {
      performanceMetrics.requests.slowRequests++;
      console.warn(`Slow request detected: ${endpoint} took ${responseTime}ms`);
    }
    
    // Track success/failure
    if (res.statusCode >= 200 && res.statusCode < 400) {
      performanceMetrics.requests.successful++;
    } else {
      performanceMetrics.requests.failed++;
      endpointStats.errors++;
      
      // Track error types
      const errorKey = `${res.statusCode}`;
      performanceMetrics.errors.set(errorKey, 
        (performanceMetrics.errors.get(errorKey) || 0) + 1
      );
    }
    
    // Update average response time
    performanceMetrics.requests.averageResponseTime = 
      (performanceMetrics.requests.averageResponseTime * (performanceMetrics.requests.total - 1) + responseTime) / 
      performanceMetrics.requests.total;
    
    // Log performance for slow requests or errors
    if (responseTime > 1000 || res.statusCode >= 400) {
      console.log(`Performance: ${endpoint} - ${responseTime}ms - Status: ${res.statusCode}`);
    }
    
    originalEnd.apply(this, args);
  };
  
  next();
};

/**
 * Memory usage monitoring
 */
export const memoryMonitor = () => {
  const memUsage = process.memoryUsage();
  const formatBytes = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };
  
  return {
    rss: formatBytes(memUsage.rss),
    heapTotal: formatBytes(memUsage.heapTotal),
    heapUsed: formatBytes(memUsage.heapUsed),
    external: formatBytes(memUsage.external),
    arrayBuffers: formatBytes(memUsage.arrayBuffers)
  };
};

/**
 * Get performance metrics
 */
export const getPerformanceMetrics = () => {
  const uptime = Date.now() - performanceMetrics.startTime;
  const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);
  
  // Convert endpoints Map to object for JSON serialization
  const endpointsObj = {};
  performanceMetrics.endpoints.forEach((value, key) => {
    endpointsObj[key] = value;
  });
  
  // Convert errors Map to object
  const errorsObj = {};
  performanceMetrics.errors.forEach((value, key) => {
    errorsObj[key] = value;
  });
  
  return {
    uptime: {
      milliseconds: uptime,
      hours: uptimeHours
    },
    requests: performanceMetrics.requests,
    connections: {
      active: performanceMetrics.activeConnections,
      peak: performanceMetrics.peakConnections
    },
    endpoints: endpointsObj,
    errors: errorsObj,
    memory: memoryMonitor(),
    timestamp: new Date().toISOString()
  };
};

/**
 * Health check with performance data
 */
export const healthCheck = (req, res) => {
  const metrics = getPerformanceMetrics();
  const isHealthy = 
    metrics.requests.failed / Math.max(metrics.requests.total, 1) < 0.1 && // Less than 10% error rate
    metrics.requests.averageResponseTime < 2000 && // Average response time under 2 seconds
    metrics.connections.active < 1000; // Less than 1000 active connections
  
  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    metrics,
    checks: {
      errorRate: (metrics.requests.failed / Math.max(metrics.requests.total, 1) * 100).toFixed(2) + '%',
      averageResponseTime: metrics.requests.averageResponseTime.toFixed(2) + 'ms',
      activeConnections: metrics.connections.active
    }
  });
};

/**
 * Reset performance metrics (useful for testing)
 */
export const resetMetrics = () => {
  performanceMetrics.requests = {
    total: 0,
    successful: 0,
    failed: 0,
    averageResponseTime: 0,
    slowRequests: 0
  };
  performanceMetrics.endpoints.clear();
  performanceMetrics.errors.clear();
  performanceMetrics.activeConnections = 0;
  performanceMetrics.peakConnections = 0;
  performanceMetrics.startTime = Date.now();
};

/**
 * Periodic performance logging
 */
export const startPerformanceLogging = (intervalMinutes = 15) => {
  setInterval(() => {
    const metrics = getPerformanceMetrics();
    console.log('=== PERFORMANCE METRICS ===');
    console.log(`Uptime: ${metrics.uptime.hours} hours`);
    console.log(`Total Requests: ${metrics.requests.total}`);
    console.log(`Success Rate: ${((metrics.requests.successful / Math.max(metrics.requests.total, 1)) * 100).toFixed(2)}%`);
    console.log(`Average Response Time: ${metrics.requests.averageResponseTime.toFixed(2)}ms`);
    console.log(`Slow Requests: ${metrics.requests.slowRequests}`);
    console.log(`Active Connections: ${metrics.connections.active}`);
    console.log(`Peak Connections: ${metrics.connections.peak}`);
    console.log(`Memory Usage: ${metrics.memory.heapUsed} / ${metrics.memory.heapTotal}`);
    console.log('===========================');
  }, intervalMinutes * 60 * 1000);
};