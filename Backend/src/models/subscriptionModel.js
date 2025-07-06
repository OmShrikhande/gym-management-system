import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema({
  gymOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Subscription must belong to a gym owner']
  },
  plan: {
    type: String,
    required: [true, 'Subscription must have a plan'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Subscription must have a price']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'Subscription must have an end date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Pending', 'Overdue'],
    default: 'Paid'
  },
  paymentHistory: [
    {
      amount: Number,
      date: {
        type: Date,
        default: Date.now
      },
      method: String,
      status: {
        type: String,
        enum: ['Success', 'Failed', 'Pending'],
        default: 'Success'
      },
      transactionId: String
    }
  ],
  autoRenew: {
    type: Boolean,
    default: true
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

// Create index for efficient queries
subscriptionSchema.index({ gymOwner: 1 });
subscriptionSchema.index({ endDate: 1 });

// Update the updatedAt field on save
subscriptionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;