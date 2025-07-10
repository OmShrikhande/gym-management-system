/**
 * Environment check utilities
 */

export const isDevelopment = () => {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
};

export const isProduction = () => {
  return import.meta.env.PROD || import.meta.env.NODE_ENV === 'production';
};

export const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:5000';
};

export const shouldEnableWebSocket = () => {
  // Enable WebSocket in development or if explicitly enabled
  if (isDevelopment()) {
    return true;
  }
  
  // In production, only enable if the backend supports it
  const apiUrl = getApiUrl();
  return apiUrl.includes('render.com') || apiUrl.includes('herokuapp.com');
};

export const getWebSocketUrl = () => {
  const baseUrl = getApiUrl();
  const wsUrl = baseUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${wsUrl}/ws`;
};

export const logEnvironmentInfo = () => {
  console.log('🌍 Environment Info:');
  console.log('  - Mode:', isDevelopment() ? 'Development' : 'Production');
  console.log('  - API URL:', getApiUrl());
  console.log('  - WebSocket URL:', getWebSocketUrl());
  console.log('  - WebSocket Enabled:', shouldEnableWebSocket());
};