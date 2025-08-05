/**
 * XML and XMLHttpRequest Security Handler
 * Handles security-related issues with XML parsing and HTTP requests
 */

class XMLSecurityHandler {
  constructor() {
    this.requestCount = 0;
    this.blockedRequests = 0;
    this.allowedOrigins = [
      'https://gentle-gingersnap-9fde09.netlify.app',
      'https://gym-management-system-ckb0.onrender.com',
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5000'
    ];
    this.init();
  }

  init() {
    console.log('🔒 Initializing XML Security Handler...');
    
    // Override XMLHttpRequest to add security headers
    this.enhanceXMLHttpRequest();
    
    // Add CORS error handling
    this.handleCORSErrors();
    
    // Monitor fetch requests
    this.enhanceFetch();
    
    console.log('✅ XML Security Handler initialized');
  }

  enhanceXMLHttpRequest() {
    const originalXHR = window.XMLHttpRequest;
    const self = this;
    
    window.XMLHttpRequest = function() {
      const xhr = new originalXHR();
      const originalOpen = xhr.open;
      const originalSend = xhr.send;
      const originalSetRequestHeader = xhr.setRequestHeader;
      
      // Track request count
      self.requestCount++;
      
      // Override open method to add security checks
      xhr.open = function(method, url, async, user, password) {
        console.log(`🌐 XHR Request #${self.requestCount}: ${method} ${url}`);
        
        // Check if URL is allowed
        if (!self.isURLAllowed(url)) {
          console.warn(`🚫 Blocked potentially unsafe request to: ${url}`);
          self.blockedRequests++;
          throw new Error(`Request to ${url} blocked by security policy`);
        }
        
        return originalOpen.call(this, method, url, async, user, password);
      };
      
      // Override setRequestHeader to ensure security headers
      xhr.setRequestHeader = function(name, value) {
        // Ensure CORS headers are properly set
        if (name.toLowerCase() === 'origin') {
          if (!self.allowedOrigins.includes(value)) {
            console.warn(`🚫 Blocked request with unauthorized origin: ${value}`);
            return;
          }
        }
        
        return originalSetRequestHeader.call(this, name, value);
      };
      
      // Override send method to add default headers
      xhr.send = function(data) {
        // Add security headers if not already present
        if (!this.getRequestHeader || !this.getRequestHeader('X-Requested-With')) {
          try {
            this.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
          } catch (e) {
            // Header might already be set
          }
        }
        
        // Add CORS headers for cross-origin requests
        const url = this.responseURL || this._url;
        if (url && self.isCrossOrigin(url)) {
          try {
            this.setRequestHeader('Access-Control-Request-Method', this._method || 'GET');
          } catch (e) {
            // Header might already be set
          }
        }
        
        return originalSend.call(this, data);
      };
      
      // Add error handling
      xhr.addEventListener('error', function(event) {
        console.error('🚨 XHR Error:', event);
        self.handleXHRError(this, event);
      });
      
      xhr.addEventListener('load', function(event) {
        if (this.status >= 400) {
          console.warn(`⚠️ XHR Warning: ${this.status} ${this.statusText} for ${this.responseURL}`);
        }
      });
      
      return xhr;
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.XMLHttpRequest, originalXHR);
    Object.defineProperty(window.XMLHttpRequest, 'prototype', {
      value: originalXHR.prototype,
      writable: false
    });
  }

  enhanceFetch() {
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(input, init = {}) {
      const url = typeof input === 'string' ? input : input.url;
      
      console.log(`🌐 Fetch Request: ${init.method || 'GET'} ${url}`);
      
      // Check if URL is allowed
      if (!self.isURLAllowed(url)) {
        console.warn(`🚫 Blocked potentially unsafe fetch request to: ${url}`);
        self.blockedRequests++;
        return Promise.reject(new Error(`Request to ${url} blocked by security policy`));
      }
      
      // Ensure proper headers
      const headers = new Headers(init.headers || {});
      
      // Add security headers
      if (!headers.has('X-Requested-With')) {
        headers.set('X-Requested-With', 'XMLHttpRequest');
      }
      
      // Add CORS headers for cross-origin requests
      if (self.isCrossOrigin(url)) {
        if (!headers.has('Origin')) {
          headers.set('Origin', window.location.origin);
        }
      }
      
      // Update init with enhanced headers
      const enhancedInit = {
        ...init,
        headers: headers
      };
      
      return originalFetch.call(this, input, enhancedInit)
        .catch(error => {
          self.handleFetchError(url, error);
          throw error;
        });
    };
  }

  handleCORSErrors() {
    // Listen for CORS-related errors
    window.addEventListener('error', (event) => {
      const error = event.error;
      if (error && error.message && error.message.includes('CORS')) {
        this.handleCORSError(error);
      }
    });
    
    // Listen for unhandled promise rejections that might be CORS-related
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (error && error.message && error.message.includes('CORS')) {
        this.handleCORSError(error);
        event.preventDefault();
      }
    });
  }

  handleCORSError(error) {
    console.error('🚨 CORS Error detected:', error.message);
    
    // Provide helpful suggestions
    console.warn('💡 CORS Error Solutions:');
    console.warn('  1. Check if the server allows your origin');
    console.warn('  2. Verify that required headers are allowed');
    console.warn('  3. Ensure preflight requests are handled correctly');
    console.warn('  4. Check if credentials are properly configured');
    
    // Show user-friendly notification
    if (window.toast && typeof window.toast.error === 'function') {
      window.toast.error('Connection issue detected. Please try again or contact support if the problem persists.');
    }
  }

  handleXHRError(xhr, event) {
    console.error('🚨 XMLHttpRequest Error Details:');
    console.error('  Status:', xhr.status);
    console.error('  Status Text:', xhr.statusText);
    console.error('  Response URL:', xhr.responseURL);
    console.error('  Ready State:', xhr.readyState);
    
    // Check for common CORS issues
    if (xhr.status === 0 && xhr.readyState === 4) {
      console.warn('💡 This might be a CORS issue. Check server configuration.');
    }
  }

  handleFetchError(url, error) {
    console.error(`🚨 Fetch Error for ${url}:`, error.message);
    
    // Check for common network issues
    if (error.message.includes('Failed to fetch')) {
      console.warn('💡 Network error detected. This could be due to:');
      console.warn('  1. Server is down or unreachable');
      console.warn('  2. CORS policy blocking the request');
      console.warn('  3. Network connectivity issues');
      console.warn('  4. SSL/TLS certificate problems');
    }
  }

  isURLAllowed(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Allow same-origin requests
      if (urlObj.origin === window.location.origin) {
        return true;
      }
      
      // Allow explicitly allowed origins
      if (this.allowedOrigins.includes(urlObj.origin)) {
        return true;
      }
      
      // Allow relative URLs
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return true;
      }
      
      // Block everything else
      return false;
    } catch (e) {
      console.warn(`🚫 Invalid URL format: ${url}`);
      return false;
    }
  }

  isCrossOrigin(url) {
    try {
      const urlObj = new URL(url, window.location.origin);
      return urlObj.origin !== window.location.origin;
    } catch (e) {
      return false;
    }
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      blockedRequests: this.blockedRequests,
      allowedOrigins: this.allowedOrigins,
      successRate: this.requestCount > 0 ? ((this.requestCount - this.blockedRequests) / this.requestCount * 100).toFixed(2) + '%' : '100%'
    };
  }

  addAllowedOrigin(origin) {
    if (!this.allowedOrigins.includes(origin)) {
      this.allowedOrigins.push(origin);
      console.log(`✅ Added allowed origin: ${origin}`);
    }
  }

  removeAllowedOrigin(origin) {
    const index = this.allowedOrigins.indexOf(origin);
    if (index > -1) {
      this.allowedOrigins.splice(index, 1);
      console.log(`🚫 Removed allowed origin: ${origin}`);
    }
  }
}

// Create singleton instance
const xmlSecurityHandler = new XMLSecurityHandler();

// Export for use in other modules
export default xmlSecurityHandler;

// Export utility functions
export const addAllowedOrigin = (origin) => xmlSecurityHandler.addAllowedOrigin(origin);
export const removeAllowedOrigin = (origin) => xmlSecurityHandler.removeAllowedOrigin(origin);
export const getSecurityStats = () => xmlSecurityHandler.getStats();

console.log('🔒 XML Security Handler module loaded');