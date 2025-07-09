import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem, removeStorageItem } from "@/lib/storage.js";

// Local storage keys
const USER_STORAGE_KEY = 'gymflow_user';
const TOKEN_STORAGE_KEY = 'gymflow_token';

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
  }, []);

  // Verify token and load user data on initial render
  useEffect(() => {
    let isMounted = true; // Flag to prevent state updates if component is unmounted
    
    const initializeAuth = async () => {
      try {
        const storedToken = getStorageItem(TOKEN_STORAGE_KEY, null);
        
        if (!storedToken) {
          if (isMounted) {
            setIsLoading(false);
          }
          return;
        }
        
        if (isMounted) {
          setToken(storedToken);
        }
        
        // Verify token with backend (optional but recommended)
        try {
          const response = await fetch(`${API_URL}/auth/verify-token`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok && isMounted) {
            // Token is valid, load user data
            const storedUser = getStorageItem(USER_STORAGE_KEY, null);
            if (storedUser) {
              setUser(storedUser);
              
              // If user is a gym owner, check subscription status
              if (storedUser.role === 'gym-owner') {
                try {
                  await checkSubscriptionStatus(storedUser._id, storedToken);
                } catch (subscriptionError) {
                  console.error('Subscription check failed during initialization:', subscriptionError);
                }
              }
              
              // PERFORMANCE OPTIMIZATION: Skip loading notifications to reduce API calls
              // await fetchNotifications(storedUser._id, storedToken);
            }
          } else if (isMounted) {
            // Token is invalid or expired, clear auth data
            clearAuthData();
          }
        } catch (err) {
          // If verification endpoint doesn't exist, fallback to stored user
          console.error('Token verification failed:', err);
          if (isMounted) {
            const storedUser = getStorageItem(USER_STORAGE_KEY, null);
            if (storedUser) {
              setUser(storedUser);
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
    
    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [clearAuthData]);
  
  // Check subscription status with caching
  const checkSubscriptionStatus = useCallback(async (userId, authToken, forceRefresh = false) => {
    // If we have subscription data and it's not a forced refresh, use the cached data
    // Only refresh subscription data every 30 minutes unless forced
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
    const lastCheckTime = window.lastSubscriptionCheckTime || 0;
    const shouldUseCache = !forceRefresh && 
                          subscription && 
                          (Date.now() - lastCheckTime < CACHE_DURATION);
    
    if (shouldUseCache) {
      return subscription.hasActiveSubscription || !subscription.requiresSubscription;
    }
    
    try {
      // Create an AbortController for timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
        
        // Store last check timestamp
        window.lastSubscriptionCheckTime = Date.now();
        
        // If subscription has expired, log out the user
        if (data.data.requiresSubscription && !data.data.hasActiveSubscription) {
          // Don't log out immediately, but set subscription status
          // This will be used to show a payment required screen
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
  
  // We'll define checkMembershipExpiration after updateCurrentUser is defined
  
  // Fetch notifications with caching - OPTIMIZED VERSION
  const fetchNotifications = useCallback(async (userId, authToken, unreadOnly = false, forceRefresh = false) => {
    // PERFORMANCE OPTIMIZATION: Return cached data immediately
    // This function is temporarily modified to reduce API calls and system load
    return { 
      notifications: notifications || [], 
      unreadCount: unreadNotificationCount || 0 
    };
    
    // The original implementation is commented out to prevent excessive API calls
    /*
    // Cache notifications for 5 minutes unless forced refresh
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
    const lastFetchTime = window.lastNotificationsFetchTime || 0;
    const shouldUseCache = !forceRefresh && 
                          notifications.length > 0 && 
                          (Date.now() - lastFetchTime < CACHE_DURATION);
    
    if (shouldUseCache) {
      return { notifications, unreadCount: unreadNotificationCount };
    }
    
    try {
      // Fetch notifications
      const response = await fetch(
        `${API_URL}/notifications/user/${userId}?unreadOnly=${unreadOnly}`, 
        {
          headers: {
            'Authorization': `Bearer ${authToken || token}`
          },
          cache: 'default'
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
        
        // Store last fetch timestamp
        window.lastNotificationsFetchTime = Date.now();
      }
      
      // Fetch unread count - only if we're not already getting unread only
      if (!unreadOnly) {
        const countResponse = await fetch(
          `${API_URL}/notifications/user/${userId}/unread-count`, 
          {
            headers: {
              'Authorization': `Bearer ${authToken || token}`
            },
            cache: 'default'
          }
        );
        
        if (countResponse.ok) {
          const countData = await countResponse.json();
          setUnreadNotificationCount(countData.data.unreadCount);
        }
      }
      
      return { 
        notifications: notifications, 
        unreadCount: unreadNotificationCount 
      };
    } catch (err) {
      // Silently fail without logging
      return { notifications, unreadCount: unreadNotificationCount };
    }
    */
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
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification._id === notificationId 
              ? { ...notification, read: true } 
              : notification
          )
        );
        
        // Update unread count
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
        // Update local state
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
    
    // Validate required fields
    if (!userData.email || !userData.password || !userData.name) {
      setError('All fields are required');
      setIsLoading(false);
      return { success: false, message: 'All fields are required' };
    }
    
    // Validate password length
    if (userData.password.length < 8) {
      setError('Password must be at least 8 characters');
      setIsLoading(false);
      return { success: false, message: 'Password must be at least 8 characters' };
    }
    
    try {
      // Determine which endpoint to use based on user type
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
      
      // Prepare request body based on user type
      let requestBody = {
        name: userData.name,
        email: userData.email,
        password: userData.password
      };
      
      // Add additional fields for gym owner
      if (userType === 'gym-owner') {
        requestBody = {
          ...requestBody,
          phone: userData.phone || '',
          whatsapp: userData.whatsapp || '',
          address: userData.address || '',
          totalMembers: userData.totalMembers || 0,
          gymName: userData.gymName || userData.name + "'s Gym", // Default gym name if not provided
          // Store subscription plan info for reference
          subscriptionPlan: userData.subscriptionPlan || '',
          paymentMethod: userData.paymentMethod || 'credit_card'
        };
      }
      
      // Add additional fields for trainer
      if (userType === 'trainer') {
        // Determine gymId - for gym owners it's their user ID, for others it's their gymId
        const gymId = user?.role === 'gym-owner' ? user._id : user?.gymId;
        
        if (!gymId) {
          setError('Unable to determine gym ID. Please ensure you are logged in properly.');
          setIsLoading(false);
          return { success: false, message: 'Unable to determine gym ID. Please ensure you are logged in properly.' };
        }
        
        requestBody = {
          ...requestBody,
          gymId: gymId, // Add the gymId field for trainer association
          phone: userData.phone || '',
          whatsapp: userData.whatsapp || '',
          address: userData.address || '',
          // Map salary field to trainerFee for backend compatibility
          trainerFee: parseInt(userData.salary || userData.trainerFee) || null // Don't set default, let backend handle it
        };
      }
      
      // Add additional fields for member
      if (userType === 'member') {
        // Calculate membership end date based on duration (in months)
        const membershipDuration = parseInt(userData.membershipDuration || '1');
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + membershipDuration);
        
        // Determine gymId - for gym owners it's their user ID, for others it's their gymId
        const gymId = user?.role === 'gym-owner' ? user._id : user?.gymId;
        console.log('🔧 MEMBER CREATION - gymId calculation:', {
          userRole: user?.role,
          userId: user?._id,
          userGymId: user?.gymId,
          calculatedGymId: gymId
        });
        
        if (!gymId) {
          setError('Unable to determine gym ID. Please ensure you are logged in properly.');
          setIsLoading(false);
          return { success: false, message: 'Unable to determine gym ID. Please ensure you are logged in properly.' };
        }
        
        requestBody = {
          ...requestBody,
          gymId: gymId, // Add the required gymId field
          phone: userData.phone || '',
          gender: userData.gender || 'Male',
          dob: userData.dob || '',
          goal: userData.goal || 'weight-loss',
          planType: userData.planType || 'Basic',
          address: userData.address || '',
          whatsapp: userData.whatsapp || '',
          height: userData.height || '',
          weight: userData.weight || '',
          emergencyContact: userData.emergencyContact || '',
          medicalConditions: userData.medicalConditions || '',
          assignedTrainer: userData.assignedTrainer || null,
          notes: userData.fitnessGoalDescription || '',
          // Membership details
          membershipStatus: 'Active',
          membershipStartDate: startDate.toISOString(),
          membershipEndDate: endDate.toISOString(),
          membershipDuration: membershipDuration.toString(),
          membershipType: userData.planType || 'Basic'
        };
      }
      
      // Call the backend API to create user
      console.log('Making API call to create user:', {
        endpoint,
        userType,
        currentUser: user,
        requestBody: { ...requestBody, password: '[HIDDEN]' }
      });
      
      // Additional debugging for member creation
      if (userType === 'member') {
        console.log('🔍 Member creation debug:', {
          userRole: user?.role,
          userId: user?._id,
          userGymId: user?.gymId,
          calculatedGymId: user?.role === 'gym-owner' ? user._id : user?.gymId,
          hasGymIdInRequest: !!requestBody.gymId
        });
      }
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log('API Response status:', response.status);
      console.log('API Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('API Response data:', data);
      
      if (!response.ok) {
        console.error('User creation failed:', {
          status: response.status,
          statusText: response.statusText,
          data
        });
        setError(data.message || 'User creation failed');
        return { success: false, message: data.message || 'User creation failed' };
      }
      
      // Refresh the users list
      await fetchUsers();
      
      // If this is a premium member, update the premium count in stats
      if (userType === 'member' && userData.planType === 'Premium Member') {
        // The stats will be automatically updated when fetchUsers is called
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
  
  // Create a gym owner (Super Admin only)
  const createGymOwner = async (userData) => {
    return createUser(userData, 'gym-owner');
  };
  
  // Create a trainer (Gym Owner or Super Admin)
  const createTrainer = async (userData) => {
    return createUser(userData, 'trainer');
  };
  
  // Create a member (Gym Owner or Super Admin)
  const createMember = async (userData) => {
    return createUser(userData, 'member');
  };
  
  // Update a member
  const updateMember = async (memberData) => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!memberData.id) {
        setError('Member ID is required');
        return { success: false, message: 'Member ID is required' };
      }
      
      // Call the backend API to update the member
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
      
      // Refresh the users list
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
  
  // Delete a member
  const deleteMember = async (memberId) => {
    setError(null);
    setIsLoading(true);
    
    try {
      if (!memberId) {
        setError('Member ID is required');
        return { success: false, message: 'Member ID is required' };
      }
      
      // First try the auth endpoint
      let response = await fetch(`${API_URL}/auth/users/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      // If the first endpoint fails, try the users endpoint
      if (!response.ok) {
        console.log('First delete endpoint failed, trying users endpoint...');
        response = await fetch(`${API_URL}/users/${memberId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      // For 204 No Content responses, there's no JSON to parse
      let data = {};
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (err) {
          console.error('Error parsing response:', err);
          // If we can't parse the response, create a default response
          data = { success: response.ok, message: response.ok ? 'Operation successful' : 'Operation failed' };
        }
      } else {
        // For 204 responses, create a success response
        data = { success: true, message: 'Member deleted successfully' };
      }
      
      if (!response.ok) {
        setError(data.message || 'Member deletion failed');
        return { success: false, message: data.message || 'Member deletion failed' };
      }
      
      // Refresh the users list
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

  // Login user using the backend API
  const login = async (credentials) => {
    setError(null);
    setIsLoading(true);
    
    try {
      // Call the backend API to login the user
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      
      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        let errorMessage = 'Invalid email or password';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, use default error message
          console.error('Error parsing response:', parseError);
        }
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      const data = await response.json();
      
      // Validate that we have the expected data structure
      if (!data || !data.data || !data.data.user) {
        const errorMessage = 'Invalid response from server';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      }
      
      // Process user data before setting it
      const userData = data.data.user;
      
      // If user is a member, initialize membership data if not present
      if (userData.role === 'member') {
        // Calculate days remaining if membership end date exists
        if (userData.membershipEndDate) {
          const endDate = new Date(userData.membershipEndDate);
          const today = new Date();
          const diffTime = endDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          // Set membership days remaining and status
          userData.membershipDaysRemaining = diffDays > 0 ? diffDays : 0;
          userData.membershipStatus = diffDays > 0 ? 'Active' : 'Expired';
          
          console.log('Member login - calculated membership data:', {
            membershipEndDate: userData.membershipEndDate,
            membershipDaysRemaining: userData.membershipDaysRemaining,
            membershipStatus: userData.membershipStatus
          });
        } else {
          // Default values if no end date
          userData.membershipDaysRemaining = 0;
          userData.membershipStatus = 'Unknown';
        }
      }
      
      // Set the user and token in state
      setUser(userData);
      setToken(data.token);
      
      // Save user and token to localStorage
      setStorageItem(USER_STORAGE_KEY, userData);
      setStorageItem(TOKEN_STORAGE_KEY, data.token);
      
      // If user is a gym owner, check subscription status
      if (data.data.user.role === 'gym-owner') {
        try {
          const subscriptionActive = await checkSubscriptionStatus(data.data.user._id, data.token);
          
          // If subscription has expired, return a special status
          if (!subscriptionActive) {
            return { 
              success: true, 
              message: 'Login successful', 
              requiresPayment: true,
              subscription: subscription
            };
          }
        } catch (subscriptionError) {
          // Don't fail login if subscription check fails
          console.error('Subscription check failed:', subscriptionError);
        }
      }
      
      // PERFORMANCE OPTIMIZATION: Skip loading notifications to reduce API calls
      // await fetchNotifications(data.data.user._id, data.token);
      
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

  // Logout user
  const logout = () => {
    clearAuthData();
  };

  const userRole = user?.role || "";

  // Fetch users from backend (for admin purposes) with caching
  const fetchUsers = useCallback(async (forceRefresh = false) => {
    if (!token) return [];
    
    console.log('Fetching users, force refresh:', forceRefresh);
    
    // Use cached users if available and not forcing refresh
    // Only use cache if it's less than 30 seconds old
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
        // Add cache control headers to leverage browser caching
        cache: 'default'
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
        
        // Store last fetch timestamp
        window.lastUsersFetchTime = Date.now();
        
        return data.data.users;
      } else if (response.status === 401) {
        // Token expired or invalid
        clearAuthData();
      } else if (response.status === 403) {
        // User doesn't have permission
        console.log('User does not have permission to view users');
        return [];
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
    
    return [];
  }, [token, users, clearAuthData]);

  // Update current user data
  const updateCurrentUser = (updatedUser) => {
    if (!updatedUser) return;
    
    // Update user in state
    setUser(updatedUser);
    
    // Update user in local storage
    setStorageItem(USER_STORAGE_KEY, updatedUser);
  };
  
  // Check if member's membership has expired - IMPROVED LOGIC
  const checkMembershipExpiration = useCallback((user) => {
    if (!user || user.role !== 'member') return false;
    
    // If no membership end date, assume membership is active and set days to a high number
    if (!user.membershipEndDate) {
      updateCurrentUser({
        ...user,
        membershipStatus: 'Active',
        membershipDaysRemaining: 365 // Default to a year if no end date
      });
      return false;
    }
    
    // Compare end date with current date
    const endDate = new Date(user.membershipEndDate);
    const today = new Date();
    
    // Calculate days remaining
    const diffTime = endDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Update user with days remaining
    if (diffDays >= 0) {
      // Not expired - update days remaining and ensure status is Active
      updateCurrentUser({
        ...user,
        membershipStatus: 'Active',
        membershipDaysRemaining: diffDays
      });
      console.log(`Member has ${diffDays} days remaining. Setting status to Active.`);
      return false; // Not expired
    } else {
      // Expired - set days to 0 and status to Expired
      updateCurrentUser({
        ...user,
        membershipStatus: 'Expired',
        membershipDaysRemaining: 0
      });
      console.log('Member membership has expired. Setting status to Expired.');
      return true; // Expired
    }
  }, []);

  // Create a reusable authenticated fetch function
  const authFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Add content-type header if not provided and method is POST, PUT or PATCH
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    if ((options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000); // 15 second default timeout
    
    const authOptions = {
      ...options,
      headers,
      signal: controller.signal
    };
    
    // Ensure the URL has the API_URL prefix if it doesn't start with http
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    try {
      console.log(`Making ${options.method || 'GET'} request to: ${fullUrl}`);
      console.log(`User role: ${userRole}, User ID: ${user?._id}`);
      const response = await fetch(fullUrl, authOptions);
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        // Token expired or invalid
        clearAuthData();
        throw new Error('Authentication expired. Please login again.');
      }
      
      if (response.status === 403) {
        // Permission denied - return a structured error response
        console.error('Permission denied for request:', fullUrl);
        return {
          success: false,
          status: 'error',
          message: 'Permission denied',
          data: null
        };
      }
      
      if (response.status === 404) {
        console.error('Resource not found:', fullUrl);
        return {
          success: false,
          status: 'error',
          message: 'Resource not found',
          data: null
        };
      }
      
      if (response.status === 500) {
        console.error('Server error (500):', fullUrl);
        // Try to get the error message from the response
        try {
          const errorData = await response.json();
          console.error('Server error details:', errorData);
          return {
            success: false,
            status: 'error',
            message: errorData.message || 'Internal server error',
            data: null
          };
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
          return {
            success: false,
            status: 'error',
            message: 'Internal server error',
            data: null
          };
        }
      }
      
      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        // Parse JSON response
        const data = await response.json();
        return data;
      } else {
        // Handle non-JSON responses
        const text = await response.text();
        console.error('Non-JSON response received:', text.substring(0, 100) + '...');
        return {
          success: false,
          status: 'error',
          message: 'Invalid response format from server',
          data: null
        };
      }
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Request timed out:', fullUrl);
        return {
          success: false,
          status: 'error',
          message: 'Request timed out. Please try again.',
          data: null
        };
      }
      
      console.error('Error in authFetch:', error.message);
      return {
        success: false,
        status: 'error',
        message: error.message || 'An error occurred during the request',
        data: null
      };
    }
  };

  // Add event listener for attendance marking
  useEffect(() => {
    const handleAttendanceMarked = (event) => {
      console.log('Attendance marked, refreshing user data');
      // Refresh users data when attendance is marked
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
      // Helper methods to check user roles
      isSuperAdmin: userRole === 'super-admin',
      isGymOwner: userRole === 'gym-owner',
      isTrainer: userRole === 'trainer',
      isMember: userRole === 'member',
      // Subscription status helpers
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