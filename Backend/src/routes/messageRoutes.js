import express from 'express';
import * as messageController from '../controllers/messageController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Restrict to gym owners and admins
router.use(authController.restrictTo('super-admin', 'gym-owner'));

// Get message templates
router.get('/templates', messageController.getMessageTemplates);

// Create a new message template
router.post('/templates', messageController.createMessageTemplate);

// Update a message template
router.patch('/templates/:id', messageController.updateMessageTemplate);

// Delete a message template
router.delete('/templates/:id', messageController.deleteMessageTemplate);

// Send message to all members
router.post('/send-to-all', messageController.sendMessageToAllMembers);

// Send message to specific member
router.post('/send-to-member/:memberId', messageController.sendMessageToMember);

// Get message history
router.get('/history', messageController.getMessageHistory);

export default router;