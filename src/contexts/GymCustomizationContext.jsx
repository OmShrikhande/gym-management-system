import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { applySettings, getAppSettings } from '@/lib/settings';

const GymCustomizationContext = createContext();

export const useGymCustomization = () => {
  const context = useContext(GymCustomizationContext);
  if (!context) {
    throw new Error('useGymCustomization must be used within a GymCustomizationProvider');
  }
  return context;
};

export const GymCustomizationProvider = ({ children }) => {
  const { user, authFetch, isGymOwner, isTrainer, isMember, isSuperAdmin } = useAuth();
  const [customization, setCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the gym ID - for gym owners it's their user ID, for others it's their gymId
  const gymId = isGymOwner ? user?._id : user?.gymId;

  // Load gym customization
  const loadGymCustomization = async () => {
    if (!gymId || !user || isSuperAdmin) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);

      // First, try to get customization from localStorage for instant loading
      const cachedSettings = getAppSettings(`gym_${gymId}`);
      if (cachedSettings) {
        setCustomization(cachedSettings);
        applySettings(cachedSettings, user._id);
      }

      // Then, fetch from API to get the latest version
      const response = await authFetch(`/gym/${gymId}/customization`);
      
      if (response.success && response.data) {
        const gymCustomization = response.data;
        
        // Only apply to gym members, trainers, and gym owner - not super admin
        if (isGymOwner || isTrainer || isMember) {
          setCustomization(gymCustomization);
          applySettings(gymCustomization, user._id);
          
          // Update favicon if available
          if (gymCustomization.branding?.favicon) {
            updateFavicon(gymCustomization.branding.favicon);
          }
          
          // Update page title if gym name is available
          if (gymCustomization.branding?.gymName) {
            updatePageTitle(gymCustomization.branding.gymName);
          }
          
          // Cache the settings for faster loading
          localStorage.setItem(`gym_settings_gym_${gymId}`, JSON.stringify(gymCustomization));
        }
      }
    } catch (err) {
      console.error('Error loading gym customization:', err);
      setError(err.message || 'Failed to load gym customization');
    } finally {
      setIsLoading(false);
    }
  };

  // Apply customization settings
  const applyCustomization = (settings) => {
    if (!settings || !user || isSuperAdmin) return;

    // Only apply to gym members, trainers, and gym owner - not super admin
    if (isGymOwner || isTrainer || isMember) {
      setCustomization(settings);
      applySettings(settings, user._id);
      
      // Update favicon
      if (settings.branding?.favicon) {
        updateFavicon(settings.branding.favicon);
      }
      
      // Update page title
      if (settings.branding?.gymName) {
        updatePageTitle(settings.branding.gymName);
      }
      
      // Cache the settings
      if (gymId) {
        localStorage.setItem(`gym_settings_gym_${gymId}`, JSON.stringify(settings));
      }
    }
  };

  // Update favicon
  const updateFavicon = (faviconUrl) => {
    if (!faviconUrl) return;

    // Find existing favicon or create new one
    let favicon = document.querySelector('link[rel="icon"]') || 
                 document.querySelector('link[rel="shortcut icon"]');
    
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      document.head.appendChild(favicon);
    }
    
    favicon.href = faviconUrl;
    
    // Also update apple-touch-icon if it exists
    const appleTouchIcon = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleTouchIcon) {
      appleTouchIcon.href = faviconUrl;
    }
  };

  // Update page title
  const updatePageTitle = (gymName) => {
    if (!gymName) return;

    // Update the page title to include gym name
    const currentTitle = document.title;
    const titleParts = currentTitle.split(' | ');
    
    if (titleParts.length > 1) {
      // Replace existing gym name
      document.title = `${titleParts[0]} | ${gymName}`;
    } else {
      // Add gym name
      document.title = `${currentTitle} | ${gymName}`;
    }
  };

  // Save customization (for gym owners only)
  const saveCustomization = async (newCustomization) => {
    if (!isGymOwner || !gymId) {
      throw new Error('Only gym owners can save customization');
    }

    try {
      const response = await authFetch(`/gym/${gymId}/customization`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCustomization),
      });

      if (response.success) {
        applyCustomization(newCustomization);
        
        // Broadcast changes to other users
        if (window.BroadcastChannel) {
          const channel = new BroadcastChannel('gym-customization');
          channel.postMessage({
            type: 'customization-updated',
            gymId,
            customization: newCustomization
          });
        }
        
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to save customization');
      }
    } catch (err) {
      console.error('Error saving customization:', err);
      throw err;
    }
  };

  // Reset to default customization
  const resetToDefault = () => {
    const defaultCustomization = {
      branding: {
        gymName: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#111827',
        cardColor: '#1F2937',
        sidebarColor: '#1F2937',
        textColor: '#FFFFFF',
        accentColor: '#06B6D4',
        logo: '',
        favicon: '',
        darkMode: true
      },
      settings: {
        allowMemberCustomization: false,
        allowTrainerCustomization: false,
        customCss: ''
      }
    };

    applyCustomization(defaultCustomization);
    
    // Clear cached settings
    if (gymId) {
      localStorage.removeItem(`gym_settings_gym_${gymId}`);
    }
  };

  // Check if user can customize
  const canCustomize = isGymOwner || 
    (isTrainer && customization?.settings?.allowTrainerCustomization) ||
    (isMember && customization?.settings?.allowMemberCustomization);

  // Listen for broadcast messages for real-time updates
  useEffect(() => {
    if (!gymId || !user || isSuperAdmin) return;

    const handleBroadcast = (event) => {
      if (event.data.type === 'customization-updated' && 
          event.data.gymId === gymId) {
        applyCustomization(event.data.customization);
      }
    };

    // Set up broadcast channel for real-time updates
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel('gym-customization');
      channel.addEventListener('message', handleBroadcast);
      
      return () => {
        channel.removeEventListener('message', handleBroadcast);
        channel.close();
      };
    }
  }, [gymId, user, isSuperAdmin]);

  // Load customization on mount and when user/gym changes
  useEffect(() => {
    let mounted = true;
    
    const loadCustomization = async () => {
      if (!mounted) return;
      
      // Don't load customization for super admin
      if (isSuperAdmin) {
        setIsLoading(false);
        return;
      }
      
      await loadGymCustomization();
    };

    loadCustomization();
    
    return () => {
      mounted = false;
    };
  }, [gymId, user, isSuperAdmin, isGymOwner, isTrainer, isMember]);

  const value = {
    customization,
    isLoading,
    error,
    canCustomize,
    loadGymCustomization,
    applyCustomization,
    saveCustomization,
    resetToDefault,
    updateFavicon,
    updatePageTitle
  };

  return (
    <GymCustomizationContext.Provider value={value}>
      {children}
    </GymCustomizationContext.Provider>
  );
};

export default GymCustomizationProvider;