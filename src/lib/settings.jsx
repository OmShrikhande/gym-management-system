
// Get the current application settings
export const getAppSettings = (key = null) => {
  try {
    let storageKey;
    
    if (key) {
      // Handle different key formats
      if (key.startsWith('gym_')) {
        storageKey = `gym_settings_${key}`;
      } else {
        storageKey = `gym_settings_user_${key}`;
      }
    } else {
      storageKey = 'gym_settings';
    }
    
    // First try to get the specific settings
    let settingsStr = localStorage.getItem(storageKey);
    
    // If no settings found and we have a key, try alternative formats
    if (!settingsStr && key) {
      const alternativeKeys = [
        `gym_settings_gym_${key}`,
        `gym_settings_user_${key}`,
        `gym_settings_${key}`
      ];
      
      for (const altKey of alternativeKeys) {
        settingsStr = localStorage.getItem(altKey);
        if (settingsStr) break;
      }
    }
    
    // If still no settings and no key was specified, try global settings
    if (!settingsStr && !key) {
      settingsStr = localStorage.getItem('gym_settings');
    }
    
    if (!settingsStr) return null;
    
    return JSON.parse(settingsStr);
  } catch (error) {
    console.error('Error parsing settings:', error);
    return null;
  }
};

// Format a date according to the user's preferred format
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    const settings = getAppSettings();
    const format = settings?.global?.dateFormat || 'MM/DD/YYYY';
    
    // Simple date formatting based on the format string
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Month name
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = monthNames[date.getMonth()];
    
    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MMM DD, YYYY':
        return `${monthName} ${day}, ${year}`;
      case 'DD MMM YYYY':
        return `${day} ${monthName} ${year}`;
      default: // MM/DD/YYYY
        return `${month}/${day}/${year}`;
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Format a time according to the user's preferred format
export const formatTime = (timeString) => {
  if (!timeString) return '';
  
  try {
    const settings = getAppSettings();
    const format = settings?.global?.timeFormat || '12h';
    
    // If it's just a time string like "14:30"
    if (timeString.includes(':')) {
      const [hours, minutes] = timeString.split(':');
      const hoursNum = parseInt(hours, 10);
      
      if (format === '24h') {
        return timeString;
      } else {
        // 12-hour format
        const period = hoursNum >= 12 ? 'PM' : 'AM';
        const hours12 = hoursNum % 12 || 12;
        return `${hours12}:${minutes} ${period}`;
      }
    }
    
    // If it's a full date string
    const date = new Date(timeString);
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    if (format === '24h') {
      return `${hours}:${minutes}`;
    } else {
      // 12-hour format
      const period = hours >= 12 ? 'PM' : 'AM';
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes} ${period}`;
    }
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

// Format currency according to the user's preferred currency
export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '';
  
  try {
    const settings = getAppSettings();
    const currency = settings?.global?.currency || 'USD';
    
    // Currency formatting options
    const currencyOptions = {
      USD: { locale: 'en-US', currency: 'USD' },
      EUR: { locale: 'de-DE', currency: 'EUR' },
      GBP: { locale: 'en-GB', currency: 'GBP' },
      INR: { locale: 'en-IN', currency: 'INR' },
      CAD: { locale: 'en-CA', currency: 'CAD' },
      AUD: { locale: 'en-AU', currency: 'AUD' },
      JPY: { locale: 'ja-JP', currency: 'JPY' },
      CNY: { locale: 'zh-CN', currency: 'CNY' },
    };
    
    const options = currencyOptions[currency] || currencyOptions.USD;
    
    return new Intl.NumberFormat(options.locale, {
      style: 'currency',
      currency: options.currency,
    }).format(amount);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${amount}`;
  }
};

// Apply settings to the application
export const applySettings = (settings, userId = null, userRole = null, gymId = null) => {
  if (!settings) return;
  
  try {
    // Apply theme colors if available
    if (settings.branding) {
      // Apply primary and secondary colors
      document.documentElement.style.setProperty('--primary', settings.branding.primaryColor);
      document.documentElement.style.setProperty('--secondary', settings.branding.secondaryColor);
      
      // Apply background colors
      if (settings.branding.backgroundColor) {
        document.documentElement.style.setProperty('--background', settings.branding.backgroundColor);
        document.body.style.backgroundColor = settings.branding.backgroundColor;
      }
      
      // Apply card background color
      if (settings.branding.cardColor) {
        document.documentElement.style.setProperty('--card', settings.branding.cardColor);
      }
      
      // Apply sidebar color
      if (settings.branding.sidebarColor) {
        document.documentElement.style.setProperty('--sidebar', settings.branding.sidebarColor);
      }
      
      // Apply text color
      if (settings.branding.textColor) {
        document.documentElement.style.setProperty('--text', settings.branding.textColor);
      }
      
      // Apply dark/light mode
      const isDarkMode = settings.branding.darkMode !== false;
      document.documentElement.classList.toggle('dark', isDarkMode);
      document.documentElement.classList.toggle('light', !isDarkMode);
    }
    
    // Apply custom CSS if available
    if (settings.branding?.customCss) {
      let styleElement = document.getElementById('custom-styles');
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'custom-styles';
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = settings.branding.customCss;
    }
    
    // Create or update the theme CSS variables
    let themeElement = document.getElementById('theme-variables');
    
    if (!themeElement) {
      themeElement = document.createElement('style');
      themeElement.id = 'theme-variables';
      document.head.appendChild(themeElement);
    }
    
    // Set CSS variables for the theme
    themeElement.textContent = `
      :root {
        --primary: ${settings.branding?.primaryColor || '#3B82F6'};
        --secondary: ${settings.branding?.secondaryColor || '#8B5CF6'};
        --background: ${settings.branding?.backgroundColor || '#111827'};
        --card: ${settings.branding?.cardColor || '#1F2937'};
        --sidebar: ${settings.branding?.sidebarColor || '#1F2937'};
        --text: ${settings.branding?.textColor || '#FFFFFF'};
      }
      
      body {
        background-color: var(--background);
        color: var(--text);
      }
      
      .bg-card {
        background-color: var(--card);
      }
      
      .bg-sidebar {
        background-color: var(--sidebar);
      }
    `;
    
    // Store settings in localStorage based on user role and ID
    if (userId) {
      if (userRole === 'gym-owner') {
        // For gym owners, store as both user and gym settings
        const userStorageKey = `gym_settings_user_${userId}`;
        const gymStorageKey = `gym_settings_gym_${userId}`;
        localStorage.setItem(userStorageKey, JSON.stringify(settings));
        localStorage.setItem(gymStorageKey, JSON.stringify(settings));
        console.log(`Saved gym owner settings for user ${userId}`);
        
        // Store the gym ID for reference by trainers and members
        localStorage.setItem('gym_id', userId);
      } else if (userRole === 'trainer' || userRole === 'member') {
        // For trainers and members, store gym settings and their user reference
        const userStorageKey = `gym_settings_user_${userId}`;
        localStorage.setItem(userStorageKey, JSON.stringify(settings));
        
        if (gymId) {
          // Store gym settings for other users of this gym
          const gymStorageKey = `gym_settings_gym_${gymId}`;
          localStorage.setItem(gymStorageKey, JSON.stringify(settings));
          localStorage.setItem('gym_id', gymId);
          console.log(`Saved gym settings for trainer/member ${userId} of gym ${gymId}`);
        }
      } else {
        // For other users, store as user-specific settings
        const userStorageKey = `gym_settings_user_${userId}`;
        localStorage.setItem(userStorageKey, JSON.stringify(settings));
        console.log(`Saved user-specific settings for user ${userId}`);
      }
    } else {
      // Store as global settings
      localStorage.setItem('gym_settings', JSON.stringify(settings));
      console.log('Saved global settings');
    }
    
    // Apply language if needed
    if (settings.global?.language) {
      try {
        import('../i18n').then(({ changeLanguage }) => {
          changeLanguage(settings.global.language);
        }).catch(error => {
          console.error('Error importing i18n:', error);
        });
      } catch (error) {
        console.error('Error applying language settings:', error);
      }
    }
    
    // Clear service worker cache for settings
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_SETTINGS_CACHE'
      }, [channel.port2]);
      
      channel.port1.onmessage = (event) => {
        if (event.data.success) {
          console.log('Service worker cache cleared successfully');
        }
      };
    }
    
    // Dispatch an event to notify the application that settings have been applied
    window.dispatchEvent(new CustomEvent('settingsApplied', { 
      detail: { 
        userId, 
        userRole,
        gymId,
        timestamp: new Date().toISOString()
      } 
    }));
    
    console.log(`Settings applied successfully for ${userRole || 'user'} ${userId || 'global'}`);
  } catch (error) {
    console.error('Error applying settings:', error);
  }
};

// Initialize settings from localStorage
export const initializeSettings = (userId = null, userRole = null, gymId = null) => {
  // Try to get user-specific settings first
  let settings = null;
  let settingsKey = null;
  
  if (userRole === 'super-admin') {
    // Super admin gets global settings
    settings = getAppSettings();
    settingsKey = 'global';
  } else if (userRole === 'gym-owner' && userId) {
    // Gym owner gets their own settings
    settings = getAppSettings(userId);
    settingsKey = `gym_${userId}`;
  } else if ((userRole === 'trainer' || userRole === 'member') && gymId) {
    // Trainers and members get their gym's settings
    settings = getAppSettings(`gym_${gymId}`);
    settingsKey = `gym_${gymId}`;
    
    // If no gym settings found, try the gym owner's user settings
    if (!settings) {
      settings = getAppSettings(gymId);
      settingsKey = `gym_${gymId}`;
    }
  }
  
  // If still no settings, try global settings
  if (!settings) {
    settings = getAppSettings();
    settingsKey = 'global';
  }
  
  if (settings) {
    // Apply settings with appropriate context
    applySettings(settings, userId, userRole, gymId);
    
    // Apply language if available
    if (settings.global?.language) {
      import('../i18n').then(({ changeLanguage }) => {
        changeLanguage(settings.global.language);
      }).catch(error => {
        console.error('Error importing i18n:', error);
      });
    }
    
    console.log(`Settings initialized for ${userRole} with key: ${settingsKey}`);
  }
};

// Get settings based on user role with performance tracking
export const getSettingsForUser = async (userId, userRole, gymId, authFetch) => {
  if (!userId || !authFetch) return null;
  
  const startTime = performance.now();
  
  try {
    let endpoint;
    
    // Determine the appropriate endpoint based on user role
    if (userRole === 'super-admin') {
      endpoint = '/settings';
    } else if (userRole === 'gym-owner') {
      endpoint = `/settings/gym/${userId}`;
    } else if (userRole === 'trainer' || userRole === 'member') {
      endpoint = `/settings/user/${userId}`;
    } else {
      // Fallback to user-specific settings
      endpoint = `/settings/user/${userId}`;
    }
    
    let response;
    try {
      response = await authFetch(endpoint);
      
      // If global settings access is denied and we're a super admin, fallback to user-specific
      if (userRole === 'super-admin' && endpoint === '/settings' && response && !response.success && 
          (response.message?.includes('Access denied') || response.message?.includes('Permission denied'))) {
        console.log('Global settings access denied, falling back to user-specific settings');
        endpoint = `/settings/user/${userId}`;
        response = await authFetch(endpoint);
      }
    } catch (error) {
      // Handle permission errors for super admin trying to access global settings
      if (userRole === 'super-admin' && endpoint === '/settings' && 
          (error.message.includes('Permission denied') || error.message.includes('Access denied') || error.message.includes('Unauthorized'))) {
        console.log('Global settings access failed, trying user-specific settings');
        endpoint = `/settings/user/${userId}`;
        response = await authFetch(endpoint);
      } else {
        throw error;
      }
    }
    
    const endTime = performance.now();
    
    // Dispatch performance event
    window.dispatchEvent(new CustomEvent('settingsPerformance', {
      detail: {
        type: 'api_call',
        timing: endTime - startTime,
        success: response.success,
        endpoint
      }
    }));
    
    if (response.success && response.data?.settings) {
      return response.data.settings;
    }
  } catch (error) {
    console.error('Error fetching settings for user:', error);
    const endTime = performance.now();
    
    // Dispatch error event
    window.dispatchEvent(new CustomEvent('settingsPerformance', {
      detail: {
        type: 'api_error',
        timing: endTime - startTime,
        success: false,
        error: error.message
      }
    }));
  }
  
  return null;
};

// Performance-optimized settings fetcher with caching
export const getSettingsWithCache = async (userId, userRole, gymId, authFetch, settingsCache) => {
  if (!userId || !authFetch) return null;
  
  // Check cache first
  const cached = settingsCache?.get(userId, userRole, gymId);
  if (cached) {
    // Dispatch cache hit event
    window.dispatchEvent(new CustomEvent('settingsPerformance', {
      detail: {
        type: 'cache_hit',
        timing: 0,
        success: true
      }
    }));
    return cached;
  }
  
  // Dispatch cache miss event
  window.dispatchEvent(new CustomEvent('settingsPerformance', {
    detail: {
      type: 'cache_miss',
      timing: 0,
      success: false
    }
  }));
  
  // Fetch from API
  const settings = await getSettingsForUser(userId, userRole, gymId, authFetch);
  
  // Cache the result
  if (settings && settingsCache) {
    settingsCache.set(userId, userRole, gymId, settings);
  }
  
  return settings;
};

// Force refresh settings by clearing all caches
export const forceRefreshSettings = async (userId, userRole, gymId, authFetch) => {
  if (!authFetch) return null;
  
  try {
    console.log('Force refreshing settings...');
    
    // Clear localStorage cache
    const keys = Object.keys(localStorage).filter(key => key.includes('gym_settings') || key.includes('gym_branding'));
    keys.forEach(key => localStorage.removeItem(key));
    
    // Clear service worker cache
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel();
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_SETTINGS_CACHE'
      }, [channel.port2]);
      
      await new Promise((resolve) => {
        channel.port1.onmessage = () => resolve();
        setTimeout(resolve, 1000); // Timeout after 1 second
      });
    }
    
    // Determine endpoint
    let endpoint;
    if (userRole === 'super-admin') {
      endpoint = '/settings';
    } else if (userRole === 'gym-owner') {
      endpoint = `/settings/gym/${userId}`;
    } else if (userRole === 'trainer' || userRole === 'member') {
      endpoint = gymId ? `/settings/gym/${gymId}` : `/settings/user/${userId}`;
    } else {
      endpoint = `/settings/user/${userId}`;
    }
    
    // Add cache-busting parameter
    const cacheBustingUrl = `${endpoint}?_cb=${Date.now()}`;
    
    // Fetch fresh settings with fallback for super admin
    let response;
    try {
      response = await authFetch(cacheBustingUrl);
      
      // If global settings access is denied and we're a super admin, fallback to user-specific
      if (userRole === 'super-admin' && endpoint === '/settings' && response && !response.success && 
          (response.message?.includes('Access denied') || response.message?.includes('Permission denied'))) {
        console.log('Global settings access denied, falling back to user-specific settings');
        endpoint = `/settings/user/${userId}`;
        const fallbackUrl = `${endpoint}?_cb=${Date.now()}`;
        response = await authFetch(fallbackUrl);
      }
    } catch (error) {
      // Handle permission errors for super admin trying to access global settings
      if (userRole === 'super-admin' && endpoint === '/settings' && 
          (error.message.includes('Permission denied') || error.message.includes('Access denied') || error.message.includes('Unauthorized'))) {
        console.log('Global settings access failed, trying user-specific settings');
        endpoint = `/settings/user/${userId}`;
        const fallbackUrl = `${endpoint}?_cb=${Date.now()}`;
        response = await authFetch(fallbackUrl);
      } else {
        throw error;
      }
    }
    
    if (response.success && response.data?.settings) {
      // Apply fresh settings
      applySettings(response.data.settings, userId, userRole, gymId);
      console.log('Settings force refreshed successfully');
      return response.data.settings;
    }
    
    return null;
  } catch (error) {
    console.error('Error force refreshing settings:', error);
    return null;
  }
};