import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Eye,
  Activity,
  Lock,
  Unlock
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { 
  getSecurityStatus, 
  resetRateLimiting,
  SECURITY_CONFIG 
} from "@/utils/razorpaySecurityUtils.js";

const RazorpaySecurityMonitor = () => {
  const { user } = useAuth();
  const [securityStatus, setSecurityStatus] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (user?._id) {
      updateSecurityStatus();
    }
  }, [user]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (user?._id) {
        updateSecurityStatus();
      }
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, user]);

  const updateSecurityStatus = () => {
    if (!user?._id) return;
    
    try {
      const status = getSecurityStatus(user._id);
      setSecurityStatus(status);
    } catch (error) {
      console.error('Failed to get security status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      updateSecurityStatus();
      toast.success('Security status refreshed');
    } catch (error) {
      toast.error('Failed to refresh security status');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleResetRateLimit = (action) => {
    if (!user?._id) return;
    
    try {
      resetRateLimiting(user._id);
      updateSecurityStatus();
      toast.success(`Rate limiting reset for ${action}`);
    } catch (error) {
      toast.error('Failed to reset rate limiting');
    }
  };

  const getRateLimitColor = (status) => {
    if (status.isBlocked) return 'destructive';
    if (status.remainingAttempts <= 1) return 'warning';
    return 'default';
  };

  const getRateLimitIcon = (status) => {
    if (status.isBlocked) return <XCircle className="h-4 w-4" />;
    if (status.remainingAttempts <= 1) return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const formatTimeRemaining = (blockUntil) => {
    if (!blockUntil) return null;
    
    const now = Date.now();
    const remaining = Math.max(0, blockUntil - now);
    const seconds = Math.ceil(remaining / 1000);
    
    if (seconds <= 0) return 'Unblocked';
    if (seconds < 60) return `${seconds}s`;
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (!securityStatus) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Razorpay Security Monitor
          </CardTitle>
          <CardDescription>Loading security status...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                Razorpay Security Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of payment security measures
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
              >
                {autoRefresh ? <Eye className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                {autoRefresh ? 'Live' : 'Manual'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Rate Limiting Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Rate Limiting Status
          </CardTitle>
          <CardDescription>
            Current rate limiting status for payment operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(securityStatus.rateLimiting).map(([action, status]) => (
              <div key={action} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium capitalize">
                    {action.replace(/([A-Z])/g, ' $1').trim()}
                  </h4>
                  <Badge variant={getRateLimitColor(status)}>
                    {getRateLimitIcon(status)}
                    {status.isBlocked ? 'Blocked' : 'Active'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Attempts Used</span>
                    <span>{status.recentAttempts}/{status.maxAttempts}</span>
                  </div>
                  <Progress 
                    value={(status.recentAttempts / status.maxAttempts) * 100} 
                    className="h-2"
                  />
                  
                  {status.isBlocked && (
                    <div className="flex items-center gap-2 text-sm text-red-600">
                      <Clock className="h-3 w-3" />
                      <span>Unblocks in: {formatTimeRemaining(status.blockUntil)}</span>
                    </div>
                  )}
                  
                  {!status.isBlocked && (
                    <div className="text-sm text-green-600">
                      <span>{status.remainingAttempts} attempts remaining</span>
                    </div>
                  )}
                </div>
                
                {status.isBlocked && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetRateLimit(action)}
                    className="w-full"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Reset Limit
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>
            Current security settings and limits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rate Limiting Config */}
            <div className="space-y-3">
              <h4 className="font-medium">Rate Limiting</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Order Creation Limit</span>
                  <span>{SECURITY_CONFIG.rateLimiting.maxOrderCreationAttempts}/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Verification Limit</span>
                  <span>{SECURITY_CONFIG.rateLimiting.maxVerificationAttempts}/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Key Fetch Limit</span>
                  <span>{SECURITY_CONFIG.rateLimiting.maxKeyFetchAttempts}/min</span>
                </div>
                <div className="flex justify-between">
                  <span>Block Duration</span>
                  <span>{SECURITY_CONFIG.rateLimiting.blockDurationMs / 60000}min</span>
                </div>
              </div>
            </div>

            {/* Payment Validation Config */}
            <div className="space-y-3">
              <h4 className="font-medium">Payment Validation</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Min Amount</span>
                  <span>₹{SECURITY_CONFIG.paymentValidation.minAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Amount</span>
                  <span>₹{SECURITY_CONFIG.paymentValidation.maxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Order Expiry</span>
                  <span>{SECURITY_CONFIG.paymentValidation.orderExpiryMs / 60000}min</span>
                </div>
                <div className="flex justify-between">
                  <span>Allowed Currencies</span>
                  <span>{SECURITY_CONFIG.paymentValidation.allowedCurrencies.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Security Status Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(securityStatus.rateLimiting).filter(s => !s.isBlocked).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Services</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(securityStatus.rateLimiting).filter(s => s.isBlocked).length}
              </div>
              <div className="text-sm text-muted-foreground">Blocked Services</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600">
                {Object.values(securityStatus.rateLimiting).reduce((sum, s) => sum + s.recentAttempts, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(securityStatus.rateLimiting).reduce((sum, s) => sum + s.remainingAttempts, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Remaining Attempts</div>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-muted-foreground text-center">
            Last updated: {new Date(securityStatus.timestamp).toLocaleString()}
          </div>
        </CardContent>
      </Card>

      {/* Development Tools */}
      {import.meta.env.DEV && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <AlertTriangle className="h-5 w-5" />
              Development Tools
            </CardTitle>
            <CardDescription className="text-yellow-700">
              These tools are only available in development mode
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResetRateLimit('all')}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Reset All Limits
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Razorpay Security Status:', securityStatus);
                  toast.info('Security status logged to console');
                }}
                className="border-yellow-300 text-yellow-800 hover:bg-yellow-100"
              >
                Log to Console
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RazorpaySecurityMonitor;