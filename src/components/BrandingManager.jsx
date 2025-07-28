import { useEffect } from 'react';
import { useGymBranding } from '@/hooks/useGymBranding';

/**
 * Component that manages dynamic branding across the application
 * This includes updating the favicon and page title based on gym settings
 */
const BrandingManager = () => {
  const { getAppName, getFavicon, loading } = useGymBranding();

  // Helper function to ensure HTTPS URLs for security
  const ensureHttpsUrl = (url) => {
    if (!url) return null;
    
    try {
      // If it's a relative URL, return as is
      if (url.startsWith('/') || url.startsWith('./') || url.startsWith('../')) {
        return url;
      }
      
      // If it's an HTTP URL and we're on HTTPS, convert to HTTPS
      if (url.startsWith('http://') && window.location.protocol === 'https:') {
        console.warn('Converting HTTP favicon URL to HTTPS for security:', url);
        return url.replace('http://', 'https://');
      }
      
      // If it's already HTTPS or we're on HTTP, return as is
      return url;
    } catch (error) {
      console.error('Error processing favicon URL:', error);
      return null;
    }
  };

  useEffect(() => {
    if (loading) return;

    // Update page title
    const appName = getAppName();
    document.title = appName;

    // Update favicon with HTTPS validation
    const originalFaviconUrl = getFavicon();
    const faviconUrl = ensureHttpsUrl(originalFaviconUrl);
    
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = faviconUrl;
      
      // Add error handling for favicon loading
      link.onerror = () => {
        console.warn('Failed to load favicon:', faviconUrl);
        // Fallback to default favicon
        link.href = '/shakktiverse_logo.png';
      };
      
      document.head.appendChild(link);
    }
  }, [loading, getAppName, getFavicon]);

  return null; // This component doesn't render anything
};

export default BrandingManager;