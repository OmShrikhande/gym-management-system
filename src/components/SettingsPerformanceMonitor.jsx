import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Users, Wifi, WifiOff } from 'lucide-react';
import settingsCache from '@/lib/settingsCache.js';

/**
 * Performance monitoring component for settings system
 * Shows real-time metrics and system status
 */
const SettingsPerformanceMonitor = () => {
  const { user, isGymOwner } = useAuth();
  const [metrics, setMetrics] = useState({
    cacheHits: 0,
    cacheMisses: 0,
    apiCalls: 0,
    avgResponseTime: 0,
    connectedUsers: 0,
    lastUpdate: null
  });
  
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show for gym owners and in development
    if (isGymOwner && (import.meta.env.DEV || window.location.hostname === 'localhost')) {
      setIsVisible(true);
    }
  }, [isGymOwner]);

  useEffect(() => {
    if (!isVisible) return;

    const updateMetrics = () => {
      const cacheStats = settingsCache.getStats();
      
      setMetrics(prev => ({
        ...prev,
        cacheSize: cacheStats.size,
        cacheEntries: cacheStats.entries,
        lastUpdate: new Date().toISOString()
      }));
    };

    // Update metrics every 5 seconds
    const interval = setInterval(updateMetrics, 5000);
    updateMetrics(); // Initial update

    return () => clearInterval(interval);
  }, [isVisible]);

  // Listen for settings performance events
  useEffect(() => {
    if (!isVisible) return;

    const handleSettingsEvent = (event) => {
      const { type, timing, success } = event.detail;
      
      setMetrics(prev => ({
        ...prev,
        apiCalls: prev.apiCalls + 1,
        avgResponseTime: timing ? Math.round((prev.avgResponseTime + timing) / 2) : prev.avgResponseTime,
        cacheHits: type === 'cache_hit' ? prev.cacheHits + 1 : prev.cacheHits,
        cacheMisses: type === 'cache_miss' ? prev.cacheMisses + 1 : prev.cacheMisses
      }));
    };

    window.addEventListener('settingsPerformance', handleSettingsEvent);
    return () => window.removeEventListener('settingsPerformance', handleSettingsEvent);
  }, [isVisible]);

  if (!isVisible) return null;

  const cacheHitRate = metrics.cacheHits + metrics.cacheMisses > 0 
    ? Math.round((metrics.cacheHits / (metrics.cacheHits + metrics.cacheMisses)) * 100)
    : 0;

  return (
    <Card className="bg-gray-900/50 border-gray-700 mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Settings Performance Monitor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500/20 p-2 rounded">
              <Clock className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Avg Response</p>
              <p className="text-lg font-semibold text-white">{metrics.avgResponseTime}ms</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-green-500/20 p-2 rounded">
              <Wifi className="h-4 w-4 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Cache Hit Rate</p>
              <p className="text-lg font-semibold text-white">{cacheHitRate}%</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-purple-500/20 p-2 rounded">
              <Users className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">API Calls</p>
              <p className="text-lg font-semibold text-white">{metrics.apiCalls}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-orange-500/20 p-2 rounded">
              <Activity className="h-4 w-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Cache Size</p>
              <p className="text-lg font-semibold text-white">{metrics.cacheSize || 0}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="bg-gray-800">
            Cache: {metrics.cacheHits} hits, {metrics.cacheMisses} misses
          </Badge>
          {metrics.lastUpdate && (
            <Badge variant="outline" className="border-gray-600">
              Updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SettingsPerformanceMonitor;