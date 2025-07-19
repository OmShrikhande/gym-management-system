/**
 * Production environment optimizations for handling 200-400 concurrent users
 */

export const productionConfig = {
  // Database settings
  database: {
    maxPoolSize: 50,
    minPoolSize: 10,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    bufferMaxEntries: 0,
    bufferCommands: false
  },

  // Server settings
  server: {
    maxConnections: 1000,
    timeout: 30000,
    keepAliveTimeout: 65000,
    headersTimeout: 66000
  },

  // Rate limiting
  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000,
      max: 1000
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 20
    },
    payment: {
      windowMs: 60 * 60 * 1000,
      max: 50
    }
  },

  // Caching
  cache: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes
    dashboardTTL: 2 * 60 * 1000, // 2 minutes
    userListTTL: 1 * 60 * 1000, // 1 minute
    subscriptionTTL: 3 * 60 * 1000 // 3 minutes
  },

  // WebSocket settings
  websocket: {
    maxPayload: 16 * 1024,
    perMessageDeflate: true,
    cleanupInterval: 5 * 60 * 1000 // 5 minutes
  },

  // Security settings
  security: {
    helmet: {
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" }
    },
    compression: {
      level: 6,
      threshold: 1024
    }
  },

  // Monitoring
  monitoring: {
    performanceLoggingInterval: 15 * 60 * 1000, // 15 minutes
    subscriptionCleanupInterval: 6 * 60 * 60 * 1000, // 6 hours
    wsCleanupInterval: 5 * 60 * 1000 // 5 minutes
  }
};

export const developmentConfig = {
  // More relaxed settings for development
  database: {
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 60000,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000
  },

  server: {
    maxConnections: 100,
    timeout: 60000,
    keepAliveTimeout: 5000,
    headersTimeout: 6000
  },

  rateLimiting: {
    general: {
      windowMs: 15 * 60 * 1000,
      max: 10000 // Very high for development
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 100
    }
  },

  cache: {
    defaultTTL: 30 * 1000, // 30 seconds for faster development
    dashboardTTL: 10 * 1000,
    userListTTL: 5 * 1000,
    subscriptionTTL: 15 * 1000
  }
};

export const getConfig = () => {
  return process.env.NODE_ENV === 'production' ? productionConfig : developmentConfig;
};