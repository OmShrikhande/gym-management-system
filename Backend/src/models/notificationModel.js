import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Notification must have a recipient']
  },
  type: {
    type: String,
    enum: ['payment_due', 'payment_success', 'subscription_expiring', 'subscription_expired', 'system', 'message'],
    required: [true, 'Notification must have a type']
  },
  title: {
    type: String,
    required: [true, 'Notification must have a title']
  },
  message: {
    type: String,
    required: [true, 'Notification must have a message']
  },
  read: {
    type: Boolean,
    default: false
  },
  actionLink: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for efficient queries
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;