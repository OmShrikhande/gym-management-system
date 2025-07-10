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
          // Super admins get global settings
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
        const response = await authFetch(endpoint);
        
        if (response.success && response.data?.settings) {
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
    
    fetchAndApplySettings();
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