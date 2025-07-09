import mongoose from 'mongoose';

const enquirySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  phoneNumber: {
    type: String,
    required: [true, 'Please provide your phone number'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true
  },
  purpose: {
    type: String,
    required: [true, 'Please provide the purpose of enquiry'],
    enum: [
      'membership-inquiry',
      'personal-training',
      'group-classes',
      'diet-consultation',
      'facility-tour',
      'pricing-information',
      'general-inquiry',
      'complaint',
      'feedback',
      'other'
    ]
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  dateTime: {
    type: Date,
    required: [true, 'Please provide date and time'],
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'contacted', 'resolved', 'closed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  gymOwner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  followUpDate: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 days in seconds (7 * 24 * 60 * 60)
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
enquirySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// TTL index is already created by the expires property in createdAt field definition above

const Enquiry = mongoose.model('Enquiry', enquirySchema);

export default Enquiry;