import Setting from '../models/Setting.js';
import User from '../models/userModel.js';
import { errorHandler } from '../utils/errorHandler.js';
import catchAsync from '../utils/catchAsync.js';
import webSocketService from '../services/websocketService.js';

/**
 * Get global settings
 * @route GET /api/settings
 * @access Private (Super Admin)
 */
export const getGlobalSettings = catchAsync(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== 'super-admin' && req.user.role !== 'gym-owner') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only super admins and gym owners can access settings.'
    });
  }

  // Find global settings or create default
  let settings = await Setting.findOne({ isGlobal: true });
  
  if (!settings) {
    settings = await Setting.create({ isGlobal: true });
  }

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

/**
 * Update global settings
 * @route POST /api/settings
 * @access Private (Super Admin)
 */
export const updateGlobalSettings = catchAsync(async (req, res) => {
  // Check if user is super admin
  if (req.user.role !== 'super-admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Only super admins can update global settings.'
    });
  }

  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({
      success: false,
      message: 'Settings data is required'
    });
  }

  // Find and update global settings, or create if not exists
  let updatedSettings = await Setting.findOneAndUpdate(
    { isGlobal: true },
    { ...settings },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    data: { settings: updatedSettings },
    message: 'Global settings updated successfully'
  });
});

/**
 * Get gym settings
 * @route GET /api/settings/gym/:gymId
 * @access Private (Gym Owner, Super Admin)
 */
export const getGymSettings = catchAsync(async (req, res) => {
  const { gymId } = req.params;

  // Check if user is authorized (super admin or the gym owner)
  if (req.user.role !== 'super-admin' && req.user._id.toString() !== gymId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own gym settings.'
    });
  }

  // Verify gym owner exists
  const gymOwner = await User.findOne({ _id: gymId, role: 'gym-owner' });
  
  if (!gymOwner) {
    return res.status(404).json({
      success: false,
      message: 'Gym owner not found'
    });
  }

  // Find gym settings or create default
  let settings = await Setting.findOne({ gymId });
  
  if (!settings) {
    // If no gym-specific settings, get global settings as default
    const globalSettings = await Setting.findOne({ isGlobal: true });
    
    // Create new settings for this gym based on global defaults
    const globalObj = globalSettings ? globalSettings.toObject() : {};
    delete globalObj._id; // Remove the _id field
    
    settings = await Setting.create({
      ...globalObj,
      gymId,
      isGlobal: false
    });
  }

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

/**
 * Update gym settings
 * @route POST /api/settings/gym/:gymId
 * @access Private (Gym Owner, Super Admin)
 */
export const updateGymSettings = catchAsync(async (req, res) => {
  const { gymId } = req.params;
  const { settings, applyToUsers = true } = req.body;

  // Check if user is authorized (super admin or the gym owner)
  if (req.user.role !== 'super-admin' && req.user._id.toString() !== gymId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own gym settings.'
    });
  }

  // Verify gym owner exists
  const gymOwner = await User.findOne({ _id: gymId, role: 'gym-owner' });
  
  if (!gymOwner) {
    return res.status(404).json({
      success: false,
      message: 'Gym owner not found'
    });
  }

  if (!settings) {
    return res.status(400).json({
      success: false,
      message: 'Settings data is required'
    });
  }

  // Find and update gym settings, or create if not exists
  let updatedSettings = await Setting.findOneAndUpdate(
    { gymId },
    { 
      ...settings,
      gymId, // Ensure gymId is set
      isGlobal: false // Ensure it's not marked as global
    },
    { new: true, upsert: true }
  );

  // If applyToUsers is true, propagate settings to all trainers and members of this gym
  if (applyToUsers) {
    try {
      // Find all trainers and members associated with this gym
      const gymUsers = await User.find({
        gymId: gymId,
        role: { $in: ['trainer', 'member'] }
      });

      // Collect user IDs for real-time updates
      const userIds = gymUsers.map(user => user._id.toString());

      // Update/create settings for each user concurrently
      const updatePromises = gymUsers.map(async (user) => {
        return Setting.findOneAndUpdate(
          { userId: user._id },
          { 
            ...settings,
            userId: user._id,
            isGlobal: false
          },
          { new: true, upsert: true }
        );
      });

      // Wait for all updates to complete
      await Promise.all(updatePromises);

      // Broadcast real-time updates via WebSocket
      if (userIds.length > 0) {
        const broadcastCount = webSocketService.broadcastSettingsUpdate(
          settings,
          userIds,
          req.user._id.toString()
        );
        
        console.log(`Settings propagated to ${gymUsers.length} users, ${broadcastCount} notified in real-time`);
      }
      
    } catch (propagationError) {
      console.error('Error propagating settings to users:', propagationError);
      // We don't want to fail the main request if propagation fails
    }
  }

  res.status(200).json({
    success: true,
    data: { settings: updatedSettings },
    message: 'Gym settings updated successfully'
  });
});

/**
 * Get user-specific settings
 * @route GET /api/settings/user/:userId
 * @access Private (Own settings only)
 */
export const getUserSettings = catchAsync(async (req, res) => {
  const { userId } = req.params;

  // Users can only access their own settings (except super admin)
  if (req.user.role !== 'super-admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only access your own settings.'
    });
  }

  // Verify user exists
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Find user settings or create default based on role
  let settings = await Setting.findOne({ userId });
  
  if (!settings) {
    // Get appropriate default settings based on user role
    let defaultSettings = {};
    
    if (user.role === 'gym-owner') {
      // For gym owners, try to get their gym settings first, then global
      const gymSettings = await Setting.findOne({ gymId: userId });
      if (gymSettings) {
        defaultSettings = gymSettings.toObject();
      } else {
        const globalSettings = await Setting.findOne({ isGlobal: true });
        defaultSettings = globalSettings ? globalSettings.toObject() : {};
      }
    } else {
      // For members and trainers, get global settings as default
      const globalSettings = await Setting.findOne({ isGlobal: true });
      defaultSettings = globalSettings ? globalSettings.toObject() : {};
    }
    
    // Remove fields that shouldn't be copied
    delete defaultSettings._id;
    delete defaultSettings.gymId;
    delete defaultSettings.userId;
    delete defaultSettings.isGlobal;
    
    // Create user-specific settings
    settings = await Setting.create({
      ...defaultSettings,
      userId,
      isGlobal: false
    });
  }

  res.status(200).json({
    success: true,
    data: { settings }
  });
});

/**
 * Update user-specific settings
 * @route POST /api/settings/user/:userId
 * @access Private (Own settings only)
 */
export const updateUserSettings = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { settings } = req.body;

  // Users can only update their own settings (except super admin)
  if (req.user.role !== 'super-admin' && req.user._id.toString() !== userId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. You can only update your own settings.'
    });
  }

  // Verify user exists
  const user = await User.findById(userId);
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!settings) {
    return res.status(400).json({
      success: false,
      message: 'Settings data is required'
    });
  }

  // Find and update user settings, or create if not exists
  let updatedSettings = await Setting.findOneAndUpdate(
    { userId },
    { 
      ...settings,
      userId, // Ensure userId is set
      isGlobal: false // Ensure it's not marked as global
    },
    { new: true, upsert: true }
  );

  res.status(200).json({
    success: true,
    data: { settings: updatedSettings },
    message: 'User settings updated successfully'
  });
});

/**
 * Bulk update settings for multiple users
 * @route POST /api/settings/bulk
 * @access Private (Gym Owner, Super Admin)
 */
export const bulkUpdateSettings = catchAsync(async (req, res) => {
  const { userIds, settings } = req.body;

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Valid user IDs array is required'
    });
  }

  if (!settings) {
    return res.status(400).json({
      success: false,
      message: 'Settings data is required'
    });
  }

  // Verify all users exist and belong to the same gym (for gym owners)
  const users = await User.find({ _id: { $in: userIds } });
  
  if (users.length !== userIds.length) {
    return res.status(400).json({
      success: false,
      message: 'Some users not found'
    });
  }

  // For gym owners, verify all users belong to their gym
  if (req.user.role === 'gym-owner') {
    const unauthorizedUsers = users.filter(user => 
      user.gymId !== req.user._id.toString() || 
      !['trainer', 'member'].includes(user.role)
    );
    
    if (unauthorizedUsers.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'You can only update settings for trainers and members of your gym'
      });
    }
  }

  // Bulk update settings
  const bulkOperations = userIds.map(userId => ({
    updateOne: {
      filter: { userId },
      update: { 
        ...settings,
        userId,
        isGlobal: false
      },
      upsert: true
    }
  }));

  await Setting.bulkWrite(bulkOperations);

  // Broadcast settings update via WebSocket
  if (userIds.length > 0) {
    webSocketService.broadcastSettingsUpdate(
      settings,
      userIds,
      req.user._id.toString()
    );
  }

  res.status(200).json({
    success: true,
    data: { 
      updatedCount: userIds.length,
      userIds
    },
    message: `Settings updated for ${userIds.length} users`
  });
});