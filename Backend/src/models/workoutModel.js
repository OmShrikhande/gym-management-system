import mongoose from 'mongoose';
const { Schema } = mongoose;

const workoutSchema = new Schema({
  title: {
    type: String,
    required: [true, 'Workout title is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced', 'weight-loss', 'weight-gain'],
    default: 'intermediate'
  },
  // focus: {
  //   type: String,
  //   required: [true, 'Focus area is required'],
  //   trim: true
  // },
  description: {
    type: String,
    required: [true, 'Workout description is required']
  },
  duration: {
    type: Number,
    default: 30,
    min: 5,
    max: 180
  },
  videoLink: {
    type: String,
    trim: true
  },
  exercises: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  trainer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [false, 'Trainer ID is required']
  },
  trainerName: {
    type: String,
    required: [false, 'Trainer name is required']
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  gym: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  views: {
    type: Number,
    default: 0
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String
    },
    date: {
      type: Date
    }
  }
}, {
  timestamps: true
});

// Create indexes for better query performance
workoutSchema.index({ trainer: 1 });
workoutSchema.index({ assignedTo: 1 });
workoutSchema.index({ gym: 1 });
workoutSchema.index({ type: 1 });

const Workout = mongoose.model('Workout', workoutSchema);

export default Workout;