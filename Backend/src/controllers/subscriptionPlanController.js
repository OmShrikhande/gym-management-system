import SubscriptionPlan from '../models/subscriptionPlanModel.js';
import Subscription from '../models/subscriptionModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get all subscription plans
export const getAllPlans = catchAsync(async (req, res, next) => {
  // Only return active plans by default, unless specifically requested
  const filter = req.query.includeInactive ? {} : { status: 'Active' };
  
  const plans = await SubscriptionPlan.find(filter);
  
  // Log the number of plans found
  console.log(`Found ${plans.length} subscription plans with filter:`, filter);
  
  // If no plans are found and we're not including inactive plans, create default plans
  if (plans.length === 0 && !req.query.includeInactive) {
    console.log('No active plans found. Creating default plans...');
    
    // Create default plans if none exist
    const defaultPlans = [
      {
        name: "Basic",
        price: 49,
        duration: "monthly",
        maxMembers: 200,
        maxTrainers: 5,
        features: ["Member Management", "Basic Reports", "Email Support"],
        status: "Active"
      },
      {
        name: "Premium",
        price: 99,
        duration: "monthly",
        maxMembers: 500,
        maxTrainers: 15,
        features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support"],
        status: "Active",
        recommended: true
      },
      {
        name: "Enterprise",
        price: 199,
        duration: "monthly",
        maxMembers: 1000,
        maxTrainers: 50,
        features: ["All Premium Features", "Custom Branding", "API Access", "Dedicated Support"],
        status: "Active"
      }
    ];
    
    try {
      // Create the default plans
      await SubscriptionPlan.create(defaultPlans);
      
      // Fetch the newly created plans
      const newPlans = await SubscriptionPlan.find({ status: 'Active' });
      
      return res.status(200).json({
        status: 'success',
        results: newPlans.length,
        data: {
          plans: newPlans
        }
      });
    } catch (error) {
      console.error('Error creating default plans:', error);
    }
  }
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});

// Get a single subscription plan
export const getPlan = catchAsync(async (req, res, next) => {
  const plan = await SubscriptionPlan.findById(req.params.id);
  
  if (!plan) {
    return next(new AppError('No subscription plan found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// Create a new subscription plan
export const createPlan = catchAsync(async (req, res, next) => {
  const newPlan = await SubscriptionPlan.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      plan: newPlan
    }
  });
});

// Update a subscription plan
export const updatePlan = catchAsync(async (req, res, next) => {
  const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  if (!plan) {
    return next(new AppError('No subscription plan found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// Delete a subscription plan
export const deletePlan = catchAsync(async (req, res, next) => {
  // Check if the plan is in use by any subscriptions
  const subscriptionsUsingPlan = await Subscription.countDocuments({ plan: req.params.id });
  
  if (subscriptionsUsingPlan > 0) {
    return next(new AppError('This plan is currently in use by active subscriptions and cannot be deleted', 400));
  }
  
  const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
  
  if (!plan) {
    return next(new AppError('No subscription plan found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get plan usage statistics
export const getPlanStats = catchAsync(async (req, res, next) => {
  const planId = req.params.id;
  
  // Check if plan exists
  const plan = await SubscriptionPlan.findById(planId);
  if (!plan) {
    return next(new AppError('No subscription plan found with that ID', 404));
  }
  
  // Count active subscriptions using this plan
  const activeSubscriptions = await Subscription.countDocuments({ 
    plan: plan.name,
    isActive: true
  });
  
  // Calculate total revenue from this plan
  const subscriptions = await Subscription.find({ plan: plan.name });
  const totalRevenue = subscriptions.reduce((sum, sub) => {
    // Sum up all payments in the payment history
    const paymentTotal = sub.paymentHistory.reduce((paymentSum, payment) => {
      return paymentSum + payment.amount;
    }, 0);
    
    return sum + paymentTotal;
  }, 0);
  
  res.status(200).json({
    status: 'success',
    data: {
      plan: plan.name,
      activeSubscriptions,
      totalRevenue,
      totalSubscriptions: subscriptions.length
    }
  });
});