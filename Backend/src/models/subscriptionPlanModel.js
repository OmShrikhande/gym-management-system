import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A subscription plan must have a name'],
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'A subscription plan must have a price']
  },
  duration: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  maxMembers: {
    type: Number,
    required: [true, 'A subscription plan must specify maximum members allowed']
  },
  maxTrainers: {
    type: Number,
    required: [true, 'A subscription plan must specify maximum trainers allowed']
  },
  features: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Deprecated'],
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

// Update the updatedAt field on save
subscriptionPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;