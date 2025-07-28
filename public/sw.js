/**
 * Service Worker for GymFlow - Settings Caching
 */

const CACHE_NAME = 'gymflow-settings-v1';
const API_BASE_URL = 'https://gym-management-system-ckb0.onrender.com';

// Cache settings-related API calls
const SETTINGS_ENDPOINTS = [
  '/api/settings',
  '/api/settings/gym/',
  '/api/settings/user/'
];

// Install event - set up cache
self.addEventListener('install', (event) => {
  console.log('Service Worker installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Settings cache opened');
      return cache;
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('gymflow-settings-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - intercept settings API calls
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Handle GET requests to settings endpoints
  if (event.request.method === 'GET' && isSettingsEndpoint(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          // Check if we have a recent cache (less than 30 seconds old)
          if (response) {
            return response.clone().json().then((cachedData) => {
              const cacheAge = Date.now() - (cachedData.timestamp || 0);
              
              // If cache is older than 30 seconds or no timestamp, fetch fresh data
              if (cacheAge > 30000 || !cachedData.timestamp) {
                console.log('Cache expired for:', url.pathname);
                return fetchAndUpdateCache(event.request, cache);
              }
              
              console.log('Returning cached settings for:', url.pathname);
              return response;
            }).catch(() => {
              // If cached data is invalid, fetch fresh
              return fetchAndUpdateCache(event.request, cache);
            });
          }
          
          // No cache, fetch from network
          return fetchAndUpdateCache(event.request, cache);
        });
      })
    );
  }
  
  // Handle POST/PUT requests to settings endpoints (clear cache)
  if ((event.request.method === 'POST' || event.request.method === 'PUT') && isSettingsEndpoint(url.pathname)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        // If the update was successful, clear related caches
        if (response.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.keys().then((keys) => {
              keys.forEach((key) => {
                const keyUrl = new URL(key.url);
                if (isSettingsEndpoint(keyUrl.pathname)) {
                  console.log('Clearing cache for:', keyUrl.pathname);
                  cache.delete(key);
                }
              });
            });
          });
        }
        return response;
      })
    );
  }
});

// Helper function to check if URL is a settings endpoint
function isSettingsEndpoint(pathname) {
  return SETTINGS_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint));
}

// Helper function to fetch and update cache
async function fetchAndUpdateCache(request, cache) {
  try {
    // Add timeout to prevent hanging requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(request, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      // Clone response for caching
      const responseClone = response.clone();
      
      try {
        const responseData = await response.clone().json();
        
        // Cache the response with a timestamp
        const cacheResponse = new Response(
          JSON.stringify({
            data: responseData,
            timestamp: Date.now(),
            url: request.url
          }),
          {
            status: response.status,
            statusText: response.statusText,
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'max-age=30'
            }
          }
        );
        
        await cache.put(request, cacheResponse);
        console.log('Settings cached for:', request.url);
      } catch (jsonError) {
        console.warn('Failed to parse JSON response, returning original response:', jsonError);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error fetching settings:', error.name, error.message);
    
    // Handle different types of errors
    if (error.name === 'AbortError') {
      console.warn('Request timed out for:', request.url);
    } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.warn('Network error or CORS issue for:', request.url);
    }
    
    // Try to return cached response as fallback
    try {
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('Returning cached settings as fallback for:', request.url);
        return cachedResponse;
      }
    } catch (cacheError) {
      console.error('Error accessing cache:', cacheError);
    }
    
    // Return error response with more specific error information
    const errorMessage = error.name === 'AbortError' 
      ? 'Request timeout - please check your connection'
      : error.name === 'TypeError' 
        ? 'Network error - unable to reach server'
        : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        success: false,
        message: errorMessage,
        error: error.name,
        timestamp: Date.now()
      }),
      {
        status: error.name === 'AbortError' ? 408 : 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Message handler for cache management
self.addEventListener('message', (event) => {
  if (event.data.type === 'CLEAR_SETTINGS_CACHE') {
    caches.open(CACHE_NAME).then((cache) => {
      cache.keys().then((keys) => {
        keys.forEach((key) => {
          cache.delete(key);
        });
      });
    });
    event.ports[0].postMessage({ success: true });
  }
  
  if (event.data.type === 'UPDATE_SETTINGS_CACHE') {
    const { url, data } = event.data;
    caches.open(CACHE_NAME).then((cache) => {
      const response = new Response(JSON.stringify({
        data,
        timestamp: Date.now(),
        url
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
      cache.put(url, response);
    });
    event.ports[0].postMessage({ success: true });
  }
});