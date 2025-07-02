import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { initializeSettings } from '@/lib/settings.jsx';

/**
 * Component that initializes user-specific settings
 * This component doesn't render anything, it just initializes settings
 */
const SettingsInitializer = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      // Initialize user-specific settings
      initializeSettings(user._id);
      console.log(`Initialized settings for user ${user._id}`);
    } else {
      // Initialize global settings
      initializeSettings();
      console.log('Initialized global settings');
    }
  }, [user]);
  
  // This component doesn't render anything
  return null;
};

export default SettingsInitializer;