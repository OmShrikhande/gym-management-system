import Subscription from '../models/subscriptionModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get total revenue
export const getTotalRevenue = catchAsync(async (req, res, next) => {
  // Aggregate all successful payments
  const result = await Subscription.aggregate([
    // Unwind the payment history array to get individual payments
    { $unwind: "$paymentHistory" },
    // Filter for successful payments only
    { $match: { "paymentHistory.status": "Success" } },
    // Group by null to sum all payments
    { 
      $group: { 
        _id: null, 
        totalRevenue: { $sum: "$paymentHistory.amount" },
        paymentCount: { $sum: 1 }
      } 
    }
  ]);

  const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
  const paymentCount = result.length > 0 ? result[0].paymentCount : 0;

  res.status(200).json({
    status: 'success',
    data: {
      totalRevenue,
      paymentCount
    }
  });
});

// Helper function to calculate subscription end date
const calculateEndDate = (startDate, months) => {
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + months);
  return endDate;
};

// Create a new subscription
export const createSubscription = catchAsync(async (req, res, next) => {
  const { gymOwnerId, plan, price, durationMonths = 1, paymentMethod, transactionId } = req.body;

  // Check if gym owner exists
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return next(new AppError('No gym owner found with that ID', 404));
  }

  // Calculate end date
  const startDate = new Date();
  const endDate = calculateEndDate(startDate, durationMonths);

  // Create subscription
  const subscription = await Subscription.create({
    gymOwner: gymOwnerId,
    plan,
    price,
    startDate,
    endDate,
    isActive: true,
    paymentStatus: 'Paid',
    paymentHistory: [
      {
        amount: price,
        date: startDate,
        method: paymentMethod,
        status: 'Success',
        transactionId
      }
    ],
    autoRenew: true
  });

  // Create notification for successful payment
  await Notification.create({
    recipient: gymOwnerId,
    type: 'payment_success',
    title: 'Subscription Payment Successful',
    message: `Your payment of $${price} for the ${plan} plan was successful. Your subscription is valid until ${endDate.toLocaleDateString()}.`,
    actionLink: '/billing-plans'
  });

  res.status(201).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Get subscription by ID
export const getSubscription = catchAsync(async (req, res, next) => {
  const subscription = await Subscription.findById(req.params.id);

  if (!subscription) {
    return next(new AppError('No subscription found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Get subscription by gym owner ID
export const getGymOwnerSubscription = catchAsync(async (req, res, next) => {
  const { gymOwnerId } = req.params;

  const subscription = await Subscription.findOne({ 
    gymOwner: gymOwnerId,
    isActive: true 
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return next(new AppError('No active subscription found for this gym owner', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Update subscription
export const updateSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { plan, price, endDate, isActive, paymentStatus, autoRenew } = req.body;

  const subscription = await Subscription.findByIdAndUpdate(
    id,
    { plan, price, endDate, isActive, paymentStatus, autoRenew },
    { new: true, runValidators: true }
  );

  if (!subscription) {
    return next(new AppError('No subscription found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Renew subscription
export const renewSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { durationMonths = 1, paymentMethod, transactionId } = req.body;

  // Find the subscription
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('No subscription found with that ID', 404));
  }

  // Calculate new end date
  const newEndDate = calculateEndDate(
    subscription.endDate > new Date() ? subscription.endDate : new Date(),
    durationMonths
  );

  // Update subscription
  subscription.endDate = newEndDate;
  subscription.isActive = true;
  subscription.paymentStatus = 'Paid';
  subscription.paymentHistory.push({
    amount: subscription.price,
    date: new Date(),
    method: paymentMethod,
    status: 'Success',
    transactionId
  });

  await subscription.save();

  // Create notification for successful renewal
  await Notification.create({
    recipient: subscription.gymOwner,
    type: 'payment_success',
    title: 'Subscription Renewed Successfully',
    message: `Your subscription has been renewed. Your new subscription end date is ${newEndDate.toLocaleDateString()}.`,
    actionLink: '/billing-plans'
  });

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Cancel subscription
export const cancelSubscription = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const subscription = await Subscription.findByIdAndUpdate(
    id,
    { isActive: false, autoRenew: false },
    { new: true }
  );

  if (!subscription) {
    return next(new AppError('No subscription found with that ID', 404));
  }

  // Create notification for cancellation
  await Notification.create({
    recipient: subscription.gymOwner,
    type: 'system',
    title: 'Subscription Cancelled',
    message: 'Your subscription has been cancelled. You will lose access to the system when your current subscription period ends.',
    actionLink: '/billing-plans'
  });

  res.status(200).json({
    status: 'success',
    data: {
      subscription
    }
  });
});

// Check subscription status
export const checkSubscriptionStatus = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('User not found', 404));
  }

  // If user is not a gym owner, they don't need a subscription
  if (user.role !== 'gym-owner') {
    return res.status(200).json({
      status: 'success',
      data: {
        requiresSubscription: false,
        hasActiveSubscription: true,
        daysRemaining: null,
        subscription: null
      }
    });
  }

  // Find active subscription for gym owner
  const subscription = await Subscription.findOne({
    gymOwner: userId,
    isActive: true
  }).sort({ createdAt: -1 });

  if (!subscription) {
    return res.status(200).json({
      status: 'success',
      data: {
        requiresSubscription: true,
        hasActiveSubscription: false,
        daysRemaining: 0,
        subscription: null
      }
    });
  }

  // Calculate days remaining
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));

  // Check if subscription is about to expire (2 days or less)
  if (daysRemaining <= 2 && daysRemaining > 0) {
    // Create expiration notification if not already created
    const existingNotification = await Notification.findOne({
      recipient: userId,
      type: 'subscription_expiring',
      read: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Created in the last 24 hours
    });

    if (!existingNotification) {
      await Notification.create({
        recipient: userId,
        type: 'subscription_expiring',
        title: 'Subscription Expiring Soon',
        message: `Your subscription will expire in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}. Please renew to avoid service interruption.`,
        actionLink: '/billing-plans'
      });
    }
  }

  // Check if subscription has expired
  if (daysRemaining <= 0) {
    // Update subscription status
    subscription.isActive = false;
    subscription.paymentStatus = 'Overdue';
    await subscription.save();

    // Create expiration notification if not already created
    const existingNotification = await Notification.findOne({
      recipient: userId,
      type: 'subscription_expired',
      read: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Created in the last 24 hours
    });

    if (!existingNotification) {
      await Notification.create({
        recipient: userId,
        type: 'subscription_expired',
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Please renew to regain access to the system.',
        actionLink: '/billing-plans'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        requiresSubscription: true,
        hasActiveSubscription: false,
        daysRemaining: 0,
        subscription
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      requiresSubscription: true,
      hasActiveSubscription: true,
      daysRemaining,
      subscription
    }
  });
});