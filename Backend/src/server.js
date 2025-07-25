import dotenv from 'dotenv';
// Load environment variables FIRST
dotenv.config();

import express from 'express';
import cors from 'cors';
import { corsMiddleware, additionalCorsHeaders, preflightHandler } from './middleware/cors.js';
import morgan from 'morgan';
import http from 'http';
import helmet from 'helmet';
import compression from 'compression';
import webSocketService from './services/websocketService.js';

// Import enhanced middleware
import { generalLimiter, authLimiter, paymentLimiter, uploadLimiter } from './middleware/rateLimiter.js';
import { performanceTracker, healthCheck, startPerformanceLogging } from './middleware/performance.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import { sanitizeInput } from './middleware/validation.js';
import { getCacheStats, clearCache, invalidateCacheMiddleware } from './middleware/cache.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import dietPlanRoutes from './routes/dietPlanRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import gymOwnerPlanRoutes from './routes/gymOwnerPlanRoutes.js';


import attendanceRoutes from './routes/attendanceRoutes.js';


import expenseRoutes from './routes/expenseRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import systemRoutes from './routes/systemRoutes.js';
import accessRoutes from './routes/accessRoutes.js';
import connectDB from './config/database.js';
import setupSuperAdmin from './config/setupAdmin.js';
import { createIndexes } from './config/indexes.js';
import User from './models/userModel.js';
import Subscription from './models/subscriptionModel.js';
import { startSubscriptionCleanup } from './utils/subscriptionCleanup.js';

// Environment variables already loaded at the top

// Initialize express app
const app = express();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Compression middleware for better performance
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Performance tracking middleware
app.use(performanceTracker);

// Input sanitization middleware
app.use(sanitizeInput);

// General rate limiting
app.use(generalLimiter);

// EMERGENCY CORS FIX - Allow all origins temporarily
app.use((req, res, next) => {
  // Set CORS headers for all requests
  res.header('Access-Control-Allow-Origin', req.headers.origin || 'https://gentle-gingersnap-9fde09.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control');
  res.header('Access-Control-Expose-Headers', 'Authorization');
  res.header('Vary', 'Origin');
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    console.log('=== EMERGENCY PREFLIGHT ===');
    console.log('Origin:', req.headers.origin);
    console.log('Method:', req.headers['access-control-request-method']);
    console.log('Headers:', req.headers['access-control-request-headers']);
    res.header('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }
  
  console.log(`${req.method} ${req.path} from origin: ${req.headers.origin}`);
  next();
});

// CORS Configuration (backup)
app.use(corsMiddleware);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

// Serve static files for gym assets
app.use('/uploads', express.static('uploads'));

// Handle preflight OPTIONS requests (backup)
app.options('*', preflightHandler);

// Additional CORS headers for all routes (backup)
app.use(additionalCorsHeaders);

// CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  console.log('CORS test endpoint hit from:', req.headers.origin);
  res.json({ 
    message: 'CORS is working!', 
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Routes with specific rate limiting and cache invalidation
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', invalidateCacheMiddleware(['users']), userRoutes);
app.use('/api/subscriptions', invalidateCacheMiddleware(['subscriptions']), subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
// Alias route for membership-plans (points to subscription-plans)
app.use('/api/membership-plans', subscriptionPlanRoutes);
// Use gym owner plans for /api/plans endpoint
app.use('/api/plans', gymOwnerPlanRoutes);
app.use('/api/notifications', invalidateCacheMiddleware(['notifications']), notificationRoutes);
app.use('/api/payments', paymentLimiter, paymentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/gym-owner-plans', gymOwnerPlanRoutes);
// Debug middleware for gym routes
app.use('/api/gym', (req, res, next) => {
  console.log(`[GYM DEBUG] ${req.method} ${req.path}`);
  console.log(`[GYM DEBUG] Headers:`, req.headers);
  console.log(`[GYM DEBUG] Body:`, req.body);
  console.log(`[GYM DEBUG] Query:`, req.query);
  console.log(`[GYM DEBUG] Params:`, req.params);
  next();
});


app.use('/api/attendance', attendanceRoutes);


app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/access', accessRoutes);





// Health check route
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'GymFlow API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced health check route with performance metrics
app.get('/health', healthCheck);

// Simple health check route for basic monitoring
app.get('/ping', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test route to check database and admin user
app.get('/test', async (req, res) => {
  try {
    const adminUser = await User.findOne({ role: 'super-admin' });
    const userCount = await User.countDocuments();
    
    // Check subscription stats
    const today = new Date();
    const totalSubscriptions = await Subscription.countDocuments();
    const activeSubscriptions = await Subscription.countDocuments({
      isActive: true,
      endDate: { $gte: today }
    });
    const expiredSubscriptions = await Subscription.countDocuments({
      isActive: true,
      endDate: { $lt: today }
    });
    
    res.json({
      status: 'success',
      data: {
        adminExists: !!adminUser,
        adminEmail: adminUser?.email,
        totalUsers: userCount,
        subscriptionStats: {
          totalSubscriptions,
          activeSubscriptions,
          expiredButStillMarkedActive: expiredSubscriptions
        },
        jwtSecretExists: !!process.env.JWT_SECRET,
        mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
        razorpayConfig: {
          testKeyId: process.env.RAZORPAY_TEST_KEY_ID ? '✓ SET' : '✗ MISSING',
          testKeySecret: process.env.RAZORPAY_TEST_KEY_SECRET ? '✓ SET' : '✗ MISSING',
          liveKeyId: process.env.RAZORPAY_LIVE_KEY_ID ? '✓ SET' : '✗ MISSING',
          liveKeySecret: process.env.RAZORPAY_LIVE_KEY_SECRET ? '✓ SET' : '✗ MISSING',
          currentMode: process.env.NODE_ENV === 'production' ? 'LIVE' : 'TEST'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
  res.json({
    status: 'success',
    message: 'CORS is working correctly',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// PATCH test endpoint
app.patch('/patch-test', (req, res) => {
  res.json({
    status: 'success',
    message: 'PATCH method is working correctly',
    origin: req.headers.origin,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint to check deployment status
app.get('/deployment-status', (req, res) => {
  res.json({
    status: 'success',
    message: 'Deployment status check',
    data: {
      nodeEnv: process.env.NODE_ENV,
      mongoUri: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      jwtSecret: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      codeVersion: 'v2.0-enhanced-error-handling',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

// Test endpoint for subscription cleanup
app.get('/test-subscription-cleanup', async (req, res) => {
  try {
    const { cleanupExpiredSubscriptions, getAccurateActiveGymCount } = await import('./utils/subscriptionCleanup.js');
    
    // Run cleanup
    const cleanupResult = await cleanupExpiredSubscriptions();
    
    // Get accurate count
    const accurateCount = await getAccurateActiveGymCount();
    
    res.json({
      status: 'success',
      data: {
        cleanupResult,
        accurateActiveGymCount: accurateCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// WebSocket status endpoint
app.get('/ws-status', (req, res) => {
  res.json({
    status: 'success',
    data: {
      websocketEnabled: !!webSocketService,
      connectedClients: webSocketService?.getConnectedClientsCount() || 0,
      timestamp: new Date().toISOString()
    }
  });
});

// Cache management endpoints
app.get('/api/cache/stats', getCacheStats);
app.post('/api/cache/clear', clearCache);



// 404 handler
app.use('*', notFoundHandler);

// Enhanced error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
let server; // Declare server variable for graceful shutdown

// Enhanced error handling for unhandled promises and exceptions
process.on('unhandledRejection', (err, promise) => {
  console.error('🚨 UNHANDLED PROMISE REJECTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  console.error('Promise:', promise);
  
  // Close server gracefully
  if (server) {
    server.close(() => {
      console.log('💥 Process terminated due to unhandled rejection');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('uncaughtException', (err) => {
  console.error('🚨 UNCAUGHT EXCEPTION! Shutting down...');
  console.error('Error:', err.name, err.message);
  console.error('Stack:', err.stack);
  
  console.log('💥 Process terminated due to uncaught exception');
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  if (server) {
    server.close(() => {
      console.log('Process terminated');
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

connectDB().then(async () => {
  // Create database indexes for optimal performance
  await createIndexes();
  
  // Create super admin user if it doesn't exist
  await setupSuperAdmin();
  
  // Start subscription cleanup scheduler
  startSubscriptionCleanup();
  
  // Start performance logging
  startPerformanceLogging(15); // Log every 15 minutes
  
  // Create HTTP server
  server = http.createServer(app);
  
  // Configure server for high concurrency
  server.maxConnections = 1000;
  server.timeout = 30000; // 30 seconds
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds
  
  // Initialize WebSocket service
  webSocketService.initialize(server);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📡 API available at https://gym-management-system-ckb0.onrender.com/api`);
    console.log(`🏥 Health check: https://gym-management-system-ckb0.onrender.com/health`);
    console.log(`🔌 WebSocket service initialized on /ws`);
    console.log(`⚡ Server optimized for ${server.maxConnections} concurrent connections`);
    console.log(`📊 Performance monitoring enabled`);
  });
}).catch(err => {
  console.error('Failed to connect to database:', err);
  process.exit(1);
});