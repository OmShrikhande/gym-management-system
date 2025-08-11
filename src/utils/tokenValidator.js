import { getStorageItem, removeStorageItem } from '@/lib/storage.js';

// Storage keys
const ACCESS_TOKEN_KEY = 'gymflow_access_token';
const REFRESH_TOKEN_KEY = 'gymflow_refresh_token';
const LEGACY_TOKEN_KEY = 'gymflow_token';
const USER_STORAGE_KEY = 'gymflow_user';

/**
 * Decode JWT token without verification (for inspection only)
 * @param {string} token - JWT token
 * @returns {object|null} - Decoded payload or null if invalid
 */
export const decodeJWT = (token) => {
  if (!token) return null;
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = parts[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

/**
 * Check if a JWT token is expired
 * @param {string} token - JWT token
 * @returns {boolean} - True if expired
 */
export const isTokenExpired = (token) => {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Math.floor(Date.now() / 1000);
  return decoded.exp < currentTime;
};

/**
 * Validate stored tokens and clear if invalid
 * @returns {object} - Validation result
 */
export const validateStoredTokens = () => {
  const accessToken = getStorageItem(ACCESS_TOKEN_KEY);
  const refreshToken = getStorageItem(REFRESH_TOKEN_KEY);
  const legacyToken = getStorageItem(LEGACY_TOKEN_KEY);
  const user = getStorageItem(USER_STORAGE_KEY);
  
  const result = {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasLegacyToken: !!legacyToken,
    hasUser: !!user,
    accessTokenExpired: accessToken ? isTokenExpired(accessToken) : null,
    refreshTokenExpired: refreshToken ? isTokenExpired(refreshToken) : null,
    legacyTokenExpired: legacyToken ? isTokenExpired(legacyToken) : null,
    shouldClearTokens: false,
    message: ''
  };
  
  // Check if all tokens are expired or invalid
  const allTokensExpired = (
    (!accessToken || isTokenExpired(accessToken)) &&
    (!refreshToken || isTokenExpired(refreshToken)) &&
    (!legacyToken || isTokenExpired(legacyToken))
  );
  
  if (allTokensExpired && (accessToken || refreshToken || legacyToken)) {
    result.shouldClearTokens = true;
    result.message = 'All stored tokens are expired or invalid. Please log in again.';
  }
  
  return result;
};

/**
 * Clear all authentication data
 */
export const clearAllAuthData = () => {
  const authKeys = [
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    LEGACY_TOKEN_KEY,
    USER_STORAGE_KEY
  ];
  
  authKeys.forEach(key => {
    removeStorageItem(key);
  });
  
  // Clear gym settings as well
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('gym_settings_')) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('All authentication data cleared');
};

/**
 * Check if the current authentication state is valid
 * @returns {boolean} - True if valid
 */
export const isAuthStateValid = () => {
  const validation = validateStoredTokens();
  
  if (validation.shouldClearTokens) {
    console.warn('Invalid authentication state detected:', validation.message);
    return false;
  }
  
  return validation.hasAccessToken || validation.hasLegacyToken;
};

/**
 * Handle JWT secret change scenario
 * This function detects when tokens might be invalid due to server-side JWT secret changes
 */
export const handleJWTSecretChange = () => {
  const validation = validateStoredTokens();
  
  console.log('Token validation result:', validation);
  
  if (validation.shouldClearTokens) {
    console.warn('🔄 Detected invalid tokens (possibly due to JWT secret change)');
    console.warn('Clearing all authentication data...');
    
    clearAllAuthData();
    
    // Show user-friendly message
    const message = `
Your session has expired due to server updates. 
This is normal when the server security keys are updated.
Please refresh the page and log in again.
    `.trim();
    
    if (typeof window !== 'undefined' && window.confirm) {
      const shouldRefresh = window.confirm(message + '\n\nWould you like to refresh the page now?');
      if (shouldRefresh) {
        window.location.reload();
      }
    } else {
      console.error(message);
    }
    
    return true; // Indicates tokens were cleared
  }
  
  return false; // No action needed
};