import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { protect } from '../middleware/authMiddleware.js';
import GymCustomization from '../models/gymCustomizationModel.js';
import User from '../models/userModel.js';

const router = express.Router();

// Test route to verify the module is working
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Gym customization routes are working',
    timestamp: new Date().toISOString()
  });
});

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/gym-assets';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `${req.params.gymId || 'default'}-${file.fieldname}-${uniqueSuffix}${fileExtension}`;
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  }
});

// Simple validation function
const validateCustomization = (req, res, next) => {
  try {
    const { branding } = req.body;
    const errors = [];
    
    if (branding) {
      const colorRegex = /^#[0-9A-F]{6}$/i;
      const colorFields = ['primaryColor', 'secondaryColor', 'backgroundColor', 'cardColor', 'sidebarColor', 'textColor', 'accentColor'];
      
      colorFields.forEach(field => {
        if (branding[field] && !colorRegex.test(branding[field])) {
          errors.push(`${field} must be a valid hex color`);
        }
      });
      
      if (branding.gymName && (branding.gymName.length > 100 || branding.gymName.length < 1)) {
        errors.push('Gym name must be between 1 and 100 characters');
      }
      
      if (branding.logo && branding.logo.length > 0 && !branding.logo.match(/^https?:\/\/.+/)) {
        errors.push('Logo must be a valid URL');
      }
      
      if (branding.favicon && branding.favicon.length > 0 && !branding.favicon.match(/^https?:\/\/.+/)) {
        errors.push('Favicon must be a valid URL');
      }
    }
    
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors
      });
    }
    
    next();
  } catch (error) {
    console.error('Error in validation middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Validation error'
    });
  }
};

// Check if user is gym owner or has permission to modify gym customization
const checkGymPermission = async (req, res, next) => {
  try {
    const { gymId } = req.params;
    const userId = req.user.id;
    
    console.log('Checking gym permission:', { gymId, userId, userRole: req.user.role });
    
    // Check if user is gym owner
    if (req.user.role === 'gym-owner' && req.user.id === gymId) {
      req.isGymOwner = true;
      console.log('User is gym owner');
      return next();
    }
    
    // Check if user belongs to this gym
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found:', userId);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.gymId && user.gymId.toString() === gymId) {
      req.isGymMember = true;
      console.log('User is gym member');
      return next();
    }
    
    console.log('User does not have permission:', { userGymId: user.gymId, requestedGymId: gymId });
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this gym\'s customization'
    });
  } catch (error) {
    console.error('Error checking gym permission:', error);
    console.error('Permission check error details:', {
      message: error.message,
      stack: error.stack,
      gymId: req.params.gymId,
      userId: req.user?.id
    });
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get gym customization
router.get('/:gymId/customization', protect, checkGymPermission, async (req, res) => {
  try {
    const { gymId } = req.params;
    
    // Don't allow super admin to access gym customization
    if (req.user.role === 'super-admin') {
      return res.status(403).json({
        success: false,
        message: 'Super admin cannot access gym customization'
      });
    }
    
    let customization = await GymCustomization.findOne({ gymId });
    
    if (!customization) {
      // Create default customization if none exists
      customization = new GymCustomization({
        gymId,
        branding: {
          gymName: '',
          primaryColor: '#3B82F6',
          secondaryColor: '#8B5CF6',
          backgroundColor: '#111827',
          cardColor: '#1F2937',
          sidebarColor: '#1F2937',
          textColor: '#FFFFFF',
          accentColor: '#06B6D4',
          logo: '',
          favicon: '',
          darkMode: true
        },
        settings: {
          allowMemberCustomization: false,
          allowTrainerCustomization: false,
          customCss: ''
        },
        metadata: {
          createdBy: req.user.id,
          lastUpdatedBy: req.user.id
        }
      });
      
      await customization.save();
    }
    
    res.json({
      success: true,
      data: customization
    });
  } catch (error) {
    console.error('Error fetching gym customization:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update gym customization (only gym owners)
router.put('/:gymId/customization', protect, checkGymPermission, validateCustomization, async (req, res) => {
  try {
    const { gymId } = req.params;
    const updateData = req.body;
    
    console.log('PUT /customization called:', { gymId, userId: req.user.id, isGymOwner: req.isGymOwner });
    console.log('Update data:', JSON.stringify(updateData, null, 2));
    
    // Only gym owners can update customization
    if (!req.isGymOwner) {
      console.log('Access denied: User is not gym owner');
      return res.status(403).json({
        success: false,
        message: 'Only gym owners can update customization'
      });
    }
    
    // Validation is handled by middleware
    
    // Check if customization exists to determine if this is an update or create
    console.log('Checking for existing customization...');
    const existingCustomization = await GymCustomization.findOne({ gymId });
    console.log('Existing customization found:', !!existingCustomization);
    
    let customization;
    if (existingCustomization) {
      console.log('Updating existing customization...');
      // Update existing customization
      customization = await GymCustomization.findOneAndUpdate(
        { gymId },
        {
          $set: {
            ...updateData,
            'metadata.lastUpdatedBy': req.user.id,
            updatedAt: new Date()
          },
          $inc: {
            'metadata.version': 1
          }
        },
        { new: true }
      );
      console.log('Customization updated successfully');
    } else {
      console.log('Creating new customization...');
      // Create new customization
      customization = await GymCustomization.findOneAndUpdate(
        { gymId },
        {
          $set: {
            ...updateData,
            'metadata.createdBy': req.user.id,
            'metadata.lastUpdatedBy': req.user.id,
            'metadata.version': 1,
            updatedAt: new Date()
          }
        },
        { new: true, upsert: true }
      );
      console.log('Customization created successfully');
    }
    
    res.json({
      success: true,
      data: customization,
      message: 'Gym customization updated successfully'
    });
  } catch (error) {
    console.error('Error updating gym customization:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      gymId: req.params.gymId,
      userId: req.user?.id,
      updateData: req.body
    });
    res.status(500).json({
      success: false,
      message: 'Server error',
      ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }
});

// Upload gym assets (logo, favicon)
router.post('/:gymId/upload-asset', protect, checkGymPermission, upload.single('file'), async (req, res) => {
  try {
    const { gymId } = req.params;
    const { type } = req.body;
    
    // Only gym owners can upload assets
    if (!req.isGymOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only gym owners can upload assets'
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    if (!type || !['logo', 'favicon'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset type. Must be logo or favicon'
      });
    }
    
    // Generate asset URL
    const assetUrl = `${req.protocol}://${req.get('host')}/uploads/gym-assets/${req.file.filename}`;
    
    // Update customization with new asset URL
    let customization = await GymCustomization.findOneAndUpdate(
      { gymId },
      {
        $set: {
          [`branding.${type}`]: assetUrl,
          'metadata.lastUpdatedBy': req.user.id,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      data: {
        url: assetUrl,
        type,
        filename: req.file.filename
      },
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully`
    });
  } catch (error) {
    console.error('Error uploading asset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete gym asset
router.delete('/:gymId/asset/:type', protect, checkGymPermission, async (req, res) => {
  try {
    const { gymId, type } = req.params;
    
    // Only gym owners can delete assets
    if (!req.isGymOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only gym owners can delete assets'
      });
    }
    
    if (!['logo', 'favicon'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid asset type. Must be logo or favicon'
      });
    }
    
    // Get current customization to find file path
    const customization = await GymCustomization.findOne({ gymId });
    
    if (customization && customization.branding[type]) {
      const assetUrl = customization.branding[type];
      const filename = path.basename(assetUrl);
      const filePath = path.join('./uploads/gym-assets', filename);
      
      // Delete file if it exists
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        console.warn('Error deleting file:', error);
      }
    }
    
    // Update customization to remove asset URL
    await GymCustomization.findOneAndUpdate(
      { gymId },
      {
        $set: {
          [`branding.${type}`]: '',
          'metadata.lastUpdatedBy': req.user.id,
          updatedAt: new Date()
        }
      }
    );
    
    res.json({
      success: true,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Reset gym customization to default
router.post('/:gymId/reset-customization', protect, checkGymPermission, async (req, res) => {
  try {
    const { gymId } = req.params;
    
    // Only gym owners can reset customization
    if (!req.isGymOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only gym owners can reset customization'
      });
    }
    
    // Reset to default values
    const defaultCustomization = {
      branding: {
        gymName: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6',
        backgroundColor: '#111827',
        cardColor: '#1F2937',
        sidebarColor: '#1F2937',
        textColor: '#FFFFFF',
        accentColor: '#06B6D4',
        logo: '',
        favicon: '',
        darkMode: true
      },
      settings: {
        allowMemberCustomization: false,
        allowTrainerCustomization: false,
        customCss: ''
      },
      metadata: {
        lastUpdatedBy: req.user.id
      }
    };
    
    const customization = await GymCustomization.findOneAndUpdate(
      { gymId },
      {
        $set: {
          ...defaultCustomization,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      data: customization,
      message: 'Gym customization reset to default'
    });
  } catch (error) {
    console.error('Error resetting gym customization:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;