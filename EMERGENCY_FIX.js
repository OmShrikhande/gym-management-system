// EMERGENCY FIX - Run this in browser console to stop infinite requests
// Copy and paste this entire code block into your browser console and press Enter

(function() {
  console.log('🚨 EMERGENCY FIX: Stopping infinite settings requests...');
  
  // 1. Unregister service worker to stop it from intercepting requests
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      for(let registration of registrations) {
        registration.unregister().then(function(boolean) {
          console.log('✅ Service worker unregistered:', boolean);
        });
      }
    });
  }
  
  // 2. Clear all settings cache
  const keys = Object.keys(localStorage);
  const settingsKeys = keys.filter(key => key.startsWith('gym_branding_'));
  settingsKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log('✅ Cleared localStorage:', key);
  });
  
  // 3. Clear service worker cache
  if ('caches' in window) {
    caches.keys().then(function(names) {
      for (let name of names) {
        if (name.includes('settings') || name.includes('gymflow')) {
          caches.delete(name).then(function(success) {
            console.log('✅ Cleared cache:', name, success);
          });
        }
      }
    });
  }
  
  // 4. Override fetch to prevent settings requests temporarily
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    const url = args[0];
    if (typeof url === 'string' && url.includes('/settings/')) {
      console.log('🚫 Blocked settings request:', url);
      return Promise.resolve(new Response(
        JSON.stringify({
          success: false,
          message: 'Settings requests temporarily blocked',
          data: { settings: { global: { appName: 'GymFlow' }, branding: {} } }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      ));
    }
    return originalFetch.apply(this, args);
  };
  
  console.log('🔧 Emergency fix applied! Refresh the page in 5 seconds...');
  
  // 5. Auto-refresh after 5 seconds
  setTimeout(() => {
    console.log('🔄 Refreshing page...');
    window.location.reload();
  }, 5000);
  
})();