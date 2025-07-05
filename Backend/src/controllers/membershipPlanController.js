import MembershipPlan from '../models/membershipPlanModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get all membership plans for a gym owner
export const getAllMembershipPlans = catchAsync(async (req, res, next) => {
  let filter = {};
  
  // If user is gym owner, only show their plans
  if (req.user.role === 'gym-owner') {
    filter.gymOwner = req.user._id;
  }
  // If user is super admin, they can see all plans (with gymOwner filter if provided)
  else if (req.user.role === 'super-admin') {
    if (req.query.gymOwner) {
      filter.gymOwner = req.query.gymOwner;
    }
  }
  
  const plans = await MembershipPlan.find(filter).populate('gymOwner', 'name email');
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});

// Get a single membership plan
export const getMembershipPlan = catchAsync(async (req, res, next) => {
  const plan = await MembershipPlan.findById(req.params.id).populate('gymOwner', 'name email');
  
  if (!plan) {
    return next(new AppError('No membership plan found with that ID', 404));
  }
  
  // Check if user has access to this plan
  if (req.user.role === 'gym-owner' && plan.gymOwner._id.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to access this plan', 403));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// Create a new membership plan
export const createMembershipPlan = catchAsync(async (req, res, next) => {
  // Only gym owners can create membership plans for their gym
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can create membership plans', 403));
  }
  
  const planData = {
    ...req.body,
    gymOwner: req.user._id // Associate plan with the gym owner
  };
  
  const newPlan = await MembershipPlan.create(planData);
  
  res.status(201).json({
    status: 'success',
    data: {
      plan: newPlan
    }
  });
});

// Update a membership plan
export const updateMembershipPlan = catchAsync(async (req, res, next) => {
  const plan = await MembershipPlan.findById(req.params.id);
  
  if (!plan) {
    return next(new AppError('No membership plan found with that ID', 404));
  }
  
  // Check if user has permission to update this plan
  if (req.user.role === 'gym-owner' && plan.gymOwner.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to update this plan', 403));
  }
  
  const updatedPlan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });
  
  res.status(200).json({
    status: 'success',
    data: {
      plan: updatedPlan
    }
  });
});

// Delete a membership plan
export const deleteMembershipPlan = catchAsync(async (req, res, next) => {
  const plan = await MembershipPlan.findById(req.params.id);
  
  if (!plan) {
    return next(new AppError('No membership plan found with that ID', 404));
  }
  
  // Check if user has permission to delete this plan
  if (req.user.role === 'gym-owner' && plan.gymOwner.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this plan', 403));
  }
  
  await MembershipPlan.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get default membership plans for a gym owner (create if don't exist)
export const getOrCreateDefaultPlans = catchAsync(async (req, res, next) => {
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can access membership plans', 403));
  }
  
  // Check if gym owner already has membership plans
  let plans = await MembershipPlan.find({ gymOwner: req.user._id });
  
  // If no plans exist, create default ones
  if (plans.length === 0) {
    const defaultPlans = [
      {
        name: 'Basic Member',
        price: 500,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['Gym Access', 'Basic Equipment', 'Locker Access'],
        gymOwner: req.user._id,
        status: 'Active'
      },
      {
        name: 'Premium Member',
        price: 1000,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['All Basic Features', 'Personal Training Session', 'Nutritional Guidance', 'Premium Equipment'],
        gymOwner: req.user._id,
        status: 'Active',
        recommended: true
      },
      {
        name: 'Elite Member',
        price: 1500,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['All Premium Features', 'Unlimited Personal Training', 'Supplement Consultation', 'Priority Support'],
        gymOwner: req.user._id,
        status: 'Active'
      }
    ];
    
    plans = await MembershipPlan.create(defaultPlans);
  }
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});