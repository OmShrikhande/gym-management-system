import mongoose from 'mongoose';

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A membership plan must have a name'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A membership plan must have a price']
  },
  duration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  durationInMonths: {
    type: Number,
    required: [true, 'Duration in months is required']
  },
  features: {
    type: [String],
    default: []
  },
  gymOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Membership plan must belong to a gym owner']
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  recommended: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for efficient queries
membershipPlanSchema.index({ gymOwner: 1 });

// Update the updatedAt field on save
membershipPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const MembershipPlan = mongoose.model('MembershipPlan', membershipPlanSchema);

export default MembershipPlan;