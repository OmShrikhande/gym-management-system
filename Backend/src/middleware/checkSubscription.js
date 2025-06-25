import Subscription from '../models/subscriptionModel.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';

// Middleware to check if a gym owner has an active subscription
export const checkActiveSubscription = catchAsync(async (req, res, next) => {
  // Skip check for non-gym-owners and super-admin
  if (req.user.role !== 'gym-owner' || req.user.role === 'super-admin') {
    return next();
  }

  // Find active subscription for gym owner
  const subscription = await Subscription.findOne({
    gymOwner: req.user._id,
    isActive: true
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return next(new AppError('Your subscription has expired. Please renew to access the system.', 403));
  }

  // Check if subscription has expired
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  
  if (endDate < today) {
    // Update subscription status
    subscription.isActive = false;
    subscription.paymentStatus = 'Overdue';
    await subscription.save();
    
    return next(new AppError('Your subscription has expired. Please renew to access the system.', 403));
  }

  // Add subscription to request object
  req.subscription = subscription;
  next();
});