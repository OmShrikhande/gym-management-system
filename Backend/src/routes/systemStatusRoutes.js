import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// System status endpoint
router.get('/status', async (req, res) => {
  try {
    const status = {
      timestamp: new Date().toISOString(),
      server: {
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      },
      database: {
        status: 'connected', // This will be updated based on actual connection
        name: process.env.MONGODB_URI ? 'configured' : 'not configured'
      },
      cors: {
        allowedOrigins: [
          'https://gentle-gingersnap-9fde09.netlify.app',
          'http://localhost:5173',
          'http://localhost:3000',
          'http://localhost:5000'
        ],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'Cache-Control',
          'X-Keep-Alive',
          'User-Agent'
        ]
      },
      security: {
        helmet: 'enabled',
        compression: 'enabled',
        rateLimiting: 'enabled',
        inputSanitization: 'enabled'
      },
      features: {
        websocket: 'enabled',
        keepAlive: 'enabled',
        performanceMonitoring: 'enabled',
        errorHandling: 'enhanced'
      }
    };

    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error retrieving system status',
      error: error.message
    });
  }
});

// CORS test endpoint
router.get('/cors-test', (req, res) => {
  res.json({
    success: true,
    message: 'CORS test successful',
    data: {
      origin: req.headers.origin,
      userAgent: req.headers['user-agent'],
      method: req.method,
      headers: req.headers,
      timestamp: new Date().toISOString()
    }
  });
});

// Error simulation endpoint (for testing error handling)
router.post('/simulate-error', protect, restrictTo('super-admin'), (req, res) => {
  const { errorType } = req.body;
  
  switch (errorType) {
    case 'validation':
      return res.status(400).json({
        success: false,
        message: 'Validation error simulation',
        errors: ['Field is required', 'Invalid format']
      });
    
    case 'unauthorized':
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access simulation'
      });
    
    case 'forbidden':
      return res.status(403).json({
        success: false,
        message: 'Forbidden access simulation'
      });
    
    case 'notfound':
      return res.status(404).json({
        success: false,
        message: 'Resource not found simulation'
      });
    
    case 'server':
      return res.status(500).json({
        success: false,
        message: 'Internal server error simulation'
      });
    
    default:
      return res.json({
        success: true,
        message: 'No error simulated',
        availableTypes: ['validation', 'unauthorized', 'forbidden', 'notfound', 'server']
      });
  }
});

// Health check with detailed information
router.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
        mongoConfigured: !!process.env.MONGODB_URI,
        jwtConfigured: !!process.env.JWT_SECRET
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

export default router;