import express from 'express';
import { protect } from '../controllers/authController.js';
import { 
  verifyMembershipForNodeMCU, 
  getAccessLogs, 
  deviceHealthCheck 
} from '../controllers/nodeMcuController.js';

const router = express.Router();

// Public routes for NodeMCU (no authentication required)
// NodeMCU will send requests to these endpoints
router.post('/verify', verifyMembershipForNodeMCU);
router.post('/health', deviceHealthCheck);

// Protected routes (require authentication)
router.use(protect);

// Get access logs for gym owner
router.get('/logs/:gymOwnerId', getAccessLogs);

export default router;