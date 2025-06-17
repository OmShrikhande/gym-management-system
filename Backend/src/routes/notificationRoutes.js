import express from 'express';
import * as notificationController from '../controllers/notificationController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Get user notifications
router.get('/user/:userId', notificationController.getUserNotifications);

// Get unread notification count
router.get('/user/:userId/unread-count', notificationController.getUnreadCount);

// Mark all notifications as read
router.patch('/user/:userId/mark-all-read', notificationController.markAllAsRead);

// Mark notification as read
router.patch('/:id/mark-read', notificationController.markAsRead);

// Create notification (admin only)
router.post('/', 
  authController.restrictTo('super-admin', 'gym-owner'),
  notificationController.createNotification
);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

export default router;