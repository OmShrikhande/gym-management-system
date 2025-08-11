import { useEffect, useState } from 'react';
import { debugAuthState, clearAllAuthData, checkTokenHealth } from '@/utils/authDebug';

export const useAuthDebug = () => {
  const [showDebugPanel, setShowDebugPanel] = useState(false);

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Ctrl + Shift + D to open debug panel
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        setShowDebugPanel(true);
      }
      
      // Ctrl + Shift + C to clear auth data
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        if (window.confirm('Clear all authentication data and reload? This will log you out.')) {
          clearAllAuthData();
          setTimeout(() => window.location.reload(), 1000);
        }
      }
      
      // Ctrl + Shift + A to debug auth state
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
        event.preventDefault();
        console.log('🔍 Manual Auth Debug Triggered:');
        debugAuthState();
        checkTokenHealth();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  return {
    showDebugPanel,
    setShowDebugPanel,
    debugAuth: () => {
      debugAuthState();
      checkTokenHealth();
    },
    clearAuth: () => {
      if (window.confirm('Clear all authentication data and reload? This will log you out.')) {
        clearAllAuthData();
        setTimeout(() => window.location.reload(), 1000);
      }
    }
  };
};