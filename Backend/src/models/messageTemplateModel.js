import mongoose from 'mongoose';

const messageTemplateSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Birthday', 'Anniversary', 'Offer', 'Custom', 'Motivation'],
    required: [true, 'Message template must have a type']
  },
  title: {
    type: String,
    required: [true, 'Message template must have a title']
  },
  content: {
    type: String,
    required: [true, 'Message template must have content']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Message template must have a creator']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MessageTemplate = mongoose.model('MessageTemplate', messageTemplateSchema);

export default MessageTemplate;