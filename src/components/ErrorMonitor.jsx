import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const ErrorMonitor = () => {
  const [errors, setErrors] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Listen for custom error events
    const handleCustomError = (event) => {
      const errorInfo = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: event.detail.type || 'unknown',
        message: event.detail.message || 'Unknown error',
        source: event.detail.source || 'unknown',
        severity: event.detail.severity || 'error'
      };
      
      setErrors(prev => [errorInfo, ...prev.slice(0, 49)]); // Keep last 50 errors
    };

    // Listen for unhandled errors
    const handleError = (event) => {
      const errorInfo = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'javascript',
        message: event.error?.message || event.message || 'Unknown JavaScript error',
        source: event.filename || 'unknown',
        line: event.lineno || 'unknown',
        severity: 'error'
      };
      
      setErrors(prev => [errorInfo, ...prev.slice(0, 49)]);
    };

    // Listen for unhandled promise rejections
    const handleRejection = (event) => {
      const errorInfo = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        type: 'promise',
        message: event.reason?.message || String(event.reason) || 'Unhandled promise rejection',
        source: 'promise',
        severity: 'error'
      };
      
      setErrors(prev => [errorInfo, ...prev.slice(0, 49)]);
    };

    window.addEventListener('custom-error', handleCustomError);
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('custom-error', handleCustomError);
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  const checkSystemStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/system-status/status');
      
      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON - likely a routing or server error');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.data);
        toast.success('System status updated');
      } else {
        throw new Error(data.message || 'Failed to fetch system status');
      }
    } catch (error) {
      console.error('Error fetching system status:', error);
      
      // Don't show toast for JSON parsing errors - they're usually server routing issues
      if (!error.message.includes('Unexpected token')) {
        toast.error('Failed to fetch system status');
      }
      
      // Dispatch custom error event with better error handling
      window.dispatchEvent(new CustomEvent('custom-error', {
        detail: {
          type: 'api',
          message: error.message.includes('Unexpected token') 
            ? 'Server routing error - endpoint not found' 
            : error.message,
          source: 'ErrorMonitor',
          severity: 'warning'
        }
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const clearErrors = () => {
    setErrors([]);
    toast.success('Error log cleared');
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      case 'info': return 'outline';
      default: return 'default';
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'info': return <CheckCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'cors': return 'destructive';
      case 'api': return 'secondary';
      case 'javascript': return 'destructive';
      case 'promise': return 'destructive';
      case 'validation': return 'secondary';
      default: return 'outline';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-background/80 backdrop-blur-sm"
        >
          <Eye className="h-4 w-4 mr-2" />
          Error Monitor ({errors.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-hidden">
      <Card className="bg-background/95 backdrop-blur-sm border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Error Monitor</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {errors.length} errors
              </Badge>
              <Button
                onClick={() => setIsVisible(false)}
                variant="ghost"
                size="sm"
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription className="text-xs">
            Real-time error monitoring and system status
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* System Status */}
          <div className="flex items-center gap-2">
            <Button
              onClick={checkSystemStatus}
              disabled={isLoading}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="h-3 w-3 mr-2" />
              )}
              Check Status
            </Button>
            <Button
              onClick={clearErrors}
              variant="outline"
              size="sm"
              disabled={errors.length === 0}
            >
              Clear
            </Button>
          </div>

          {/* System Status Display */}
          {systemStatus && (
            <div className="p-2 bg-muted rounded-md">
              <div className="text-xs font-medium mb-1">System Status</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <div>Server: <Badge variant="outline" className="text-xs">{systemStatus.server.status}</Badge></div>
                <div>DB: <Badge variant="outline" className="text-xs">{systemStatus.database.status}</Badge></div>
                <div>Uptime: {Math.floor(systemStatus.server.uptime / 60)}m</div>
                <div>Env: {systemStatus.server.environment}</div>
              </div>
            </div>
          )}

          {/* Error List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {errors.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                No errors detected
              </div>
            ) : (
              errors.map((error) => (
                <div
                  key={error.id}
                  className="p-2 bg-muted rounded-md border-l-2 border-l-destructive"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      {getSeverityIcon(error.severity)}
                      <Badge variant={getTypeColor(error.type)} className="text-xs">
                        {error.type}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="text-xs text-foreground">
                    {error.message}
                  </div>
                  {error.source && error.source !== 'unknown' && (
                    <div className="text-xs text-muted-foreground mt-1">
                      Source: {error.source}
                      {error.line && error.line !== 'unknown' && `:${error.line}`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utility function to dispatch custom errors
export const reportError = (type, message, source = 'unknown', severity = 'error') => {
  window.dispatchEvent(new CustomEvent('custom-error', {
    detail: { type, message, source, severity }
  }));
};

export default ErrorMonitor;