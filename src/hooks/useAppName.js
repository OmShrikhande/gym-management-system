import { useState, useEffect } from 'react';
import { getAppSettings } from '@/lib/settings';
import { useAuth } from '@/contexts/AuthContext';

export const useAppName = () => {
  const { user } = useAuth();
  const [appName, setAppName] = useState("GymFlow");

  useEffect(() => {
    const loadAppName = () => {
      try {
        // Get user-specific settings first, then fall back to global settings
        const settings = getAppSettings(user?._id) || getAppSettings();
        const customAppName = settings?.global?.appName;
        
        if (customAppName && customAppName.trim() !== '') {
          setAppName(customAppName);
          // Update document title
          document.title = `${customAppName} - Gym Management Platform`;
        } else {
          setAppName("GymFlow");
          document.title = "GymFlow - Gym Management Platform";
        }
      } catch (error) {
        console.error('Error loading app name from settings:', error);
        setAppName("GymFlow");
        document.title = "GymFlow - Gym Management Platform";
      }
    };

    loadAppName();

    // Listen for settings changes
    const handleStorageChange = (e) => {
      if (e.key?.includes('gym_settings')) {
        loadAppName();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events when settings are updated
    const handleSettingsUpdate = () => {
      loadAppName();
    };
    
    window.addEventListener('settingsUpdated', handleSettingsUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
    };
  }, [user?._id]);

  return appName;
};