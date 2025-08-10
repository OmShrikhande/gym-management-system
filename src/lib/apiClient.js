import axios from 'axios';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage.js';

// Storage keys
const ACCESS_TOKEN_KEY = 'gymflow_access_token';
const REFRESH_TOKEN_KEY = 'gymflow_refresh_token';
const LEGACY_TOKEN_KEY = 'gymflow_token'; // For backward compatibility

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

class ApiClient {
  constructor() {
    this.isRefreshing = false;
    this.failedQueue = [];
    
    // Create axios instance
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return this.client(originalRequest);
              })
              .catch(err => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const newToken = await this.refreshAccessToken();
            this.processQueue(null, newToken);
            
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            this.processQueue(refreshError, null);
            this.clearTokens();
            
            // Redirect to login or emit an event
            this.onAuthenticationFailed();
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Get access token with fallback to legacy token
  getAccessToken() {
    return getStorageItem(ACCESS_TOKEN_KEY) || getStorageItem(LEGACY_TOKEN_KEY);
  }

  // Get refresh token
  getRefreshToken() {
    return getStorageItem(REFRESH_TOKEN_KEY);
  }

  // Set tokens
  setTokens(accessToken, refreshToken) {
    setStorageItem(ACCESS_TOKEN_KEY, accessToken);
    setStorageItem(LEGACY_TOKEN_KEY, accessToken); // For backward compatibility
    if (refreshToken) {
      setStorageItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  // Clear all tokens
  clearTokens() {
    removeStorageItem(ACCESS_TOKEN_KEY);
    removeStorageItem(REFRESH_TOKEN_KEY);
    removeStorageItem(LEGACY_TOKEN_KEY);
  }

  // Refresh access token
  async refreshAccessToken() {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh-token`, {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;
      
      this.setTokens(accessToken, newRefreshToken);
      
      console.log('Token refreshed successfully');
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  // Process queued requests after token refresh
  processQueue(error, token = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  // Handle authentication failure
  onAuthenticationFailed() {
    // Emit custom event for auth failure
    window.dispatchEvent(new CustomEvent('auth:failed'));
  }

  // Login method
  async login(credentials) {
    try {
      const response = await this.client.post('/auth/login', credentials);
      
      const { accessToken, refreshToken, token } = response.data;
      
      // Store both new and legacy tokens
      this.setTokens(accessToken || token, refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  // Logout method
  async logout() {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      this.clearTokens();
    }
  }

  // Generic API methods
  get(url, config = {}) {
    return this.client.get(url, config);
  }

  post(url, data, config = {}) {
    return this.client.post(url, data, config);
  }

  put(url, data, config = {}) {
    return this.client.put(url, data, config);
  }

  patch(url, data, config = {}) {
    return this.client.patch(url, data, config);
  }

  delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;