import mongoose from 'mongoose';

const gymOwnerPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: [0, 'Price must be positive']
  },
  duration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  durationInMonths: {
    type: Number,
    required: true,
    default: function() {
      switch (this.duration) {
        case 'monthly': return 1;
        case 'quarterly': return 3;
        case 'yearly': return 12;
        default: return 1;
      }
    }
  },
  features: [{
    type: String,
    trim: true
  }],
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isRecommended: {
    type: Boolean,
    default: false
  },
  gymOwnerId: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Gym owner is required']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
gymOwnerPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient querying
gymOwnerPlanSchema.index({ gymOwnerId: 1, isActive: 1 });

const GymOwnerPlan = mongoose.model('GymOwnerPlan', gymOwnerPlanSchema);

export default GymOwnerPlan;