// Authentication debugging utilities

export const debugAuthState = () => {
  const accessToken = localStorage.getItem('gymflow_access_token');
  const refreshToken = localStorage.getItem('gymflow_refresh_token');
  const legacyToken = localStorage.getItem('gymflow_token');
  const user = localStorage.getItem('gymflow_user');
  
  console.log('🔍 Auth Debug State:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    hasLegacyToken: !!legacyToken,
    hasUser: !!user,
    accessTokenLength: accessToken ? accessToken.length : 0,
    refreshTokenLength: refreshToken ? refreshToken.length : 0,
    userRole: user ? JSON.parse(user).role : null,
    userId: user ? JSON.parse(user)._id : null
  });
  
  return {
    accessToken,
    refreshToken,
    legacyToken,
    user: user ? JSON.parse(user) : null
  };
};

export const clearAllAuthData = () => {
  console.log('🧹 Clearing all authentication data...');
  
  const authKeys = [
    'gymflow_access_token',
    'gymflow_refresh_token', 
    'gymflow_token',
    'gymflow_user'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Cleared ${key}`);
  });
  
  console.log('🔄 Please refresh the page and log in again');
};

export const validateTokenFormat = (token) => {
  if (!token) return { valid: false, reason: 'No token provided' };
  
  try {
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, reason: 'Invalid JWT format - should have 3 parts' };
    }
    
    // Try to decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    const now = Math.floor(Date.now() / 1000);
    
    return {
      valid: true,
      payload,
      expired: payload.exp && payload.exp < now,
      expiresAt: payload.exp ? new Date(payload.exp * 1000) : null,
      userId: payload.id || payload.sub
    };
  } catch (error) {
    return { valid: false, reason: 'Failed to decode token', error: error.message };
  }
};

export const checkTokenHealth = () => {
  const { accessToken, refreshToken } = debugAuthState();
  
  console.log('🏥 Token Health Check:');
  
  if (accessToken) {
    const accessTokenInfo = validateTokenFormat(accessToken);
    console.log('Access Token:', accessTokenInfo);
  }
  
  if (refreshToken) {
    const refreshTokenInfo = validateTokenFormat(refreshToken);
    console.log('Refresh Token:', refreshTokenInfo);
  }
};

// Add to window for easy debugging in console
if (typeof window !== 'undefined') {
  window.authDebug = {
    debugAuthState,
    clearAllAuthData,
    validateTokenFormat,
    checkTokenHealth
  };
}