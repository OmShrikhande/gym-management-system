import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getAppSettings, forceRefreshSettings } from '@/lib/settings';
import { validateAndSecureUrl } from '@/utils/urlValidator';

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

    // TEMPORARY: Skip branding settings fetch to prevent 401 errors
    console.log('Temporarily skipping branding settings fetch to prevent logout loop');
    setLoading(false);
    return;

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

      let endpoint;
      // For gym owners, get their own settings
      if (isGymOwner) {
        endpoint = `/settings/gym/${gymId}`;
      } 
      // For trainers and members, get their gym's settings
      else if (userRole === 'trainer' || userRole === 'member') {
        endpoint = `/settings/gym/${gymId}`;
      }
      // For super admin, get global settings
      else if (userRole === 'super-admin') {
        endpoint = '/settings';
      }

      if (!endpoint) {
        setError('Invalid user role');
        setLoading(false);
        return;
      }

      let response;
      try {
        response = await authFetch(endpoint);
        
        // If global settings access is denied and we're a super admin, fallback to user-specific
        if (userRole === 'super-admin' && endpoint === '/settings' && response && !response.success && 
            (response.message?.includes('Access denied') || response.message?.includes('Permission denied'))) {
          console.log('Global branding settings access denied, falling back to user-specific settings');
          endpoint = `/settings/user/${user._id}`;
          response = await authFetch(endpoint);
        }
      } catch (error) {
        // Handle permission errors for super admin trying to access global settings
        if (userRole === 'super-admin' && endpoint === '/settings' && 
            (error.message.includes('Permission denied') || error.message.includes('Access denied') || error.message.includes('Unauthorized'))) {
          console.log('Global branding settings access failed, trying user-specific settings');
          endpoint = `/settings/user/${user._id}`;
          response = await authFetch(endpoint);
        } else {
          throw error;
        }
      }
      
      if (response.success && response.data?.settings) {
        setGymSettings(response.data.settings);
        
        // Store in localStorage for offline access
        const storageKey = `gym_branding_${gymId}`;
        localStorage.setItem(storageKey, JSON.stringify(response.data.settings));
      } else {
        // Try to get from localStorage as fallback
        const storageKey = `gym_branding_${gymId}`;
        const cachedSettings = localStorage.getItem(storageKey);
        if (cachedSettings) {
          setGymSettings(JSON.parse(cachedSettings));
        } else {
          setError('No settings found');
        }
      }
    } catch (err) {
      console.error('Error fetching gym settings:', err);
      setError(err.message);
      
      // Try to get from localStorage as fallback
      const gymId = getGymId();
      if (gymId) {
        const storageKey = `gym_branding_${gymId}`;
        const cachedSettings = localStorage.getItem(storageKey);
        if (cachedSettings) {
          setGymSettings(JSON.parse(cachedSettings));
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
    forceRefresh
  };
};