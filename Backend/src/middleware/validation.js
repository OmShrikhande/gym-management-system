import mongoose from 'mongoose';
import validator from 'validator';

/**
 * Validate MongoDB ObjectId
 */
export const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_PARAMETER',
        message: `Missing required parameter: ${paramName}`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_ID',
        message: `Invalid ${paramName} format`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Validate email format
 */
export const validateEmail = (req, res, next) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_EMAIL',
      message: 'Email is required',
      timestamp: new Date().toISOString()
    });
  }
  
  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_EMAIL',
      message: 'Please provide a valid email address',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Validate password strength
 */
export const validatePassword = (req, res, next) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      success: false,
      error: 'MISSING_PASSWORD',
      message: 'Password is required',
      timestamp: new Date().toISOString()
    });
  }
  
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      error: 'WEAK_PASSWORD',
      message: 'Password must be at least 8 characters long',
      timestamp: new Date().toISOString()
    });
  }
  
  // Check for at least one number, one lowercase, one uppercase letter
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      error: 'WEAK_PASSWORD',
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Validate required fields
 */
export const validateRequiredFields = (fields) => {
  return (req, res, next) => {
    const missingFields = [];
    
    fields.forEach(field => {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missingFields.push(field);
      }
    });
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'MISSING_REQUIRED_FIELDS',
        message: 'Missing required fields',
        details: { missingFields },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Validate phone number
 */
export const validatePhone = (req, res, next) => {
  const { phone } = req.body;
  
  if (phone && !validator.isMobilePhone(phone, 'any')) {
    return res.status(400).json({
      success: false,
      error: 'INVALID_PHONE',
      message: 'Please provide a valid phone number',
      timestamp: new Date().toISOString()
    });
  }
  
  next();
};

/**
 * Validate date format
 */
export const validateDate = (fieldName) => {
  return (req, res, next) => {
    const dateValue = req.body[fieldName];
    
    if (dateValue && !validator.isISO8601(dateValue)) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_DATE',
        message: `Invalid date format for ${fieldName}. Use ISO 8601 format (YYYY-MM-DD)`,
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
};

/**
 * Validate numeric values
 */
export const validateNumeric = (fieldName, options = {}) => {
  return (req, res, next) => {
    const value = req.body[fieldName];
    
    if (value !== undefined && value !== null) {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_NUMBER',
          message: `${fieldName} must be a valid number`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (options.min !== undefined && numValue < options.min) {
        return res.status(400).json({
          success: false,
          error: 'NUMBER_TOO_SMALL',
          message: `${fieldName} must be at least ${options.min}`,
          timestamp: new Date().toISOString()
        });
      }
      
      if (options.max !== undefined && numValue > options.max) {
        return res.status(400).json({
          success: false,
          error: 'NUMBER_TOO_LARGE',
          message: `${fieldName} must be at most ${options.max}`,
          timestamp: new Date().toISOString()
        });
      }
      
      // Convert to number for further processing
      req.body[fieldName] = numValue;
    }
    
    next();
  };
};

/**
 * Sanitize input data
 */
export const sanitizeInput = (req, res, next) => {
  // Remove any potential XSS attempts
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
              .replace(/javascript:/gi, '')
              .replace(/on\w+\s*=/gi, '');
  };
  
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = sanitizeString(obj[key]);
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };
  
  if (req.body) {
    sanitizeObject(req.body);
  }
  
  if (req.query) {
    sanitizeObject(req.query);
  }
  
  next();
};