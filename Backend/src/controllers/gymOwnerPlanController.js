import GymOwnerPlan from '../models/gymOwnerPlanModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get all gym owner plans (for the authenticated gym owner)
export const getGymOwnerPlans = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user._id;
  
  const plans = await GymOwnerPlan.find({ 
    gymOwnerId,
    isActive: true 
  }).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});

// Get all plans for a specific gym owner (for admin use)
export const getGymOwnerPlansByGymId = catchAsync(async (req, res, next) => {
  const { gymOwnerId } = req.params;
  
  const plans = await GymOwnerPlan.find({ 
    gymOwnerId,
    isActive: true 
  }).sort({ createdAt: -1 });
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});

// Get a single gym owner plan
export const getGymOwnerPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const gymOwnerId = req.user._id;
  
  const plan = await GymOwnerPlan.findOne({ 
    _id: id,
    gymOwnerId 
  });
  
  if (!plan) {
    return next(new AppError('No plan found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// Create a new gym owner plan
export const createGymOwnerPlan = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user._id;
  
  // Add gymOwnerId to the request body
  const planData = {
    ...req.body,
    gymOwnerId
  };
  
  const newPlan = await GymOwnerPlan.create(planData);
  
  res.status(201).json({
    status: 'success',
    data: {
      plan: newPlan
    }
  });
});

// Update a gym owner plan
export const updateGymOwnerPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const gymOwnerId = req.user._id;
  
  const plan = await GymOwnerPlan.findOneAndUpdate(
    { _id: id, gymOwnerId },
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!plan) {
    return next(new AppError('No plan found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      plan
    }
  });
});

// Delete a gym owner plan (soft delete)
export const deleteGymOwnerPlan = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const gymOwnerId = req.user._id;
  
  const plan = await GymOwnerPlan.findOneAndUpdate(
    { _id: id, gymOwnerId },
    { isActive: false },
    { new: true }
  );
  
  if (!plan) {
    return next(new AppError('No plan found with that ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Get default gym owner plans (creates default plans if none exist)
export const getOrCreateDefaultPlans = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user._id;
  
  // Check if user has any plans
  let plans = await GymOwnerPlan.find({ 
    gymOwnerId,
    isActive: true 
  }).sort({ createdAt: -1 });
  
  // If no plans exist, create default ones
  if (plans.length === 0) {
    const defaultPlans = [
      {
        name: 'Basic Member',
        price: 500,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['Standard gym access', 'Basic equipment usage', 'Locker facility'],
        description: 'Perfect for beginners starting their fitness journey',
        gymOwnerId,
        isActive: true
      },
      {
        name: 'Premium Member',
        price: 1000,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['Full gym access', 'All equipment', 'Group classes', 'Personal training consultation'],
        description: 'Complete fitness package with additional benefits',
        gymOwnerId,
        isActive: true,
        isRecommended: true
      },
      {
        name: 'Elite Member',
        price: 1500,
        duration: 'monthly',
        durationInMonths: 1,
        features: ['Premium gym access', 'All equipment & classes', 'Dedicated trainer', 'Diet consultation', 'Progress tracking'],
        description: 'Ultimate fitness experience with personalized attention',
        gymOwnerId,
        isActive: true
      }
    ];
    
    plans = await GymOwnerPlan.create(defaultPlans);
  }
  
  res.status(200).json({
    status: 'success',
    results: plans.length,
    data: {
      plans
    }
  });
});