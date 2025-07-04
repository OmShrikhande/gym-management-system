// Device Socket Service for real-time communication with NodeMCU devices
import { Server } from 'socket.io';

class DeviceSocketService {
  constructor() {
    this.io = null;
    this.connectedDevices = new Map(); // Store connected devices by gymOwnerId
  }

  // Initialize Socket.IO server
  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.setupEventHandlers();
    console.log('✅ Device Socket Service initialized - Devices can now listen for responses');
  }

  // Set up socket event handlers
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Device connected: ${socket.id}`);

      // Device registration - device sends gymOwnerId to register for listening
      socket.on('register-device', (data) => {
        const { gymOwnerId, deviceId } = data;
        
        if (!gymOwnerId) {
          socket.emit('registration-error', { message: 'Gym Owner ID is required' });
          return;
        }

        // Store device connection
        this.connectedDevices.set(gymOwnerId, {
          socketId: socket.id,
          deviceId: deviceId || `device_${Date.now()}`,
          gymOwnerId: gymOwnerId,
          connectedAt: new Date()
        });

        // Join device to gym-specific room for listening
        socket.join(`gym_${gymOwnerId}`);
        
        console.log(`📡 Device registered and listening for gym: ${gymOwnerId}`);
        
        // Send registration confirmation
        socket.emit('registration-success', {
          message: 'Device registered successfully and listening for QR scan responses',
          gymOwnerId: gymOwnerId,
          deviceId: deviceId || `device_${Date.now()}`,
          status: 'listening'
        });
      });

      // Device heartbeat to maintain connection
      socket.on('heartbeat', (data) => {
        const { gymOwnerId } = data;
        socket.emit('heartbeat-response', {
          timestamp: new Date(),
          status: 'listening',
          message: 'Device is listening for QR scan responses'
        });
      });

      // Handle device disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 Device disconnected: ${socket.id}`);
        
        // Remove device from connected devices
        for (const [gymOwnerId, deviceInfo] of this.connectedDevices.entries()) {
          if (deviceInfo.socketId === socket.id) {
            this.connectedDevices.delete(gymOwnerId);
            console.log(`📡 Device stopped listening for gym: ${gymOwnerId}`);
            break;
          }
        }
      });
    });
  }

  // Send QR scan response to listening device
  sendQRScanResponse(gymOwnerId, responseData) {
    try {
      const deviceInfo = this.connectedDevices.get(gymOwnerId);
      
      if (!deviceInfo) {
        console.log(`❌ No device listening for gym: ${gymOwnerId}`);
        return false;
      }

      // Send QR scan response to the listening device
      this.io.to(deviceInfo.socketId).emit('qr-scan-response', {
        timestamp: new Date(),
        gymOwnerId: gymOwnerId,
        ...responseData
      });

      console.log(`📤 QR Scan Response sent to listening device for gym: ${gymOwnerId}`);
      console.log(`📄 Response data:`, responseData);
      return true;
    } catch (error) {
      console.error('Error sending QR scan response:', error);
      return false;
    }
  }

  // Send access control response to device
  sendAccessResponse(gymOwnerId, responseData) {
    try {
      const deviceInfo = this.connectedDevices.get(gymOwnerId);
      
      if (!deviceInfo) {
        console.log(`❌ No device listening for gym: ${gymOwnerId}`);
        return false;
      }

      // Send access response to the listening device
      this.io.to(deviceInfo.socketId).emit('access-response', {
        timestamp: new Date(),
        gymOwnerId: gymOwnerId,
        ...responseData
      });

      console.log(`📤 Access Response sent to listening device for gym: ${gymOwnerId}`);
      console.log(`📄 Response data:`, responseData);
      return true;
    } catch (error) {
      console.error('Error sending access response:', error);
      return false;
    }
  }

  // Broadcast message to all devices in a gym
  broadcastToGym(gymOwnerId, eventName, data) {
    try {
      this.io.to(`gym_${gymOwnerId}`).emit(eventName, {
        timestamp: new Date(),
        gymOwnerId: gymOwnerId,
        ...data
      });
      
      console.log(`📢 Broadcast sent to listening devices in gym ${gymOwnerId}: ${eventName}`);
      return true;
    } catch (error) {
      console.error('Error broadcasting to gym:', error);
      return false;
    }
  }

  // Get connected devices status
  getConnectedDevices() {
    const devicesStatus = [];
    
    for (const [gymOwnerId, deviceInfo] of this.connectedDevices.entries()) {
      devicesStatus.push({
        gymOwnerId: gymOwnerId,
        deviceId: deviceInfo.deviceId,
        socketId: deviceInfo.socketId,
        connectedAt: deviceInfo.connectedAt,
        status: 'listening'
      });
    }
    
    return devicesStatus;
  }

  // Check if device is connected and listening for a gym
  isDeviceListening(gymOwnerId) {
    return this.connectedDevices.has(gymOwnerId);
  }
}

// Export singleton instance
export default new DeviceSocketService();