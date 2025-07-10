/**
 * Settings cache system for fast access and reduced API calls
 */

class SettingsCache {
  constructor() {
    this.cache = new Map();
    this.ttl = 5 * 60 * 1000; // 5 minutes TTL
    this.maxSize = 100; // Maximum cache size
  }

  // Generate cache key based on user info
  getCacheKey(userId, userRole, gymId) {
    if (userRole === 'super-admin') {
      return 'global_settings';
    } else if (userRole === 'gym-owner') {
      return `gym_settings_${userId}`;
    } else if (userRole === 'trainer' || userRole === 'member') {
      // For trainers and members, use gym-specific settings
      return gymId ? `gym_settings_${gymId}` : `user_settings_${userId}`;
    }
    return `user_settings_${userId}`;
  }

  // Get settings from cache
  get(userId, userRole, gymId) {
    const key = this.getCacheKey(userId, userRole, gymId);
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    // Check if cache is expired
    if (Date.now() > cached.expires) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Set settings in cache
  set(userId, userRole, gymId, settings) {
    const key = this.getCacheKey(userId, userRole, gymId);
    
    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data: settings,
      expires: Date.now() + this.ttl,
      timestamp: Date.now()
    });
  }

  // Remove specific settings from cache
  remove(userId, userRole, gymId) {
    const key = this.getCacheKey(userId, userRole, gymId);
    this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache stats
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl,
      entries: Array.from(this.cache.entries()).map(([key, value]) => ({
        key,
        timestamp: value.timestamp,
        expires: value.expires,
        isExpired: Date.now() > value.expires
      }))
    };
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expires) {
        this.cache.delete(key);
      }
    }
  }
}

// Create singleton instance
const settingsCache = new SettingsCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  settingsCache.cleanup();
}, 5 * 60 * 1000);

export default settingsCache;