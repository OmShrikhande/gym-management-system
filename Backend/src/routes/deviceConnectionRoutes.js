import express from 'express';
import deviceSocketService from '../services/deviceSocketService.js';
import catchAsync from '../utils/catchAsync.js';

const router = express.Router();

// Get connected devices status
router.get('/connected-devices', catchAsync(async (req, res) => {
  const connectedDevices = deviceSocketService.getConnectedDevices();
  
  res.status(200).json({
    status: 'success',
    message: 'Connected devices retrieved successfully',
    data: {
      totalDevices: connectedDevices.length,
      devices: connectedDevices
    }
  });
}));

// Check if device is listening for a specific gym
router.get('/check-listening/:gymOwnerId', catchAsync(async (req, res) => {
  const { gymOwnerId } = req.params;
  const isListening = deviceSocketService.isDeviceListening(gymOwnerId);
  
  res.status(200).json({
    status: 'success',
    message: `Device listening status for gym ${gymOwnerId}`,
    data: {
      gymOwnerId,
      isListening,
      status: isListening ? 'Device is listening' : 'No device listening'
    }
  });
}));

// Send test message to device
router.post('/test-message', catchAsync(async (req, res) => {
  const { gymOwnerId, message } = req.body;
  
  if (!gymOwnerId || !message) {
    return res.status(400).json({
      status: 'error',
      message: 'Gym owner ID and message are required'
    });
  }
  
  const sent = deviceSocketService.broadcastToGym(gymOwnerId, 'test-message', {
    message,
    testType: 'manual'
  });
  
  res.status(200).json({
    status: sent ? 'success' : 'error',
    message: sent ? 'Test message sent to device' : 'No device listening for this gym',
    data: {
      gymOwnerId,
      messageSent: sent
    }
  });
}));

export default router;