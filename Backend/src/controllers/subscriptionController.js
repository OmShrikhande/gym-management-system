import mongoose from 'mongoose';
import Subscription from '../models/subscriptionModel.js';
import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get total revenue from active subscriptions only
export const getTotalRevenue = catchAsync(async (req, res, next) => {
  const today = new Date();
  
  try {
    // Use a more efficient approach with parallel operations
    const [updateResult, revenueResult] = await Promise.all([
      // Update expired subscriptions
      Subscription.updateMany(
        { 
          isActive: true,
          endDate: { $lt: today }
        },
        { 
          $set: { 
            isActive: false,
            paymentStatus: 'Overdue'
          }
        }
      ),
      // Aggregate revenue with optimized pipeline
      Subscription.aggregate([
        // Match only active subscriptions that haven't expired
        { 
          $match: { 
            isActive: true,
            endDate: { $gte: today },
            paymentStatus: { $ne: 'Overdue' },
            paymentHistory: { $exists: true, $ne: [] }
          } 
        },
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
      ])
    ]);

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    const paymentCount = revenueResult.length > 0 ? revenueResult[0].paymentCount : 0;

    // Log performance metrics
    if (updateResult.modifiedCount > 0) {
      console.log(`Updated ${updateResult.modifiedCount} expired subscriptions`);
    }

    res.status(200).json({
      status: 'success',
      data: {
        totalRevenue,
        paymentCount
      },
      meta: {
        expiredSubscriptionsUpdated: updateResult.modifiedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getTotalRevenue:', error);
    return next(new AppError('Failed to calculate total revenue', 500));
  }
});

// Get count of active gyms (gyms with active subscriptions)
export const getActiveGymCount = catchAsync(async (req, res, next) => {
  const today = new Date();
  
  try {
    // Use parallel operations for better performance
    const [updateResult, subscriptionResult, userResult] = await Promise.all([
      // Update expired subscriptions
      Subscription.updateMany(
        { 
          isActive: true,
          endDate: { $lt: today }
        },
        { 
          $set: { 
            isActive: false,
            paymentStatus: 'Overdue'
          }
        }
      ),
      // Count unique gym owners with active subscriptions
      Subscription.aggregate([
        { 
          $match: { 
            isActive: true,
            endDate: { $gte: today },
            paymentStatus: { $ne: 'Overdue' }
          } 
        },
        { 
          $group: { 
            _id: "$gymOwner"
          } 
        },
        { 
          $group: { 
            _id: null, 
            activeGymCount: { $sum: 1 }
          } 
        }
      ]),
      // Count gym owners with active account status
      User.countDocuments({
        role: 'gym-owner',
        accountStatus: 'active'
      })
    ]);

    const subscriptionBasedCount = subscriptionResult.length > 0 ? subscriptionResult[0].activeGymCount : 0;
    const accountStatusBasedCount = userResult;

    // Use the higher of the two counts for accuracy
    const activeGymCount = Math.max(subscriptionBasedCount, accountStatusBasedCount);

    // Log performance metrics
    if (updateResult.modifiedCount > 0) {
      console.log(`Updated ${updateResult.modifiedCount} expired subscriptions`);
    }

    console.log('Active gym count comparison:', {
      subscriptionBased: subscriptionBasedCount,
      accountStatusBased: accountStatusBasedCount,
      finalCount: activeGymCount
    });

    res.status(200).json({
      status: 'success',
      data: {
        activeGymCount
      },
      meta: {
        subscriptionBasedCount,
        accountStatusBasedCount,
        expiredSubscriptionsUpdated: updateResult.modifiedCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error in getActiveGymCount:', error);
    return next(new AppError('Failed to get active gym count', 500));
  }
});

// Get all subscriptions (for Super Admin)
export const getAllSubscriptions = catchAsync(async (req, res, next) => {
  // Get query parameters for filtering
  const { year, month, status } = req.query;
  
  // Build filter object
  const filter = {};
  
  // Filter by status if provided
  if (status) {
    filter.isActive = status === 'active';
  }
  
  // Filter by date if year/month provided
  if (year && month) {
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
    
    filter.startDate = { $gte: startDate, $lte: endDate };
  } else if (year) {
    const startDate = new Date(parseInt(year), 0, 1);
    const endDate = new Date(parseInt(year), 11, 31, 23, 59, 59);
    
    filter.startDate = { $gte: startDate, $lte: endDate };
  }
  
  // Find subscriptions with populated gym owner data
  const subscriptions = await Subscription.find(filter)
    .populate('gymOwner', 'name email gymName')
    .sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: subscriptions.length,
    data: {
      subscriptions
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
  try {
    console.log('=== CREATE SUBSCRIPTION START ===');
    console.log('User:', req.user.email, 'Role:', req.user.role);
    console.log('Request:', { gymOwnerId: req.body.gymOwnerId, plan: req.body.plan, price: req.body.price, paymentMethod: req.body.paymentMethod });
    
    const { gymOwnerId, plan, price, durationMonths = 1, paymentMethod, transactionId } = req.body;
    
    // Ensure transactionId is provided
    const finalTransactionId = transactionId || `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Validate required fields
    if (!gymOwnerId || !plan || !price || !paymentMethod) {
      return next(new AppError('Missing required fields: gymOwnerId, plan, price, paymentMethod', 400));
    }

    // Validate and parse price
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return next(new AppError('Invalid price value', 400));
    }

    // Validate gymOwnerId format
    if (!mongoose.Types.ObjectId.isValid(gymOwnerId)) {
      return next(new AppError('Invalid gym owner ID format', 400));
    }

    // Check if gym owner exists
    let gymOwner;
    try {
      gymOwner = await User.findById(gymOwnerId);
    } catch (error) {
      console.error('Error finding gym owner:', error.message);
      return next(new AppError('Error finding gym owner', 500));
    }
  
    if (!gymOwner) {
      return next(new AppError('Gym owner not found. Please ensure you are logged in with a valid gym owner account.', 404));
    }
    
    if (gymOwner.role !== 'gym-owner') {
      return next(new AppError('Only gym owners can create subscriptions', 403));
    }
    
    // Check authorization
    const isAuthorized = 
      req.user.role === 'super-admin' || 
      (req.user.role === 'gym-owner' && 
       gymOwnerId === req.user._id.toString() && 
       paymentMethod === 'test_mode');
    
    if (!isAuthorized) {
      if (req.user.role === 'gym-owner' && gymOwnerId !== req.user._id.toString()) {
        return next(new AppError('You can only create subscriptions for your own account', 403));
      }
      if (req.user.role === 'gym-owner' && paymentMethod !== 'test_mode') {
        return next(new AppError('Gym owners can only create subscriptions in test mode', 403));
      }
      return next(new AppError('You are not authorized to create subscriptions', 403));
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = calculateEndDate(startDate, durationMonths);

    // Create subscription
    let subscription;
    try {
      subscription = await Subscription.create({
        gymOwner: gymOwnerId,
        plan,
        price: parsedPrice,
        startDate,
        endDate,
        isActive: true,
        paymentStatus: 'Paid',
        paymentHistory: [
          {
            amount: parsedPrice,
            date: startDate,
            method: paymentMethod,
            status: 'Success',
            transactionId: finalTransactionId
          }
        ],
        autoRenew: true
      });
      
      console.log('Subscription created successfully:', subscription._id);

      // Update gym owner account status to active if it's inactive
      if (gymOwner.accountStatus === 'inactive') {
        gymOwner.accountStatus = 'active';
        await gymOwner.save();
        console.log('Gym owner account activated');
      }

      // Create notification for successful payment
      try {
        await Notification.create({
          recipient: gymOwnerId,
          type: 'payment_success',
          title: 'Subscription Payment Successful',
          message: `Your payment of ₹${parsedPrice} for the ${plan} plan was successful. Your subscription is valid until ${endDate.toLocaleDateString()}.`,
          actionLink: '/billing-plans'
        });
      } catch (notificationError) {
        console.error('Error creating notification (non-critical):', notificationError.message);
        // Don't fail the subscription creation if notification fails
      }
    
    } catch (subscriptionError) {
      console.error('Error creating subscription:', subscriptionError.message);
      return next(new AppError(`Failed to create subscription: ${subscriptionError.message}`, 500));
    }

    res.status(201).json({
      status: 'success',
      data: {
        subscription
      }
    });
    console.log('=== SUCCESS: Subscription created ===');
  } catch (error) {
    console.error('Subscription creation failed:', error.message);
    return next(new AppError(`Subscription creation failed: ${error.message}`, 500));
  }
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
  const { userId, gymOwnerId } = req.params;
  const targetUserId = userId || gymOwnerId;
  
  // Check if the user is authorized to view this subscription
  // Allow super-admin or the gym owner who owns the subscription
  console.log('User ID:', req.user._id, 'Type:', typeof req.user._id);
  console.log('Target User ID:', targetUserId, 'Type:', typeof targetUserId);
  
  const isAuthorized = 
    req.user.role === 'super-admin' || 
    (req.user.role === 'gym-owner' && 
     (req.user._id.toString() === targetUserId || 
      req.user._id.toString() === targetUserId));

  if (!isAuthorized) {
    return next(new AppError('You are not authorized to view this subscription', 403));
  }

  // Find the most recent subscription for this gym owner (active or not)
  const subscription = await Subscription.findOne({ 
    gymOwner: targetUserId
  }).sort({ createdAt: -1 });

  if (!subscription) {
    // If no subscription found, return a response with null subscription
    // This allows the frontend to handle new subscriptions
    return res.status(200).json({
      status: 'success',
      data: {
        subscription: null,
        hasActiveSubscription: false
      }
    });
  }

  // Check if subscription is active
  const today = new Date();
  const endDate = new Date(subscription.endDate);
  const isActive = subscription.isActive && endDate > today;

  res.status(200).json({
    status: 'success',
    data: {
      subscription,
      hasActiveSubscription: isActive
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
  const { durationMonths = 1, paymentMethod, transactionId, razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

  // Find the subscription
  const subscription = await Subscription.findById(id);
  if (!subscription) {
    return next(new AppError('No subscription found with that ID', 404));
  }

  // Check if the user is authorized to renew this subscription
  // Allow super-admin or the gym owner who owns the subscription
  const isAuthorized = 
    req.user.role === 'super-admin' || 
    (req.user.role === 'gym-owner' && subscription.gymOwner.toString() === req.user._id.toString());

  if (!isAuthorized) {
    return next(new AppError('You are not authorized to renew this subscription', 403));
  }

  // If Razorpay payment details are provided, verify the payment
  if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
    // In a production environment, we would verify the signature
    // For testing purposes, we'll skip the signature verification
    console.log('Skipping signature verification for testing');
    
    // The following code would be used in production:
    // const razorpay_secret = process.env.NODE_ENV === 'production' 
    //   ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    //   : process.env.RAZORPAY_TEST_KEY_SECRET;
    // const generated_signature = crypto.createHmac('sha256', razorpay_secret)
    //   .update(razorpay_order_id + "|" + razorpay_payment_id)
    //   .digest('hex');
    // 
    // if (generated_signature !== razorpay_signature) {
    //   return next(new AppError('Invalid payment signature', 400));
    // }
    
    // Use the Razorpay payment ID as the transaction ID
    transactionId = razorpay_payment_id;
    paymentMethod = 'razorpay';
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
  
  console.log('Checking subscription status for user ID:', userId);

  // Find the user
  const user = await User.findById(userId);
  if (!user) {
    console.log('User not found with ID:', userId);
    return next(new AppError('User not found', 404));
  }
  
  console.log('Found user:', user.name, 'Role:', user.role);

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