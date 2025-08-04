import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Encryption configuration
const ENCRYPTION_CONFIG = {
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  saltLength: 32
};

/**
 * Generate a secure random key
 */
export const generateSecureKey = () => {
  return crypto.randomBytes(ENCRYPTION_CONFIG.keyLength);
};

/**
 * Derive key from password using PBKDF2
 */
export const deriveKey = (password, salt) => {
  return crypto.pbkdf2Sync(password, salt, 100000, ENCRYPTION_CONFIG.keyLength, 'sha256');
};

/**
 * Encrypt sensitive data
 */
export const encryptData = (data, key) => {
  try {
    const iv = crypto.randomBytes(ENCRYPTION_CONFIG.ivLength);
    const cipher = crypto.createCipher(ENCRYPTION_CONFIG.algorithm, key, iv);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

/**
 * Decrypt sensitive data
 */
export const decryptData = (encryptedData, key) => {
  try {
    const { encrypted, iv, tag } = encryptedData;
    const decipher = crypto.createDecipher(ENCRYPTION_CONFIG.algorithm, key, Buffer.from(iv, 'hex'));
    
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return JSON.parse(decrypted);
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

/**
 * Hash sensitive data (one-way)
 */
export const hashData = async (data, saltRounds = 12) => {
  try {
    return await bcrypt.hash(data, saltRounds);
  } catch (error) {
    throw new Error('Hashing failed: ' + error.message);
  }
};

/**
 * Verify hashed data
 */
export const verifyHash = async (data, hash) => {
  try {
    return await bcrypt.compare(data, hash);
  } catch (error) {
    throw new Error('Hash verification failed: ' + error.message);
  }
};

/**
 * Generate secure token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Encrypt PII (Personally Identifiable Information)
 */
export const encryptPII = (piiData) => {
  const key = process.env.PII_ENCRYPTION_KEY || generateSecureKey();
  return encryptData(piiData, key);
};

/**
 * Decrypt PII
 */
export const decryptPII = (encryptedPII) => {
  const key = process.env.PII_ENCRYPTION_KEY || generateSecureKey();
  return decryptData(encryptedPII, key);
};

/**
 * Secure data sanitization
 */
export const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return data
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/[<>]/g, '');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeData(value);
    }
    return sanitized;
  }
  
  return data;
};

/**
 * Generate CSRF token
 */
export const generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Validate CSRF token
 */
export const validateCSRFToken = (token, sessionToken) => {
  return crypto.timingSafeEqual(
    Buffer.from(token, 'hex'),
    Buffer.from(sessionToken, 'hex')
  );
};

/**
 * Secure password generation
 */
export const generateSecurePassword = (length = 16) => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
};

/**
 * Data masking for logs
 */
export const maskSensitiveData = (data) => {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
  
  if (typeof data === 'object' && data !== null) {
    const masked = { ...data };
    
    for (const field of sensitiveFields) {
      if (masked[field]) {
        masked[field] = '***MASKED***';
      }
    }
    
    return masked;
  }
  
  return data;
};

export default {
  generateSecureKey,
  deriveKey,
  encryptData,
  decryptData,
  hashData,
  verifyHash,
  generateSecureToken,
  encryptPII,
  decryptPII,
  sanitizeData,
  generateCSRFToken,
  validateCSRFToken,
  generateSecurePassword,
  maskSensitiveData
};