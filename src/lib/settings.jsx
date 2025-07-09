
// Get the current application settings
export const getAppSettings = (userId = null) => {
  try {
    // If userId is provided, get user-specific settings
    const storageKey = userId ? `gym_settings_user_${userId}` : 'gym_settings';
    
    // First try to get user-specific settings
    let settingsStr = localStorage.getItem(storageKey);
    
    // If no user-specific settings and no userId was specified, try to get global settings
    if (!settingsStr && !userId) {
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
export const applySettings = (settings, userId = null) => {
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
    
    // Store settings in localStorage
    // If userId is provided, store as user-specific settings
    if (userId) {
      const storageKey = `gym_settings_user_${userId}`;
      localStorage.setItem(storageKey, JSON.stringify(settings));
      console.log(`Saved user-specific settings for user ${userId}`);
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
  } catch (error) {
    console.error('Error applying settings:', error);
  }
};

// Initialize settings from localStorage
export const initializeSettings = (userId = null, userRole = null) => {
  // Try to get user-specific settings first
  let settings = null;
  if (userId) {
    settings = getAppSettings(userId);
  }
  
  // If no user settings, try global settings
  if (!settings) {
    settings = getAppSettings();
  }
  
  if (settings) {
    // Apply settings with appropriate ID
    applySettings(settings, userId);
    
    // Apply language if available
    if (settings.global?.language) {
      import('../i18n').then(({ changeLanguage }) => {
        changeLanguage(settings.global.language);
      }).catch(error => {
        console.error('Error importing i18n:', error);
      });
    }
  }
};