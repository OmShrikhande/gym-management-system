import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Workout from '../src/models/workoutModel.js';
import User from '../src/models/userModel.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const createTestWorkout = async () => {
  try {
    // Find a gym owner
    const gymOwner = await User.findOne({ role: 'gym-owner' });
    if (!gymOwner) {
      console.error('No gym owner found');
      process.exit(1);
    }
    console.log(`Found gym owner: ${gymOwner.name} (${gymOwner._id})`);

    // Find a trainer associated with this gym owner
    const trainer = await User.findOne({ 
      role: 'trainer',
      $or: [
        { gym: gymOwner._id },
        { createdBy: gymOwner._id }
      ]
    });
    
    if (!trainer) {
      console.error('No trainer found for this gym owner');
      process.exit(1);
    }
    console.log(`Found trainer: ${trainer.name} (${trainer._id})`);
    console.log(`Trainer's gym: ${trainer.gym}`);
    console.log(`Trainer's createdBy: ${trainer.createdBy}`);

    // Create a test workout
    const workout = new Workout({
      title: 'Test Workout for Gym Owner',
      type: 'beginner',
      description: 'This is a test workout created directly via script',
      duration: 30,
      trainer: trainer._id,
      trainerName: trainer.name,
      gym: gymOwner._id,
      exercises: 'Test exercises',
      notes: 'Test notes'
    });

    await workout.save();
    console.log('Test workout created successfully:', workout);
    
    // Verify the workout can be found
    const workouts = await Workout.find({ 
      $or: [
        { gym: gymOwner._id },
        { trainer: trainer._id }
      ]
    });
    
    console.log(`Found ${workouts.length} workouts for this gym owner`);
    workouts.forEach(w => {
      console.log(`- ${w.title} (ID: ${w._id})`);
      console.log(`  Trainer: ${w.trainerName} (${w.trainer})`);
      console.log(`  Gym: ${w.gym}`);
    });
    
  } catch (error) {
    console.error('Error creating test workout:', error);
  } finally {
    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

createTestWorkout();