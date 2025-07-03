import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Plus, 
  Settings, 
  Activity, 
  MapPin, 
  Clock,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

const DeviceManagement = () => {
  const { token, user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newDevice, setNewDevice] = useState({
    deviceId: '',
    deviceLocation: '',
    deviceType: 'NodeMCU'
  });

  useEffect(() => {
    if (user?.role === 'gym-owner') {
      fetchDevices();
    }
  }, [user]);

  const fetchDevices = async () => {
    try {
      const response = await axios.get('http://localhost:8081/api/devices/my-devices', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(response.data.data.devices);
    } catch (error) {
      console.error('Error fetching devices:', error);
      toast.error('Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  const registerDevice = async () => {
    if (!newDevice.deviceId || !newDevice.deviceLocation) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await axios.post('http://localhost:8081/api/devices/register', newDevice, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Device registered successfully!');
      setNewDevice({ deviceId: '', deviceLocation: '', deviceType: 'NodeMCU' });
      setShowAddDevice(false);
      fetchDevices();
    } catch (error) {
      console.error('Error registering device:', error);
      toast.error(error.response?.data?.message || 'Failed to register device');
    }
  };

  const deactivateDevice = async (deviceId) => {
    try {
      await axios.patch(`http://localhost:8081/api/devices/${deviceId}/deactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Device deactivated successfully');
      fetchDevices();
    } catch (error) {
      console.error('Error deactivating device:', error);
      toast.error('Failed to deactivate device');
    }
  };

  const getStatusColor = (device) => {
    if (!device.isOnline) return 'bg-red-500';
    if (device.status === 'active') return 'bg-green-500';
    if (device.status === 'maintenance') return 'bg-yellow-500';
    return 'bg-gray-500';
  };

  const getStatusText = (device) => {
    if (!device.isOnline) return 'Offline';
    return device.status.charAt(0).toUpperCase() + device.status.slice(1);
  };

  const formatUptime = (uptime) => {
    const seconds = Math.floor(uptime / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  if (user?.role !== 'gym-owner') {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <Shield className="h-12 w-12 mx-auto mb-4" />
            <p>Device management is only available for gym owners.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-6">
          <div className="text-center text-gray-400">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading devices...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Device Management</h2>
          <p className="text-gray-400">Manage your NodeMCU access control devices</p>
        </div>
        <Button
          onClick={() => setShowAddDevice(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Device
        </Button>
      </div>

      {/* Add Device Form */}
      {showAddDevice && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Register New Device</CardTitle>
            <CardDescription className="text-gray-400">
              Add a new NodeMCU device to your gym access control system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deviceId" className="text-gray-300">Device ID</Label>
                <Input
                  id="deviceId"
                  placeholder="e.g., NODEMCU_001"
                  value={newDevice.deviceId}
                  onChange={(e) => setNewDevice({...newDevice, deviceId: e.target.value.toUpperCase()})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="deviceLocation" className="text-gray-300">Location</Label>
                <Input
                  id="deviceLocation"
                  placeholder="e.g., Main Entrance"
                  value={newDevice.deviceLocation}
                  onChange={(e) => setNewDevice({...newDevice, deviceLocation: e.target.value})}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={registerDevice} className="bg-green-600 hover:bg-green-700">
                Register Device
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddDevice(false)}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Device Configuration Instructions */}
      <Card className="bg-blue-900/20 border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-200 flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Device Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-200 space-y-2">
            <p><strong>Your Gym Owner ID:</strong> <code className="bg-blue-800 px-2 py-1 rounded">{user?._id}</code></p>
            <p><strong>Server URL:</strong> <code className="bg-blue-800 px-2 py-1 rounded">http://192.168.1.4:5000/api/devices/validate</code></p>
            <p><strong>Heartbeat URL:</strong> <code className="bg-blue-800 px-2 py-1 rounded">http://192.168.1.4:5000/api/devices/heartbeat</code></p>
            <div className="mt-4 p-3 bg-blue-800/30 rounded">
              <p className="font-medium mb-2">Configure each NodeMCU with:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Unique DEVICE_ID (e.g., NODEMCU_001, NODEMCU_002)</li>
                <li>Your GYM_OWNER_ID: {user?._id}</li>
                <li>Device location description</li>
                <li>Your WiFi credentials</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Devices List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <Card key={device._id} className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center">
                  {device.isOnline ? (
                    <Wifi className="h-5 w-5 mr-2 text-green-400" />
                  ) : (
                    <WifiOff className="h-5 w-5 mr-2 text-red-400" />
                  )}
                  {device.deviceId}
                </CardTitle>
                <Badge className={`${getStatusColor(device)} text-white`}>
                  {getStatusText(device)}
                </Badge>
              </div>
              <CardDescription className="text-gray-400 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {device.deviceLocation}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Uptime</p>
                  <p className="text-white">{formatUptime(device.systemInfo?.uptime || 0)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Free Memory</p>
                  <p className="text-white">{Math.round((device.systemInfo?.freeHeap || 0) / 1024)}KB</p>
                </div>
                <div>
                  <p className="text-gray-400">Signal</p>
                  <p className="text-white">{device.systemInfo?.rssi || 0} dBm</p>
                </div>
                <div>
                  <p className="text-gray-400">Last Seen</p>
                  <p className="text-white">
                    {new Date(device.lastHeartbeat).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Access Stats */}
              <div className="border-t border-gray-600 pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-green-400">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    <span>{device.successfulAccess || 0} Granted</span>
                  </div>
                  <div className="flex items-center text-red-400">
                    <XCircle className="h-4 w-4 mr-1" />
                    <span>{device.deniedAccess || 0} Denied</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => {/* View logs */}}
                >
                  <Activity className="h-4 w-4 mr-1" />
                  Logs
                </Button>
                {device.status === 'active' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20"
                    onClick={() => deactivateDevice(device.deviceId)}
                  >
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Deactivate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {devices.length === 0 && (
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-12">
            <div className="text-center text-gray-400">
              <Wifi className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No Devices Registered</h3>
              <p className="mb-4">Get started by registering your first NodeMCU device.</p>
              <Button
                onClick={() => setShowAddDevice(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Device
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DeviceManagement;