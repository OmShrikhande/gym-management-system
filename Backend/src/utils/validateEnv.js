// Environment variables validation utility
import dotenv from 'dotenv';

// Reload environment variables
dotenv.config();

// Required environment variables
const REQUIRED_VARS = {
  'JWT_SECRET': 'JWT secret key for token signing',
  'JWT_REFRESH_SECRET': 'JWT refresh secret key',
  'MONGODB_URI': 'MongoDB connection string',
  'NODE_ENV': 'Node environment (development/production)'
};

// Optional but recommended variables
const OPTIONAL_VARS = {
  'JWT_ACCESS_EXPIRES_IN': '15m',
  'JWT_REFRESH_EXPIRES_IN': '7d',
  'JWT_EXPIRES_IN': '90d',
  'PORT': '5000',
  'FRONTEND_URL': 'Frontend URL for CORS'
};

export const validateEnvironment = () => {
  const missing = [];
  const warnings = [];
  const valid = {};

  console.log('\n🔍 Environment Variables Validation:');
  console.log('=====================================');

  // Check required variables
  for (const [varName, description] of Object.entries(REQUIRED_VARS)) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      missing.push(varName);
      console.log(`❌ ${varName}: MISSING - ${description}`);
    } else {
      valid[varName] = value;
      const displayValue = varName.includes('SECRET') || varName.includes('URI') 
        ? `${value.substring(0, 8)}...` 
        : value;
      console.log(`✅ ${varName}: ${displayValue}`);
    }
  }

  // Check optional variables
  for (const [varName, defaultValue] of Object.entries(OPTIONAL_VARS)) {
    const value = process.env[varName];
    if (!value || value.trim() === '') {
      warnings.push(varName);
      console.log(`⚠️  ${varName}: Using default (${defaultValue})`);
    } else {
      valid[varName] = value;
      console.log(`✅ ${varName}: ${value}`);
    }
  }

  console.log('=====================================');

  if (missing.length > 0) {
    console.error(`\n🚨 CRITICAL ERROR: Missing required environment variables:`);
    missing.forEach(varName => console.error(`   - ${varName}`));
    console.error(`\nPlease check your .env file and ensure all required variables are set.`);
    return false;
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  Warning: Missing optional environment variables:`);
    warnings.forEach(varName => console.warn(`   - ${varName}`));
  }

  console.log(`\n✅ Environment validation successful!`);
  return true;
};

// Validate JWT secrets specifically
export const validateJWTSecrets = () => {
  const jwtSecret = process.env.JWT_SECRET;
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!jwtSecret) {
    console.error('🚨 JWT_SECRET is not defined!');
    return false;
  }

  if (!jwtRefreshSecret) {
    console.error('🚨 JWT_REFRESH_SECRET is not defined!');
    return false;
  }

  if (jwtSecret === 'your-very-strong-secret-key-change-this-in-production-min-32-chars') {
    console.warn('⚠️  WARNING: You are using the default JWT_SECRET! Please change it in production.');
  }

  if (jwtRefreshSecret === 'your-very-strong-refresh-secret-key-different-from-access-min-32-chars') {
    console.warn('⚠️  WARNING: You are using the default JWT_REFRESH_SECRET! Please change it in production.');
  }

  if (jwtSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security.');
  }

  if (jwtRefreshSecret.length < 32) {
    console.warn('⚠️  WARNING: JWT_REFRESH_SECRET should be at least 32 characters long for security.');
  }

  if (jwtSecret === jwtRefreshSecret) {
    console.warn('⚠️  WARNING: JWT_SECRET and JWT_REFRESH_SECRET should be different!');
  }

  return true;
};

// Get environment status
export const getEnvironmentStatus = () => {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecretSet: !!process.env.JWT_SECRET,
    jwtRefreshSecretSet: !!process.env.JWT_REFRESH_SECRET,
    mongoUriSet: !!process.env.MONGODB_URI,
    frontendUrlSet: !!process.env.FRONTEND_URL,
    allSecrets: {
      JWT_SECRET: process.env.JWT_SECRET ? '✓ SET' : '✗ MISSING',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? '✓ SET' : '✗ MISSING',
      MONGODB_URI: process.env.MONGODB_URI ? '✓ SET' : '✗ MISSING'
    }
  };
};

export default { validateEnvironment, validateJWTSecrets, getEnvironmentStatus };