// controllers/memberController.js
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Verify membership and subscription status for QR code scanning
export const verifyMembership = catchAsync(async (req, res, next) => {
  console.log('Verify membership request received');
  console.log('Request body:', req.body);
  console.log('Request user:', req.user);
  
  const { gymOwnerId, memberId, timestamp } = req.body;

  console.log('Extracted values:', { gymOwnerId, memberId, timestamp });

  // Validate input
  if (!gymOwnerId || !memberId) {
    console.log('Validation failed - missing gymOwnerId or memberId');
    return next(new AppError('Gym owner ID and member ID are required', 400));
  }

  // Check if the requesting user is the member
  if (req.user._id.toString() !== memberId) {
    console.log('User ID mismatch:', { requestUserId: req.user._id.toString(), memberId });
    return next(new AppError('You can only verify your own membership', 403));
  }

  // Find the gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid gym owner or gym not found',
      nodeMcuResponse: 'INACTIVE', // For NodeMCU
      data: {
        member: { membershipStatus: 'Unknown' }
      }
    });
  }

  // Find the member
  const member = await User.findById(memberId);
  if (!member || member.role !== 'member') {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid member',
      nodeMcuResponse: 'INACTIVE', // For NodeMCU
      data: {
        member: { membershipStatus: 'Unknown' }
      }
    });
  }

  // Check if member is associated with this gym
  if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
    return res.status(403).json({
      status: 'error',
      message: 'You are not a member of this gym',
      nodeMcuResponse: 'INACTIVE', // For NodeMCU
      data: {
        member: { membershipStatus: 'Not a member' },
        gym: {
          id: gymOwner._id,
          name: gymOwner.gymName || gymOwner.name + "'s Gym",
          owner: gymOwner.name
        }
      }
    });
  }

  // Check membership status
  if (member.membershipStatus !== 'Active') {
    return res.status(200).json({
      status: 'error',
      message: 'Your subscription is inactive. Please renew your membership.',
      nodeMcuResponse: 'INACTIVE', // For NodeMCU
      data: {
        member: { 
          membershipStatus: member.membershipStatus || 'Inactive',
          name: member.name,
          email: member.email
        },
        gym: {
          id: gymOwner._id,
          name: gymOwner.gymName || gymOwner.name + "'s Gym",
          owner: gymOwner.name
        }
      }
    });
  }

  // Success - member is active
  res.status(200).json({
    status: 'success',
    message: `✅ Subscription is Active! Welcome to ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
    nodeMcuResponse: 'ACTIVE', // For NodeMCU
    data: {
      member: { 
        membershipStatus: 'Active',
        name: member.name,
        email: member.email
      },
      gym: {
        id: gymOwner._id,
        name: gymOwner.gymName || gymOwner.name + "'s Gym",
        owner: gymOwner.name
      }
    }
  });
});

// Join gym functionality
export const joinGym = catchAsync(async (req, res, next) => {
  const { gymOwnerId } = req.body;
  const memberId = req.user.id;

  if (!gymOwnerId) {
    return next(new AppError('Gym owner ID is required', 400));
  }

  // Find the gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return next(new AppError('Invalid gym owner', 404));
  }

  // Find the member
  const member = await User.findById(memberId);
  if (!member || member.role !== 'member') {
    return next(new AppError('Invalid member', 404));
  }

  // Check if already a member
  if (member.createdBy && member.createdBy.toString() === gymOwnerId) {
    return next(new AppError('You are already a member of this gym', 400));
  }

  // Join the gym
  member.createdBy = gymOwnerId;
  member.membershipStatus = 'Active'; // Set as active by default
  await member.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Successfully joined ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
    data: {
      member,
      gym: {
        id: gymOwner._id,
        name: gymOwner.gymName || gymOwner.name + "'s Gym",
        owner: gymOwner.name
      }
    }
  });
});

export const markAttendance = catchAsync(async (req, res, next) => {
  const { gymOwnerId, memberId, timestamp } = req.body;

  // Validate input
  if (!gymOwnerId || !memberId || !timestamp) {
    return next(new AppError('Gym owner ID, member ID, and timestamp are required', 400));
  }

  // Check if the requesting user is the member
  if (req.user.id !== memberId) {
    return next(new AppError('You can only mark attendance for yourself', 403));
  }

  // Find the gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return next(new AppError('Invalid gym owner', 404));
  }

  // Find the member
  const member = await User.findById(memberId);
  if (!member || member.role !== 'member') {
    return next(new AppError('Invalid member', 404));
  }

  // Check if member is associated with this gym
  if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
    return res.status(403).json({
      status: 'error',
      message: 'You are not a member of this gym',
      nodeMcuResponse: 'INACTIVE' // For NodeMCU
    });
  }

  // Check membership status
  if (member.membershipStatus !== 'Active') {
    return res.status(403).json({
      status: 'error',
      message: 'Status inactive',
      nodeMcuResponse: 'INACTIVE' // For NodeMCU
    });
  }

  // Record attendance
  member.attendance = member.attendance || [];
  member.attendance.push({ gymOwnerId, timestamp: new Date(timestamp) });
  await member.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: `Attendance marked for ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
    nodeMcuResponse: 'ACTIVE', // For NodeMCU
    data: {
      member,
      gym: {
        id: gymOwner._id,
        name: gymOwner.gymName || gymOwner.name + "'s Gym",
        owner: gymOwner.name
      },
      attendance: { gymOwnerId, timestamp }
    }
  });
});