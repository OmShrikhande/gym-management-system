// routes/gateRoutes.js
import express from 'express';
import { protect } from '../controllers/authController.js';
import { getGateStatus, emergencyGateControl } from '../controllers/gateController.js';

const router = express.Router();

// All gate routes require authentication
router.use(protect);

// Get current gate status - for gym owners and trainers
router.get('/status', getGateStatus);

// Emergency gate control (always opens) - for gym owners and trainers
router.post('/emergency', emergencyGateControl);

export default router;