import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppSettings, forceRefreshSettings } from '@/lib/settings';
import { validateAndSecureUrl } from '@/utils/urlValidator';
import { debugAuthState, checkTokenHealth } from '@/utils/authDebug';

/**
 * Custom hook for managing gym branding and app settings
 * This hook ensures that gym branding is applied to all roles (gym-owner, trainer, member)
 */
export const useGymBranding = () => {
  const { user, userRole, isGymOwner, authFetch } = useAuth();
  const [gymSettings, setGymSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get gym ID - for gym owners it's their user ID, for trainers/members it's their gymId or createdBy
  const getGymId = () => {
    if (isGymOwner) {
      return user?._id;
    } else if (userRole === 'trainer' || userRole === 'member') {
      // Try gymId first, then createdBy as fallback
      return user?.gymId || user?.createdBy;
    }
    return null;
  };

  // Fetch gym settings from server
  const fetchGymSettings = async () => {
    if (!user || !authFetch) return;

    setLoading(true);
    setError(null);

    try {
      const gymId = getGymId();
      if (!gymId) {
        console.log('No gym ID found for user:', { user, userRole });
        setError('No gym ID found');
        setLoading(false);
        return;
      }
      
      console.log('Fetching gym settings for:', { gymId, userRole });
      
      // Debug authentication state before making requests
      console.log('🔍 Auth state before settings request:');
      debugAuthState();
      checkTokenHealth();

      // Always try user-specific settings first as they're more reliable
      let primaryEndpoint = `/settings/user/${user._id}`;
      let fallbackEndpoint = null;
      
      // For gym owners, also try gym endpoint as fallback
      if (isGymOwner) {
        fallbackEndpoint = `/settings/gym/${gymId}`;
      } 
      // For trainers and members, try gym settings as fallback
      else if (userRole === 'trainer' || userRole === 'member') {
        fallbackEndpoint = `/settings/gym/${gymId}`;
      }
      // For super admin, try global settings as fallback
      else if (userRole === 'super-admin') {
        fallbackEndpoint = '/settings';
      }

      let response;
      let usedEndpoint = primaryEndpoint;
      let authError = false;
      
      try {
        console.log(`Attempting to fetch settings from: ${primaryEndpoint}`);
        response = await authFetch(primaryEndpoint);
        
        // If the primary endpoint fails with auth error, don't try fallback
        if (!response.success && response.message?.includes('Settings access denied')) {
          console.log('Settings access denied, using cached settings only');
          authError = true;
        }
        // If primary endpoint fails for other reasons and we have a fallback, try it
        else if (!response.success && fallbackEndpoint && !authError) {
          console.log(`Primary endpoint failed, trying fallback: ${fallbackEndpoint}`);
          try {
            response = await authFetch(fallbackEndpoint);
            usedEndpoint = fallbackEndpoint;
          } catch (fallbackError) {
            console.log(`Fallback endpoint failed:`, fallbackError.message);
            if (fallbackError.message?.includes('Settings access denied')) {
              authError = true;
            }
          }
        }
        
      } catch (error) {
        console.log(`Error with ${primaryEndpoint}:`, error.message);
        
        // Check if it's an auth error
        if (error.message?.includes('Settings access denied') || 
            error.message?.includes('Authentication required') ||
            error.message?.includes('Session expired')) {
          console.log('Authentication error detected, using cached settings');
          authError = true;
        } else if (fallbackEndpoint && !authError) {
          try {
            console.log(`Trying fallback endpoint: ${fallbackEndpoint}`);
            response = await authFetch(fallbackEndpoint);
            usedEndpoint = fallbackEndpoint;
          } catch (fallbackError) {
            console.log(`Fallback endpoint also failed:`, fallbackError.message);
            if (fallbackError.message?.includes('Settings access denied')) {
              authError = true;
            } else {
              throw fallbackError;
            }
          }
        } else {
          throw error;
        }
      }
      
      // If we got a successful response, use it
      if (response && response.success && response.data?.settings) {
        console.log(`Settings loaded successfully from ${usedEndpoint}`);
        setGymSettings(response.data.settings);
        
        // Store in localStorage for offline access
        const storageKey = `gym_branding_${gymId}`;
        localStorage.setItem(storageKey, JSON.stringify(response.data.settings));
        console.log(`Settings cached with key: ${storageKey}`);
      } else {
        // If no successful response or auth error, use cached settings
        console.log('No successful response, checking localStorage cache');
        const storageKey = `gym_branding_${gymId}`;
        const cachedSettings = localStorage.getItem(storageKey);
        if (cachedSettings) {
          console.log('Using cached settings from localStorage');
          setGymSettings(JSON.parse(cachedSettings));
          
          // If it was an auth error, don't show error message
          if (authError) {
            console.log('Auth error occurred, but using cached settings successfully');
          }
        } else {
          console.log('No cached settings found');
          if (!authError) {
            setError('No settings found');
          }
        }
      }
    } catch (err) {
      console.error('Error fetching gym settings:', err);
      
      // Always try to use cached settings as final fallback
      const gymId = getGymId();
      if (gymId) {
        const storageKey = `gym_branding_${gymId}`;
        const cachedSettings = localStorage.getItem(storageKey);
        if (cachedSettings) {
          console.log('Using cached settings as final fallback');
          setGymSettings(JSON.parse(cachedSettings));
          setError(null); // Clear error if we found cached settings
        } else {
          // Only set error if we don't have cached settings and it's not an auth error
          if (!err.message?.includes('Settings access denied') && 
              !err.message?.includes('Authentication required') &&
              !err.message?.includes('Session expired')) {
            setError(err.message);
          } else {
            console.log('Auth error with no cached settings - using defaults');
          }
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Get app name from settings
  const getAppName = () => {
    if (gymSettings?.global?.appName) {
      return gymSettings.global.appName;
    }
    
    // Try to get from localStorage as fallback
    const gymId = getGymId();
    if (gymId) {
      const storageKey = `gym_branding_${gymId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsedSettings = JSON.parse(cached);
          if (parsedSettings?.global?.appName) {
            return parsedSettings.global.appName;
          }
        } catch (e) {
          console.error('Error parsing cached settings:', e);
        }
      }
    }
    
    return 'GymFlow'; // Default fallback
  };

  // Get app logo URL from settings
  const getAppLogo = () => {
    if (gymSettings?.branding?.logoUrl) {
      return validateAndSecureUrl(gymSettings.branding.logoUrl);
    }
    
    // Try to get from localStorage as fallback
    const gymId = getGymId();
    if (gymId) {
      const storageKey = `gym_branding_${gymId}`;
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsedSettings = JSON.parse(cached);
          if (parsedSettings?.branding?.logoUrl) {
            return validateAndSecureUrl(parsedSettings.branding.logoUrl);
          }
        } catch (e) {
          console.error('Error parsing cached settings:', e);
        }
      }
    }
    
    return null; // Will use default icon
  };

  // Get app favicon URL from settings
  const getFavicon = () => {
    if (gymSettings?.branding?.faviconUrl) {
      return validateAndSecureUrl(gymSettings.branding.faviconUrl);
    }
    return null; // Will use default favicon
  };

  // Get gym subtitle or description
  const getAppSubtitle = () => {
    if (gymSettings?.global?.appSubtitle) {
      return gymSettings.global.appSubtitle;
    }
    return 'Gym Management Platform'; // Default fallback
  };

  // Get primary color
  const getPrimaryColor = () => {
    if (gymSettings?.branding?.primaryColor) {
      return gymSettings.branding.primaryColor;
    }
    return '#3B82F6'; // Default blue
  };

  // Get secondary color
  const getSecondaryColor = () => {
    if (gymSettings?.branding?.secondaryColor) {
      return gymSettings.branding.secondaryColor;
    }
    return '#8B5CF6'; // Default purple
  };

  // Check if branding is available
  const hasBranding = () => {
    return gymSettings?.branding && (
      gymSettings.branding.logoUrl || 
      gymSettings.branding.primaryColor || 
      gymSettings.branding.secondaryColor ||
      gymSettings.global?.appName !== 'GymFlow'
    );
  };

  // Fetch settings on mount and user changes
  useEffect(() => {
    if (user) {
      fetchGymSettings();
    }
  }, [user, userRole]);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsApplied = (event) => {
      if (event.detail?.userId === user?._id || event.detail?.gymId === getGymId()) {
        fetchGymSettings();
      }
    };

    window.addEventListener('settingsApplied', handleSettingsApplied);
    return () => window.removeEventListener('settingsApplied', handleSettingsApplied);
  }, [user]);

  // Force refresh settings and clear all caches
  const forceRefresh = async () => {
    const freshSettings = await forceRefreshSettings(user?._id, userRole, getGymId(), authFetch);
    if (freshSettings) {
      setGymSettings(freshSettings);
    }
  };

  // Debug function for authentication issues
  const debugAuth = () => {
    console.log('🔍 Gym Branding Hook Debug:');
    debugAuthState();
    checkTokenHealth();
    console.log('Current gym settings:', gymSettings);
    console.log('Hook state:', { loading, error, user: !!user, authFetch: !!authFetch });
  };

  return {
    gymSettings,
    loading,
    error,
    getAppName,
    getAppLogo,
    getFavicon,
    getAppSubtitle,
    getPrimaryColor,
    getSecondaryColor,
    hasBranding,
    refetch: fetchGymSettings,
    forceRefresh,
    debugAuth
  };
};