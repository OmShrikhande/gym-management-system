import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem, removeStorageItem } from "@/lib/storage.js";
import apiClient from "@/lib/apiClient.js";

// Local storage keys
const USER_STORAGE_KEY = 'gymflow_user';
const TOKEN_STORAGE_KEY = 'gymflow_token';
const ACCESS_TOKEN_KEY = 'gymflow_access_token';
const REFRESH_TOKEN_KEY = 'gymflow_refresh_token';

// Debug function to check localStorage status
const debugLocalStorage = () => {
  try {
    const token = getStorageItem(TOKEN_STORAGE_KEY, null);
    const accessToken = getStorageItem(ACCESS_TOKEN_KEY, null);
    const refreshToken = getStorageItem(REFRESH_TOKEN_KEY, null);
    const user = getStorageItem(USER_STORAGE_KEY, null);
    
    console.log('LocalStorage Debug:', {
      hasLegacyToken: !!token,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      tokenLength: token ? token.length : 0,
      accessTokenLength: accessToken ? accessToken.length : 0,
      hasUser: !!user,
      userRole: user?.role,
      userId: user?._id,
      storageAvailable: typeof(Storage) !== "undefined"
    });
    
    return { 
      token: accessToken || token, // Prefer access token over legacy token
      accessToken,
      refreshToken,
      user 
    };
  } catch (error) {
    console.error('LocalStorage Debug Error:', error);
    return { token: null, accessToken: null, refreshToken: null, user: null };
  }
};

// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

// Create the Auth Context
const AuthContext = createContext(undefined);

/**
 * Authentication Provider component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Clear authentication data
  const clearAuthData = useCallback(() => {
    setUser(null);
    setToken(null);
    removeStorageItem(USER_STORAGE_KEY);
    removeStorageItem(TOKEN_STORAGE_KEY);
    removeStorageItem(ACCESS_TOKEN_KEY);
    removeStorageItem(REFRESH_TOKEN_KEY);
    apiClient.clearTokens();
  }, []);

  // Listen for authentication failures from API client
  useEffect(() => {
    const handleAuthFailure = () => {
      console.log('Authentication failed, clearing auth data');
      clearAuthData();
    };

    window.addEventListener('auth:failed', handleAuthFailure);
    
    return () => {
      window.removeEventListener('auth:failed', handleAuthFailure);
    };
  }, [clearAuthData]);

  // Verify token and load user data on initial render
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      try {
        // Debug localStorage status
        const { token: storedToken, accessToken, refreshToken, user: storedUser } = debugLocalStorage();
        
        // Initialize API client with stored tokens
        if (storedToken || accessToken) {
          apiClient.setTokens(storedToken || accessToken, refreshToken);
        }
        
        if (!storedToken) {
          console.log('No stored token found, user needs to login');
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }
        
        console.log('Found stored token, attempting verification...');
        
        if (isMounted) {
          setToken(storedToken);
        }
        
        // Verify token with backend
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          const response = await fetch(`${API_URL}/auth/verify-token`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            },
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (response.ok && isMounted) {
            // Token is valid, fetch complete user profile
            try {
              const profileResponse = await fetch(`${API_URL}/users/me`, {
                headers: { 'Authorization': `Bearer ${storedToken}` }
              });
              if (profileResponse.ok) {
                const profileData = await profileResponse.json();
                let userData = profileData.data.user;
                if (userData.role === 'gym-owner' && !userData.gymId) {
                  userData.gymId = userData._id; // Fallback if backend doesn't provide gymId
                }
                setUser(userData);
                setStorageItem(USER_STORAGE_KEY, userData);
                
                if (userData.role === 'gym-owner') {
                  try {
                    await checkSubscriptionStatus(userData._id, storedToken);
                  } catch (subscriptionError) {
                    console.error('Subscription check failed:', subscriptionError);
                  }
                }
              } else {
                // Profile fetch failed, but token is valid, use stored user
                const storedUser = getStorageItem(USER_STORAGE_KEY, null);
                if (storedUser && isMounted) {
                  setUser(storedUser);
                }
              }
            } catch (profileError) {
              console.error('Profile fetch failed:', profileError);
              // Use stored user data as fallback
              const storedUser = getStorageItem(USER_STORAGE_KEY, null);
              if (storedUser && isMounted) {
                setUser(storedUser);
              }
            }
          } else if (response.status === 401 && isMounted) {
            // Token is invalid/expired, clear auth data
            console.log('Token expired or invalid, clearing auth data');
            clearAuthData();
          } else if (isMounted) {
            // Other error, but don't clear auth data immediately
            // Try to use stored user data
            const storedUser = getStorageItem(USER_STORAGE_KEY, null);
            if (storedUser) {
              console.log('Token verification failed, using stored user data');
              setUser(storedUser);
            } else {
              clearAuthData();
            }
          }
        } catch (err) {
          console.error('Token verification failed:', err);
          if (isMounted) {
            // Network error or timeout - don't clear auth data immediately
            // Try to use stored user data as fallback
            const storedUser = getStorageItem(USER_STORAGE_KEY, null);
            if (storedUser) {
              console.log('Network error during token verification, using stored user data');
              setUser(storedUser);
              
              // Optionally, you can retry verification after a delay
              setTimeout(async () => {
                try {
                  const retryResponse = await fetch(`${API_URL}/auth/verify-token`, {
                    headers: {
                      'Authorization': `Bearer ${storedToken}`
                    }
                  });
                  
                  if (!retryResponse.ok && retryResponse.status === 401) {
                    console.log('Token verification retry failed - token is invalid');
                    clearAuthData();
                  }
                } catch (retryError) {
                  console.error('Token verification retry failed:', retryError);
                  // Don't clear auth data on retry failure
                }
              }, 5000); // Retry after 5 seconds
            } else {
              clearAuthData();
            }
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
        if (isMounted) {
          clearAuthData();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      isMounted = false;
    };
  }, [clearAuthData]);
  
  // Check subscription status with caching
  const checkSubscriptionStatus = useCallback(async (userId, authToken, forceRefresh = false) => {
    const CACHE_DURATION = 30 * 60 * 1000;
    const lastCheckTime = window.lastSubscriptionCheckTime || 0;
    const shouldUseCache = !forceRefresh && 
                          subscription && 
                          (Date.now() - lastCheckTime < CACHE_DURATION);
    
    if (shouldUseCache) {
      return subscription.hasActiveSubscription || !subscription.requiresSubscription;
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${API_URL}/subscriptions/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        },
        signal: controller.signal,
        cache: 'default'
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        window.lastSubscriptionCheckTime = Date.now();
        
        if (data.data.requiresSubscription && !data.data.hasActiveSubscription) {
          return false;
        }
        return true;
      }
      return false;
    } catch (err) {
      if (err.name === 'AbortError') {
        console.error('Subscription check timed out');
      } else {
        console.error('Error checking subscription status:', err);
      }
      return false;
    }
  }, [subscription, token]);
  
  // Fetch notifications with caching
  const fetchNotifications = useCallback(async (userId, authToken, unreadOnly = false, forceRefresh = false) => {
    return { 
      notifications: notifications || [], 
      unreadCount: unreadNotificationCount || 0 
    };
  }, [notifications, unreadNotificationCount]);
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${API_URL}/notifications/${notificationId}/mark-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
        setUnreadNotificationCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`${API_URL}/notifications/user/${user._id}/mark-all-read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
        setUnreadNotificationCount(0);
      }
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Create a new user based on role
  const createUser = async (userData, userType) => {
    setError(null);
    setIsLoading(true);
    
    if (!userData.email || !userData.password || !userData.name) {
      setError('All fields are required');
      setIsLoading(false);
      return { success: false, message: 'All fields are required' };
    }
    
    if (userData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return { success: false, message: 'Password must be at least 8 characters' };
    }
    
    try {
      let endpoint;
      switch(userType) {
        case 'gym-owner':
          endpoint = `${API_URL}/auth/create-gym-owner`;
          break;
        case 'trainer':
          endpoint = `${API_URL}/auth/create-trainer`;
          break;
        case 'member':
          endpoint = `${API_URL}/auth/create-user`;
          break;
        default:
          throw new Error('Invalid user type');
      }
      
      let requestBody = {
        name: userData.name,
        email: userData.email,
        password: userData.password
      };
      
      if (userType === 'gym-owner') {
        requestBody = {
          ...requestBody,
          phone: userData.phone || '',
          whatsapp: userData.whatsapp || '',
          address: userData.address || '',
          totalMembers: userData.totalMembers || 0,
          gymName: userData.gymName || userData.name + "'s Gym",
          subscriptionPlan: userData.subscriptionPlan || '',
          paymentMethod: userData.paymentMethod || 'credit_card'
        };
      }
      
      if (userType === 'trainer') {
        if (!user || user.role !== 'gym-owner') {
          const errorMessage = 'Only gym owners can create trainers';
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
        
        if (!user.gymId && !user._id) {
          const errorMessage = 'Gym ID is missing for the logged-in gym owner';
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
        
        requestBody = {
          ...requestBody,
          phone: userData.phone || '',
          whatsapp: userData.whatsapp || '',
          address: userData.address || '',
          trainerFee: parseInt(userData.salary || userData.trainerFee) || null,
          gymId: user?.gymId || user?._id
        };
      }
      
      if (userType === 'member') {
        if (!user || user.role !== 'gym-owner') {
          const errorMessage = 'Only gym owners can create members';
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
        
        if (!user.gymId) {
          const errorMessage = 'Gym ID is missing for the logged-in gym owner';
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
        
        const membershipDuration = parseInt(userData.membershipDuration || '1');
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + membershipDuration);
        
        const cleanValue = (value) => value && value.trim() !== '' ? value.trim() : undefined;
        
        requestBody = {
          ...requestBody,
          phone: cleanValue(userData.phone),
          gender: userData.gender || 'Male',
          dob: cleanValue(userData.dob),
          goal: userData.goal || 'weight-loss',
          planType: userData.planType || 'Basic',
          address: cleanValue(userData.address),
          whatsapp: cleanValue(userData.whatsapp),
          height: cleanValue(userData.height),
          weight: cleanValue(userData.weight),
          emergencyContact: cleanValue(userData.emergencyContact),
          medicalConditions: cleanValue(userData.medicalConditions),
          assignedTrainer: userData.assignedTrainer || undefined,
          notes: cleanValue(userData.fitnessGoalDescription),
          membershipStatus: 'Active',
          membershipStartDate: startDate.toISOString().split('T')[0],
          membershipEndDate: endDate.toISOString().split('T')[0],
          membershipDuration: membershipDuration,
          membershipType: userData.planType || 'Basic',
          role: 'member',
          gymId: user?.gymId || user?._id,
          paymentStatus: userData.paymentStatus,
          paymentId: userData.paymentId,
          paymentAmount: userData.paymentAmount,
          paymentDate: userData.paymentDate
        };
        
        Object.keys(requestBody).forEach(key => {
          if (requestBody[key] === undefined) {
            delete requestBody[key];
          }
        });
      }
      
      if (!token) {
        const errorMessage = 'Authentication required. Please log in again.';
        console.error('Auth error:', errorMessage);
        setError(errorMessage);
        setIsLoading(false);
        return { success: false, message: errorMessage };
      }
      
      if (userType === 'member') {
        // Debug: Log user object and gymId
        console.log('Current user object:', user);
        console.log('User gymId:', user?.gymId);
        console.log('User _id:', user?._id);
        console.log('Final gymId being used:', requestBody.gymId);
        
        const requiredFields = ['name', 'email', 'password', 'planType'];
        const missingFields = requiredFields.filter(field => !requestBody[field] || (typeof requestBody[field] === 'string' && requestBody[field].trim() === ''));
        
        // Check gymId separately since it might not be a string
        if (!requestBody.gymId) {
          missingFields.push('gymId');
        }
        
        if (missingFields.length > 0) {
          const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
      }
      
      if (userType === 'trainer') {
        // Debug: Log user object and gymId for trainer creation
        console.log('Current user object:', user);
        console.log('User gymId:', user?.gymId);
        console.log('User _id:', user?._id);
        console.log('Final gymId being used:', requestBody.gymId);
        
        const requiredFields = ['name', 'email', 'password'];
        const missingFields = requiredFields.filter(field => !requestBody[field] || (typeof requestBody[field] === 'string' && requestBody[field].trim() === ''));
        
        // Check gymId separately since it might not be a string
        if (!requestBody.gymId) {
          missingFields.push('gymId');
        }
        
        if (missingFields.length > 0) {
          const errorMessage = `Missing required fields: ${missingFields.join(', ')}`;
          console.error('Validation error:', errorMessage);
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, message: errorMessage };
        }
      }
      
      console.log('Creating user with endpoint:', endpoint);
      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', data);
      
      if (!response.ok) {
        const errorMessage = data.message || data.error || `HTTP ${response.status}: User creation failed`;
        console.error('User creation failed:', {
          status: response.status,
          statusText: response.statusText,
          data: data,
          requestBody: requestBody
        });
        setError(errorMessage);
        return { success: false, message: errorMessage, details: data };
      }
      
      await fetchUsers();
      
      if (userType === 'member' && userData.planType === 'Premium Member') {
        console.log('Premium member added successfully');
      }
      
      return { 
        success: true, 
        message: `${userType.charAt(0).toUpperCase() + userType.slice(1)} created successfully`,
        user: data.data.user
      };
    } catch (err) {
      console.error('User creation error:', err);
      setError('User creation failed. Please try again.');
      return { success: false, message: 'User creation failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };
  
  const createGymOwner = async (userData) => {
    return createUser(userData, 'gym-owner');
  };
  
  const createTrainer = async (userData) => {
    return createUser(userData, 'trainer');
  };
  
  const createMember = async (userData) => {
    return createUser(userData, 'member');
  };
  
  const updateMember = async (memberData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!memberData.id) {
        setError('Member ID is required');
        return { success: false, message: 'Member ID is required' };
      }
      
      const response = await fetch(`${API_URL}/auth/users/${memberData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(memberData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Member update failed');
        return { success: false, message: data.message || 'Member update failed' };
      }
      
      await fetchUsers();
      
      return { 
        success: true, 
        message: 'Member updated successfully',
        user: data.data.user
      };
    } catch (err) {
      console.error('Member update error:', err);
      setError('Member update failed. Please try again.');
      return { success: false, message: 'Member update failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };
  
  const deleteMember = async (memberId) => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!memberId) {
        setError('Member ID is required');
        return { success: false, message: 'Member ID is required' };
      }
      
      let response = await fetch(`${API_URL}/auth/users/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log('First delete endpoint failed, trying users endpoint...');
        response = await fetch(`${API_URL}/users/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      let data = {};
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (err) {
          console.error('Error parsing response:', err);
          data = { success: response.ok, message: response.ok ? 'Operation successful' : 'Operation failed' };
        }
      } else {
        data = { success: true, message: 'Member deleted successfully' };
      }
      
      if (!response.ok) {
        setError(data.message || 'Member deletion failed');
        return { success: false, message: data.message || 'Member deletion failed' };
      }
      
      await fetchUsers();
      
      return { 
        success: true, 
        message: 'Member deleted successfully'
      };
    } catch (err) {
      console.error('Member deletion error:', err);
      setError('Member deletion failed. Please try again.');
      return { success: false, message: 'Member deletion failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Use the new API client with refresh token support
      const data = await apiClient.login({
        email: credentials.email,
        password: credentials.password,
      });
      
      if (!data || !data.data || !data.data.user) {
        const errorMessage = 'Invalid response from server';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      let userData = data.data.user;
      
      if (userData.role === 'member') {
        if (userData.membershipEndDate) {
          const endDate = new Date(userData.membershipEndDate);
          const today = new Date();
          const diffTime = endDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          userData.membershipDaysRemaining = diffDays > 0 ? diffDays : 0;
          userData.membershipStatus = diffDays > 0 ? 'Active' : 'Expired';
          
          console.log('Member login - calculated membership data:', {
            membershipEndDate: userData.membershipEndDate,
            membershipDaysRemaining: userData.membershipDaysRemaining,
            membershipStatus: userData.membershipStatus
          });
        } else {
          userData.membershipDaysRemaining = 0;
          userData.membershipStatus = 'Unknown';
        }
      }
      
      if (userData.role === 'gym-owner' && !userData.gymId) {
        console.warn('Gym ID missing for gym owner, using _id as fallback');
        userData.gymId = userData._id;
      }
      
      // Verify tokens are present
      const accessToken = data.accessToken || data.token;
      const refreshToken = data.refreshToken;
      
      if (!accessToken) {
        const errorMessage = 'No authentication token received from server';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      // Set state first
      setUser(userData);
      setToken(accessToken);
      
      // Then store in localStorage with error handling
      try {
        setStorageItem(USER_STORAGE_KEY, userData);
        setStorageItem(TOKEN_STORAGE_KEY, accessToken); // Legacy token
        setStorageItem(ACCESS_TOKEN_KEY, accessToken);
        if (refreshToken) {
          setStorageItem(REFRESH_TOKEN_KEY, refreshToken);
        }
        
        // Verify storage was successful
        const storedToken = getStorageItem(TOKEN_STORAGE_KEY, null);
        const storedUser = getStorageItem(USER_STORAGE_KEY, null);
        
        if (!storedToken || !storedUser) {
          console.error('Failed to store authentication data in localStorage');
          // Don't fail the login, but log the issue
        } else {
          console.log('Authentication data successfully stored');
          // Debug the stored data
          debugLocalStorage();
        }
      } catch (storageError) {
        console.error('Error storing authentication data:', storageError);
        // Don't fail the login, but log the issue
      }
      
      if (userData.role === 'gym-owner') {
        try {
          const subscriptionActive = await checkSubscriptionStatus(userData._id, accessToken);
          if (!subscriptionActive) {
            return { 
              success: true, 
              message: 'Login successful', 
              requiresPayment: true,
              subscription: subscription
            };
          }
        } catch (subscriptionError) {
          console.error('Subscription check failed:', subscriptionError);
        }
      }
      
      return { success: true, message: 'Login successful' };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Call server logout endpoint to invalidate refresh token
      await apiClient.logout();
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always clear local data regardless of server response
      clearAuthData();
    }
  };

  const userRole = user?.role || "";

  const fetchUsers = useCallback(async (forceRefresh = false) => {
    if (!token) return [];
    
    console.log('Fetching users, force refresh:', forceRefresh);
    
    const cacheAge = Date.now() - (window.lastUsersFetchTime || 0);
    if (!forceRefresh && users.length > 0 && cacheAge < 30000) {
      console.log('Using cached users, cache age:', cacheAge, 'ms');
      return users;
    }
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        cache: 'default'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        window.lastUsersFetchTime = Date.now();
        return data.data.users;
      } else if (response.status === 401) {
        clearAuthData();
      } else if (response.status === 403) {
        console.log('User does not have permission to view users');
        return [];
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    
    return [];
  }, [token, users, clearAuthData]);

  const updateCurrentUser = (updatedUser) => {
    if (!updatedUser) return;
    
    setUser(updatedUser);
    setStorageItem(USER_STORAGE_KEY, updatedUser);
  };
  
  const checkMembershipExpiration = useCallback((user) => {
    if (!user || user.role !== 'member') return false;
    
    if (!user.membershipEndDate) {
      updateCurrentUser({
        ...user,
        membershipStatus: 'Active',
        membershipDaysRemaining: 365
      });
      return false;
    }
    
    const endDate = new Date(user.membershipEndDate);
    const today = new Date();
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays >= 0) {
      updateCurrentUser({
        ...user,
        membershipStatus: 'Active',
        membershipDaysRemaining: diffDays
      });
      console.log(`Member has ${diffDays} days remaining. Setting status to Active.`);
      return false;
    } else {
      updateCurrentUser({
        ...user,
        membershipStatus: 'Expired',
        membershipDaysRemaining: 0
      });
      console.log('Member membership has expired. Setting status to Expired.');
      return true;
    }
  }, []);

  const authFetch = async (url, options = {}) => {
    // Enhanced token checking and initialization
    let currentToken = apiClient.getAccessToken();
    
    // If no token in API client, try to initialize from storage
    if (!currentToken) {
      console.log('No token in API client, checking storage...');
      const { token: storedToken, accessToken, refreshToken } = debugLocalStorage();
      
      if (storedToken || accessToken) {
        console.log('Found tokens in storage, initializing API client');
        currentToken = storedToken || accessToken;
        apiClient.setTokens(currentToken, refreshToken);
      } else if (token) {
        // Fallback to context token
        console.log('Using context token as fallback');
        currentToken = token;
        apiClient.setTokens(token, null);
      } else {
        console.error('AuthFetch: No authentication token found');
        console.error('Storage check:', { storedToken: !!storedToken, accessToken: !!accessToken });
        console.error('Context state:', { contextToken: !!token, user: !!user });
        throw new Error('Authentication required - please log in again');
      }
    }
    
    try {
      console.log(`Making ${options.method || 'GET'} request to: ${url}`);
      console.log(`User role: ${user?.role}, User ID: ${user?._id}`);
      
      // Use the API client which handles token refresh automatically
      let response;
      const { method = 'GET', body, ...restOptions } = options;
      
      // Remove the 'signal' and 'timeout' as API client handles these
      const cleanOptions = { ...restOptions };
      delete cleanOptions.signal;
      delete cleanOptions.timeout;
      
      switch (method.toUpperCase()) {
        case 'POST':
          response = await apiClient.post(url, body ? JSON.parse(body) : undefined, cleanOptions);
          break;
        case 'PUT':
          response = await apiClient.put(url, body ? JSON.parse(body) : undefined, cleanOptions);
          break;
        case 'PATCH':
          response = await apiClient.patch(url, body ? JSON.parse(body) : undefined, cleanOptions);
          break;
        case 'DELETE':
          response = await apiClient.delete(url, cleanOptions);
          break;
        default:
          response = await apiClient.get(url, cleanOptions);
      }
      
      // Transform axios response to match expected format
      const responseData = response.data;
      
      return {
        success: responseData.status === 'success',
        status: responseData.status || 'success',
        message: responseData.message || 'Request completed successfully',
        data: responseData.data || responseData
      };
      
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        const errorData = error.response.data;
        
        if (statusCode === 401) {
          console.error('🚨 401 Authentication Error:', errorData?.message);
          console.log('Clearing all auth data and redirecting to login...');
          
          // Immediate cleanup of all authentication data
          try {
            // Clear API client tokens
            apiClient.clearTokens();
            
            // Clear all localStorage auth data
            const authKeys = ['gymflow_access_token', 'gymflow_refresh_token', 'gymflow_token', 'gymflow_user'];
            authKeys.forEach(key => {
              localStorage.removeItem(key);
              console.log(`✅ Cleared ${key}`);
            });
            
            // Clear context state
            setToken(null);
            setUser(null);
            
            // Force redirect to login after short delay
            setTimeout(() => {
              console.log('🔄 Redirecting to login page...');
              window.location.href = '/login?expired=true&error=401';
            }, 1000);
            
          } catch (clearError) {
            console.error('❌ Error during auth cleanup:', clearError);
            // Ultimate fallback - force page refresh
            setTimeout(() => window.location.href = '/login', 1500);
          }
          
          return {
            success: false,
            status: 'error',
            message: 'Session expired. Redirecting to login...',
            data: null
          };
        }
        
        if (statusCode === 403) {
          console.error('Permission denied for request:', url);
          return {
            success: false,
            status: 'error',
          message: 'Permission denied',
          data: null
        };
        
        return {
          success: false,
          status: 'error',
          message: errorData?.message || 'Server error occurred',
          data: errorData?.data || null
        };
      }
      
      // Handle network or other errors
      console.error('Error in authFetch:', error.message);
      return {
        success: false,
        status: 'error',
        message: error.message || 'An error occurred during the request',
        data: null
      };
    }
  };

  useEffect(() => {
    const handleAttendanceMarked = (event) => {
      console.log('Attendance marked, refreshing user data');
      fetchUsers(true);
    };

    window.addEventListener('attendanceMarked', handleAttendanceMarked);
    
    return () => {
      window.removeEventListener('attendanceMarked', handleAttendanceMarked);
    };
  }, [fetchUsers]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      isLoading, 
      error, 
      users,
      token,
      subscription,
      notifications,
      unreadNotificationCount,
      login, 
      logout,
      fetchUsers,
      authFetch,
      updateCurrentUser,
      createGymOwner,
      createTrainer,
      createMember,
      updateMember,
      deleteMember,
      checkSubscriptionStatus,
      fetchNotifications,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      isAuthenticated: !!user,
      isSuperAdmin: userRole === 'super-admin',
      isGymOwner: userRole === 'gym-owner',
      isTrainer: userRole === 'trainer',
      isMember: userRole === 'member',
      hasActiveSubscription: subscription?.hasActiveSubscription || !subscription?.requiresSubscription,
      subscriptionDaysRemaining: subscription?.daysRemaining || 0,
      requiresSubscription: subscription?.requiresSubscription || false
    }}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} Auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};