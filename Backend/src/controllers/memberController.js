// controllers/memberController.js
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import firestoreService from '../services/firestoreService.js';

// Verify membership and subscription status for QR code scanning
// When successful, sends "allow" response to NodeMCU for access control
export const verifyMembership = catchAsync(async (req, res, next) => {
  console.log('Verify membership request received');
  console.log('Request body:', req.body);
  console.log('Request user:', req.user || 'No authenticated user (device access)');
  
  const { gymOwnerId, memberId, timestamp } = req.body;

  console.log('Extracted values:', { gymOwnerId, memberId, timestamp });

  // Validate input
  if (!gymOwnerId || !memberId) {
    console.log('Validation failed - missing gymOwnerId or memberId');
    return next(new AppError('Gym owner ID and member ID are required', 400));
  }

  // Check if the requesting user is the member (skip for device access)
  if (req.user && req.user._id.toString() !== memberId) {
    console.log('User ID mismatch:', { requestUserId: req.user._id.toString(), memberId });
    return next(new AppError('You can only verify your own membership', 403));
  }

  // Find the gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    // Update door status to false (closed) for invalid gym
    try {
      await firestoreService.updateDoorStatus(gymOwnerId, false);
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Invalid gym owner'
      );
    } catch (firestoreError) {
      console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    }

    return res.status(404).json({
      status: 'error',
      message: 'Invalid gym owner or gym not found',
      data: {
        member: { membershipStatus: 'Unknown' }
      }
    });
  }

  // Find the member
  const member = await User.findById(memberId);
  if (!member || member.role !== 'member') {
    // Update door status to false (closed) for invalid member
    try {
      await firestoreService.updateDoorStatus(gymOwnerId, false);
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Invalid member'
      );
    } catch (firestoreError) {
      console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    }

    return res.status(404).json({
      status: 'error',
      message: 'Invalid member',
      data: {
        member: { membershipStatus: 'Unknown' }
      }
    });
  }

  // Check if member is associated with this gym
  if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
    // Update door status to false (closed) for non-member
    try {
      await firestoreService.updateDoorStatus(gymOwnerId, false);
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Not a member of this gym'
      );
    } catch (firestoreError) {
      console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    }

    return res.status(403).json({
      status: 'error',
      message: 'You are not a member of this gym',
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
    // Update door status to false (closed) for inactive membership
    try {
      await firestoreService.updateDoorStatus(gymOwnerId, false);
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Inactive membership'
      );
    } catch (firestoreError) {
      console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    }

    return res.status(200).json({
      status: 'error',
      message: 'Your subscription is inactive. Please renew your membership.',
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

  // Check if member has already scanned today (daily limit check)
  try {
    const dailyScanCheck = await firestoreService.hasScannedToday(memberId, gymOwnerId);
    
    if (dailyScanCheck.hasScanned) {
      // Update door status to false (closed) for daily limit exceeded
      await firestoreService.updateDoorStatus(gymOwnerId, false);
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Daily scan limit exceeded'
      );

      const lastScanTime = dailyScanCheck.lastScanTime;
      const timeString = lastScanTime ? 
        (lastScanTime instanceof Date ? lastScanTime.toLocaleTimeString() : new Date(lastScanTime).toLocaleTimeString()) 
        : 'earlier today';

      return res.status(429).json({
        status: 'error',
        message: `⚠️ Daily scan limit reached! You already scanned at ${timeString}. Please try again tomorrow.`,
        data: {
          member: { 
            membershipStatus: 'Active',
            name: member.name,
            email: member.email,
            dailyLimitReached: true,
            lastScanTime: lastScanTime
          },
          gym: {
            id: gymOwner._id,
            name: gymOwner.gymName || gymOwner.name + "'s Gym",
            owner: gymOwner.name
          }
        }
      });
    }
  } catch (firestoreError) {
    console.error('❌ Firestore Daily Check Error (non-critical):', firestoreError.message);
    // Continue with scan if daily check fails (fail-safe approach)
  }

  // Success - member is active
  try {
    // Update Firestore with active status
    await firestoreService.updateMemberStatusToActive(
      memberId,
      gymOwnerId,
      {
        name: member.name,
        email: member.email
      },
      {
        id: gymOwner._id,
        name: gymOwner.gymName || gymOwner.name + "'s Gym",
        owner: gymOwner.name
      }
    );

    // Log successful QR scan
    await firestoreService.logQRScanAttempt(
      memberId,
      gymOwnerId,
      'success',
      'Active membership verified'
    );

    console.log('✅ Firestore: Member status updated to active successfully');
  } catch (firestoreError) {
    console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    // Don't fail the request if Firestore fails - it's supplementary
  }

  res.status(200).json({
    status: 'success',
    message: `✅ Subscription is Active! Welcome to ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
    nodeMcuResponse: 'allow', // Send "allow" to NodeMCU on successful scan
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

// Member QR scan verification - member scans gym owner's QR code
export const verifyMemberQRScan = catchAsync(async (req, res, next) => {
  console.log('Member QR scan verification request received');
  console.log('Request body:', req.body);
  console.log('Request user:', req.user);
  
  const { gymOwnerId, timestamp } = req.body;
  const memberId = req.user?.id || req.user?._id;

  console.log('Extracted values:', { gymOwnerId, memberId, timestamp });

  // Validate input
  if (!gymOwnerId) {
    console.log('Validation failed - missing gymOwnerId');
    return res.status(400).json({
      status: 'error',
      message: 'Gym owner ID is required',
      nodeMcuResponse: 'deny',
      data: {}
    });
  }

  // Check if user is authenticated
  if (!req.user || !memberId) {
    console.log('Validation failed - no authenticated user');
    return res.status(401).json({
      status: 'error',
      message: 'Authentication required',
      nodeMcuResponse: 'deny',
      data: {}
    });
  }

  // Find the gym owner
  const gymOwner = await User.findById(gymOwnerId);
  if (!gymOwner || gymOwner.role !== 'gym-owner') {
    return res.status(404).json({
      status: 'error',
      message: 'Invalid gym owner or gym not found',
      nodeMcuResponse: 'deny',
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
      nodeMcuResponse: 'deny',
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
      nodeMcuResponse: 'deny',
      data: {
        member: { 
          membershipStatus: 'Not a member',
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

  // Check membership status
  if (member.membershipStatus !== 'Active') {
    return res.status(200).json({
      status: 'error',
      message: 'Your subscription is inactive. Please renew your membership.',
      nodeMcuResponse: 'deny',
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

  // Check if member has already scanned today (daily limit check)
  try {
    const dailyScanCheck = await firestoreService.hasScannedToday(memberId, gymOwnerId);
    
    if (dailyScanCheck.hasScanned) {
      // Log failed attempt due to daily limit
      await firestoreService.logQRScanAttempt(
        memberId,
        gymOwnerId,
        'failed',
        'Daily scan limit exceeded'
      );

      const lastScanTime = dailyScanCheck.lastScanTime;
      const timeString = lastScanTime ? 
        (lastScanTime instanceof Date ? lastScanTime.toLocaleTimeString() : new Date(lastScanTime).toLocaleTimeString()) 
        : 'earlier today';

      return res.status(429).json({
        status: 'error',
        message: `⚠️ Daily scan limit reached! You already scanned at ${timeString}. Please try again tomorrow.`,
        nodeMcuResponse: 'deny',
        data: {
          member: { 
            membershipStatus: 'Active',
            name: member.name,
            email: member.email,
            dailyLimitReached: true,
            lastScanTime: lastScanTime
          },
          gym: {
            id: gymOwner._id,
            name: gymOwner.gymName || gymOwner.name + "'s Gym",
            owner: gymOwner.name
          }
        }
      });
    }
  } catch (firestoreError) {
    console.error('❌ Firestore Daily Check Error (non-critical):', firestoreError.message);
    // Continue with scan if daily check fails (fail-safe approach)
  }

  // Success - member is active, allow access
  try {
    // Update Firestore with active status
    await firestoreService.updateMemberStatusToActive(
      memberId,
      gymOwnerId,
      {
        name: member.name,
        email: member.email
      },
      {
        id: gymOwner._id,
        name: gymOwner.gymName || gymOwner.name + "'s Gym",
        owner: gymOwner.name
      }
    );

    // Log successful QR scan
    await firestoreService.logQRScanAttempt(
      memberId,
      gymOwnerId,
      'success',
      'QR scan verification successful'
    );

    console.log('✅ Firestore: Member QR scan logged and status updated successfully');
  } catch (firestoreError) {
    console.error('❌ Firestore Error (non-critical):', firestoreError.message);
    // Don't fail the request if Firestore fails - it's supplementary
  }

  res.status(200).json({
    status: 'success',
    message: `✅ Access Granted! Welcome to ${gymOwner.gymName || gymOwner.name + "'s Gym"}, ${member.name}!`,
    nodeMcuResponse: 'allow', // Send "allow" to NodeMCU only for active members
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
  const memberId = req.user._id;

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
  if (req.user._id.toString() !== memberId) {
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
      message: 'You are not a member of this gym'
    });
  }

  // Check membership status
  if (member.membershipStatus !== 'Active') {
    return res.status(403).json({
      status: 'error',
      message: 'Status inactive'
    });
  }

  // Record attendance
  member.attendance = member.attendance || [];
  const attendanceRecord = { gymOwnerId, timestamp: new Date(timestamp) };
  member.attendance.push(attendanceRecord);
  
  console.log(`Marking attendance for member ${member.name} (${memberId}) at gym ${gymOwnerId}`);
  console.log('Attendance record:', attendanceRecord);
  console.log('Total attendance records after adding:', member.attendance.length);
  
  await member.save({ validateBeforeSave: false });
  
  console.log('Attendance successfully saved to database');

  res.status(200).json({
    status: 'success',
    message: `Attendance marked for ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
    nodeMcuResponse: 'allow', // Send "allow" to NodeMCU on successful attendance marking
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

// Get attendance data for a specific member
export const getAttendanceData = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  const userId = req.user._id;

  // Find the member
  const member = await User.findById(memberId);
  if (!member || member.role !== 'member') {
    return next(new AppError('Member not found', 404));
  }

  // Check if the requesting user has permission to view this member's attendance
  // Gym owners can view their members' attendance, trainers can view their assigned members
  if (req.user.role === 'gym-owner') {
    if (!member.createdBy || member.createdBy.toString() !== userId) {
      return next(new AppError('You can only view attendance of your gym members', 403));
    }
  } else if (req.user.role === 'trainer') {
    if (!member.assignedTrainer || member.assignedTrainer.toString() !== userId) {
      return next(new AppError('You can only view attendance of your assigned members', 403));
    }
  } else {
    return next(new AppError('Insufficient permissions', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      member: {
        id: member._id,
        name: member.name,
        email: member.email,
        attendance: member.attendance || []
      }
    }
  });
});

// Get gym-wide attendance statistics
export const getGymAttendanceStats = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Only gym owners can view gym-wide stats
  if (req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can view gym-wide attendance statistics', 403));
  }

  // Get all members of this gym
  const members = await User.find({ 
    createdBy: userId, 
    role: 'member' 
  }).select('name email attendance membershipStatus');

  // Calculate statistics with proper date handling
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today.getTime() + (24 * 60 * 60 * 1000));
  const thisWeekStart = new Date(today.getTime() - (today.getDay() * 24 * 60 * 60 * 1000));
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  console.log('Date ranges for attendance calculation:', {
    today: today.toISOString(),
    tomorrow: tomorrow.toISOString(),
    thisWeekStart: thisWeekStart.toISOString(),
    thisMonthStart: thisMonthStart.toISOString()
  });

  let totalAttendanceToday = 0;
  let totalAttendanceThisWeek = 0;
  let totalAttendanceThisMonth = 0;
  let totalAttendanceAllTime = 0;

  const memberStats = members.map(member => {
    const attendance = member.attendance || [];
    
    // Today's attendance: between today 00:00:00 and tomorrow 00:00:00
    const todayAttendance = attendance.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= today && recordDate < tomorrow;
    }).length;

    // This week's attendance
    const weekAttendance = attendance.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= thisWeekStart && recordDate < tomorrow;
    }).length;

    // This month's attendance
    const monthAttendance = attendance.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= thisMonthStart && recordDate < tomorrow;
    }).length;

    // Log attendance data for debugging
    if (attendance.length > 0) {
      console.log(`Member ${member.name} attendance:`, {
        totalRecords: attendance.length,
        todayCount: todayAttendance,
        weekCount: weekAttendance,
        monthCount: monthAttendance,
        recentRecords: attendance.slice(-3).map(r => ({
          timestamp: r.timestamp,
          date: new Date(r.timestamp).toISOString()
        }))
      });
    }

    totalAttendanceToday += todayAttendance;
    totalAttendanceThisWeek += weekAttendance;
    totalAttendanceThisMonth += monthAttendance;
    totalAttendanceAllTime += attendance.length;

    return {
      id: member._id,
      name: member.name,
      email: member.email,
      membershipStatus: member.membershipStatus,
      attendanceToday: todayAttendance,
      attendanceThisWeek: weekAttendance,
      attendanceThisMonth: monthAttendance,
      attendanceAllTime: attendance.length,
      lastAttendance: attendance.length > 0 ? 
        new Date(Math.max(...attendance.map(a => new Date(a.timestamp)))).toISOString() : null
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      summary: {
        totalMembers: members.length,
        activeMembers: members.filter(m => m.membershipStatus === 'Active').length,
        totalAttendanceToday,
        totalAttendanceThisWeek,
        totalAttendanceThisMonth,
        totalAttendanceAllTime,
        averageAttendancePerMember: members.length > 0 ? Math.round(totalAttendanceAllTime / members.length) : 0
      },
      members: memberStats
    }
  });
});