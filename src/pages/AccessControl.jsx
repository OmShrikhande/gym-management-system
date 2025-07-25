import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  ArrowLeft, 
  CheckCircle, 
  Clock,
  Users,
  Building,
  AlertTriangle
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext.jsx";
import UniversalAccessControl from "@/components/access/UniversalAccessControl";
import DashboardLayout from "@/components/layout/DashboardLayout";

const AccessControl = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accessGranted, setAccessGranted] = useState(false);
  const [accessData, setAccessData] = useState(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    // Check if user should have access to this page
    if (!user) {
      toast.error('Please log in to access the gym entry system');
      navigate('/login');
      return;
    }

    // Auto-show full screen for kiosk mode (can be configured)
    const isKioskMode = new URLSearchParams(window.location.search).get('kiosk') === 'true';
    if (isKioskMode) {
      setShowFullScreen(true);
    }
  }, [user, navigate]);

  const handleAccessGranted = (data) => {
    setAccessData(data);
    setAccessGranted(true);
    
    // Auto-redirect after successful access (optional)
    setTimeout(() => {
      if (data.user?.role === 'member') {
        navigate('/dashboard');
      } else if (data.user?.role === 'trainer') {
        navigate('/trainer-dashboard');
      } else if (data.user?.role === 'gym-owner') {
        navigate('/gym-owner-dashboard');
      }
    }, 3000);
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  // Full screen access control (for kiosk mode)
  if (showFullScreen) {
    return (
      <UniversalAccessControl 
        onAccessGranted={handleAccessGranted}
        onClose={() => setShowFullScreen(false)}
      />
    );
  }

  // Success screen
  if (accessGranted && accessData) {
    return (
      <DashboardLayout>
        <div className="min-h-[70vh] flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-green-600 mb-2">Access Granted!</h2>
                  <p className="text-gray-600">
                    Welcome to the gym, {accessData.user?.name}!
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Access Method:</span>
                    <Badge variant="outline" className="capitalize">
                      {accessData.method}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium">
                      {new Date(accessData.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">User Role:</span>
                    <Badge variant="secondary" className="capitalize">
                      {accessData.user?.role?.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Button onClick={handleBackToDashboard} className="w-full">
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setAccessGranted(false)}
                    className="w-full"
                  >
                    Access Again
                  </Button>
                </div>

                <p className="text-xs text-gray-500">
                  Redirecting to dashboard in a few seconds...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Main access control interface
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Gym Access Control</h1>
              <p className="text-muted-foreground">
                Secure entry system for members, trainers, and gym owners
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowFullScreen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="h-4 w-4 mr-2" />
            Full Screen Mode
          </Button>
        </div>

        {/* Quick Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
                onClick={() => setShowFullScreen(true)}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-500" />
                Quick Access
              </CardTitle>
              <CardDescription>
                Fast entry for all user types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Launch the full access control interface with QR scanner and staff access options.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                Member Access
              </CardTitle>
              <CardDescription>
                QR code scanning for members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Members can scan their QR codes to verify membership and enter the gym.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                Staff Access
              </CardTitle>
              <CardDescription>
                PIN and biometric access for staff
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Trainers and gym owners can use PIN codes or biometric authentication.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Access Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Access the Gym</CardTitle>
            <CardDescription>
              Different access methods based on your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  For Members
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Open the access control interface</p>
                  <p>2. Use the QR scanner tab</p>
                  <p>3. Scan your membership QR code</p>
                  <p>4. Wait for verification and entry</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  For Staff (Trainers & Gym Owners)
                </h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>1. Open the access control interface</p>
                  <p>2. Use the Staff Access tab</p>
                  <p>3. Choose PIN, biometric, or emergency access</p>
                  <p>4. Complete authentication and enter</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Information */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-yellow-800">Security & Privacy</h4>
                <div className="text-sm text-yellow-700 space-y-1">
                  <p>• All access attempts are logged and monitored for security</p>
                  <p>• Failed access attempts are recorded and reviewed</p>
                  <p>• Emergency access codes are for urgent situations only</p>
                  <p>• Biometric data is processed locally and not stored</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Launch Full Interface */}
        <div className="text-center">
          <Button 
            size="lg"
            onClick={() => setShowFullScreen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Shield className="h-5 w-5 mr-2" />
            Launch Access Control Interface
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AccessControl;