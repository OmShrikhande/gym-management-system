import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initializeSettings, applySettings, forceRefreshSettings } from '@/lib/settings.jsx';
import settingsCache from '@/lib/settingsCache.js';

/**
 * Component that initializes user-specific settings
 * This component doesn't render anything, it just initializes settings
 */
const SettingsInitializer = () => {
  const { user, authFetch, isSuperAdmin, isGymOwner, isTrainer, isMember } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    const fetchAndApplySettings = async () => {
      if (!user) {
        // Initialize global settings for non-authenticated users
        initializeSettings();
        console.log('Initialized global settings for non-authenticated user');
        setIsInitialized(true);
        return;
      }
      
      // Add a small delay to ensure authentication is fully established
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        // Check cache first
        const cachedSettings = settingsCache.get(user._id, user.role, user.gymId);
        if (cachedSettings) {
          console.log(`Using cached settings for user ${user._id} with role ${user.role}`);
          applySettings(
            cachedSettings, 
            user._id, 
            user.role, 
            user.gymId || (user.role === 'gym-owner' ? user._id : null)
          );
          setIsInitialized(true);
          return;
        }
        
        let endpoint;
        
        // Determine the appropriate endpoint based on user role
        if (isSuperAdmin) {
          // Try global settings first, fallback to user-specific if access denied
          endpoint = '/settings';
        } else if (isGymOwner) {
          // Gym owners get their gym-specific settings
          endpoint = `/settings/gym/${user._id}`;
        } else if (isTrainer || isMember) {
          // Trainers and members get their gym's settings
          endpoint = user.gymId ? `/settings/gym/${user.gymId}` : `/settings/user/${user._id}`;
        } else {
          // Fallback to user-specific settings
          endpoint = `/settings/user/${user._id}`;
        }
        
        console.log(`Fetching settings from endpoint: ${endpoint}`);
        
        // Add retry logic for authentication issues
        let retryCount = 0;
        const maxRetries = 3;
        let response;
        
        while (retryCount < maxRetries) {
          try {
            response = await authFetch(endpoint);
            
            // Check if we got a permission denied error (403) or unauthorized (401)
            if (response && !response.success && (response.message?.includes('Access denied') || response.message?.includes('Permission denied'))) {
              // If this was a super admin trying to access global settings, fallback to user-specific
              if (isSuperAdmin && endpoint === '/settings') {
                console.log('Global settings access denied, falling back to user-specific settings');
                endpoint = `/settings/user/${user._id}`;
                response = await authFetch(endpoint);
              }
            }
            
            break; // Success, exit retry loop
          } catch (error) {
            retryCount++;
            
            // Handle permission/authentication errors
            if (error.message.includes('Authentication expired') || 
                error.message.includes('Authentication required') ||
                error.message.includes('Permission denied') ||
                error.message.includes('Access denied')) {
              
              // Special handling for super admin global settings access
              if (isSuperAdmin && endpoint === '/settings' && retryCount === 1) {
                console.log('Global settings access failed, trying user-specific settings');
                endpoint = `/settings/user/${user._id}`;
                retryCount--; // Don't count this as a retry
                continue;
              }
              
              if (retryCount < maxRetries) {
                console.log(`Authentication error, retrying... (${retryCount}/${maxRetries})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * retryCount)); // Exponential backoff
                continue;
              }
            }
            throw error; // Re-throw if not auth error or max retries reached
          }
        }
        
        if (response && response.success && response.data?.settings) {
          // Cache the settings for faster access
          settingsCache.set(user._id, user.role, user.gymId, response.data.settings);
          
          // Apply the settings to the UI with all relevant user information
          applySettings(
            response.data.settings, 
            user._id, 
            user.role, 
            user.gymId || (user.role === 'gym-owner' ? user._id : null)
          );
          console.log(`Applied settings for user ${user._id} with role ${user.role}`);
        } else {
          // Fallback to local settings if API call fails
          initializeSettings(user._id, user.role, user.gymId);
          console.log(`Initialized local settings for user ${user._id} with role ${user.role}`);
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        // Fallback to local settings
        initializeSettings(user._id, user.role, user.gymId);
      } finally {
        setIsInitialized(true);
      }
    };
    
    // Only fetch settings if we have both user and authFetch available
    if (user && authFetch) {
      // TEMPORARY FIX: Skip API call to prevent 401 logout loop
      console.log('Temporarily skipping settings API call to prevent logout loop');
      initializeSettings(user._id, user.role, user.gymId);
      setIsInitialized(true);
      
      // TODO: Re-enable this once backend settings endpoint is fixed
      // fetchAndApplySettings();
    } else if (!user) {
      // Handle non-authenticated case
      initializeSettings();
      setIsInitialized(true);
    }
  }, [user, authFetch, isSuperAdmin, isGymOwner, isTrainer, isMember]);
  
  // Listen for settings updates and force refresh
  useEffect(() => {
    const handleSettingsUpdate = async (event) => {
      if (event.detail?.forceRefresh && user && authFetch) {
        console.log('Force refreshing settings due to update event');
        await forceRefreshSettings(user._id, user.role, user.gymId, authFetch);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, [user, authFetch]);
  
  // This component doesn't render anything
  return null;
};

export default SettingsInitializer;