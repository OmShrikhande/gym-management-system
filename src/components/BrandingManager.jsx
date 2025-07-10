import { useEffect } from 'react';
import { useGymBranding } from '@/hooks/useGymBranding';

/**
 * Component that manages dynamic branding across the application
 * This includes updating the favicon and page title based on gym settings
 */
const BrandingManager = () => {
  const { getAppName, getFavicon, loading } = useGymBranding();

  useEffect(() => {
    if (loading) return;

    // Update page title
    const appName = getAppName();
    document.title = appName;

    // Update favicon
    const faviconUrl = getFavicon();
    if (faviconUrl) {
      let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
      link.type = 'image/x-icon';
      link.rel = 'shortcut icon';
      link.href = faviconUrl;
      document.head.appendChild(link);
    }
  }, [loading, getAppName, getFavicon]);

  return null; // This component doesn't render anything
};

export default BrandingManager;