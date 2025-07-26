import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Payment identification
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Member information
  member: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Payment must belong to a member']
  },
  
  // Gym owner information
  gymOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Payment must belong to a gym owner']
  },
  
  // Payment details
  amount: {
    type: Number,
    required: [true, 'Payment must have an amount'],
    min: [0, 'Payment amount cannot be negative']
  },
  
  // Payment breakdown
  planCost: {
    type: Number,
    required: true,
    min: 0
  },
  
  trainerCost: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Plan information
  planType: {
    type: String,
    required: true,
    enum: ['Basic', 'Standard', 'Premium']
  },
  
  duration: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  
  // Payment information
  paymentDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  paymentMethod: {
    type: String,
    enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Razorpay'],
    default: 'Cash'
  },
  
  paymentStatus: {
    type: String,
    enum: ['Completed', 'Pending', 'Failed', 'Refunded'],
    default: 'Completed'
  },
  
  // Transaction details
  transactionId: {
    type: String,
    sparse: true // Allows multiple null values
  },
  
  referenceId: {
    type: String,
    required: true
  },
  
  // Membership period covered by this payment
  membershipPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  
  // Additional information
  notes: {
    type: String,
    trim: true
  },
  
  // Trainer assignment
  assignedTrainer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient queries
paymentSchema.index({ member: 1, paymentDate: -1 });
paymentSchema.index({ gymOwner: 1, paymentDate: -1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ 'membershipPeriod.startDate': 1, 'membershipPeriod.endDate': 1 });

// Update the updatedAt field on save
paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Generate payment ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.paymentId) {
    this.paymentId = `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

// Generate reference ID before saving
paymentSchema.pre('save', function(next) {
  if (!this.referenceId) {
    this.referenceId = `REF${Math.floor(100000 + Math.random() * 900000)}`;
  }
  next();
});

// Virtual for payment month/year
paymentSchema.virtual('paymentMonth').get(function() {
  return this.paymentDate.getMonth() + 1;
});

paymentSchema.virtual('paymentYear').get(function() {
  return this.paymentDate.getFullYear();
});

// Static method to get payments for a gym owner
paymentSchema.statics.getGymOwnerPayments = function(gymOwnerId, filters = {}) {
  const query = { gymOwner: gymOwnerId };
  
  // Add date filters if provided
  if (filters.startDate && filters.endDate) {
    query.paymentDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  // Add status filter if provided
  if (filters.status) {
    query.paymentStatus = filters.status;
  }
  
  // Add plan type filter if provided
  if (filters.planType) {
    query.planType = filters.planType;
  }
  
  return this.find(query)
    .populate('member', 'name email phone membershipType')
    .populate('assignedTrainer', 'name')
    .sort({ paymentDate: -1 });
};

// Static method to get revenue statistics
paymentSchema.statics.getRevenueStats = function(gymOwnerId, filters = {}) {
  const matchStage = { gymOwner: new mongoose.Types.ObjectId(gymOwnerId) };
  
  // Add date filters if provided
  if (filters.startDate && filters.endDate) {
    matchStage.paymentDate = {
      $gte: new Date(filters.startDate),
      $lte: new Date(filters.endDate)
    };
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalPayments: { $sum: 1 },
        uniqueMembers: { $addToSet: '$member' },
        avgPaymentAmount: { $avg: '$amount' },
        planBreakdown: {
          $push: {
            planType: '$planType',
            amount: '$amount'
          }
        }
      }
    },
    {
      $project: {
        totalRevenue: 1,
        totalPayments: 1,
        uniqueMembers: { $size: '$uniqueMembers' },
        avgPaymentAmount: { $round: ['$avgPaymentAmount', 2] },
        planBreakdown: 1
      }
    }
  ]);
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;