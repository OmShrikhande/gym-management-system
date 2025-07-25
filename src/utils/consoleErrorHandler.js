/**
 * Console Error Handler Utility
 * Filters out known non-critical console errors while preserving important ones
 */

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// List of error patterns to suppress (non-critical third-party errors)
const SUPPRESSED_ERROR_PATTERNS = [
  // Razorpay/Payment gateway related non-critical errors
  /Request timed out.*gym-management-system/i,
  /Refused to get unsafe header.*x-rtb-fingerprint-id/i,
  /Blocked call to navigator\.vibrate.*cross-origin iframe/i,
  
  // SVG attribute errors (usually from third-party components)
  /svg.*attribute.*width.*Expected length.*auto/i,
  /svg.*attribute.*height.*Expected length.*auto/i,
  
  // Razorpay checkout script related warnings
  /v2-entry-app.*modern\.js.*Intervention/i,
  /chromestatus\.com.*feature/i,
  
  // Other common third-party warnings that don't affect functionality
  /Failed to load resource.*favicon/i,
  /Mixed Content.*was loaded over HTTPS/i,
  /Permissions-Policy header.*unrecognized feature/i,
  
  // Network timeout errors that are handled gracefully
  /fetch.*timeout/i,
  /XMLHttpRequest.*timeout/i,
  
  // Third-party script loading warnings
  /checkout\.razorpay\.com.*loading/i,
  /api\.qrserver\.com.*loading/i
];

// List of critical error patterns that should NEVER be suppressed
const CRITICAL_ERROR_PATTERNS = [
  // Authentication and security errors
  /authentication.*failed/i,
  /unauthorized/i,
  /forbidden/i,
  /token.*expired/i,
  /login.*required/i,
  
  // Payment processing errors
  /payment.*failed/i,
  /transaction.*failed/i,
  /order.*creation.*failed/i,
  /verification.*failed/i,
  
  // Database and API errors
  /database.*error/i,
  /api.*error/i,
  /server.*error/i,
  /network.*error/i,
  
  // Application logic errors
  /undefined.*is.*not.*function/i,
  /cannot.*read.*property/i,
  /reference.*error/i,
  /syntax.*error/i,
  /type.*error/i,
  
  // React errors
  /react.*error/i,
  /component.*error/i,
  /render.*error/i
];

/**
 * Check if an error should be suppressed
 * @param {string} message - Error message
 * @returns {boolean} - True if error should be suppressed
 */
const shouldSuppressError = (message) => {
  const messageStr = String(message);
  
  // Never suppress critical errors
  const isCritical = CRITICAL_ERROR_PATTERNS.some(pattern => 
    pattern.test(messageStr)
  );
  
  if (isCritical) {
    return false;
  }
  
  // Check if error matches suppressed patterns
  const shouldSuppress = SUPPRESSED_ERROR_PATTERNS.some(pattern => 
    pattern.test(messageStr)
  );
  
  return shouldSuppress;
};

/**
 * Enhanced console.error that filters out non-critical errors
 */
const filteredConsoleError = (...args) => {
  const message = args.join(' ');
  
  if (!shouldSuppressError(message)) {
    // Only log if it's not a suppressed error
    originalConsoleError.apply(console, args);
  } else {
    // Optionally log suppressed errors in development mode with a different style
    if (import.meta.env.DEV) {
      originalConsoleLog(
        '%c[SUPPRESSED ERROR]', 
        'color: #888; font-style: italic;', 
        ...args
      );
    }
  }
};

/**
 * Enhanced console.warn that filters out non-critical warnings
 */
const filteredConsoleWarn = (...args) => {
  const message = args.join(' ');
  
  if (!shouldSuppressError(message)) {
    originalConsoleWarn.apply(console, args);
  } else {
    // Optionally log suppressed warnings in development mode
    if (import.meta.env.DEV) {
      originalConsoleLog(
        '%c[SUPPRESSED WARNING]', 
        'color: #888; font-style: italic;', 
        ...args
      );
    }
  }
};

/**
 * Initialize console error filtering
 * Call this once in your main application file
 */
export const initializeConsoleErrorFiltering = () => {
  // Only apply filtering in production or when explicitly enabled
  const shouldFilter = !import.meta.env.DEV || 
                      localStorage.getItem('gymflow_filter_console_errors') === 'true';
  
  if (shouldFilter) {
    console.error = filteredConsoleError;
    console.warn = filteredConsoleWarn;
    
    console.log(
      '%c🔇 Console error filtering enabled', 
      'color: #4CAF50; font-weight: bold;'
    );
    console.log(
      '%cNon-critical third-party errors will be suppressed', 
      'color: #888;'
    );
  }
};

/**
 * Disable console error filtering (for debugging)
 */
export const disableConsoleErrorFiltering = () => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  
  console.log(
    '%c🔊 Console error filtering disabled', 
    'color: #FF9800; font-weight: bold;'
  );
};

/**
 * Toggle console error filtering
 */
export const toggleConsoleErrorFiltering = () => {
  const isCurrentlyFiltered = console.error === filteredConsoleError;
  
  if (isCurrentlyFiltered) {
    disableConsoleErrorFiltering();
    localStorage.setItem('gymflow_filter_console_errors', 'false');
  } else {
    initializeConsoleErrorFiltering();
    localStorage.setItem('gymflow_filter_console_errors', 'true');
  }
};

/**
 * Log a message that will never be suppressed (for important application logs)
 */
export const forceLog = (...args) => {
  originalConsoleLog.apply(console, args);
};

/**
 * Log an error that will never be suppressed (for critical errors)
 */
export const forceError = (...args) => {
  originalConsoleError.apply(console, args);
};

/**
 * Log a warning that will never be suppressed (for important warnings)
 */
export const forceWarn = (...args) => {
  originalConsoleWarn.apply(console, args);
};

// Export original console methods for direct access if needed
export const originalConsole = {
  log: originalConsoleLog,
  error: originalConsoleError,
  warn: originalConsoleWarn
};

// Development helper: Add global functions for easy debugging
if (import.meta.env.DEV) {
  window.gymflowConsole = {
    toggleFiltering: toggleConsoleErrorFiltering,
    enableFiltering: initializeConsoleErrorFiltering,
    disableFiltering: disableConsoleErrorFiltering,
    forceLog,
    forceError,
    forceWarn,
    original: originalConsole
  };
}