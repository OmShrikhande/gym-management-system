// Settings debugging utilities

export const clearSettingsCache = () => {
  console.log('🧹 Clearing settings cache...');
  
  // Clear localStorage settings cache
  const keys = Object.keys(localStorage);
  const settingsKeys = keys.filter(key => key.startsWith('gym_branding_'));
  
  settingsKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Cleared ${key}`);
  });
  
  // Clear service worker cache if available
  if ('serviceWorker' in navigator && 'caches' in window) {
    caches.open('gym-settings-v1').then(cache => {
      cache.keys().then(requests => {
        requests.forEach(request => {
          if (request.url.includes('/settings/')) {
            cache.delete(request);
            console.log(`✅ Cleared SW cache for ${request.url}`);
          }
        });
      });
    });
  }
  
  console.log('🔄 Settings cache cleared. Refresh the page to reload settings.');
};

export const debugSettingsState = () => {
  console.log('🔍 Settings Debug State:');
  
  // Check localStorage
  const keys = Object.keys(localStorage);
  const settingsKeys = keys.filter(key => key.startsWith('gym_branding_'));
  
  console.log('📦 LocalStorage Settings:', {
    totalSettingsKeys: settingsKeys.length,
    keys: settingsKeys,
    data: settingsKeys.reduce((acc, key) => {
      try {
        acc[key] = JSON.parse(localStorage.getItem(key));
      } catch (e) {
        acc[key] = 'Invalid JSON';
      }
      return acc;
    }, {})
  });
  
  // Check service worker cache
  if ('serviceWorker' in navigator && 'caches' in window) {
    caches.open('gym-settings-v1').then(cache => {
      cache.keys().then(requests => {
        const settingsRequests = requests.filter(req => req.url.includes('/settings/'));
        console.log('🔧 Service Worker Cache:', {
          totalCachedRequests: settingsRequests.length,
          urls: settingsRequests.map(req => req.url)
        });
      });
    });
  }
};

export const resetSettingsRetries = () => {
  console.log('🔄 Resetting settings retry counters...');
  
  // Send message to service worker to clear rate limiting
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_RATE_LIMITS'
    });
    console.log('✅ Sent clear rate limits message to service worker');
  }
  
  // Also clear any retry state in the app
  window.dispatchEvent(new CustomEvent('resetSettingsRetries'));
  console.log('✅ Dispatched reset retries event');
};

// Add to window for easy debugging
if (typeof window !== 'undefined') {
  window.settingsDebug = {
    clearCache: clearSettingsCache,
    debugState: debugSettingsState,
    resetRetries: resetSettingsRetries
  };
  
  // Also add individual functions
  window.clearSettingsCache = clearSettingsCache;
  window.debugSettings = debugSettingsState;
  window.resetSettingsRetries = resetSettingsRetries;
}