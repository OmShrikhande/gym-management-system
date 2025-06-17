import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getStorageItem, setStorageItem, removeStorageItem } from "@/lib/storage.js";

// Local storage keys
const USER_STORAGE_KEY = 'gymflow_user';
const TOKEN_STORAGE_KEY = 'gymflow_token';

// API URL
const API_URL = 'http://localhost:8081/api';

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
    const initializeAuth = async () => {
      try {
        const storedToken = getStorageItem(TOKEN_STORAGE_KEY, null);
        
        if (!storedToken) {
          setIsLoading(false);
          return;
        }
        
        setToken(storedToken);
        
        // Verify token with backend (optional but recommended)
        try {
          const response = await fetch(`${API_URL}/auth/verify-token`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          
          if (response.ok) {
            // Token is valid, load user data
            const storedUser = getStorageItem(USER_STORAGE_KEY, null);
            if (storedUser) {
              setUser(storedUser);
              
              // If user is a gym owner, check subscription status
              if (storedUser.role === 'gym-owner') {
                await checkSubscriptionStatus(storedUser._id, storedToken);
              }
              
              // Load notifications
              await fetchNotifications(storedUser._id, storedToken);
            }
          } else {
            // Token is invalid or expired, clear auth data
            console.log('Token invalid or expired, logging out');
            clearAuthData();
          }
        } catch (err) {
          // If verification endpoint doesn't exist, fallback to stored user
          console.log('Token verification failed, using stored user data');
          const storedUser = getStorageItem(USER_STORAGE_KEY, null);
          if (storedUser) {
            setUser(storedUser);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeAuth();
  }, [clearAuthData]);
  
  // Check subscription status
  const checkSubscriptionStatus = async (userId, authToken) => {
    try {
      const response = await fetch(`${API_URL}/subscriptions/status/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken || token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSubscription(data.data);
        
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
      console.error('Error checking subscription status:', err);
      return false;
    }
  };
  
  // Fetch notifications
  const fetchNotifications = async (userId, authToken, unreadOnly = false) => {
    try {
      // Fetch notifications
      const response = await fetch(
        `${API_URL}/notifications/user/${userId}?unreadOnly=${unreadOnly}`, 
        {
          headers: {
            'Authorization': `Bearer ${authToken || token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications);
      }
      
      // Fetch unread count
      const countResponse = await fetch(
        `${API_URL}/notifications/user/${userId}/unread-count`, 
        {
          headers: {
            'Authorization': `Bearer ${authToken || token}`
          }
        }
      );
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setUnreadNotificationCount(countData.data.unreadCount);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };
  
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
    if (userData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return { success: false, message: 'Password must be at least 6 characters' };
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
      
      // Call the backend API to create the user
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'User creation failed');
        return { success: false, message: data.message || 'User creation failed' };
      }
      
      // Refresh the users list
      await fetchUsers();
      
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
      
      // Call the backend API to delete the member
      const response = await fetch(`${API_URL}/auth/users/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
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
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.message || 'Invalid email or password');
        return { success: false, message: data.message || 'Invalid email or password' };
      }
      
      // Set the user and token in state
      setUser(data.data.user);
      setToken(data.token);
      
      // Save user and token to localStorage
      setStorageItem(USER_STORAGE_KEY, data.data.user);
      setStorageItem(TOKEN_STORAGE_KEY, data.token);
      
      // If user is a gym owner, check subscription status
      if (data.data.user.role === 'gym-owner') {
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
      }
      
      // Load notifications
      await fetchNotifications(data.data.user._id, data.token);
      
      return { success: true, message: 'Login successful' };
    } catch (err) {
      console.error('Login error:', err);
      setError('Login failed. Please try again.');
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = () => {
    clearAuthData();
  };

  const userRole = user?.role || "";

  // Fetch users from backend (for admin purposes)
  const fetchUsers = async () => {
    if (!token) return [];
    
    try {
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.data.users);
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
  };

  // Update current user data
  const updateCurrentUser = (updatedUser) => {
    if (!updatedUser) return;
    
    // Update user in state
    setUser(updatedUser);
    
    // Update user in local storage
    setStorageItem(USER_STORAGE_KEY, updatedUser);
  };

  // Create a reusable authenticated fetch function
  const authFetch = async (url, options = {}) => {
    if (!token) {
      throw new Error('Authentication required');
    }
    
    // Add content-type header if not provided and method is POST or PUT
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    if ((options.method === 'POST' || options.method === 'PUT') && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    const authOptions = {
      ...options,
      headers
    };
    
    // Ensure the URL has the API_URL prefix if it doesn't start with http
    const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
    
    try {
      const response = await fetch(fullUrl, authOptions);
      
      if (response.status === 401) {
        // Token expired or invalid
        clearAuthData();
        throw new Error('Authentication expired. Please login again.');
      }
      
      // Parse JSON response
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Auth fetch error:', error);
      return {
        success: false,
        message: error.message || 'An error occurred during the request'
      };
    }
  };

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