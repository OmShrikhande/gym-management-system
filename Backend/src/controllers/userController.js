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
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({
      status: 'error',
      message: 'Error deleting user'
    });
  }
};

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
    const members = await User.find({ 
      createdBy: gymOwnerId,
      role: 'member'
    });
    
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

// Helper function to filter object
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};