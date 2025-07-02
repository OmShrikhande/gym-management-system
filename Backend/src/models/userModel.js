import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide your name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  role: {
    type: String,
    enum: ['super-admin', 'gym-owner', 'trainer', 'member'],
    default: 'member'
  },
  passwordChangedAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  // Member specific fields
  phone: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  dob: String,
  goal: {
    type: String,
    enum: ['weight-loss', 'weight-gain', 'general-fitness'],
    default: 'weight-loss'
  },
  planType: {
    type: String,
    default: 'Basic'
  },
  address: String,
  whatsapp: String,
  height: String,
  weight: String,
  emergencyContact: String,
  medicalConditions: String,
  notes: String,
  assignedTrainer: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  membershipStatus: {
    type: String,
    enum: ['Active', 'Inactive', 'Expired', 'Pending'],
    default: 'Active'
  },
  membershipStartDate: {
    type: Date,
    default: Date.now
  },
  membershipEndDate: Date,
  membershipDuration: {
    type: String,
    default: '1'
  },
  membershipType: {
    type: String,
    default: 'Basic'
  },
  // Trainer specific fields
  assignedMembers: {
    type: Number,
    default: 0
  },
  
  // Attendance and Access Control fields
  attendance: [{
    gymOwnerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    deviceId: String
  }],
  
  accessAttempts: [{
    gymOwnerId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['GRANTED', 'DENIED'],
      required: true
    },
    reason: String,
    deviceId: String
  }]
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);
  
  next();
});

// Method to check if password is correct
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Log the model creation
console.log('Creating User model with collection name:', mongoose.model('User', userSchema).collection.name);

const User = mongoose.model('User', userSchema);

// Explicitly log the collection name that Mongoose will use
console.log('User model will use collection:', User.collection.name);

export default User;