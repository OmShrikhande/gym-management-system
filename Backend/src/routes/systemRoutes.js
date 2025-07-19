import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getPerformanceMetrics } from '../middleware/performance.js';
import { getCacheStats, clearCache } from '../middleware/cache.js';
import { getIndexStats } from '../config/indexes.js';
import mongoose from 'mongoose';

const router = express.Router();

// System monitoring endpoint (Super Admin only)
router.get('/monitor', protect, restrictTo('super-admin'), async (req, res) => {
  try {
    const performanceMetrics = getPerformanceMetrics();
    const indexStats = await getIndexStats();
    
    // Database connection stats
    const dbStats = {
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.name,
      collections: Object.keys(mongoose.connection.collections).length
    };

    // Memory usage
    const memUsage = process.memoryUsage();
    const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
    
    const memoryStats = {
      rss: formatBytes(memUsage.rss),
      heapTotal: formatBytes(memUsage.heapTotal),
      heapUsed: formatBytes(memUsage.heapUsed),
      external: formatBytes(memUsage.external),
      arrayBuffers: formatBytes(memUsage.arrayBuffers)
    };

    // CPU usage (basic)
    const cpuUsage = process.cpuUsage();
    
    res.json({
      status: 'success',
      data: {
        performance: performanceMetrics,
        database: dbStats,
        indexes: indexStats,
        memory: memoryStats,
        cpu: {
          user: cpuUsage.user,
          system: cpuUsage.system
        },
        process: {
          pid: process.pid,
          uptime: process.uptime(),
          version: process.version,
          platform: process.platform,
          arch: process.arch
        },
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to get system monitoring data',
      error: error.message
    });
  }
});

// Cache management endpoints
router.get('/cache/stats', protect, restrictTo('super-admin'), getCacheStats);
router.post('/cache/clear', protect, restrictTo('super-admin'), clearCache);

// Database health check
router.get('/db-health', protect, restrictTo('super-admin'), async (req, res) => {
  try {
    const start = Date.now();
    
    // Test database connection
    await mongoose.connection.db.admin().ping();
    
    const responseTime = Date.now() - start;
    
    res.json({
      status: 'success',
      data: {
        connected: mongoose.connection.readyState === 1,
        responseTime: `${responseTime}ms`,
        host: mongoose.connection.host,
        database: mongoose.connection.name,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database health check failed',
      error: error.message
    });
  }
});

// System optimization recommendations
router.get('/optimization-tips', protect, restrictTo('super-admin'), (req, res) => {
  const performanceMetrics = getPerformanceMetrics();
  const tips = [];

  // Analyze performance and provide recommendations
  if (performanceMetrics.requests.averageResponseTime > 1000) {
    tips.push({
      type: 'performance',
      severity: 'high',
      message: 'Average response time is high. Consider optimizing database queries or adding more caching.',
      metric: `${performanceMetrics.requests.averageResponseTime.toFixed(2)}ms`
    });
  }

  if (performanceMetrics.requests.failed / Math.max(performanceMetrics.requests.total, 1) > 0.05) {
    tips.push({
      type: 'reliability',
      severity: 'medium',
      message: 'Error rate is above 5%. Check error logs for common issues.',
      metric: `${((performanceMetrics.requests.failed / Math.max(performanceMetrics.requests.total, 1)) * 100).toFixed(2)}%`
    });
  }

  if (performanceMetrics.connections.active > 800) {
    tips.push({
      type: 'capacity',
      severity: 'high',
      message: 'High number of active connections. Consider implementing connection pooling or load balancing.',
      metric: `${performanceMetrics.connections.active} active connections`
    });
  }

  if (performanceMetrics.requests.slowRequests > performanceMetrics.requests.total * 0.1) {
    tips.push({
      type: 'performance',
      severity: 'medium',
      message: 'High number of slow requests (>1s). Review and optimize slow endpoints.',
      metric: `${performanceMetrics.requests.slowRequests} slow requests`
    });
  }

  if (tips.length === 0) {
    tips.push({
      type: 'status',
      severity: 'info',
      message: 'System is performing well. No immediate optimizations needed.',
      metric: 'All metrics within acceptable ranges'
    });
  }

  res.json({
    status: 'success',
    data: {
      tips,
      metrics: performanceMetrics,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;