import Workout from '../models/workoutModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// Create a new workout
export const createWorkout = async (req, res) => {
  try {
    const { title, type, description, videoLink, duration, exercises, notes } = req.body;
    
    // Validate required fields
    if (!title || !description) {
      console.log('Missing required fields:', { title, description });
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Verify that the trainer exists
    const trainer = await User.findById(req.user._id);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(403).json({
        success: false,
        message: 'Only trainers can create workouts'
      });
    }
    
    // Get the gym owner ID from the trainer
    const gymOwnerId = trainer.createdBy || trainer.gym || null;
    console.log(`Creating workout for trainer ${req.user._id} (${req.user.name})`);
    console.log(`Trainer's gym owner ID: ${gymOwnerId}`);
    console.log(`Trainer's createdBy: ${trainer.createdBy}`);
    console.log(`Trainer's gym: ${trainer.gym}`);
    
    // Create the workout
    const workout = new Workout({
      title,
      type: type || 'intermediate',
      // focus field is commented out in the model
      description,
      videoLink,
      duration: duration || 30,
      trainer: req.user._id,
      trainerName: req.user.name,
      gym: gymOwnerId, // Use createdBy (gym owner) or gym field if available
      // Add exercises and notes if provided
      exercises: exercises || '',
      notes: notes || ''
    });
    
    await workout.save();
    
    res.status(201).json({
      success: true,
      message: 'Workout created successfully',
      data: { workout }
    });
  } catch (error) {
    console.error('Error creating workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workout',
      error: error.message
    });
  }
};

// Get all workouts (admin, gym-owner, and trainer)
export const getAllWorkouts = async (req, res) => {
  try {
    let workouts = [];
    
    if (req.user.role === 'super-admin') {
      // Super admin can see all workouts
      workouts = await Workout.find()
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'gym-owner') {
      // Gym owner can see workouts from their trainers
      const trainers = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: req.user._id },
          { createdBy: req.user._id }
        ]
      });
      
      const trainerIds = trainers.map(trainer => trainer._id);
      
      workouts = await Workout.find({ 
        $or: [
          { gym: req.user._id },
          { trainer: { $in: trainerIds } }
        ]
      })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'trainer') {
      // Trainer can only see their own workouts
      workouts = await Workout.find({ trainer: req.user._id })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    res.status(200).json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    console.error('Error fetching workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workouts',
      error: error.message
    });
  }
};

// Get workouts by gym
export const getWorkoutsByGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    
    // Validate gym ID
    if (!mongoose.Types.ObjectId.isValid(gymId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid gym ID'
      });
    }
    
    // Check if user is authorized to view gym workouts
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== gymId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // If the user is a gym owner, find all trainers associated with this gym
    let workouts = [];
    
    if (req.user.role === 'gym-owner' && req.user._id.toString() === gymId) {
      console.log(`Fetching workouts for gym owner: ${gymId}`);
      
      // Find all trainers associated with this gym
      const trainers = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: gymId },
          { createdBy: gymId }
        ]
      });
      
      console.log(`Found ${trainers.length} trainers for gym owner ${gymId}`);
      if (trainers.length > 0) {
        console.log('Trainer IDs:', trainers.map(t => t._id.toString()));
      } else {
        console.log('No trainers found for this gym owner');
      }
      
      const trainerIds = trainers.map(trainer => trainer._id);
      
      // First check if there are any workouts with this gym ID
      const gymWorkouts = await Workout.find({ gym: gymId });
      console.log(`Found ${gymWorkouts.length} workouts directly associated with gym ${gymId}`);
      
      // Then check if there are any workouts created by the trainers
      if (trainerIds.length > 0) {
        const trainerWorkouts = await Workout.find({ trainer: { $in: trainerIds } });
        console.log(`Found ${trainerWorkouts.length} workouts created by trainers of gym ${gymId}`);
      }
      
      // Find all workouts created by these trainers or associated with this gym
      workouts = await Workout.find({ 
        $or: [
          { gym: gymId },
          { trainer: { $in: trainerIds } }
        ]
      })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
        
      console.log(`Total: Found ${workouts.length} workouts for gym owner ${gymId}`);
    } else {
      // For other users, just find workouts directly associated with the gym
      workouts = await Workout.find({ gym: gymId })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.status(200).json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    console.error('Error fetching gym workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gym workouts',
      error: error.message
    });
  }
};

// Get workouts by trainer
export const getWorkoutsByTrainer = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Validate trainer ID
    if (!mongoose.Types.ObjectId.isValid(trainerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid trainer ID'
      });
    }
    
    // Check if user is authorized to view trainer workouts
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== trainerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    const workouts = await Workout.find({ trainer: trainerId })
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    console.error('Error fetching trainer workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trainer workouts',
      error: error.message
    });
  }
};

// Get workouts by member
export const getWorkoutsByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }
    
    // Check if user is authorized to view member workouts
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user.role !== 'trainer' && 
        req.user._id.toString() !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get the member details to find their assigned trainer
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    let workouts = [];
    
    // If member has an assigned trainer, show all workouts from that trainer
    if (member.assignedTrainer) {
      workouts = await Workout.find({ trainer: member.assignedTrainer })
        .populate('trainer', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // If no assigned trainer, show workouts from all trainers in the same gym
      const gymOwnerId = member.createdBy || member.gym;
      if (gymOwnerId) {
        // Find all trainers in the same gym
        const trainers = await User.find({ 
          role: 'trainer',
          $or: [
            { gym: gymOwnerId },
            { createdBy: gymOwnerId }
          ]
        });
        
        const trainerIds = trainers.map(trainer => trainer._id);
        
        workouts = await Workout.find({ trainer: { $in: trainerIds } })
          .populate('trainer', 'name email')
          .sort({ createdAt: -1 });
      }
    }
    
    res.status(200).json({
      success: true,
      data: { workouts }
    });
  } catch (error) {
    console.error('Error fetching member workouts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch member workouts',
      error: error.message
    });
  }
};

// Get a single workout by ID
export const getWorkoutById = async (req, res) => {
  try {
    const { workoutId } = req.params;
    
    // Validate workout ID
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID'
      });
    }
    
    const workout = await Workout.findById(workoutId)
      .populate('trainer', 'name email')
      .populate('assignedTo', 'name email');
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Check if user is authorized to view this workout
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== workout.trainer.toString() && 
        req.user._id.toString() !== workout.assignedTo.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Increment view count
    workout.views += 1;
    await workout.save();
    
    res.status(200).json({
      success: true,
      data: { workout }
    });
  } catch (error) {
    console.error('Error fetching workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workout',
      error: error.message
    });
  }
};

// Update a workout
export const updateWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { title, type, focus, description, videoLink, assignedTo, duration } = req.body;
    
    // Validate workout ID
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID'
      });
    }
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Check if user is authorized to update this workout
    if (req.user.role !== 'super-admin' && 
        req.user._id.toString() !== workout.trainer.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // If assignedTo is changed, verify that the member exists
    if (assignedTo && assignedTo !== workout.assignedTo.toString()) {
      const member = await User.findById(assignedTo);
      if (!member || member.role !== 'member') {
        return res.status(400).json({
          success: false,
          message: 'Invalid member assignment'
        });
      }
    }
    
    // Update the workout
    workout.title = title || workout.title;
    workout.type = type || workout.type;
    workout.focus = focus || workout.focus;
    workout.description = description || workout.description;
    workout.videoLink = videoLink !== undefined ? videoLink : workout.videoLink;
    workout.assignedTo = assignedTo || workout.assignedTo;
    workout.duration = duration || workout.duration;
    
    await workout.save();
    
    res.status(200).json({
      success: true,
      message: 'Workout updated successfully',
      data: { workout }
    });
  } catch (error) {
    console.error('Error updating workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workout',
      error: error.message
    });
  }
};

// Delete a workout
export const deleteWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;
    
    // Validate workout ID
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID'
      });
    }
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Check if user is authorized to delete this workout
    if (req.user.role !== 'super-admin' && 
        req.user._id.toString() !== workout.trainer.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Delete the workout
    await Workout.findByIdAndDelete(workoutId);
    
    res.status(200).json({
      success: true,
      message: 'Workout deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workout',
      error: error.message
    });
  }
};

// Mark workout as completed
export const markWorkoutCompleted = async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { feedback, rating } = req.body;
    
    // Validate workout ID
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID'
      });
    }
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Check if user is authorized to mark this workout as completed
    if (req.user._id.toString() !== workout.assignedTo.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Update the workout
    workout.isCompleted = true;
    workout.completedDate = new Date();
    
    // Add feedback if provided
    if (feedback || rating) {
      workout.feedback = {
        comment: feedback,
        rating: rating,
        date: new Date()
      };
    }
    
    await workout.save();
    
    res.status(200).json({
      success: true,
      message: 'Workout marked as completed',
      data: { workout }
    });
  } catch (error) {
    console.error('Error marking workout as completed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark workout as completed',
      error: error.message
    });
  }
};

// Assign workout to members
export const assignWorkout = async (req, res) => {
  try {
    const { workoutId } = req.params;
    const { memberIds } = req.body;
    
    // Validate workout ID
    if (!mongoose.Types.ObjectId.isValid(workoutId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workout ID'
      });
    }
    
    // Validate member IDs
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid member IDs'
      });
    }
    
    // Find the workout
    const workout = await Workout.findById(workoutId);
    
    if (!workout) {
      return res.status(404).json({
        success: false,
        message: 'Workout not found'
      });
    }
    
    // Check if user is authorized to assign this workout
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== workout.trainer.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Verify all member IDs are valid
    const validMemberIds = [];
    for (const memberId of memberIds) {
      if (mongoose.Types.ObjectId.isValid(memberId)) {
        const member = await User.findById(memberId);
        if (member && member.role === 'member') {
          validMemberIds.push(memberId);
        }
      }
    }
    
    if (validMemberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid members found'
      });
    }
    
    // Create individual workout assignments for each member
    const assignedWorkouts = [];
    
    for (const memberId of validMemberIds) {
      // Create a copy of the workout for each member
      const assignedWorkout = new Workout({
        title: workout.title,
        type: workout.type,
        focus: workout.focus,
        description: workout.description,
        videoLink: workout.videoLink,
        duration: workout.duration,
        exercises: workout.exercises,
        notes: workout.notes,
        trainer: workout.trainer,
        trainerName: workout.trainerName,
        gym: workout.gym,
        assignedTo: memberId,
        isCompleted: false,
        createdAt: new Date()
      });
      
      const savedWorkout = await assignedWorkout.save();
      assignedWorkouts.push(savedWorkout);
    }
    
    res.status(200).json({
      success: true,
      message: `Workout assigned to ${validMemberIds.length} member${validMemberIds.length !== 1 ? 's' : ''}`,
      data: { 
        assignedWorkouts,
        assignedCount: validMemberIds.length
      }
    });
  } catch (error) {
    console.error('Error assigning workout:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign workout',
      error: error.message
    });
  }
};