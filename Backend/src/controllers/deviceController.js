// controllers/deviceController.js
import User from '../models/userModel.js';
import Device from '../models/deviceModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

// Register a new NodeMCU device for a gym owner
export const registerDevice = catchAsync(async (req, res, next) => {
  const { deviceId, deviceLocation, deviceType = 'NodeMCU' } = req.body;
  const gymOwnerId = req.user._id;

  // Validate input
  if (!deviceId || !deviceLocation) {
    return next(new AppError('Device ID and location are required', 400));
  }

  // Check if device already exists
  const existingDevice = await Device.findOne({ deviceId });
  if (existingDevice) {
    return next(new AppError('Device ID already registered', 400));
  }

  // Verify user is gym owner
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can register devices', 403));
  }

  // Create new device
  const device = await Device.create({
    deviceId,
    deviceLocation,
    deviceType,
    gymOwner: gymOwnerId,
    status: 'active',
    lastHeartbeat: new Date()
  });

  res.status(201).json({
    status: 'success',
    message: 'Device registered successfully',
    data: {
      device
    }
  });
});

// Get all devices for a gym owner
export const getGymDevices = catchAsync(async (req, res, next) => {
  const gymOwnerId = req.user._id;

  // Verify user is gym owner
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can view devices', 403));
  }

  const devices = await Device.find({ gymOwner: gymOwnerId })
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    results: devices.length,
    data: {
      devices
    }
  });
});

// Update device status and heartbeat
export const updateDeviceHeartbeat = catchAsync(async (req, res, next) => {
  const { deviceId, gymOwnerId, deviceLocation, status, uptime, freeHeap, rssi } = req.body;

  // Validate required fields
  if (!deviceId || !gymOwnerId) {
    return res.status(400).json({
      status: 'error',
      message: 'Device ID and Gym Owner ID are required'
    });
  }

  // Find and update device
  const device = await Device.findOneAndUpdate(
    { deviceId, gymOwner: gymOwnerId },
    {
      lastHeartbeat: new Date(),
      status: status || 'active',
      deviceLocation: deviceLocation || device?.deviceLocation,
      systemInfo: {
        uptime: uptime || 0,
        freeHeap: freeHeap || 0,
        rssi: rssi || 0,
        lastUpdate: new Date()
      }
    },
    { new: true, upsert: true }
  );

  res.status(200).json({
    status: 'success',
    message: 'Heartbeat updated',
    data: {
      device
    }
  });
});

// Validate membership with device tracking
export const validateMembershipWithDevice = catchAsync(async (req, res, next) => {
  console.log('Device validation request received:', req.body);
  
  const { gymOwnerId, memberId, deviceId, deviceLocation, timestamp } = req.body;

  // Validate required fields
  if (!gymOwnerId || !memberId || !deviceId) {
    return res.status(400).json({
      status: 'error',
      message: 'Gym Owner ID, Member ID, and Device ID are required',
      nodeMcuResponse: 'INACTIVE'
    });
  }

  try {
    // Find the gym owner
    const gymOwner = await User.findById(gymOwnerId);
    if (!gymOwner || gymOwner.role !== 'gym-owner') {
      return res.status(200).json({
        status: 'error',
        message: 'Invalid gym owner',
        nodeMcuResponse: 'INACTIVE',
        deviceResponse: {
          deviceId,
          action: 'DENY_ACCESS',
          reason: 'Invalid gym owner'
        }
      });
    }

    // Find the member
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(200).json({
        status: 'error',
        message: 'Invalid member',
        nodeMcuResponse: 'INACTIVE',
        deviceResponse: {
          deviceId,
          action: 'DENY_ACCESS',
          reason: 'Invalid member'
        }
      });
    }

    // Verify device belongs to this gym owner
    const device = await Device.findOne({ deviceId, gymOwner: gymOwnerId });
    if (!device) {
      console.log(`Device ${deviceId} not registered for gym owner ${gymOwnerId}`);
      return res.status(200).json({
        status: 'error',
        message: 'Device not authorized for this gym',
        nodeMcuResponse: 'INACTIVE',
        deviceResponse: {
          deviceId,
          action: 'DENY_ACCESS',
          reason: 'Device not authorized'
        }
      });
    }

    // Check if member belongs to this gym
    if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
      // Log unauthorized access attempt
      await Device.findByIdAndUpdate(device._id, {
        $push: {
          accessLogs: {
            memberId,
            memberName: member.name,
            timestamp: new Date(),
            action: 'DENIED',
            reason: 'Not a member of this gym'
          }
        }
      });

      return res.status(200).json({
        status: 'error',
        message: 'You are not a member of this gym',
        nodeMcuResponse: 'INACTIVE',
        deviceResponse: {
          deviceId,
          action: 'DENY_ACCESS',
          reason: 'Not a member of this gym'
        }
      });
    }

    // Check member's subscription status
    if (member.membershipStatus !== 'Active') {
      // Log inactive membership attempt
      await Device.findByIdAndUpdate(device._id, {
        $push: {
          accessLogs: {
            memberId,
            memberName: member.name,
            timestamp: new Date(),
            action: 'DENIED',
            reason: 'Inactive membership'
          }
        }
      });

      return res.status(200).json({
        status: 'error',
        message: 'Your membership is inactive. Please renew your subscription.',
        nodeMcuResponse: 'INACTIVE',
        deviceResponse: {
          deviceId,
          action: 'DENY_ACCESS',
          reason: 'Inactive membership'
        }
      });
    }

    // Success - Grant access and log it
    await Device.findByIdAndUpdate(device._id, {
      $push: {
        accessLogs: {
          memberId,
          memberName: member.name,
          timestamp: new Date(),
          action: 'GRANTED',
          reason: 'Valid membership'
        }
      },
      lastActivity: new Date()
    });

    // Also update member's attendance
    member.attendance = member.attendance || [];
    member.attendance.push({
      gymOwnerId,
      timestamp: new Date(timestamp || Date.now()),
      deviceId,
      deviceLocation: deviceLocation || device.deviceLocation
    });
    await member.save({ validateBeforeSave: false });

    console.log(`Access granted for member ${member.name} at device ${deviceId}`);

    res.status(200).json({
      status: 'success',
      message: `Welcome to ${gymOwner.gymName || gymOwner.name + "'s Gym"}!`,
      nodeMcuResponse: 'ACTIVE',
      deviceResponse: {
        deviceId,
        action: 'GRANT_ACCESS',
        duration: 5000, // 5 seconds
        memberName: member.name,
        welcomeMessage: `Welcome ${member.name}!`
      },
      data: {
        member: {
          name: member.name,
          membershipStatus: 'Active'
        },
        gym: {
          id: gymOwner._id,
          name: gymOwner.gymName || gymOwner.name + "'s Gym",
          owner: gymOwner.name
        },
        device: {
          id: device.deviceId,
          location: device.deviceLocation
        }
      }
    });

  } catch (error) {
    console.error('Device validation error:', error);
    res.status(200).json({
      status: 'error',
      message: 'System error occurred',
      nodeMcuResponse: 'INACTIVE',
      deviceResponse: {
        deviceId: deviceId || 'unknown',
        action: 'DENY_ACCESS',
        reason: 'System error'
      }
    });
  }
});

// Get device access logs
export const getDeviceAccessLogs = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const gymOwnerId = req.user._id;
  const { limit = 50, page = 1 } = req.query;

  // Verify user is gym owner
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can view device logs', 403));
  }

  // Find device
  const device = await Device.findOne({ deviceId, gymOwner: gymOwnerId });
  if (!device) {
    return next(new AppError('Device not found', 404));
  }

  // Get paginated access logs
  const startIndex = (page - 1) * limit;
  const accessLogs = device.accessLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(startIndex, startIndex + parseInt(limit));

  res.status(200).json({
    status: 'success',
    results: accessLogs.length,
    totalLogs: device.accessLogs.length,
    page: parseInt(page),
    totalPages: Math.ceil(device.accessLogs.length / limit),
    data: {
      device: {
        deviceId: device.deviceId,
        location: device.deviceLocation,
        status: device.status
      },
      accessLogs
    }
  });
});

// Delete/Deactivate device
export const deactivateDevice = catchAsync(async (req, res, next) => {
  const { deviceId } = req.params;
  const gymOwnerId = req.user._id;

  // Verify user is gym owner
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can deactivate devices', 403));
  }

  const device = await Device.findOneAndUpdate(
    { deviceId, gymOwner: gymOwnerId },
    { status: 'inactive', deactivatedAt: new Date() },
    { new: true }
  );

  if (!device) {
    return next(new AppError('Device not found', 404));
  }

  res.status(200).json({
    status: 'success',
    message: 'Device deactivated successfully',
    data: {
      device
    }
  });
});