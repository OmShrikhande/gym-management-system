import User from '../models/userModel.js';
import firestoreService from '../services/firestoreService.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

/**
 * Handle staff entry (gym owners and trainers)
 * Updates Firestore with staff entry status
 */
export const staffEntry = catchAsync(async (req, res, next) => {
  try {
    const staffId = req.user._id;
    const staffRole = req.user.role;
    
    // Get staff details
    const staff = await User.findById(staffId);
    if (!staff) {
      return next(new AppError('Staff member not found', 404));
    }

    // Determine gym owner ID
    let gymOwnerId;
    if (staffRole === 'gym-owner') {
      gymOwnerId = staffId; // Gym owner's own ID
    } else if (staffRole === 'trainer') {
      // For trainers, get the gym owner they belong to
      gymOwnerId = staff.gymId;
      
      if (!gymOwnerId || gymOwnerId === '' || gymOwnerId === null) {
        return next(new AppError('Trainer is not assigned to any gym owner', 400));
      }
    } else {
      return next(new AppError('Only trainers and gym owners can use staff entry', 403));
    }

    // Prepare staff data for Firestore
    const staffData = {
      name: staff.name,
      email: staff.email,
      gymName: staff.gymName || 'Main Gym',
      phone: staff.phone,
      role: staffRole
    };

    // Update staff entry status in Firestore
    const firestoreResult = await firestoreService.updateStaffEntryStatus(
      staffId,
      gymOwnerId,
      staffData,
      staffRole
    );

    if (!firestoreResult.success) {
      return next(new AppError('Failed to update entry status in Firestore', 500));
    }

    // Send success response
    res.status(200).json({
      success: true,
      status: 'success',
      message: `${staffRole === 'gym-owner' ? 'Gym Owner' : 'Trainer'} entry recorded successfully`,
      data: {
        staffId,
        staffName: staff.name,
        staffRole,
        gymOwnerId,
        entryTime: new Date().toISOString(),
        status: true,
        firestoreData: firestoreResult.data
      }
    });

  } catch (error) {
    console.error('Staff Entry Error:', error);
    return next(new AppError('Failed to process staff entry', 500));
  }
});