import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * Check and fix trainer gym assignments
 * Only accessible by super-admin and gym-owner
 */
router.post('/fix-trainer-assignments', restrictTo('super-admin', 'gym-owner'), catchAsync(async (req, res, next) => {
  try {
    console.log('🔧 Starting trainer gym assignment fix...');
    
    let query = { role: 'trainer' };
    
    // If gym owner, only fix their trainers
    if (req.user.role === 'gym-owner') {
      query.$or = [
        { createdBy: req.user._id },
        { gymId: req.user._id }
      ];
    }
    
    // Find trainers without proper gymId
    const trainersToFix = await User.find({
      ...query,
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' },
        { gymId: { $type: 'string', $eq: '' } }
      ]
    });

    console.log(`Found ${trainersToFix.length} trainers to fix`);
    
    const fixResults = [];
    
    for (const trainer of trainersToFix) {
      let gymOwnerId = null;
      let fixMethod = '';
      
      // Try to find gym owner through createdBy
      if (trainer.createdBy) {
        const creator = await User.findById(trainer.createdBy);
        if (creator && creator.role === 'gym-owner') {
          gymOwnerId = creator._id;
          fixMethod = 'createdBy';
        }
      }
      
      // If still no gym owner and user is gym owner, assign to them
      if (!gymOwnerId && req.user.role === 'gym-owner') {
        gymOwnerId = req.user._id;
        fixMethod = 'current-gym-owner';
      }
      
      // If still no gym owner, find any gym owner
      if (!gymOwnerId) {
        const anyGymOwner = await User.findOne({ role: 'gym-owner' });
        if (anyGymOwner) {
          gymOwnerId = anyGymOwner._id;
          fixMethod = 'first-available';
        }
      }
      
      if (gymOwnerId) {
        await User.findByIdAndUpdate(trainer._id, {
          gymId: gymOwnerId,
          createdBy: gymOwnerId
        });
        
        fixResults.push({
          trainerId: trainer._id,
          trainerName: trainer.name,
          trainerEmail: trainer.email,
          assignedGymOwnerId: gymOwnerId,
          fixMethod: fixMethod,
          status: 'fixed'
        });
        
        console.log(`✅ Fixed trainer ${trainer.name} → Gym Owner ID: ${gymOwnerId} (${fixMethod})`);
      } else {
        fixResults.push({
          trainerId: trainer._id,
          trainerName: trainer.name,
          trainerEmail: trainer.email,
          status: 'failed',
          reason: 'No gym owner found'
        });
        
        console.log(`❌ Could not fix trainer ${trainer.name} - No gym owner found`);
      }
    }
    
    // Get updated status
    const remainingIssues = await User.find({
      ...query,
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' },
        { gymId: { $type: 'string', $eq: '' } }
      ]
    });
    
    res.status(200).json({
      status: 'success',
      message: `Trainer gym assignment fix completed`,
      data: {
        trainersProcessed: trainersToFix.length,
        trainersFixed: fixResults.filter(r => r.status === 'fixed').length,
        trainersFailed: fixResults.filter(r => r.status === 'failed').length,
        remainingIssues: remainingIssues.length,
        fixResults: fixResults
      }
    });
    
  } catch (error) {
    console.error('❌ Error fixing trainer assignments:', error);
    return next(new AppError('Failed to fix trainer assignments', 500));
  }
}));

/**
 * Get trainer gym assignment status
 * Only accessible by super-admin and gym-owner
 */
router.get('/trainer-status', restrictTo('super-admin', 'gym-owner'), catchAsync(async (req, res, next) => {
  try {
    let query = { role: 'trainer' };
    
    // If gym owner, only show their trainers
    if (req.user.role === 'gym-owner') {
      query.$or = [
        { createdBy: req.user._id },
        { gymId: req.user._id }
      ];
    }
    
    const allTrainers = await User.find(query).populate('gymId', 'name email').populate('createdBy', 'name email');
    
    const trainersWithIssues = await User.find({
      ...query,
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' },
        { gymId: { $type: 'string', $eq: '' } }
      ]
    });
    
    const trainerStatus = allTrainers.map(trainer => ({
      id: trainer._id,
      name: trainer.name,
      email: trainer.email,
      gymOwner: trainer.gymId ? {
        id: trainer.gymId._id,
        name: trainer.gymId.name,
        email: trainer.gymId.email
      } : null,
      createdBy: trainer.createdBy ? {
        id: trainer.createdBy._id,
        name: trainer.createdBy.name,
        email: trainer.createdBy.email
      } : null,
      hasIssue: !trainer.gymId
    }));
    
    res.status(200).json({
      status: 'success',
      data: {
        totalTrainers: allTrainers.length,
        trainersWithIssues: trainersWithIssues.length,
        trainersOk: allTrainers.length - trainersWithIssues.length,
        trainers: trainerStatus
      }
    });
    
  } catch (error) {
    console.error('❌ Error getting trainer status:', error);
    return next(new AppError('Failed to get trainer status', 500));
  }
}));

export default router;