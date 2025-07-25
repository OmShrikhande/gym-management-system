import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  QrCode, 
  Key, 
  User, 
  Users, 
  Building, 
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  Camera
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext.jsx";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import StaffAccessControl from "./StaffAccessControl";

const UniversalAccessControl = ({ onAccessGranted, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('auto');
  const [accessStats, setAccessStats] = useState({
    todayEntries: 0,
    activeMembers: 0,
    staffPresent: 0
  });

  useEffect(() => {
    // Auto-select appropriate tab based on user role
    if (user) {
      if (user.role === 'member') {
        setActiveTab('qr');
      } else if (user.role === 'trainer' || user.role === 'gym-owner') {
        setActiveTab('staff');
      } else {
        setActiveTab('qr'); // Default to QR for other roles
      }
    }
    
    loadAccessStats();
  }, [user]);

  const loadAccessStats = async () => {
    try {
      // This would typically fetch from your API
      // For now, using mock data
      setAccessStats({
        todayEntries: 45,
        activeMembers: 12,
        staffPresent: 3
      });
    } catch (error) {
      console.error('Failed to load access stats:', error);
    }
  };

  const handleAccessSuccess = (accessData) => {
    toast.success(`Welcome to the gym, ${accessData.user?.name || 'User'}!`);
    loadAccessStats(); // Refresh stats
    onAccessGranted?.(accessData);
  };

  const getUserRoleInfo = () => {
    if (!user) return { role: 'Guest', icon: User, color: 'secondary' };
    
    switch (user.role) {
      case 'member':
        return { role: 'Member', icon: User, color: 'default' };
      case 'trainer':
        return { role: 'Trainer', icon: Users, color: 'secondary' };
      case 'gym-owner':
        return { role: 'Gym Owner', icon: Building, color: 'default' };
      case 'super-admin':
        return { role: 'Super Admin', icon: Shield, color: 'destructive' };
      default:
        return { role: 'Guest', icon: User, color: 'outline' };
    }
  };

  const roleInfo = getUserRoleInfo();
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-400" />
                <div>
                  <CardTitle className="text-white text-2xl">GymFlow Access Control</CardTitle>
                  <CardDescription className="text-gray-400">
                    Secure gym entry system for all users
                  </CardDescription>
                </div>
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <Badge variant={roleInfo.color} className="flex items-center gap-1">
                    <RoleIcon className="h-3 w-3" />
                    {roleInfo.role}
                  </Badge>
                  <span className="text-sm text-gray-400">{user.name}</span>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Access Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{accessStats.todayEntries}</div>
                  <div className="text-sm text-gray-400">Today's Entries</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-green-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{accessStats.activeMembers}</div>
                  <div className="text-sm text-gray-400">Active Members</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-400" />
                <div>
                  <div className="text-2xl font-bold text-white">{accessStats.staffPresent}</div>
                  <div className="text-sm text-gray-400">Staff Present</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Access Methods */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Choose Access Method</CardTitle>
            <CardDescription className="text-gray-400">
              Select the appropriate method based on your role and situation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700">
                <TabsTrigger 
                  value="qr" 
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Scanner
                </TabsTrigger>
                <TabsTrigger 
                  value="staff"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  disabled={!user || (user.role !== 'trainer' && user.role !== 'gym-owner')}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Staff Access
                </TabsTrigger>
                <TabsTrigger 
                  value="admin"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                  disabled={!user || user.role !== 'super-admin'}
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Admin Override
                </TabsTrigger>
              </TabsList>

              {/* QR Code Scanner Tab */}
              <TabsContent value="qr" className="mt-6">
                <Card className="bg-gray-700/50 border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      QR Code Scanner
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Scan your membership QR code to enter the gym
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <QRCodeScanner 
                      onScanSuccess={handleAccessSuccess}
                      onClose={onClose}
                      memberId={user?._id}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Staff Access Tab */}
              <TabsContent value="staff" className="mt-6">
                {user && (user.role === 'trainer' || user.role === 'gym-owner') ? (
                  <StaffAccessControl 
                    onAccessGranted={handleAccessSuccess}
                    onClose={onClose}
                  />
                ) : (
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <AlertTriangle className="h-12 w-12 mx-auto text-yellow-400" />
                        <div>
                          <h3 className="text-lg font-medium text-white">Access Restricted</h3>
                          <p className="text-gray-400">
                            Staff access is only available for trainers and gym owners.
                          </p>
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={() => setActiveTab('qr')}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          Use QR Scanner Instead
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Admin Override Tab */}
              <TabsContent value="admin" className="mt-6">
                {user && user.role === 'super-admin' ? (
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Administrator Override
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Emergency access and system override controls
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5" />
                            <div>
                              <h4 className="font-medium text-red-300">Administrator Access</h4>
                              <p className="text-sm text-red-200">
                                This override grants immediate access and logs all activities for security review.
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          onClick={() => handleAccessSuccess({
                            method: 'admin-override',
                            user: user,
                            timestamp: new Date().toISOString()
                          })}
                          variant="destructive"
                          className="w-full"
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Grant Administrator Access
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-gray-700/50 border-gray-600">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <Shield className="h-12 w-12 mx-auto text-red-400" />
                        <div>
                          <h3 className="text-lg font-medium text-white">Administrator Only</h3>
                          <p className="text-gray-400">
                            This access method is restricted to system administrators.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Access Instructions */}
        <Card className="bg-blue-900/20 border-blue-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <h4 className="font-medium text-blue-300">Access Instructions</h4>
                <div className="text-sm text-blue-200 space-y-1">
                  <p><strong>Members:</strong> Use the QR scanner to scan your membership QR code</p>
                  <p><strong>Trainers:</strong> Use staff access with your PIN or biometric authentication</p>
                  <p><strong>Gym Owners:</strong> Use staff access or QR scanner based on your preference</p>
                  <p><strong>Emergency:</strong> Contact gym administration for emergency access codes</p>
                </div>
                <div className="mt-3 p-2 bg-blue-800/30 rounded text-xs text-blue-100">
                  <strong>Security Note:</strong> All access attempts are logged and monitored for security purposes.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Close Button */}
        {onClose && (
          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Close Access Control
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UniversalAccessControl;