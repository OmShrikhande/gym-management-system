/**
 * Variable Initialization Error Handler
 * Handles "Cannot access 'X' before initialization" errors
 */

class VariableInitializationHandler {
  constructor() {
    this.errorCount = 0;
    this.maxErrors = 10;
    this.errorLog = [];
    this.init();
  }

  init() {
    // Override console.error to catch initialization errors
    const originalError = console.error;
    
    console.error = (...args) => {
      const errorMessage = args.join(' ');
      
      // Check if it's a variable initialization error
      if (errorMessage.includes('Cannot access') && errorMessage.includes('before initialization')) {
        this.handleInitializationError(errorMessage, args);
      }
      
      // Call original console.error
      originalError.apply(console, args);
    };

    // Handle unhandled promise rejections that might contain initialization errors
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      if (error && error.message && error.message.includes('Cannot access') && error.message.includes('before initialization')) {
        this.handleInitializationError(error.message, [error]);
        event.preventDefault(); // Prevent the error from being logged to console
      }
    });

    // Handle regular errors
    window.addEventListener('error', (event) => {
      const error = event.error;
      if (error && error.message && error.message.includes('Cannot access') && error.message.includes('before initialization')) {
        this.handleInitializationError(error.message, [error]);
        event.preventDefault(); // Prevent the error from being logged to console
      }
    });
  }

  handleInitializationError(errorMessage, args) {
    this.errorCount++;
    
    const errorInfo = {
      timestamp: new Date().toISOString(),
      message: errorMessage,
      count: this.errorCount,
      stack: args[0]?.stack || 'No stack trace available'
    };
    
    this.errorLog.push(errorInfo);
    
    // Keep only last 20 errors
    if (this.errorLog.length > 20) {
      this.errorLog = this.errorLog.slice(-20);
    }
    
    console.warn(`🔧 Variable Initialization Error #${this.errorCount} handled:`, errorMessage);
    
    // If too many errors, suggest a page reload
    if (this.errorCount >= this.maxErrors) {
      console.warn('⚠️ Too many variable initialization errors detected. Consider refreshing the page.');
      
      // Show user-friendly notification if toast is available
      if (window.toast && typeof window.toast.error === 'function') {
        window.toast.error('Multiple initialization errors detected. Please refresh the page if issues persist.');
      }
    }
    
    // Try to provide helpful debugging information
    this.analyzeError(errorMessage);
  }

  analyzeError(errorMessage) {
    // Extract variable name from error message
    const match = errorMessage.match(/Cannot access '(\w+)' before initialization/);
    if (match) {
      const variableName = match[1];
      console.warn(`🔍 Variable '${variableName}' accessed before initialization. This usually happens when:`);
      console.warn('  1. A variable is used in its own initialization');
      console.warn('  2. Hoisting issues with let/const declarations');
      console.warn('  3. Circular dependencies between modules');
      console.warn('  4. Async operations accessing variables before they\'re ready');
      
      // Provide specific suggestions based on variable name
      if (variableName.toLowerCase().includes('at')) {
        console.warn(`💡 Suggestion: Check if '${variableName}' is being used in a forEach, map, or similar array method before it's properly initialized.`);
      }
    }
  }

  getErrorStats() {
    return {
      totalErrors: this.errorCount,
      recentErrors: this.errorLog.slice(-5),
      errorLog: this.errorLog
    };
  }

  clearErrors() {
    this.errorCount = 0;
    this.errorLog = [];
    console.log('🧹 Variable initialization error log cleared');
  }

  // Method to safely access potentially uninitialized variables
  safeAccess(fn, fallback = null, context = 'unknown') {
    try {
      return fn();
    } catch (error) {
      if (error.message && error.message.includes('Cannot access') && error.message.includes('before initialization')) {
        console.warn(`🛡️ Safe access prevented initialization error in ${context}:`, error.message);
        return fallback;
      }
      throw error; // Re-throw if it's not an initialization error
    }
  }

  // Method to safely execute array operations
  safeArrayOperation(array, operation, fallback = []) {
    try {
      if (!Array.isArray(array)) {
        console.warn('🛡️ Safe array operation: provided value is not an array, using fallback');
        return fallback;
      }
      return operation(array);
    } catch (error) {
      if (error.message && error.message.includes('Cannot access') && error.message.includes('before initialization')) {
        console.warn('🛡️ Safe array operation prevented initialization error:', error.message);
        return fallback;
      }
      throw error;
    }
  }
}

// Create singleton instance
const variableInitializationHandler = new VariableInitializationHandler();

// Export for use in other modules
export default variableInitializationHandler;

// Also export utility functions
export const safeAccess = (fn, fallback = null, context = 'unknown') => {
  return variableInitializationHandler.safeAccess(fn, fallback, context);
};

export const safeArrayOperation = (array, operation, fallback = []) => {
  return variableInitializationHandler.safeArrayOperation(array, operation, fallback);
};

// Initialize immediately
console.log('🔧 Variable Initialization Handler initialized');