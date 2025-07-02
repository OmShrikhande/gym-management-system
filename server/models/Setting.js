const mongoose = require('mongoose');

// Schema for global settings
const globalSettingsSchema = new mongoose.Schema({
  appName: { type: String, default: 'GymFlow' },
  currency: { type: String, default: 'USD' },
  language: { type: String, default: 'English' },
  timezone: { type: String, default: 'UTC' },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, default: '12h' },
  emailEnabled: { type: Boolean, default: true },
  smsEnabled: { type: Boolean, default: false },
  whatsappEnabled: { type: Boolean, default: false }
});

// Schema for branding settings
const brandingSettingsSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#3B82F6' },
  secondaryColor: { type: String, default: '#8B5CF6' },
  logoUrl: { type: String, default: '' },
  faviconUrl: { type: String, default: '' },
  customCss: { type: String, default: '' }
});

// Schema for notification settings
const notificationSettingsSchema = new mongoose.Schema({
  emailNotifications: { type: Boolean, default: true },
  smsNotifications: { type: Boolean, default: false },
  pushNotifications: { type: Boolean, default: true },
  marketingEmails: { type: Boolean, default: false },
  systemAlerts: { type: Boolean, default: true }
});

// Schema for message templates
const messagingSettingsSchema = new mongoose.Schema({
  birthdayTemplate: { 
    type: String, 
    default: 'Happy Birthday [NAME]! 🎉 We hope you have a wonderful day!' 
  },
  anniversaryTemplate: { 
    type: String, 
    default: 'Congratulations [NAME] on your [YEARS] year anniversary with us! 🎊' 
  },
  motivationTemplate: { 
    type: String, 
    default: 'Keep pushing [NAME]! You\'re doing amazing! 💪' 
  },
  offerTemplate: { 
    type: String, 
    default: 'Hi [NAME]! We have a special offer just for you: [OFFER]' 
  },
  reminderTemplate: { 
    type: String, 
    default: 'Hi [NAME], don\'t forget about your workout session today at [TIME]!' 
  }
});

// Schema for integration settings
const integrationSettingsSchema = new mongoose.Schema({
  razorpayKey: { type: String, default: '' },
  stripeKey: { type: String, default: '' },
  twilioSid: { type: String, default: '' },
  twilioToken: { type: String, default: '' },
  emailProvider: { type: String, default: 'smtp' },
  smtpHost: { type: String, default: '' },
  smtpPort: { type: String, default: '' },
  smtpUser: { type: String, default: '' },
  smtpPass: { type: String, default: '' }
});

// Main settings schema
const settingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Not required for global settings
  },
  gymId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming gym owner is a user
    required: false // Not required for global settings
  },
  isGlobal: {
    type: Boolean,
    default: false
  },
  global: globalSettingsSchema,
  branding: brandingSettingsSchema,
  notifications: notificationSettingsSchema,
  messaging: messagingSettingsSchema,
  integration: integrationSettingsSchema
}, { timestamps: true });

// Create a unique index for global settings
settingSchema.index({ isGlobal: 1 }, { unique: true, partialFilterExpression: { isGlobal: true } });

// Create a unique index for user-specific settings
settingSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { userId: { $exists: true } } });

// Create a unique index for gym-specific settings
settingSchema.index({ gymId: 1 }, { unique: true, partialFilterExpression: { gymId: { $exists: true } } });

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;