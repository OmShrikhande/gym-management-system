import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import mongoose from 'mongoose';

// Get new gym owners count for the current month (optimized with parallel queries)
export const getNewGymOwnersCount = catchAsync(async (req, res, next) => {
  try {
    // Calculate date ranges
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Execute both queries in parallel for better performance
    const [newGymOwnersCount, prevMonthGymOwnersCount] = await Promise.all([
      User.countDocuments({
        role: 'gym-owner',
        createdAt: { $gte: firstDayOfMonth }
      }),
      User.countDocuments({
        role: 'gym-owner',
        createdAt: { 
          $gte: firstDayOfPrevMonth,
          $lte: lastDayOfPrevMonth
        }
      })
    ]);
    
    // Calculate growth percentage
    let growthPercentage = 0;
    if (prevMonthGymOwnersCount > 0) {
      growthPercentage = Math.round(((newGymOwnersCount - prevMonthGymOwnersCount) / prevMonthGymOwnersCount) * 100);
    } else if (newGymOwnersCount > 0) {
      growthPercentage = 100;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        newGymOwnersCount,
        prevMonthGymOwnersCount,
        growthPercentage
      },
      meta: {
        timestamp: new Date().toISOString(),
        period: {
          current: firstDayOfMonth.toISOString(),
          previous: `${firstDayOfPrevMonth.toISOString()} - ${lastDayOfPrevMonth.toISOString()}`
        }
      }
    });
  } catch (error) {
    console.error('Error in getNewGymOwnersCount:', error);
    return next(new AppError('Failed to get gym owners count', 500));
  }
});

// Get monthly gym owner statistics for the year
export const getMonthlyGymOwnerStats = catchAsync(async (req, res, next) => {
  const year = parseInt(req.query.year) || new Date().getFullYear();
  
  // Create an array to hold monthly stats
  const monthlyStats = {};
  
  // Initialize stats for all months
  for (let month = 1; month <= 12; month++) {
    monthlyStats[month] = {
      newGymOwners: 0,
      totalGymOwners: 0,
      totalTrainers: 0
    };
  }
  
  // Get all gym owners
  const allGymOwners = await User.find({ 
    role: 'gym-owner',
    createdAt: { $lte: new Date(year, 11, 31, 23, 59, 59) } // Created before or during the specified year
  }).select('createdAt');
  
  // Calculate monthly stats
  allGymOwners.forEach(owner => {
    const createdAt = new Date(owner.createdAt);
    const ownerYear = createdAt.getFullYear();
    const ownerMonth = createdAt.getMonth() + 1;
    
    // Count new gym owners for each month in the specified year
    if (ownerYear === year) {
      monthlyStats[ownerMonth].newGymOwners++;
    }
    
    // Calculate cumulative total for each month
    for (let month = 1; month <= 12; month++) {
      if (ownerYear < year || (ownerYear === year && ownerMonth <= month)) {
        monthlyStats[month].totalGymOwners++;
      }
    }
  });
  
  // Get trainer counts
  const trainers = await User.find({ role: 'trainer' }).select('createdAt');
  const trainersByMonth = {};
  
  // Initialize trainer counts for all months
  for (let month = 1; month <= 12; month++) {
    trainersByMonth[month] = 0;
  }
  
  // Count trainers by month
  trainers.forEach(trainer => {
    const createdAt = new Date(trainer.createdAt);
    const trainerYear = createdAt.getFullYear();
    const trainerMonth = createdAt.getMonth() + 1;
    
    // Count cumulative trainers for each month
    for (let month = 1; month <= 12; month++) {
      if (trainerYear < year || (trainerYear === year && trainerMonth <= month)) {
        trainersByMonth[month]++;
      }
    }
  });
  
  // Add trainer counts to monthly stats
  for (let month = 1; month <= 12; month++) {
    monthlyStats[month].totalTrainers = trainersByMonth[month];
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      year,
      monthlyStats
    }
  });
});

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    let users = [];
    
    // If super-admin, return all users
    if (req.user.role === 'super-admin') {
      users = await User.find();
    } 
    // If gym-owner, only return users created by this gym owner
    else if (req.user.role === 'gym-owner') {
      // Get trainers created by this gym owner
      const trainers = await User.find({ 
        createdBy: req.user.id,
        role: 'trainer'
      });
      
      // Get members created by this gym owner
      const members = await User.find({ 
        createdBy: req.user.id,
        role: 'member'
      });
      
      // For gym owners, only include their own members and trainers
      users = [...trainers, ...members];
    }
    // If trainer, only return members assigned to this trainer
    else if (req.user.role === 'trainer') {
      const members = await User.find({
        assignedTrainer: req.user.id,
        role: 'member'
      });
      
      users = members;
    } else {
      // For other roles, return an empty array
      users = [];
    }
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users'
    });
  }
};

// Get a single user by ID (admin only)
export const getUser = async (req, res) => {
  try {
    // Debug: Log the received ID parameter
    console.log('getUser - Received ID:', req.params.id, 'Type:', typeof req.params.id);
    
    // Validate that the ID is a valid ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('getUser - Invalid ObjectId format:', req.params.id);
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid user ID format'
      });
    }
    
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if the requesting user has permission to view this user
    // Users can view their own details
    const isOwnProfile = req.user.id === req.params.id;
    
    // Gym owners can view users they created
    const isGymOwnerCreator = req.user.role === 'gym-owner' && 
                             user.createdBy && 
                             user.createdBy.toString() === req.user.id;
    
    // Trainers can view members assigned to them
    const isAssignedTrainer = req.user.role === 'trainer' && 
                             user.role === 'member' && 
                             user.assignedTrainer && 
                             user.assignedTrainer.toString() === req.user.id;
    
    // Members can view their assigned trainer
    const isMyTrainer = req.user.role === 'member' && 
                       user.role === 'trainer' && 
                       req.user.assignedTrainer && 
                       req.user.assignedTrainer.toString() === req.params.id;
    
    // Members can view gym owner who created them (for gym info)
    const isMyGymOwner = req.user.role === 'member' && 
                        user.role === 'gym-owner' && 
                        req.user.createdBy && 
                        req.user.createdBy.toString() === req.params.id;
    
    // Super admin can view all users
    const isSuperAdmin = req.user.role === 'super-admin';
    
    if (!isOwnProfile && !isGymOwnerCreator && !isAssignedTrainer && !isMyTrainer && !isMyGymOwner && !isSuperAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this user'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user'
    });
  }
};

// Get current user profile
export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

// Update current user profile
export const updateMe = async (req, res) => {
  try {
    // 1) Check if user is trying to update password
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is not for password updates. Please use /update-password.'
      });
    }
    
    // 2) Filter out unwanted fields that should not be updated
    // Allow more fields based on user role
    let allowedFields = ['name', 'email', 'phone', 'gender', 'bio'];
    
    // Add role-specific fields
    if (req.user.role === 'super-admin') {
      allowedFields = [...allowedFields, 'whatsapp', 'experience'];
    } else if (req.user.role === 'gym-owner') {
      allowedFields = [...allowedFields, 'gymName', 'address', 'whatsapp'];
    } else if (req.user.role === 'trainer') {
      allowedFields = [...allowedFields, 'specialization', 'experience', 'certifications', 'availability'];
    } else if (req.user.role === 'member') {
      allowedFields = [...allowedFields, 'address', 'whatsapp'];
    }
    
    const filteredBody = filterObj(req.body, ...allowedFields);
    
    // 3) Update user document
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user'
    });
  }
};

// Update any user (admin only)
export const updateUser = async (req, res) => {
  try {
    // Don't allow password updates with this route
    if (req.body.password) {
      return res.status(400).json({
        status: 'fail',
        message: 'This route is not for password updates.'
      });
    }
    
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error updating user'
    });
  }
};

// Get detailed user information including membership details
export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    // Check if the requesting user has permission to view this user's details
    // Users can view their own details
    const isOwnProfile = req.user.id === req.params.id;
    
    // Gym owners can view users they created
    const isGymOwnerCreator = req.user.role === 'gym-owner' && 
                             user.createdBy && 
                             user.createdBy.toString() === req.user.id;
    
    // Trainers can view members assigned to them
    const isAssignedTrainer = req.user.role === 'trainer' && 
                             user.role === 'member' && 
                             user.assignedTrainer && 
                             user.assignedTrainer.toString() === req.user.id;
    
    // Super admin can view all users
    const isSuperAdmin = req.user.role === 'super-admin';
    
    if (!isOwnProfile && !isGymOwnerCreator && !isAssignedTrainer && !isSuperAdmin) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this user\'s details'
      });
    }
    
    // Calculate membership details for members
    let membershipDetails = null;
    if (user.role === 'member') {
      // Calculate days remaining in membership
      const calculateDaysRemaining = (endDate) => {
        if (!endDate) return 0;
        
        const end = new Date(endDate);
        const today = new Date();
        const diffTime = end - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays > 0 ? diffDays : 0;
      };
      
      // Check if membership is expired
      const checkMembershipExpired = (endDate) => {
        if (!endDate) return true;
        
        const end = new Date(endDate);
        const today = new Date();
        return end < today;
      };
      
      const isExpired = checkMembershipExpired(user.membershipEndDate);
      const daysRemaining = calculateDaysRemaining(user.membershipEndDate);
      
      membershipDetails = {
        status: isExpired ? "Expired" : user.membershipStatus || "Active",
        startDate: user.membershipStartDate || user.createdAt,
        endDate: user.membershipEndDate,
        type: user.membershipType || user.planType || "Standard",
        daysRemaining: daysRemaining
      };
    }
    
    // Get trainer name if assigned
    let trainerName = '';
    if (user.role === 'member' && user.assignedTrainer) {
      const trainer = await User.findById(user.assignedTrainer);
      if (trainer) {
        trainerName = trainer.name;
      }
    }
    
    // Prepare response data
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      gender: user.gender,
      dob: user.dob,
      goal: user.goal,
      planType: user.planType,
      address: user.address,
      whatsapp: user.whatsapp,
      height: user.height,
      weight: user.weight,
      emergencyContact: user.emergencyContact,
      medicalConditions: user.medicalConditions,
      notes: user.notes,
      assignedTrainer: user.assignedTrainer,
      trainerName: trainerName,
      createdAt: user.createdAt
    };
    
    // Add membership details if available
    if (membershipDetails) {
      userData.membership = membershipDetails;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: userData
      }
    });
  } catch (err) {
    console.error('Error fetching user details:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user details'
    });
  }
};

// Delete a user (admin only)
export const deleteUser = catchAsync(async (req, res, next) => {
  // First find the user to check if they exist
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new AppError('User not found', 404));
  }
  
  // Check if the user is a member and belongs to the current gym owner
  if (user.role === 'member' && req.user.role === 'gym-owner' && 
      user.createdBy && user.createdBy.toString() !== req.user.id) {
    return next(new AppError('You are not authorized to delete this member', 403));
  }
  
  // Delete the user
  await User.findByIdAndDelete(req.params.id);
  
  // Send success response with status 200 instead of 204 to ensure the response body is sent
  res.status(200).json({
    status: 'success',
    success: true,
    message: 'User deleted successfully',
    data: null
  });
});

// Get all members for a specific gym owner
export const getGymOwnerMembers = async (req, res) => {
  try {
    const { gymOwnerId } = req.params;
    
    // Verify the gym owner exists
    const gymOwner = await User.findById(gymOwnerId);
    if (!gymOwner || gymOwner.role !== 'gym-owner') {
      return res.status(404).json({
        status: 'fail',
        message: 'Gym owner not found'
      });
    }
    
    // Find all members created by this gym owner
    let members = await User.find({ 
      createdBy: gymOwnerId,
      role: 'member'
    });
    
    console.log(`Found ${members.length} members for gym owner ${gymOwnerId}`);
    
    // If no members found, try to find members by gymId field if it exists
    if (members.length === 0 && gymOwner.gymId) {
      console.log(`No members found by createdBy, trying gymId: ${gymOwner.gymId}`);
      const gymMembers = await User.find({
        gymId: gymOwner.gymId,
        role: 'member'
      });
      
      if (gymMembers.length > 0) {
        console.log(`Found ${gymMembers.length} members by gymId`);
        members = gymMembers;
      }
    }
    
    // Return empty array if no members found - DO NOT return all members as fallback
    // This ensures gym owners only see their own members
    
    res.status(200).json({
      status: 'success',
      results: members.length,
      data: {
        users: members
      }
    });
  } catch (err) {
    console.error('Error fetching gym owner members:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching gym owner members'
    });
  }
};

// Get all members assigned to a specific trainer
// Helper function to update a trainer's member count
const updateTrainerMemberCount = async (trainerId) => {
  try {
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') return null;
    
    // Count members assigned to this trainer
    const memberCount = await User.countDocuments({
      assignedTrainer: trainerId,
      role: 'member'
    });
    
    // Update the trainer's assignedMembers count
    trainer.assignedMembers = memberCount;
    await trainer.save({ validateBeforeSave: false });
    
    return {
      trainerId: trainer._id,
      trainerName: trainer.name,
      memberCount
    };
  } catch (error) {
    console.error(`Error updating member count for trainer ${trainerId}:`, error);
    return null;
  }
};

export const getTrainerMembers = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Verify the trainer exists
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        status: 'fail',
        message: 'Trainer not found'
      });
    }
    
    // Check if the requesting user is authorized
    // Only allow super-admin, the gym owner who created this trainer, or the trainer themselves
    const isAuthorized = 
      req.user.role === 'super-admin' || 
      (req.user.role === 'gym-owner' && trainer.createdBy && trainer.createdBy.toString() === req.user.id) ||
      req.user._id.toString() === trainerId;
      
    if (!isAuthorized) {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to access this data'
      });
    }
    
    // Find all members assigned to this trainer
    const members = await User.find({ 
      assignedTrainer: trainerId,
      role: 'member'
    });
    
    // Update the trainer's assignedMembers count
    trainer.assignedMembers = members.length;
    await trainer.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      results: members.length,
      data: {
        members
      }
    });
  } catch (err) {
    console.error('Error fetching trainer members:', err);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainer members'
    });
  }
};

// Get trainers by gym
export const getTrainersByGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    
    // Validate gym ID
    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gym ID'
      });
    }
    
    // Check if the requesting user is authorized (only super-admin or the gym owner)
    if (req.user.role !== 'super-admin' && 
        (req.user.role !== 'gym-owner' || req.user._id.toString() !== gymId)) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view these trainers'
      });
    }
    
    // Find all trainers associated with this gym (created by this gym owner)
    const trainers = await User.find({ 
      role: 'trainer',
      createdBy: gymId
    }).select('name email _id');
    
    res.status(200).json({
      success: true,
      results: trainers.length,
      data: {
        trainers
      }
    });
  } catch (error) {
    console.error('Error fetching trainers by gym:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainers',
      error: error.message
    });
  }
};

// Update all trainers' member counts
export const updateAllTrainerMemberCounts = async (req, res) => {
  try {
    // Check if the requesting user is authorized (only super-admin or gym-owner)
    if (req.user.role !== 'super-admin' && req.user.role !== 'gym-owner') {
      return res.status(403).json({
        status: 'fail',
        message: 'You are not authorized to perform this action'
      });
    }
    
    // Get all trainers
    const trainers = await User.find({ role: 'trainer' });
    
    // Update each trainer's member count
    const results = await Promise.all(
      trainers.map(async (trainer) => {
        return await updateTrainerMemberCount(trainer._id);
      })
    );
    
    // Filter out null results
    const validResults = results.filter(result => result !== null);
    
    res.status(200).json({
      success: true,
      results: validResults.length,
      data: {
        trainers: validResults
      }
    });
  } catch (err) {
    console.error('Error updating all trainer member counts:', err);
    res.status(500).json({
      success: false,
      message: 'Error updating all trainer member counts'
    });
  }
};

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};