/**
 * Simple in-memory caching middleware for frequently accessed data
 * Helps reduce database load for 200-400 concurrent users
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each cache entry
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttl);
  }

  get(key) {
    const expiry = this.ttl.get(key);
    
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    
    return this.cache.get(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl) {
      if (now > expiry) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create cache instance
const cache = new SimpleCache();

/**
 * Cache middleware for GET requests
 */
export const cacheMiddleware = (ttl = 5 * 60 * 1000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create cache key from URL and query parameters
    const cacheKey = `${req.originalUrl}:${JSON.stringify(req.query)}:${req.user?.id || 'anonymous'}`;
    
    // Try to get from cache
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log(`Cache HIT: ${cacheKey}`);
      return res.json(cachedData);
    }

    // Override res.json to cache the response
    const originalJson = res.json;
    res.json = function(data) {
      // Only cache successful responses
      if (res.statusCode === 200 && data.status === 'success') {
        cache.set(cacheKey, data, ttl);
        console.log(`Cache SET: ${cacheKey}`);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Cache middleware specifically for dashboard stats
 */
export const dashboardCache = cacheMiddleware(2 * 60 * 1000); // 2 minutes

/**
 * Cache middleware for user lists
 */
export const userListCache = cacheMiddleware(1 * 60 * 1000); // 1 minute

/**
 * Cache middleware for subscription data
 */
export const subscriptionCache = cacheMiddleware(3 * 60 * 1000); // 3 minutes

/**
 * Cache middleware for notifications
 */
export const notificationCache = cacheMiddleware(30 * 1000); // 30 seconds

/**
 * Invalidate cache for specific patterns
 */
export const invalidateCache = (pattern) => {
  const keys = Array.from(cache.cache.keys());
  const keysToDelete = keys.filter(key => key.includes(pattern));
  
  keysToDelete.forEach(key => {
    cache.delete(key);
  });
  
  console.log(`Cache invalidated: ${keysToDelete.length} entries for pattern "${pattern}"`);
};

/**
 * Invalidate cache middleware for POST, PUT, PATCH, DELETE requests
 */
export const invalidateCacheMiddleware = (patterns = []) => {
  return (req, res, next) => {
    // Override res.json to invalidate cache after successful operations
    const originalJson = res.json;
    res.json = function(data) {
      // Invalidate cache for successful operations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        patterns.forEach(pattern => {
          invalidateCache(pattern);
        });
        
        // Auto-invalidate based on route
        const route = req.route?.path || req.path;
        if (route.includes('users')) {
          invalidateCache('users');
        }
        if (route.includes('subscriptions')) {
          invalidateCache('subscriptions');
        }
        if (route.includes('notifications')) {
          invalidateCache('notifications');
        }
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
};

/**
 * Get cache statistics
 */
export const getCacheStats = (req, res) => {
  const stats = cache.getStats();
  
  res.json({
    status: 'success',
    data: {
      cacheSize: stats.size,
      cachedKeys: stats.keys,
      timestamp: new Date().toISOString()
    }
  });
};

/**
 * Clear all cache
 */
export const clearCache = (req, res) => {
  cache.clear();
  
  res.json({
    status: 'success',
    message: 'Cache cleared successfully',
    timestamp: new Date().toISOString()
  });
};

export default cache;