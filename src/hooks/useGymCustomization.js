import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applySettings, getAppSettings } from '@/lib/settings';

/**
 * Custom hook for managing gym customization
 * This hook handles loading and applying gym-specific customization settings
 */
export const useGymCustomization = () => {
  const { user, authFetch, isGymOwner, isTrainer, isMember } = useAuth();
  const [customization, setCustomization] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get the gym ID - for gym owners it's their user ID, for others it's their gymId
  const gymId = isGymOwner ? user?._id : user?.gymId;

  // Load gym customization
  const loadGymCustomization = useCallback(async () => {
    if (!gymId || !user) return;

    try {
      setIsLoading(true);
      setError(null);

      // First, try to get customization from localStorage
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
          
          // Cache the settings for faster loading
          localStorage.setItem(`gym_settings_${gymId}`, JSON.stringify(gymCustomization));
        }
      }
    } catch (err) {
      console.error('Error loading gym customization:', err);
      setError(err.message || 'Failed to load gym customization');
    } finally {
      setIsLoading(false);
    }
  }, [gymId, user, authFetch, isGymOwner, isTrainer, isMember]);

  // Apply customization settings
  const applyCustomization = useCallback((settings) => {
    if (!settings || !user) return;

    // Only apply to gym members, trainers, and gym owner - not super admin
    if (isGymOwner || isTrainer || isMember) {
      setCustomization(settings);
      applySettings(settings, user._id);
      
      // Cache the settings
      if (gymId) {
        localStorage.setItem(`gym_settings_${gymId}`, JSON.stringify(settings));
      }
    }
  }, [user, isGymOwner, isTrainer, isMember, gymId]);

  // Update favicon
  const updateFavicon = useCallback((faviconUrl) => {
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
  }, []);

  // Update page title
  const updatePageTitle = useCallback((gymName, systemName) => {
    const titleToUse = systemName || gymName;
    if (!titleToUse) return;

    // Update the page title to include gym/system name
    const currentTitle = document.title;
    const titleParts = currentTitle.split(' | ');
    
    if (titleParts.length > 1) {
      // Replace existing name
      document.title = `${titleParts[0]} | ${titleToUse}`;
    } else {
      // Add name
      document.title = `${currentTitle} | ${titleToUse}`;
    }
  }, []);

  // Listen for broadcast messages for real-time updates
  useEffect(() => {
    if (!gymId || !user) return;

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
  }, [gymId, user, applyCustomization]);

  // Load customization on mount and when user/gym changes
  useEffect(() => {
    loadGymCustomization();
  }, [loadGymCustomization]);

  // Apply favicon and title when customization changes
  useEffect(() => {
    if (customization?.branding) {
      if (customization.branding.favicon) {
        updateFavicon(customization.branding.favicon);
      }
      
      if (customization.branding.gymName || customization.branding.systemName) {
        updatePageTitle(customization.branding.gymName, customization.branding.systemName);
      }
    }
  }, [customization, updateFavicon, updatePageTitle]);

  // Save customization (for gym owners only)
  const saveCustomization = useCallback(async (newCustomization) => {
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
  }, [isGymOwner, gymId, authFetch, applyCustomization]);

  // Reset to default customization
  const resetToDefault = useCallback(() => {
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
      localStorage.removeItem(`gym_settings_${gymId}`);
    }
  }, [applyCustomization, gymId]);

  // Check if user can customize
  const canCustomize = isGymOwner || 
    (isTrainer && customization?.settings?.allowTrainerCustomization) ||
    (isMember && customization?.settings?.allowMemberCustomization);

  return {
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
};

export default useGymCustomization;