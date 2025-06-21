import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import * as authController from '../controllers/authController.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Check subscription status
router.get('/status/:userId', subscriptionController.checkSubscriptionStatus);

// Routes accessible to super admin only
router.get('/revenue/total', 
  authController.restrictTo('super-admin'),
  subscriptionController.getTotalRevenue
);

// Routes for super admin only
router.use(authController.restrictTo('super-admin'));

router.route('/')
  .get(subscriptionController.getAllSubscriptions)
  .post(subscriptionController.createSubscription);

router.route('/:id')
  .get(subscriptionController.getSubscription)
  .patch(subscriptionController.updateSubscription);

router.route('/gym-owner/:gymOwnerId')
  .get(subscriptionController.getGymOwnerSubscription);

router.route('/:id/renew')
  .post(subscriptionController.renewSubscription);

router.route('/:id/cancel')
  .patch(subscriptionController.cancelSubscription);

export default router;