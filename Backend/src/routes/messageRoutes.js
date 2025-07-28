import express from 'express';
import * as messageController from '../controllers/messageController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict to gym owners and admins
router.use(authController.restrictTo('super-admin', 'gym-owner'));

// Send message to all members
router.post('/send-to-all', messageController.sendMessageToAllMembers);

// Get message history
router.get('/history', messageController.getMessageHistory);

export default router;