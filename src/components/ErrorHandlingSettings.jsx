import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Info,
  RefreshCw,
  Download,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { 
  toggleConsoleErrorFiltering, 
  initializeConsoleErrorFiltering,
  disableConsoleErrorFiltering,
  forceLog, 
  forceError, 
  forceWarn 
} from "@/utils/consoleErrorHandler.js";

const ErrorHandlingSettings = () => {
  const [isFilteringEnabled, setIsFilteringEnabled] = useState(false);
  const [errorStats, setErrorStats] = useState({
    suppressed: 0,
    critical: 0,
    total: 0,
    lastReset: new Date().toISOString()
  });
  const [systemStatus, setSystemStatus] = useState({
    consoleFiltering: false,
    svgFixer: false,
    razorpayHandler: false
  });

  useEffect(() => {
    checkSystemStatus();
    loadErrorStats();
  }, []);

  const checkSystemStatus = () => {
    const filteringEnabled = localStorage.getItem('gymflow_filter_console_errors') === 'true';
    setIsFilteringEnabled(filteringEnabled);
    
    setSystemStatus({
      consoleFiltering: filteringEnabled,
      svgFixer: true, // Always active once initialized
      razorpayHandler: window.Razorpay !== undefined
    });
  };

  const loadErrorStats = () => {
    const savedStats = localStorage.getItem('gymflow_error_stats');
    if (savedStats) {
      try {
        setErrorStats(JSON.parse(savedStats));
      } catch (error) {
        console.warn('Failed to load error stats:', error);
      }
    }
  };

  const saveErrorStats = (stats) => {
    localStorage.setItem('gymflow_error_stats', JSON.stringify(stats));
    setErrorStats(stats);
  };

  const handleToggleFiltering = () => {
    try {
      toggleConsoleErrorFiltering();
      const newState = !isFilteringEnabled;
      setIsFilteringEnabled(newState);
      
      setSystemStatus(prev => ({
        ...prev,
        consoleFiltering: newState
      }));
      
      if (newState) {
        toast.success("Console error filtering enabled");
        forceLog("🔇 Console error filtering enabled via settings");
      } else {
        toast.success("Console error filtering disabled");
        forceLog("🔊 Console error filtering disabled via settings");
      }
    } catch (error) {
      toast.error("Failed to toggle error filtering");
      forceError("❌ Failed to toggle error filtering:", error);
    }
  };

  const resetErrorHandling = () => {
    try {
      // Disable current filtering
      disableConsoleErrorFiltering();
      
      // Re-initialize
      setTimeout(() => {
        initializeConsoleErrorFiltering();
        checkSystemStatus();
        toast.success("Error handling system reset successfully");
        forceLog("🔄 Error handling system reset via settings");
      }, 100);
    } catch (error) {
      toast.error("Failed to reset error handling");
      forceError("❌ Failed to reset error handling:", error);
    }
  };

  const testErrorHandling = () => {
    const testErrors = [
      "Request timed out: https://gym-management-system-ckb0",
      "Refused to get unsafe header \"x-rtb-fingerprint-id\"",
      "Blocked call to navigator.vibrate inside a cross-origin iframe",
      "<svg> attribute width: Expected length, \"auto\".",
      "v2-entry-app-4976853e.modern.js:1 [Intervention] Blocked call"
    ];

    let suppressedCount = 0;
    
    testErrors.forEach((error, index) => {
      setTimeout(() => {
        console.error(error);
        if (isFilteringEnabled) {
          suppressedCount++;
        }
      }, index * 100);
    });

    // Test a critical error that should NOT be suppressed
    setTimeout(() => {
      forceError("TEST CRITICAL ERROR - This should always be visible");
      
      // Update stats
      const newStats = {
        ...errorStats,
        suppressed: errorStats.suppressed + (isFilteringEnabled ? suppressedCount : 0),
        critical: errorStats.critical + 1,
        total: errorStats.total + testErrors.length + 1
      };
      saveErrorStats(newStats);
      
      toast.info(`Error handling test completed. Check console for results.`);
    }, testErrors.length * 100 + 200);
  };

  const clearErrorStats = () => {
    const clearedStats = {
      suppressed: 0,
      critical: 0,
      total: 0,
      lastReset: new Date().toISOString()
    };
    saveErrorStats(clearedStats);
    toast.success("Error statistics cleared");
  };

  const exportErrorStats = () => {
    const exportData = {
      ...errorStats,
      systemStatus,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymflow-error-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Error statistics exported");
  };

  return (
    <div className="space-y-6">
      {/* Main Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Error Handling Settings
          </CardTitle>
          <CardDescription>
            Configure console error filtering and system error handling
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Console Error Filtering */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="console-filtering" className="text-base font-medium">
                  Console Error Filtering
                </Label>
                <p className="text-sm text-muted-foreground">
                  Hide non-critical third-party errors from the browser console
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={isFilteringEnabled ? "default" : "secondary"}>
                  {isFilteringEnabled ? "Enabled" : "Disabled"}
                </Badge>
                <Switch
                  id="console-filtering"
                  checked={isFilteringEnabled}
                  onCheckedChange={handleToggleFiltering}
                />
              </div>
            </div>

            {/* Filtered Error Types */}
            {isFilteringEnabled && (
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <EyeOff className="h-4 w-4" />
                  Suppressed Error Types
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Request timeout errors</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Unsafe header warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Navigator.vibrate warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>SVG attribute warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Razorpay script warnings</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Third-party loading errors</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* System Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">System Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {systemStatus.consoleFiltering ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <div className="font-medium">Console Filtering</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStatus.consoleFiltering ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="font-medium">SVG Fixer</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {systemStatus.razorpayHandler ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <div className="font-medium">Razorpay Handler</div>
                  <div className="text-sm text-muted-foreground">
                    {systemStatus.razorpayHandler ? 'Loaded' : 'Not Loaded'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Error Statistics */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Error Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {errorStats.suppressed}
                </div>
                <div className="text-sm text-green-600 dark:text-green-400">
                  Suppressed
                </div>
              </div>
              <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {errorStats.critical}
                </div>
                <div className="text-sm text-red-600 dark:text-red-400">
                  Critical
                </div>
              </div>
              <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {errorStats.total}
                </div>
                <div className="text-sm text-blue-600 dark:text-blue-400">
                  Total
                </div>
              </div>
            </div>
            
            {errorStats.lastReset && (
              <p className="text-sm text-muted-foreground">
                Last reset: {new Date(errorStats.lastReset).toLocaleString()}
              </p>
            )}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={testErrorHandling}
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Test Error Handling
              </Button>
              
              <Button
                variant="outline"
                onClick={resetErrorHandling}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reset System
              </Button>
              
              <Button
                variant="outline"
                onClick={exportErrorStats}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Stats
              </Button>
              
              <Button
                variant="outline"
                onClick={clearErrorStats}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Stats
              </Button>
            </div>
          </div>

          {/* Information */}
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                  About Error Handling
                </p>
                <div className="text-blue-800 dark:text-blue-200 space-y-1">
                  <p>
                    • <strong>Console Filtering:</strong> Hides non-critical third-party errors while preserving important application errors
                  </p>
                  <p>
                    • <strong>SVG Fixer:</strong> Automatically fixes common SVG attribute issues that cause console warnings
                  </p>
                  <p>
                    • <strong>Razorpay Handler:</strong> Manages payment gateway errors and prevents unnecessary console noise
                  </p>
                  <p className="mt-2 text-xs">
                    Critical errors (authentication, payment failures, application crashes) are never suppressed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ErrorHandlingSettings;