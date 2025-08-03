// controllers/gateController.js
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import User from '../models/userModel.js';
import realtimeDatabaseService from '../services/realtimeDatabaseService.js';

/**
 * Toggle gate status for gym owners and trainers
 * Updates Realtime Database: gym/{gymId}/status:(boolean)
 */
export const toggleGateStatus = catchAsync(async (req, res, next) => {
  console.log('🚪 Gate toggle request received');
  console.log('Request body:', req.body);
  console.log('Request user:', req.user);
  
  const { status } = req.body; // true = open, false = close
  const userId = req.user?.id || req.user?._id;
  const userRole = req.user?.role;

  console.log('Extracted values:', { userId, userRole, status });

  // Validate input
  if (typeof status !== 'boolean') {
    console.log('Validation failed - status must be boolean');
    return next(new AppError('Status must be a boolean value (true/false)', 400));
  }

  // Check if user is authorized (gym-owner or trainer)
  if (!['gym-owner', 'trainer'].includes(userRole)) {
    console.log('Authorization failed - invalid role:', userRole);
    return next(new AppError('Only gym owners and trainers can control the gate', 403));
  }

  try {
    // Find the user to get gym information
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    console.log('User found:', { 
      id: user._id, 
      role: user.role, 
      name: user.name,
      gymId: user.gymId 
    });

    let gymId;
    let gymOwnerId;

    if (userRole === 'gym-owner') {
      // For gym owners, use their own ID as gym ID
      gymId = user._id.toString();
      gymOwnerId = user._id.toString();
    } else if (userRole === 'trainer') {
      // For trainers, find their gym owner using gymId field
      if (!user.gymId || user.gymId === '' || user.gymId === null) {
        return next(new AppError('Trainer is not assigned to any gym', 400));
      }
      
      // Get gym owner details
      const gymOwner = await User.findById(user.gymId);
      if (!gymOwner || gymOwner.role !== 'gym-owner') {
        return next(new AppError('Invalid gym owner or gym not found', 404));
      }
      
      gymId = gymOwner._id.toString();
      gymOwnerId = gymOwner._id.toString();
    }

    console.log('Gate control details:', { gymId, gymOwnerId, status });

    // First try: Update Realtime Database with gym ID
    let realtimeDbResult;
    try {
      await realtimeDatabaseService.updateDoorStatus(gymId, status);
      
      // Log the gate control action
      await realtimeDatabaseService.logQRScanAttempt(
        userId,
        gymOwnerId,
        'success',
        `Gate ${status ? 'opened' : 'closed'} by ${userRole}: ${user.name}`
      );

      // Update staff entry status if opening gate
      if (status) {
        await realtimeDatabaseService.updateStaffEntryStatus(
          userId,
          gymOwnerId,
          user,
          userRole
        );
      }

      realtimeDbResult = {
        success: true,
        method: 'gym-id',
        path: `gym/${gymId}/status`
      };
      
      console.log(`✅ Realtime DB: Gate status updated to ${status ? 'OPEN' : 'CLOSED'} for gym ${gymId}`);
      
    } catch (realtimeDbError) {
      console.error('❌ Realtime DB Error with gym ID, trying gym owner ID:', realtimeDbError.message);
      
      // Second try: Update Realtime Database with gym owner ID (fallback)
      try {
        await realtimeDatabaseService.updateDoorStatus(gymOwnerId, status);
        
        // Log the gate control action
        await realtimeDatabaseService.logQRScanAttempt(
          userId,
          gymOwnerId,
          'success',
          `Gate ${status ? 'opened' : 'closed'} by ${userRole}: ${user.name} (fallback method)`
        );

        // Update staff entry status if opening gate
        if (status) {
          await realtimeDatabaseService.updateStaffEntryStatus(
            userId,
            gymOwnerId,
            user,
            userRole
          );
        }

        realtimeDbResult = {
          success: true,
          method: 'gym-owner-id',
          path: `gym/${gymOwnerId}/status`
        };
        
        console.log(`✅ Realtime DB: Gate status updated to ${status ? 'OPEN' : 'CLOSED'} for gym owner ${gymOwnerId} (fallback)`);
        
      } catch (fallbackError) {
        console.error('❌ Realtime DB Error with both methods:', fallbackError.message);
        // Don't fail the request completely, but log the error
        realtimeDbResult = {
          success: false,
          error: fallbackError.message,
          methods_tried: ['gym-id', 'gym-owner-id']
        };
      }
    }

    // Prepare response data
    const responseData = {
      user: {
        id: user._id,
        name: user.name,
        role: userRole,
        email: user.email
      },
      gym: {
        id: gymId,
        ownerId: gymOwnerId,
        name: userRole === 'gym-owner' ? (user.gymName || `${user.name}'s Gym`) : 
              (user.gymName || 'Assigned Gym')
      },
      gate: {
        status: status,
        action: status ? 'opened' : 'closed',
        timestamp: new Date().toISOString(),
        controlledBy: userRole
      },
      realtimeDatabase: realtimeDbResult
    };

    // Send success response
    res.status(200).json({
      status: 'success',
      message: `🚪 Gate ${status ? 'opened' : 'closed'} successfully by ${userRole}!`,
      nodeMcuResponse: status ? 'allow' : 'deny', // For hardware integration
      data: responseData
    });

  } catch (error) {
    console.error('❌ Gate control error:', error);
    return next(new AppError(`Failed to control gate: ${error.message}`, 500));
  }
});

/**
 * Get current gate status from Realtime Database
 */
export const getGateStatus = catchAsync(async (req, res, next) => {
  console.log('🔍 Gate status check request received');
  
  const userId = req.user?.id || req.user?._id;
  const userRole = req.user?.role;

  // Check if user is authorized
  if (!['gym-owner', 'trainer'].includes(userRole)) {
    return next(new AppError('Only gym owners and trainers can check gate status', 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let gymId;
    let gymOwnerId;

    if (userRole === 'gym-owner') {
      gymId = user._id.toString();
      gymOwnerId = user._id.toString();
    } else if (userRole === 'trainer') {
      if (!user.gymId || user.gymId === '' || user.gymId === null) {
        return next(new AppError('Trainer is not assigned to any gym', 400));
      }
      
      const gymOwner = await User.findById(user.gymId);
      if (!gymOwner || gymOwner.role !== 'gym-owner') {
        return next(new AppError('Invalid gym owner or gym not found', 404));
      }
      
      gymId = gymOwner._id.toString();
      gymOwnerId = gymOwner._id.toString();
    }

    // Get status from Realtime Database
    try {
      const doorStatusResult = await realtimeDatabaseService.getDoorStatus(gymOwnerId);
      
      res.status(200).json({
        status: 'success',
        message: 'Gate status retrieved successfully',
        data: {
          gym: {
            id: gymId,
            ownerId: gymOwnerId
          },
          gate: {
            status: doorStatusResult.status,
            path: doorStatusResult.path,
            lastUpdated: new Date().toISOString()
          }
        }
      });
    } catch (error) {
      // Fallback to default closed status if retrieval fails
      res.status(200).json({
        status: 'success',
        message: 'Gate status retrieved (default)',
        data: {
          gym: {
            id: gymId,
            ownerId: gymOwnerId
          },
          gate: {
            status: false, // Default to closed
            path: `gym/${gymOwnerId}/status`,
            lastUpdated: new Date().toISOString(),
            error: error.message
          }
        }
      });
    }

  } catch (error) {
    console.error('❌ Gate status check error:', error);
    return next(new AppError(`Failed to get gate status: ${error.message}`, 500));
  }
});

/**
 * Emergency gate control (always opens the gate)
 */
export const emergencyGateControl = catchAsync(async (req, res, next) => {
  console.log('🚨 Emergency gate control request received');
  
  const { reason } = req.body;
  const userId = req.user?.id || req.user?._id;
  const userRole = req.user?.role;

  // Check if user is authorized
  if (!['gym-owner', 'trainer'].includes(userRole)) {
    return next(new AppError('Only gym owners and trainers can use emergency gate control', 403));
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    let gymId;
    let gymOwnerId;

    if (userRole === 'gym-owner') {
      gymId = user._id.toString();
      gymOwnerId = user._id.toString();
    } else if (userRole === 'trainer') {
      if (!user.gymId || user.gymId === '' || user.gymId === null) {
        return next(new AppError('Trainer is not assigned to any gym', 400));
      }
      
      const gymOwner = await User.findById(user.gymId);
      if (!gymOwner || gymOwner.role !== 'gym-owner') {
        return next(new AppError('Invalid gym owner or gym not found', 404));
      }
      
      gymId = gymOwner._id.toString();
      gymOwnerId = gymOwner._id.toString();
    }

    // Force open the gate
    try {
      await realtimeDatabaseService.updateDoorStatus(gymId, true);
      
      // Log emergency access
      await realtimeDatabaseService.logQRScanAttempt(
        userId,
        gymOwnerId,
        'success',
        `Emergency gate access by ${userRole}: ${user.name}. Reason: ${reason || 'No reason provided'}`
      );

      console.log(`🚨 Emergency gate access granted for gym ${gymId}`);
      
    } catch (realtimeDbError) {
      // Try fallback method
      await realtimeDatabaseService.updateDoorStatus(gymOwnerId, true);
      
      await realtimeDatabaseService.logQRScanAttempt(
        userId,
        gymOwnerId,
        'success',
        `Emergency gate access by ${userRole}: ${user.name} (fallback). Reason: ${reason || 'No reason provided'}`
      );

      console.log(`🚨 Emergency gate access granted for gym owner ${gymOwnerId} (fallback)`);
    }

    res.status(200).json({
      status: 'success',
      message: '🚨 Emergency gate access granted!',
      nodeMcuResponse: 'allow',
      data: {
        user: {
          id: user._id,
          name: user.name,
          role: userRole
        },
        gym: {
          id: gymId,
          ownerId: gymOwnerId
        },
        emergency: {
          reason: reason || 'No reason provided',
          timestamp: new Date().toISOString(),
          grantedBy: userRole
        }
      }
    });

  } catch (error) {
    console.error('❌ Emergency gate control error:', error);
    return next(new AppError(`Emergency gate control failed: ${error.message}`, 500));
  }
});