// models/deviceModel.js
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: [true, 'Device ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  deviceType: {
    type: String,
    enum: ['NodeMCU', 'Arduino', 'RaspberryPi', 'Other'],
    default: 'NodeMCU'
  },
  deviceLocation: {
    type: String,
    required: [true, 'Device location is required'],
    trim: true
  },
  gymOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Gym owner is required']
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'error'],
    default: 'active'
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  systemInfo: {
    uptime: {
      type: Number,
      default: 0
    },
    freeHeap: {
      type: Number,
      default: 0
    },
    rssi: {
      type: Number,
      default: 0
    },
    lastUpdate: {
      type: Date,
      default: Date.now
    }
  },
  accessLogs: [{
    memberId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    memberName: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    action: {
      type: String,
      enum: ['GRANTED', 'DENIED'],
      required: true
    },
    reason: {
      type: String,
      required: true
    }
  }],
  configuration: {
    accessTimeout: {
      type: Number,
      default: 5000 // 5 seconds
    },
    heartbeatInterval: {
      type: Number,
      default: 30000 // 30 seconds
    },
    maxFailedAttempts: {
      type: Number,
      default: 5
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  deactivatedAt: Date
}, {
  timestamps: true
});

// Index for efficient queries
deviceSchema.index({ deviceId: 1, gymOwner: 1 });
deviceSchema.index({ gymOwner: 1, status: 1 });
deviceSchema.index({ lastHeartbeat: 1 });

// Virtual for device health status
deviceSchema.virtual('isOnline').get(function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastHeartbeat > fiveMinutesAgo && this.status === 'active';
});

// Virtual for access logs count
deviceSchema.virtual('totalAccessAttempts').get(function() {
  return this.accessLogs.length;
});

// Virtual for successful access count
deviceSchema.virtual('successfulAccess').get(function() {
  return this.accessLogs.filter(log => log.action === 'GRANTED').length;
});

// Virtual for denied access count
deviceSchema.virtual('deniedAccess').get(function() {
  return this.accessLogs.filter(log => log.action === 'DENIED').length;
});

// Method to check if device is healthy
deviceSchema.methods.isHealthy = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.lastHeartbeat > fiveMinutesAgo && 
         this.status === 'active' && 
         this.systemInfo.freeHeap > 10000; // At least 10KB free memory
};

// Method to get recent access logs
deviceSchema.methods.getRecentAccessLogs = function(limit = 10) {
  return this.accessLogs
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, limit);
};

// Static method to find devices by gym owner
deviceSchema.statics.findByGymOwner = function(gymOwnerId) {
  return this.find({ gymOwner: gymOwnerId, status: { $ne: 'inactive' } });
};

// Static method to find online devices
deviceSchema.statics.findOnlineDevices = function() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return this.find({ 
    lastHeartbeat: { $gt: fiveMinutesAgo },
    status: 'active'
  });
};

// Pre-save middleware to update lastActivity
deviceSchema.pre('save', function(next) {
  if (this.isModified('accessLogs')) {
    this.lastActivity = new Date();
  }
  next();
});

// Pre-save middleware to limit access logs (keep only last 1000)
deviceSchema.pre('save', function(next) {
  if (this.accessLogs && this.accessLogs.length > 1000) {
    this.accessLogs = this.accessLogs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 1000);
  }
  next();
});

const Device = mongoose.model('Device', deviceSchema);

export default Device;