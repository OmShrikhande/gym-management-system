const express = require('express');
const router = express.Router();
const User = require('../models/User');
const GymCustomization = require('../models/GymCustomization');
const { authMiddleware } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body, validationResult } = require('express-validator');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/gym-assets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileExtension = path.extname(file.originalname);
    const filename = `${req.params.gymId}-${file.fieldname}-${uniqueSuffix}${fileExtension}`;
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

// Validation middleware
const validateCustomization = [
  body('branding.primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Primary color must be a valid hex color'),
  body('branding.secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Secondary color must be a valid hex color'),
  body('branding.backgroundColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Background color must be a valid hex color'),
  body('branding.cardColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Card color must be a valid hex color'),
  body('branding.sidebarColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Sidebar color must be a valid hex color'),
  body('branding.textColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Text color must be a valid hex color'),
  body('branding.accentColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Accent color must be a valid hex color'),
  body('branding.gymName').optional().isLength({ min: 1, max: 100 }).withMessage('Gym name must be between 1 and 100 characters'),
  body('branding.logo').optional().isURL().withMessage('Logo must be a valid URL'),
  body('branding.favicon').optional().isURL().withMessage('Favicon must be a valid URL'),
];

// Check if user is gym owner or has permission to modify gym customization
const checkGymPermission = async (req, res, next) => {
  try {
    const { gymId } = req.params;
    const userId = req.user.id;
    
    // Check if user is gym owner
    if (req.user.role === 'gym-owner' && req.user.id === gymId) {
      req.isGymOwner = true;
      return next();
    }
    
    // Check if user belongs to this gym
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    if (user.gymId && user.gymId.toString() === gymId) {
      req.isGymMember = true;
      return next();
    }
    
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this gym\'s customization'
    });
  } catch (error) {
    console.error('Error checking gym permission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get gym customization
router.get('/:gymId/customization', authMiddleware, checkGymPermission, async (req, res) => {
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
router.put('/:gymId/customization', authMiddleware, checkGymPermission, validateCustomization, async (req, res) => {
  try {
    const { gymId } = req.params;
    const updateData = req.body;
    
    // Only gym owners can update customization
    if (!req.isGymOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only gym owners can update customization'
      });
    }
    
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Update or create customization
    let customization = await GymCustomization.findOneAndUpdate(
      { gymId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { new: true, upsert: true }
    );
    
    res.json({
      success: true,
      data: customization,
      message: 'Gym customization updated successfully'
    });
  } catch (error) {
    console.error('Error updating gym customization:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Upload gym assets (logo, favicon)
router.post('/:gymId/upload-asset', authMiddleware, checkGymPermission, upload.single('file'), async (req, res) => {
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
router.delete('/:gymId/asset/:type', authMiddleware, checkGymPermission, async (req, res) => {
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
      const filePath = path.join(__dirname, '../uploads/gym-assets', filename);
      
      // Delete file if it exists
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Update customization to remove asset URL
    await GymCustomization.findOneAndUpdate(
      { gymId },
      {
        $set: {
          [`branding.${type}`]: '',
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
router.post('/:gymId/reset-customization', authMiddleware, checkGymPermission, async (req, res) => {
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

module.exports = router;