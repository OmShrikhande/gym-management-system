/**
 * Enhanced centralized error handler for API requests with comprehensive error tracking
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const errorHandler = (error, req, res, next) => {
  // Prevent duplicate error responses
  if (res.headersSent) {
    return next(error);
  }

  // Log error with context for debugging
  const errorContext = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    errorName: error.name,
    errorMessage: error.message,
    statusCode: error.statusCode || 500
  };
  
  console.error('=== ERROR HANDLER ===');
  console.error('Context:', errorContext);
  console.error('Stack:', error.stack);
  console.error('=====================');
  
  // Default error status and message
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Something went wrong';
  let errorCode = 'INTERNAL_ERROR';
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const validationErrors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message,
      value: err.value
    }));
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: 'Validation failed',
      details: validationErrors,
      timestamp: errorContext.timestamp
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_ERROR';
    const field = Object.keys(error.keyValue)[0];
    const value = error.keyValue[field];
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: `Duplicate value for ${field}. Please use another value.`,
      details: { field, value },
      timestamp: errorContext.timestamp
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (error.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_ID';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: `Invalid ${error.path}: ${error.value}`,
      details: { path: error.path, value: error.value },
      timestamp: errorContext.timestamp
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: 'Invalid token. Please log in again.',
      timestamp: errorContext.timestamp
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    
    return res.status(statusCode).json({
      success: false,
      error: errorCode,
      message: 'Your token has expired. Please log in again.',
      timestamp: errorContext.timestamp
    });
  }
  
  // MongoDB connection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
    statusCode = 503;
    errorCode = 'DATABASE_ERROR';
    message = 'Database temporarily unavailable. Please try again.';
  }
  
  // Rate limiting errors
  if (error.name === 'TooManyRequestsError') {
    statusCode = 429;
    errorCode = 'RATE_LIMIT_EXCEEDED';
    message = 'Too many requests. Please try again later.';
  }
  
  // File upload errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    errorCode = 'FILE_TOO_LARGE';
    message = 'File size exceeds the allowed limit.';
  }
  
  // CORS errors
  if (error.message && error.message.includes('CORS')) {
    statusCode = 403;
    errorCode = 'CORS_ERROR';
    message = 'Cross-origin request blocked.';
  }
  
  // Default error response with enhanced information
  const errorResponse = {
    success: false,
    error: errorCode,
    message,
    timestamp: errorContext.timestamp,
    requestId: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.context = errorContext;
  }
  
  return res.status(statusCode).json(errorResponse);
};

/**
 * Enhanced 404 handler
 */
export const notFoundHandler = (req, res) => {
  const errorResponse = {
    success: false,
    error: 'NOT_FOUND',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.originalUrl
  };
  
  console.warn('404 Error:', errorResponse);
  res.status(404).json(errorResponse);
};

/**
 * Async error wrapper to catch unhandled promise rejections
 */
export const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};