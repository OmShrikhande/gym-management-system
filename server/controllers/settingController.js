const Setting = require('../models/Setting');
const User = require('../models/User');
const { errorHandler } = require('../utils/errorHandler');

/**
 * Get global settings
 * @route GET /api/settings
 * @access Private (Super Admin)
 */
exports.getGlobalSettings = async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only super admins can access global settings.'
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
  } catch (error) {
    errorHandler(error, req, res);
  }
};

/**
 * Update global settings
 * @route POST /api/settings
 * @access Private (Super Admin)
 */
exports.updateGlobalSettings = async (req, res) => {
  try {
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
  } catch (error) {
    errorHandler(error, req, res);
  }
};

/**
 * Get gym settings
 * @route GET /api/settings/gym/:gymId
 * @access Private (Gym Owner, Super Admin)
 */
exports.getGymSettings = async (req, res) => {
  try {
    const { gymId } = req.params;

    // Check if user is authorized (super admin, gym owner, or trainer/member of this gym)
    const isAuthorized = req.user.role === 'super-admin' || 
                        req.user._id.toString() === gymId ||
                        (req.user.gymId && req.user.gymId.toString() === gymId);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your gym settings.'
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
      settings = await Setting.create({
        gymId,
        ...globalSettings ? globalSettings.toObject() : {},
        isGlobal: false,
        _id: undefined // Don't copy the global settings ID
      });
    }

    res.status(200).json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

/**
 * Update gym settings
 * @route POST /api/settings/gym/:gymId
 * @access Private (Gym Owner, Super Admin)
 */
exports.updateGymSettings = async (req, res) => {
  try {
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

        // For each user, update or create their settings based on the gym settings
        const updatePromises = gymUsers.map(async (user) => {
          // Check if user already has settings
          const userSettings = await Setting.findOne({ userId: user._id });
          
          if (userSettings) {
            // Update existing user settings with gym settings
            await Setting.updateOne(
              { userId: user._id },
              { 
                ...settings,
                userId: user._id,
                isGlobal: false
              }
            );
          } else {
            // Create new user settings based on gym settings
            await Setting.create({
              ...settings,
              userId: user._id,
              isGlobal: false
            });
          }
        });

        // Wait for all updates to complete
        await Promise.all(updatePromises);
        
        console.log(`Settings propagated to ${gymUsers.length} users of gym ${gymId}`);
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
  } catch (error) {
    errorHandler(error, req, res);
  }
};

/**
 * Get user-specific settings
 * @route GET /api/settings/user/:userId
 * @access Private (User or Admin)
 */
exports.getUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is authorized (the user themselves, their gym owner, or super admin)
    const isOwnSettings = req.user._id.toString() === userId;
    const isGymOwner = req.user.role === 'gym-owner' && req.user._id.toString() === req.user.gymId;
    const isSuperAdmin = req.user.role === 'super-admin';
    
    if (!isOwnSettings && !isGymOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own settings.'
      });
    }

    // Find the user to get their gymId
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // For trainers and members, get gym settings directly
    let settings = null;
    
    if (user.role === 'trainer' || user.role === 'member') {
      // Get gym settings for trainers and members
      if (user.gymId) {
        settings = await Setting.findOne({ gymId: user.gymId });
      }
    } else {
      // For gym owners, get their own settings
      settings = await Setting.findOne({ userId });
    }
    
    // If no settings found and user has a gym, try to find gym settings
    if (!settings && user.gymId) {
      settings = await Setting.findOne({ gymId: user.gymId });
    }
    
    // If still no settings, use global settings
    if (!settings) {
      const globalSettings = await Setting.findOne({ isGlobal: true });
      
      if (globalSettings) {
        // Create user settings based on global settings
        settings = await Setting.create({
          userId,
          ...globalSettings.toObject(),
          _id: undefined, // Don't copy the global settings ID
          isGlobal: false
        });
      } else {
        // Create default settings if nothing else exists
        settings = await Setting.create({ userId, isGlobal: false });
      }
    }

    res.status(200).json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    errorHandler(error, req, res);
  }
};

/**
 * Update user-specific settings
 * @route POST /api/settings/user/:userId
 * @access Private (User or Admin)
 */
exports.updateUserSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { settings } = req.body;

    // Check if user is authorized (the user themselves, their gym owner, or super admin)
    const isOwnSettings = req.user._id.toString() === userId;
    const isGymOwner = req.user.role === 'gym-owner' && req.user._id.toString() === req.user.gymId;
    const isSuperAdmin = req.user.role === 'super-admin';
    
    if (!isOwnSettings && !isGymOwner && !isSuperAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own settings.'
      });
    }

    // Find the user
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
  } catch (error) {
    errorHandler(error, req, res);
  }
};