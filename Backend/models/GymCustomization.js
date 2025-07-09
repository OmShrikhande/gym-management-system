const mongoose = require('mongoose');

const gymCustomizationSchema = new mongoose.Schema({
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true
  },
  branding: {
    gymName: {
      type: String,
      default: '',
      maxlength: 100
    },
    systemName: {
      type: String,
      default: 'GymFlow',
      maxlength: 50
    },
    systemSubtitle: {
      type: String,
      default: 'Gym Management Platform',
      maxlength: 100
    },
    primaryColor: {
      type: String,
      default: '#3B82F6',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Primary color must be a valid hex color'
      }
    },
    secondaryColor: {
      type: String,
      default: '#8B5CF6',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Secondary color must be a valid hex color'
      }
    },
    backgroundColor: {
      type: String,
      default: '#111827',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Background color must be a valid hex color'
      }
    },
    cardColor: {
      type: String,
      default: '#1F2937',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Card color must be a valid hex color'
      }
    },
    sidebarColor: {
      type: String,
      default: '#1F2937',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Sidebar color must be a valid hex color'
      }
    },
    textColor: {
      type: String,
      default: '#FFFFFF',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Text color must be a valid hex color'
      }
    },
    accentColor: {
      type: String,
      default: '#06B6D4',
      validate: {
        validator: function(v) {
          return /^#[0-9A-F]{6}$/i.test(v);
        },
        message: 'Accent color must be a valid hex color'
      }
    },
    logo: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Logo must be a valid URL'
      }
    },
    favicon: {
      type: String,
      default: '',
      validate: {
        validator: function(v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Favicon must be a valid URL'
      }
    },
    darkMode: {
      type: Boolean,
      default: true
    }
  },
  settings: {
    allowMemberCustomization: {
      type: Boolean,
      default: false
    },
    allowTrainerCustomization: {
      type: Boolean,
      default: false
    },
    customCss: {
      type: String,
      default: '',
      maxlength: 10000 // Limit custom CSS to 10KB
    }
  },
  metadata: {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    lastUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    version: {
      type: Number,
      default: 1
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index for efficient queries
gymCustomizationSchema.index({ gymId: 1 });
gymCustomizationSchema.index({ 'metadata.createdBy': 1 });
gymCustomizationSchema.index({ updatedAt: -1 });

// Virtual for gym reference
gymCustomizationSchema.virtual('gym', {
  ref: 'User',
  localField: 'gymId',
  foreignField: '_id',
  justOne: true
});

// Pre-save middleware to update metadata
gymCustomizationSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.metadata.version += 1;
  }
  next();
});

// Pre-update middleware to update version
gymCustomizationSchema.pre('findOneAndUpdate', function(next) {
  this.set({ 'metadata.version': this.get('metadata.version') + 1 });
  next();
});

// Static method to get customization by gym ID
gymCustomizationSchema.statics.getByGymId = function(gymId) {
  return this.findOne({ gymId }).populate('gym', 'name email');
};

// Instance method to apply theme preset
gymCustomizationSchema.methods.applyThemePreset = function(preset) {
  const presets = {
    default: {
      primaryColor: '#3B82F6',
      secondaryColor: '#8B5CF6',
      backgroundColor: '#111827',
      cardColor: '#1F2937',
      sidebarColor: '#1F2937',
      textColor: '#FFFFFF',
      accentColor: '#06B6D4'
    },
    modern: {
      primaryColor: '#10B981',
      secondaryColor: '#F59E0B',
      backgroundColor: '#0F172A',
      cardColor: '#1E293B',
      sidebarColor: '#1E293B',
      textColor: '#F8FAFC',
      accentColor: '#EC4899'
    },
    professional: {
      primaryColor: '#2563EB',
      secondaryColor: '#7C3AED',
      backgroundColor: '#1F2937',
      cardColor: '#374151',
      sidebarColor: '#374151',
      textColor: '#F9FAFB',
      accentColor: '#EF4444'
    },
    warm: {
      primaryColor: '#EA580C',
      secondaryColor: '#DC2626',
      backgroundColor: '#1C1917',
      cardColor: '#292524',
      sidebarColor: '#292524',
      textColor: '#FAFAF9',
      accentColor: '#FBBF24'
    },
    nature: {
      primaryColor: '#059669',
      secondaryColor: '#0D9488',
      backgroundColor: '#164E63',
      cardColor: '#1E40AF',
      sidebarColor: '#1E40AF',
      textColor: '#F0F9FF',
      accentColor: '#84CC16'
    },
    purple: {
      primaryColor: '#7C3AED',
      secondaryColor: '#A855F7',
      backgroundColor: '#1E1B4B',
      cardColor: '#312E81',
      sidebarColor: '#312E81',
      textColor: '#F3F4F6',
      accentColor: '#EC4899'
    }
  };

  if (presets[preset]) {
    Object.assign(this.branding, presets[preset]);
  }
};

// Instance method to reset to default
gymCustomizationSchema.methods.resetToDefault = function() {
  this.branding = {
    gymName: '',
    systemName: 'GymFlow',
    systemSubtitle: 'Gym Management Platform',
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
  };
  
  this.settings = {
    allowMemberCustomization: false,
    allowTrainerCustomization: false,
    customCss: ''
  };
};

// Instance method to validate colors
gymCustomizationSchema.methods.validateColors = function() {
  const colorFields = ['primaryColor', 'secondaryColor', 'backgroundColor', 'cardColor', 'sidebarColor', 'textColor', 'accentColor'];
  const colorRegex = /^#[0-9A-F]{6}$/i;
  
  const invalidColors = [];
  
  colorFields.forEach(field => {
    if (this.branding[field] && !colorRegex.test(this.branding[field])) {
      invalidColors.push(field);
    }
  });
  
  return invalidColors;
};

// Instance method to get CSS variables
gymCustomizationSchema.methods.getCSSVariables = function() {
  return {
    '--primary': this.branding.primaryColor,
    '--secondary': this.branding.secondaryColor,
    '--background': this.branding.backgroundColor,
    '--card': this.branding.cardColor,
    '--sidebar': this.branding.sidebarColor,
    '--text': this.branding.textColor,
    '--accent': this.branding.accentColor
  };
};

module.exports = mongoose.model('GymCustomization', gymCustomizationSchema);