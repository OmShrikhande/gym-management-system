import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Get new gym owners count for the current month
export const getNewGymOwnersCount = catchAsync(async (req, res, next) => {
  // Calculate the first day of the current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Count gym owners created this month
  const newGymOwnersCount = await User.countDocuments({
    role: 'gym-owner',
    createdAt: { $gte: firstDayOfMonth }
  });
  
  // Get previous month for comparison
  const firstDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  
  // Count gym owners created in the previous month
  const prevMonthGymOwnersCount = await User.countDocuments({
    role: 'gym-owner',
    createdAt: { 
      $gte: firstDayOfPrevMonth,
      $lte: lastDayOfPrevMonth
    }
  });
  
  // Calculate growth percentage
  let growthPercentage = 0;
  if (prevMonthGymOwnersCount > 0) {
    growthPercentage = Math.round(((newGymOwnersCount - prevMonthGymOwnersCount) / prevMonthGymOwnersCount) * 100);
  } else if (newGymOwnersCount > 0) {
    growthPercentage = 100; // If there were no gym owners last month but there are this month
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      newGymOwnersCount,
      prevMonthGymOwnersCount,
      growthPercentage
    }
  });
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
    const users = await User.find();
    
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
    const user = await User.findById(req.params.id);
    
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
    
    // If still no members, return all members as a fallback
    if (members.length === 0) {
      console.log('No members found for this gym owner, returning all members as fallback');
      members = await User.find({ role: 'member' }).limit(20);
      console.log(`Returning ${members.length} members as fallback`);
    }
    
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
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== trainerId) {
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