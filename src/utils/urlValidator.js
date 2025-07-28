/**
 * URL Validation and Security Utilities
 * Ensures URLs are secure and compatible with HTTPS environments
 */

/**
 * Validates and converts HTTP URLs to HTTPS for security
 * @param {string} url - The URL to validate
 * @param {boolean} forceHttps - Whether to force HTTPS conversion
 * @returns {string|null} - The validated URL or null if invalid
 */
export const validateAndSecureUrl = (url, forceHttps = true) => {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Trim whitespace
  url = url.trim();
  
  if (!url) {
    return null;
  }

  try {
    // Handle relative URLs
    if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
      return url;
    }

    // Handle data URLs (base64 images)
    if (url.startsWith('data:')) {
      return url;
    }

    // Validate URL format
    const urlObj = new URL(url);
    
    // Check for valid protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      console.warn('Invalid URL protocol:', urlObj.protocol);
      return null;
    }

    // Convert HTTP to HTTPS if we're in a secure context or forceHttps is true
    if (urlObj.protocol === 'http:' && (forceHttps || window.location.protocol === 'https:')) {
      console.warn('Converting HTTP URL to HTTPS for security:', url);
      urlObj.protocol = 'https:';
    }

    return urlObj.toString();
  } catch (error) {
    console.error('Invalid URL format:', url, error);
    return null;
  }
};

/**
 * Validates settings object and fixes any insecure URLs
 * @param {object} settings - The settings object to validate
 * @returns {object} - The validated settings object
 */
export const validateSettingsUrls = (settings) => {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const validatedSettings = { ...settings };

  // Validate branding URLs
  if (validatedSettings.branding) {
    if (validatedSettings.branding.logoUrl) {
      const validatedLogoUrl = validateAndSecureUrl(validatedSettings.branding.logoUrl);
      if (validatedLogoUrl !== validatedSettings.branding.logoUrl) {
        console.log('Logo URL validated:', validatedSettings.branding.logoUrl, '->', validatedLogoUrl);
        validatedSettings.branding.logoUrl = validatedLogoUrl || '';
      }
    }

    if (validatedSettings.branding.faviconUrl) {
      const validatedFaviconUrl = validateAndSecureUrl(validatedSettings.branding.faviconUrl);
      if (validatedFaviconUrl !== validatedSettings.branding.faviconUrl) {
        console.log('Favicon URL validated:', validatedSettings.branding.faviconUrl, '->', validatedFaviconUrl);
        validatedSettings.branding.faviconUrl = validatedFaviconUrl || '';
      }
    }
  }

  return validatedSettings;
};

/**
 * Checks if a URL is secure (HTTPS or relative)
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is secure
 */
export const isSecureUrl = (url) => {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Relative URLs are considered secure
  if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
    return true;
  }

  // Data URLs are secure
  if (url.startsWith('data:')) {
    return true;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'https:';
  } catch (error) {
    return false;
  }
};

/**
 * Gets a list of insecure URLs from settings
 * @param {object} settings - The settings object to check
 * @returns {Array} - Array of insecure URL information
 */
export const getInsecureUrls = (settings) => {
  const insecureUrls = [];

  if (!settings || typeof settings !== 'object') {
    return insecureUrls;
  }

  if (settings.branding) {
    if (settings.branding.logoUrl && !isSecureUrl(settings.branding.logoUrl)) {
      insecureUrls.push({
        field: 'branding.logoUrl',
        url: settings.branding.logoUrl,
        type: 'Logo URL'
      });
    }

    if (settings.branding.faviconUrl && !isSecureUrl(settings.branding.faviconUrl)) {
      insecureUrls.push({
        field: 'branding.faviconUrl',
        url: settings.branding.faviconUrl,
        type: 'Favicon URL'
      });
    }
  }

  return insecureUrls;
};

export default {
  validateAndSecureUrl,
  validateSettingsUrls,
  isSecureUrl,
  getInsecureUrls
};