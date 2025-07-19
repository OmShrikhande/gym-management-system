import express from 'express';
import * as subscriptionController from '../controllers/subscriptionController.js';
import * as authController from '../controllers/authController.js';
import * as paymentController from '../controllers/paymentController.js';
import { subscriptionCache, dashboardCache } from '../middleware/cache.js';

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Check subscription status - accessible to all authenticated users
router.get('/status/:userId', subscriptionController.checkSubscriptionStatus);

// Get subscription details - accessible to gym owners for their own subscription
router.get('/details/:userId', subscriptionController.getGymOwnerSubscription);

// Create Razorpay order for subscription renewal
router.post('/:id/create-payment', paymentController.createRazorpayOrder);

// Renew subscription - accessible to gym owners for their own subscription
router.post('/:id/renew', subscriptionController.renewSubscription);

// Create subscription - accessible to gym owners for test mode and super admin
router.post('/', subscriptionController.createSubscription);

// Routes accessible to super admin only (with caching)
router.get('/revenue/total', 
  authController.restrictTo('super-admin'),
  dashboardCache,
  subscriptionController.getTotalRevenue
);

router.get('/active-gyms/count', 
  authController.restrictTo('super-admin'),
  subscriptionController.getActiveGymCount
);

// Routes for super admin only
router.use(authController.restrictTo('super-admin'));

router.route('/')
  .get(subscriptionController.getAllSubscriptions);

router.route('/:id')
  .get(subscriptionController.getSubscription)
  .patch(subscriptionController.updateSubscription);

router.route('/gym-owner/:gymOwnerId')
  .get(subscriptionController.getGymOwnerSubscription);

router.route('/:id/cancel')
  .patch(subscriptionController.cancelSubscription);

export default router;