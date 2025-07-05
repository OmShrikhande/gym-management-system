import mongoose from 'mongoose';
const { Schema } = mongoose;

const mealSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Meal type is required'],
    trim: true
  },
  time: {
    type: String,
    trim: true
  },
  items: {
    type: String,
    required: [true, 'Meal items are required'],
    trim: true
  },
  calories: {
    type: Number,
    required: [true, 'Calories are required']
  }
});

const dietPlanSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Diet plan name is required'],
    trim: true
  },
  goalType: {
    type: String,
    enum: ['weight-loss', 'weight-gain', 'general'],
    default: 'general'
  },
  totalCalories: {
    type: Number,
    required: [true, 'Total calories are required']
  },
  description: {
    type: String,
    trim: true
  },
  meals: [mealSchema],
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trainer ID is required']
  },
  trainerName: {
    type: String,
    required: [true, 'Trainer name is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gym: {
    type: Schema.Types.ObjectId,
    ref: 'User'
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

// Update the updatedAt field on save
dietPlanSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Add indexes for better query performance
dietPlanSchema.index({ trainer: 1, createdAt: -1 });
dietPlanSchema.index({ gym: 1, createdAt: -1 });
dietPlanSchema.index({ assignedTo: 1, createdAt: -1 });
dietPlanSchema.index({ goalType: 1 });
// Removed duplicate createdAt index since it's already included in compound indexes above

const DietPlan = mongoose.model('DietPlan', dietPlanSchema);

export default DietPlan;