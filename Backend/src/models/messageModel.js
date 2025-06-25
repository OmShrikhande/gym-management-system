import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Birthday', 'Anniversary', 'Offer', 'Custom', 'Motivation'],
    required: [true, 'Message must have a type']
  },
  title: {
    type: String,
    required: [true, 'Message must have a title']
  },
  content: {
    type: String,
    required: [true, 'Message must have content']
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message must have a sender']
  },
  recipients: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  channel: {
    type: String,
    enum: ['SMS', 'Email', 'WhatsApp', 'In-App'],
    default: 'In-App'
  },
  sendDate: {
    type: Date,
    default: Date.now
  },
  scheduledDateTime: {
    type: Date,
    default: null
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  sentStatus: {
    type: String,
    enum: ['Sent', 'Scheduled', 'Failed'],
    default: 'Sent'
  },
  deliveredCount: {
    type: Number,
    default: 0
  },
  totalRecipients: {
    type: Number,
    required: [true, 'Message must have a total recipients count']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for efficient queries
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ sentStatus: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;