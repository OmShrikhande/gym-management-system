// routes/deviceRoutes.js
import express from 'express';
import { protect } from '../controllers/authController.js';
import {
  registerDevice,
  getGymDevices,
  updateDeviceHeartbeat,
  validateMembershipWithDevice,
  getDeviceAccessLogs,
  deactivateDevice
} from '../controllers/deviceController.js';

const router = express.Router();

// Public routes for NodeMCU devices (no authentication required)
router.post('/heartbeat', updateDeviceHeartbeat);
router.post('/validate', validateMembershipWithDevice);

// Protected routes (require authentication)
router.use(protect);

// Device management routes for gym owners
router.post('/register', registerDevice);
router.get('/my-devices', getGymDevices);
router.get('/:deviceId/logs', getDeviceAccessLogs);
router.patch('/:deviceId/deactivate', deactivateDevice);

export default router;