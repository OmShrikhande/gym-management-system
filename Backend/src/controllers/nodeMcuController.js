// controllers/nodeMcuController.js
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// NodeMCU membership verification endpoint
export const verifyMembershipForNodeMCU = catchAsync(async (req, res, next) => {
  console.log('NodeMCU verification request received');
  console.log('Request body:', req.body);
  console.log('Request headers:', req.headers);
  
  const { gymOwnerId, memberId, timestamp, deviceId } = req.body;

  console.log('Extracted values:', { gymOwnerId, memberId, timestamp, deviceId });

  // Validate input
  if (!gymOwnerId || !memberId) {
    console.log('Validation failed - missing gymOwnerId or memberId');
    return res.status(200).json({
      nodeMcuResponse: 'INACTIVE'
    });
  }

  try {
    // Find the gym owner
    const gymOwner = await User.findById(gymOwnerId);
    if (!gymOwner || gymOwner.role !== 'gym-owner') {
      console.log('Invalid gym owner');
      return res.status(200).json({
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Find the member
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      console.log('Invalid member');
      return res.status(200).json({
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Check if member is associated with this gym
    if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
      console.log('Member not associated with gym');
      return res.status(200).json({
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Check membership status
    if (member.membershipStatus !== 'Active') {
      console.log('Member subscription inactive');
      
      // Record the access attempt for inactive member
      member.accessAttempts = member.accessAttempts || [];
      member.accessAttempts.push({ 
        gymOwnerId, 
        timestamp: new Date(timestamp || Date.now()),
        status: 'DENIED',
        reason: 'Inactive membership',
        deviceId: deviceId || 'unknown'
      });
      await member.save({ validateBeforeSave: false });

      return res.status(200).json({
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Success - member is active, record attendance
    member.attendance = member.attendance || [];
    member.attendance.push({ 
      gymOwnerId, 
      timestamp: new Date(timestamp || Date.now()),
      deviceId: deviceId || 'unknown'
    });
    
    // Also record successful access
    member.accessAttempts = member.accessAttempts || [];
    member.accessAttempts.push({ 
      gymOwnerId, 
      timestamp: new Date(timestamp || Date.now()),
      status: 'GRANTED',
      reason: 'Active membership',
      deviceId: deviceId || 'unknown'
    });
    
    await member.save({ validateBeforeSave: false });

    console.log('Access granted for member:', member.name);
    
    res.status(200).json({
      nodeMcuResponse: 'ACTIVE'
    });

  } catch (error) {
    console.error('Error in NodeMCU verification:', error);
    res.status(200).json({
      nodeMcuResponse: 'INACTIVE'
    });
  }
});

// Get gym access logs
export const getAccessLogs = catchAsync(async (req, res, next) => {
  const { gymOwnerId } = req.params;
  const { limit = 50, page = 1 } = req.query;

  // Verify gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return next(new AppError('Invalid gym owner', 404));
  }

  // Check if requesting user is the gym owner
  if (req.user._id.toString() !== gymOwnerId) {
    return next(new AppError('You can only view your own gym logs', 403));
  }

  // Get all members of this gym with their access attempts
  const members = await User.find({ 
    createdBy: gymOwnerId, 
    role: 'member',
    accessAttempts: { $exists: true, $ne: [] }
  }).select('name email accessAttempts attendance').sort({ updatedAt: -1 });

  // Flatten and sort all access attempts
  const allAccessLogs = [];
  members.forEach(member => {
    if (member.accessAttempts) {
      member.accessAttempts.forEach(attempt => {
        allAccessLogs.push({
          memberName: member.name,
          memberEmail: member.email,
          memberId: member._id,
          ...attempt.toObject(),
          timestamp: attempt.timestamp
        });
      });
    }
  });

  // Sort by timestamp (newest first)
  allAccessLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Paginate
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedLogs = allAccessLogs.slice(startIndex, endIndex);

  res.status(200).json({
    status: 'success',
    results: paginatedLogs.length,
    totalLogs: allAccessLogs.length,
    page: parseInt(page),
    totalPages: Math.ceil(allAccessLogs.length / limit),
    data: {
      accessLogs: paginatedLogs,
      gymName: gymOwner.gymName || gymOwner.name + "'s Gym"
    }
  });
});

// Device health check endpoint
export const deviceHealthCheck = catchAsync(async (req, res, next) => {
  const { deviceId, gymOwnerId } = req.body;
  
  console.log('Device health check:', { deviceId, gymOwnerId });
  
  res.status(200).json({
    status: 'OK',
    message: 'Device connected',
    timestamp: new Date().toISOString(),
    deviceId: deviceId || 'unknown'
  });
});