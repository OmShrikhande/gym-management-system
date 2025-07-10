import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applySettings, getAppSettings } from '@/lib/settings';
import settingsCache from '@/lib/settingsCache.js';
import { toast } from 'sonner';
import { shouldEnableWebSocket, getWebSocketUrl, logEnvironmentInfo } from '@/utils/environmentCheck';

/**
 * Hook for real-time settings updates
 * Handles WebSocket connections for live settings synchronization
 */
export const useRealTimeSettings = () => {
  const { user, authFetch } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [ws, setWs] = useState(null);
  const [wsEnabled, setWsEnabled] = useState(true);

  // Log environment info on mount (development only)
  useEffect(() => {
    if (import.meta.env.DEV) {
      logEnvironmentInfo();
    }
  }, []);

  // Handle incoming WebSocket messages
  const handleMessage = useCallback((event) => {
    try {
      const data = JSON.parse(event.data);
      
      if (data.type === 'settings_update' && data.settings) {
        const { settings, targetUsers, updatedBy, timestamp } = data;
        
        // Check if this update is for the current user
        const isTargetUser = targetUsers.includes(user?._id);
        
        // Don't apply settings if updated by the same user (to avoid loops)
        if (isTargetUser && updatedBy !== user?._id) {
          console.log('Applying real-time settings update:', settings);
          
          // Clear cache for this user
          settingsCache.remove(user._id, user.role, user.gymId);
          
          // Update cache with new settings
          settingsCache.set(user._id, user.role, user.gymId, settings);
          
          // Clear service worker cache
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            const channel = new MessageChannel();
            navigator.serviceWorker.controller.postMessage({
              type: 'CLEAR_SETTINGS_CACHE'
            }, [channel.port2]);
          }
          
          // Apply settings with user context
          applySettings(settings, user._id, user.role, user.gymId);
          
          // Update last update timestamp
          setLastUpdate(timestamp);
          
          // Show notification
          toast.info('Settings have been updated by your gym administrator', {
            duration: 3000,
            description: 'Your interface has been automatically updated'
          });
        }
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [user]);

  // Check if WebSocket is available and should be enabled
  useEffect(() => {
    if (!user || user.role === 'super-admin') return;

    const checkWebSocketAvailability = async () => {
      // First check if WebSocket should be enabled in this environment
      if (!shouldEnableWebSocket()) {
        setWsEnabled(false);
        return;
      }

      try {
        const response = await authFetch('/ws-status');
        if (response.success && response.data.websocketEnabled) {
          setWsEnabled(true);
          if (import.meta.env.DEV) {
            console.log('WebSocket enabled on server');
          }
        } else {
          setWsEnabled(false);
        }
      } catch (error) {
        setWsEnabled(false);
        // Only log errors in development
        if (import.meta.env.DEV) {
          console.log('Could not check WebSocket availability:', error.message);
        }
      }
    };

    checkWebSocketAvailability();
  }, [user, authFetch]);

  // Initialize WebSocket connection with retry logic
  useEffect(() => {
    if (!user || user.role === 'super-admin' || !wsEnabled) {
      if (import.meta.env.DEV) {
        console.log('WebSocket not needed or not available');
      }
      return;
    }

    let retryCount = 0;
    const maxRetries = 3; // Reduced retries for production
    let retryTimeout;

    const connectWebSocket = () => {
      try {
        const wsUrl = getWebSocketUrl();
        if (import.meta.env.DEV) {
          console.log('Attempting WebSocket connection to:', wsUrl);
        }
        
        const websocket = new WebSocket(wsUrl);
        
        // Set a connection timeout
        const connectionTimeout = setTimeout(() => {
          if (import.meta.env.DEV) {
            console.log('WebSocket connection timeout');
          }
          websocket.close();
        }, 5000); // 5 second timeout for production

        websocket.onopen = () => {
          if (import.meta.env.DEV) {
            console.log('WebSocket connected for real-time settings');
          }
          clearTimeout(connectionTimeout);
          setIsConnected(true);
          retryCount = 0; // Reset retry count on successful connection
          
          // Send authentication message
          const authMessage = {
            type: 'auth',
            token: localStorage.getItem('token'),
            userId: user._id,
            role: user.role
          };
          
          if (import.meta.env.DEV) {
            console.log('Sending WebSocket auth message');
          }
          websocket.send(JSON.stringify(authMessage));
        };

        websocket.onmessage = handleMessage;
        
        websocket.onclose = (event) => {
          clearTimeout(connectionTimeout);
          setIsConnected(false);
          
          // Only retry on certain close codes (not manual closes) and only in development
          if (event.code !== 1000 && event.code !== 1001 && retryCount < maxRetries && user && user.role !== 'super-admin' && import.meta.env.DEV) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 15000); // Max 15 seconds
            retryCount++;
            
            console.log(`Retrying WebSocket connection in ${delay}ms (attempt ${retryCount}/${maxRetries})`);
            
            retryTimeout = setTimeout(() => {
              connectWebSocket();
            }, delay);
          }
          // In production, silently disable WebSocket without retries
        };

        websocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          setIsConnected(false);
          // Only log WebSocket errors in development
          if (import.meta.env.DEV) {
            console.log('WebSocket error:', error.message || 'Connection failed');
          }
        };

        setWs(websocket);
      } catch (error) {
        setIsConnected(false);
        // Only log connection errors in development
        if (import.meta.env.DEV) {
          console.log('Error connecting WebSocket:', error.message);
        }
      }
    };

    // Delay initial connection to ensure user is fully authenticated
    const initTimeout = setTimeout(() => {
      connectWebSocket();
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimeout);
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (ws) {
        ws.close();
      }
    };
  }, [user, handleMessage, wsEnabled]);

  // Function to broadcast settings update
  const broadcastSettingsUpdate = useCallback(async (settings, targetUsers) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected, using fallback HTTP sync');
      return;
    }

    try {
      const message = {
        type: 'settings_update',
        settings,
        targetUsers,
        updatedBy: user?._id,
        timestamp: new Date().toISOString()
      };

      ws.send(JSON.stringify(message));
      console.log('Settings update broadcasted via WebSocket');
    } catch (error) {
      console.error('Error broadcasting settings update:', error);
    }
  }, [ws, user]);

  // Function to sync settings via HTTP as fallback
  const syncSettingsHttp = useCallback(async () => {
    if (!user || !authFetch) return;

    try {
      let endpoint;
      
      // Get appropriate endpoint based on user role
      if (user.role === 'gym-owner') {
        endpoint = `/settings/gym/${user._id}`;
      } else if (user.role === 'trainer' || user.role === 'member') {
        // For trainers and members, get their gym's settings
        endpoint = user.gymId ? `/settings/gym/${user.gymId}` : `/settings/user/${user._id}`;
      } else {
        return;
      }

      const response = await authFetch(endpoint);
      
      if (response.success && response.data?.settings) {
        const currentSettings = getAppSettings(user._id);
        
        // Only apply if settings are different
        if (JSON.stringify(currentSettings) !== JSON.stringify(response.data.settings)) {
          applySettings(response.data.settings, user._id, user.role, user.gymId);
          setLastUpdate(new Date().toISOString());
          console.log('Settings synchronized via HTTP');
        }
      }
    } catch (error) {
      console.error('Error syncing settings via HTTP:', error);
    }
  }, [user, authFetch]);

  // Periodic sync as fallback
  useEffect(() => {
    if (!user || user.role === 'super-admin') return;

    const interval = setInterval(syncSettingsHttp, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, [syncSettingsHttp, user]);

  return {
    isConnected,
    lastUpdate,
    broadcastSettingsUpdate,
    syncSettingsHttp,
    wsEnabled
  };
};