import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { 
  toggleConsoleErrorFiltering, 
  forceLog, 
  forceError, 
  forceWarn 
} from "@/utils/consoleErrorHandler.js";

const ErrorHandlingStatus = () => {
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);
  const [errorStats, setErrorStats] = useState({
    suppressed: 0,
    critical: 0,
    total: 0
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if filtering is currently enabled
    const filteringEnabled = localStorage.getItem('gymflow_filter_console_errors') === 'true';
    setIsFilteringEnabled(filteringEnabled);

    // Set up error counting (in development mode)
    if (import.meta.env.DEV) {
      // Add to global scope for debugging
      window.gymflowErrorStats = errorStats;
      window.updateErrorStats = setErrorStats;
    }
  }, []);

  const handleToggleFiltering = () => {
    try {
      toggleConsoleErrorFiltering();
      const newState = !isFilteringEnabled;
      setIsFilteringEnabled(newState);
      
      if (newState) {
        toast.success("Console error filtering enabled");
        forceLog("🔇 Console error filtering enabled by user");
      } else {
        toast.success("Console error filtering disabled");
        forceLog("🔊 Console error filtering disabled by user");
      }
    } catch (error) {
      toast.error("Failed to toggle error filtering");
      forceError("❌ Failed to toggle error filtering:", error);
    }
  };

  const testErrorHandling = () => {
    // Test different types of errors
    console.error("Request timed out: https://gym-management-system-ckb0"); // Should be suppressed
    console.error("Refused to get unsafe header \"x-rtb-fingerprint-id\""); // Should be suppressed
    console.warn("Blocked call to navigator.vibrate inside a cross-origin iframe"); // Should be suppressed
    console.error("<svg> attribute width: Expected length, \"auto\"."); // Should be suppressed
    
    // Test critical error (should NOT be suppressed)
    forceError("This is a test critical error - should always show");
    
    toast.info("Error handling test completed - check console");
  };

  const clearErrorStats = () => {
    setErrorStats({ suppressed: 0, critical: 0, total: 0 });
    toast.success("Error statistics cleared");
  };

  if (!import.meta.env.DEV && !isExpanded) {
    // In production, show minimal UI unless expanded
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
        >
          <Shield className="h-4 w-4 mr-2" />
          Error Handling
        </Button>
      </div>
    );
  }

  return (
    <div className={`${isExpanded ? 'fixed inset-4 z-50' : 'w-full max-w-md'}`}>
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {isFilteringEnabled ? (
                <ShieldCheck className="h-5 w-5 text-green-400" />
              ) : (
                <ShieldAlert className="h-5 w-5 text-yellow-400" />
              )}
              Error Handling Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Console error filtering and Razorpay error management
            </CardDescription>
          </div>
          {isExpanded && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtering Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="error-filtering" className="text-sm font-medium">
                Console Error Filtering
              </Label>
              <Badge variant={isFilteringEnabled ? "default" : "secondary"}>
                {isFilteringEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
            <Switch
              id="error-filtering"
              checked={isFilteringEnabled}
              onCheckedChange={handleToggleFiltering}
            />
          </div>

          {/* Error Statistics (Development only) */}
          {import.meta.env.DEV && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Error Statistics</h4>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-gray-700 p-2 rounded text-center">
                  <div className="text-green-400 font-medium">{errorStats.suppressed}</div>
                  <div className="text-gray-400">Suppressed</div>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <div className="text-red-400 font-medium">{errorStats.critical}</div>
                  <div className="text-gray-400">Critical</div>
                </div>
                <div className="bg-gray-700 p-2 rounded text-center">
                  <div className="text-blue-400 font-medium">{errorStats.total}</div>
                  <div className="text-gray-400">Total</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Indicators */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300">System Status</h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>Razorpay error handling active</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-400" />
                <span>SVG attribute fixer active</span>
              </div>
              <div className="flex items-center gap-2">
                {isFilteringEnabled ? (
                  <CheckCircle className="h-3 w-3 text-green-400" />
                ) : (
                  <AlertCircle className="h-3 w-3 text-yellow-400" />
                )}
                <span>Console error filtering {isFilteringEnabled ? 'active' : 'inactive'}</span>
              </div>
            </div>
          </div>

          {/* Suppressed Error Types */}
          {isFilteringEnabled && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Suppressed Error Types</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3 w-3" />
                  <span>Request timeout errors</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3 w-3" />
                  <span>Unsafe header warnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3 w-3" />
                  <span>Navigator.vibrate warnings</span>
                </div>
                <div className="flex items-center gap-2">
                  <EyeOff className="h-3 w-3" />
                  <span>SVG attribute warnings</span>
                </div>
              </div>
            </div>
          )}

          {/* Development Tools */}
          {import.meta.env.DEV && (
            <div className="space-y-2 pt-2 border-t border-gray-700">
              <h4 className="text-sm font-medium text-gray-300">Development Tools</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={testErrorHandling}
                  className="text-xs bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  Test Filtering
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearErrorStats}
                  className="text-xs bg-gray-700 border-gray-600 hover:bg-gray-600"
                >
                  Clear Stats
                </Button>
              </div>
            </div>
          )}

          {/* Information */}
          <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-300">
                <p className="font-medium mb-1">Error Handling Active</p>
                <p>
                  Non-critical third-party errors are being filtered to keep your console clean. 
                  Critical application errors will always be displayed.
                </p>
                {import.meta.env.DEV && (
                  <p className="mt-1 text-blue-400">
                    Use <code>window.gymflowConsole</code> in the browser console for debugging tools.
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingStatus;