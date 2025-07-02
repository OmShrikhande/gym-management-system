/**
 * Centralized error handler for API requests
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const errorHandler = (error, req, res) => {
  console.error('Error:', error);
  
  // Default error status and message
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Something went wrong';
  
  // Mongoose validation error
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `Duplicate value for ${field}. Please use another value.`
    });
  }
  
  // Mongoose cast error (invalid ID)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid ${error.path}: ${error.value}`
    });
  }
  
  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Your token has expired. Please log in again.'
    });
  }
  
  // Default error response
  return res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};