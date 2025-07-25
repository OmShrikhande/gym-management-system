import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Key, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Users,
  Building,
  Fingerprint,
  Smartphone,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext.jsx";

const StaffAccessControl = ({ onAccessGranted, onClose }) => {
  const { user, authFetch } = useAuth();
  const [accessMethod, setAccessMethod] = useState('pin'); // 'pin', 'biometric', 'emergency'
  const [pinCode, setPinCode] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [accessHistory, setAccessHistory] = useState([]);
  const [emergencyCode, setEmergencyCode] = useState('');
  const [biometricSupported, setBiometricSupported] = useState(false);

  useEffect(() => {
    checkBiometricSupport();
    loadAccessHistory();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      if (window.PublicKeyCredential && 
          await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
        setBiometricSupported(true);
      }
    } catch (error) {
      console.log('Biometric authentication not supported:', error);
      setBiometricSupported(false);
    }
  };

  const loadAccessHistory = async () => {
    try {
      const response = await authFetch('/access/staff-history', {
        method: 'GET'
      });
      
      if (response.success) {
        setAccessHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Failed to load access history:', error);
    }
  };

  const handlePinAccess = async () => {
    if (!pinCode || pinCode.length < 4) {
      toast.error('Please enter a valid PIN (minimum 4 digits)');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await authFetch('/access/staff-pin-verify', {
        method: 'POST',
        body: JSON.stringify({
          pinCode,
          userRole: user.role,
          gymId: user.gymId || user._id,
          accessMethod: 'pin'
        })
      });

      if (response.success) {
        toast.success(`Access granted! Welcome ${user.name}`);
        await logAccessAttempt('pin', true);
        onAccessGranted?.({
          method: 'pin',
          user: user,
          timestamp: new Date().toISOString()
        });
      } else {
        toast.error(response.message || 'Invalid PIN code');
        await logAccessAttempt('pin', false, response.message);
      }
    } catch (error) {
      toast.error('Access verification failed');
      await logAccessAttempt('pin', false, error.message);
    } finally {
      setIsProcessing(false);
      setPinCode('');
    }
  };

  const handleBiometricAccess = async () => {
    if (!biometricSupported) {
      toast.error('Biometric authentication not supported on this device');
      return;
    }

    setIsProcessing(true);
    try {
      // Create credential request
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array(32),
          rp: {
            name: "GymFlow Access Control",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(user._id),
            name: user.email,
            displayName: user.name,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key"}],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required"
          },
          timeout: 60000,
          attestation: "direct"
        }
      });

      if (credential) {
        const response = await authFetch('/access/staff-biometric-verify', {
          method: 'POST',
          body: JSON.stringify({
            credentialId: credential.id,
            userRole: user.role,
            gymId: user.gymId || user._id,
            accessMethod: 'biometric'
          })
        });

        if (response.success) {
          toast.success(`Biometric access granted! Welcome ${user.name}`);
          await logAccessAttempt('biometric', true);
          onAccessGranted?.({
            method: 'biometric',
            user: user,
            timestamp: new Date().toISOString()
          });
        } else {
          toast.error(response.message || 'Biometric verification failed');
          await logAccessAttempt('biometric', false, response.message);
        }
      }
    } catch (error) {
      toast.error('Biometric authentication failed');
      await logAccessAttempt('biometric', false, error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEmergencyAccess = async () => {
    if (!emergencyCode || emergencyCode.length < 6) {
      toast.error('Please enter a valid emergency code');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await authFetch('/access/staff-emergency-verify', {
        method: 'POST',
        body: JSON.stringify({
          emergencyCode,
          userRole: user.role,
          gymId: user.gymId || user._id,
          accessMethod: 'emergency',
          reason: 'Emergency access requested'
        })
      });

      if (response.success) {
        toast.success(`Emergency access granted! Welcome ${user.name}`);
        toast.warning('Emergency access logged for security review');
        await logAccessAttempt('emergency', true);
        onAccessGranted?.({
          method: 'emergency',
          user: user,
          timestamp: new Date().toISOString()
        });
      } else {
        toast.error(response.message || 'Invalid emergency code');
        await logAccessAttempt('emergency', false, response.message);
      }
    } catch (error) {
      toast.error('Emergency access verification failed');
      await logAccessAttempt('emergency', false, error.message);
    } finally {
      setIsProcessing(false);
      setEmergencyCode('');
    }
  };

  const logAccessAttempt = async (method, success, error = null) => {
    try {
      await authFetch('/access/log-attempt', {
        method: 'POST',
        body: JSON.stringify({
          method,
          success,
          error,
          userRole: user.role,
          gymId: user.gymId || user._id,
          timestamp: new Date().toISOString()
        })
      });
      loadAccessHistory(); // Refresh history
    } catch (logError) {
      console.error('Failed to log access attempt:', logError);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'gym-owner':
        return <Building className="h-4 w-4" />;
      case 'trainer':
        return <Users className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'gym-owner':
        return 'default';
      case 'trainer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle>Staff Access Control</CardTitle>
                <CardDescription>
                  Secure access for trainers and gym owners
                </CardDescription>
              </div>
            </div>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeColor(user.role)} className="flex items-center gap-1">
              {getRoleIcon(user.role)}
              {user.role === 'gym-owner' ? 'Gym Owner' : 'Trainer'}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {user.name} • {user.email}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Access Methods */}
      <Card>
        <CardHeader>
          <CardTitle>Choose Access Method</CardTitle>
          <CardDescription>
            Select your preferred method to access the gym
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Button
              variant={accessMethod === 'pin' ? 'default' : 'outline'}
              onClick={() => setAccessMethod('pin')}
              className="h-20 flex flex-col gap-2"
            >
              <Key className="h-6 w-6" />
              <span>PIN Code</span>
            </Button>
            
            <Button
              variant={accessMethod === 'biometric' ? 'default' : 'outline'}
              onClick={() => setAccessMethod('biometric')}
              disabled={!biometricSupported}
              className="h-20 flex flex-col gap-2"
            >
              <Fingerprint className="h-6 w-6" />
              <span>Biometric</span>
              {!biometricSupported && (
                <span className="text-xs text-muted-foreground">Not Available</span>
              )}
            </Button>
            
            <Button
              variant={accessMethod === 'emergency' ? 'default' : 'outline'}
              onClick={() => setAccessMethod('emergency')}
              className="h-20 flex flex-col gap-2"
            >
              <AlertTriangle className="h-6 w-6" />
              <span>Emergency</span>
            </Button>
          </div>

          {/* PIN Access */}
          {accessMethod === 'pin' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pin">Enter your PIN code</Label>
                <div className="relative">
                  <Input
                    id="pin"
                    type={showPin ? 'text' : 'password'}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Enter PIN"
                    className="pr-10"
                    maxLength={8}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPin(!showPin)}
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter your 4-8 digit PIN code to access the gym
                </p>
              </div>
              <Button 
                onClick={handlePinAccess} 
                disabled={isProcessing || !pinCode}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Unlock className="h-4 w-4 mr-2" />
                    Access with PIN
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Biometric Access */}
          {accessMethod === 'biometric' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <Fingerprint className="h-16 w-16 mx-auto text-blue-500" />
                <h3 className="font-medium">Biometric Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  Use your fingerprint, face, or other biometric method to access the gym
                </p>
              </div>
              <Button 
                onClick={handleBiometricAccess} 
                disabled={isProcessing || !biometricSupported}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Fingerprint className="h-4 w-4 mr-2" />
                    Authenticate with Biometric
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Emergency Access */}
          {accessMethod === 'emergency' && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-800">Emergency Access</h4>
                    <p className="text-sm text-yellow-700">
                      This method is for emergency situations only. All emergency access attempts are logged and reviewed.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="emergency">Emergency Access Code</Label>
                <Input
                  id="emergency"
                  type="password"
                  value={emergencyCode}
                  onChange={(e) => setEmergencyCode(e.target.value.toUpperCase())}
                  placeholder="Enter emergency code"
                  maxLength={12}
                />
                <p className="text-sm text-muted-foreground">
                  Contact your gym administrator for the emergency access code
                </p>
              </div>
              
              <Button 
                onClick={handleEmergencyAccess} 
                disabled={isProcessing || !emergencyCode}
                variant="destructive"
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Emergency Access
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Access History */}
      {accessHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Access History
            </CardTitle>
            <CardDescription>
              Your recent gym access attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {accessHistory.slice(0, 5).map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    {entry.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="text-sm font-medium capitalize">
                      {entry.method} Access
                    </span>
                    <Badge variant={entry.success ? 'default' : 'destructive'} className="text-xs">
                      {entry.success ? 'Success' : 'Failed'}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Information */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-medium text-blue-900">Access Methods Guide</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>PIN Code:</strong> Use your personal 4-8 digit PIN for quick access</p>
                <p><strong>Biometric:</strong> Use fingerprint/face recognition (if supported)</p>
                <p><strong>Emergency:</strong> Use emergency code in urgent situations only</p>
              </div>
              <p className="text-xs text-blue-700 mt-2">
                Need help? Contact your gym administrator or check the staff manual.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAccessControl;