import DietPlan from '../models/dietPlanModel.js';
import User from '../models/userModel.js';
import mongoose from 'mongoose';

// Create a new diet plan
export const createDietPlan = async (req, res) => {
  try {
    const { name, goalType, totalCalories, description, meals } = req.body;
    
    // Validate required fields
    if (!name || !totalCalories || !meals || meals.length === 0) {
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
        message: 'Only trainers can create diet plans'
      });
    }
    
    // Create the diet plan
    const dietPlan = new DietPlan({
      name,
      goalType: goalType || 'general',
      totalCalories,
      description,
      meals,
      trainer: req.user._id,
      trainerName: req.user.name,
      gym: trainer.createdBy || trainer.gym || null // Use createdBy (gym owner) or gym field if available
    });
    
    await dietPlan.save();
    
    res.status(201).json({
      success: true,
      message: 'Diet plan created successfully',
      data: {
        dietPlan
      }
    });
  } catch (error) {
    console.error('Error creating diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating diet plan'
    });
  }
};

// Get all diet plans
export const getAllDietPlans = async (req, res) => {
  try {
    const dietPlans = await DietPlan.find();
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      data: {
        dietPlans
      }
    });
  } catch (error) {
    console.error('Error fetching diet plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching diet plans'
    });
  }
};

// Get diet plans by gym
export const getDietPlansByGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    
    // Verify the gym exists
    const gym = await User.findById(gymId);
    if (!gym || gym.role !== 'gym-owner') {
      return res.status(404).json({
        success: false,
        message: 'Gym not found'
      });
    }
    
    // Check if user is authorized to view gym diet plans
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== gymId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // If the user is a gym owner, find all trainers associated with this gym
    let dietPlans = [];
    
    if (req.user.role === 'gym-owner' && req.user._id.toString() === gymId) {
      // Find all trainers associated with this gym
      const trainers = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: gymId },
          { createdBy: gymId }
        ]
      });
      
      const trainerIds = trainers.map(trainer => trainer._id);
      
      // Find all diet plans created by these trainers
      dietPlans = await DietPlan.find({ 
        $or: [
          { gym: gymId },
          { trainer: { $in: trainerIds } }
        ]
      })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // For other users, just find diet plans directly associated with the gym
      dietPlans = await DietPlan.find({ gym: gymId })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    }
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      data: {
        dietPlans
      }
    });
  } catch (error) {
    console.error('Error fetching gym diet plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gym diet plans'
    });
  }
};

// Get diet plans by trainer
export const getDietPlansByTrainer = async (req, res) => {
  try {
    const { trainerId } = req.params;
    
    // Verify the trainer exists
    const trainer = await User.findById(trainerId);
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }
    
    // Find all diet plans created by this trainer
    const dietPlans = await DietPlan.find({ trainer: trainerId });
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      data: {
        dietPlans
      }
    });
  } catch (error) {
    console.error('Error fetching trainer diet plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trainer diet plans'
    });
  }
};

// Get diet plans by member
export const getDietPlansByMember = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // Verify the member exists
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Find all diet plans assigned to this member
    const dietPlans = await DietPlan.find({ assignedTo: memberId });
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      data: {
        dietPlans
      }
    });
  } catch (error) {
    console.error('Error fetching member diet plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member diet plans'
    });
  }
};

// Get a single diet plan by ID
export const getDietPlanById = async (req, res) => {
  try {
    const { dietPlanId } = req.params;
    
    // Find the diet plan
    const dietPlan = await DietPlan.findById(dietPlanId);
    
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found'
      });
    }
    
    // Check if user is authorized to view this diet plan
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== dietPlan.trainer.toString() && 
        (dietPlan.assignedTo && req.user._id.toString() !== dietPlan.assignedTo.toString())) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this diet plan'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        dietPlan
      }
    });
  } catch (error) {
    console.error('Error fetching diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching diet plan'
    });
  }
};

// Update a diet plan
export const updateDietPlan = async (req, res) => {
  try {
    const { dietPlanId } = req.params;
    
    // Find the diet plan
    const dietPlan = await DietPlan.findById(dietPlanId);
    
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found'
      });
    }
    
    // Check if user is authorized to update this diet plan
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== dietPlan.trainer.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this diet plan'
      });
    }
    
    // Update the diet plan
    Object.keys(req.body).forEach(key => {
      dietPlan[key] = req.body[key];
    });
    
    await dietPlan.save();
    
    res.status(200).json({
      success: true,
      message: 'Diet plan updated successfully',
      data: {
        dietPlan
      }
    });
  } catch (error) {
    console.error('Error updating diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating diet plan'
    });
  }
};

// Delete a diet plan
export const deleteDietPlan = async (req, res) => {
  try {
    const { dietPlanId } = req.params;
    
    // Find the diet plan
    const dietPlan = await DietPlan.findById(dietPlanId);
    
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found'
      });
    }
    
    // Check if user is authorized to delete this diet plan
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== dietPlan.trainer.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this diet plan'
      });
    }
    
    await DietPlan.findByIdAndDelete(dietPlanId);
    
    res.status(200).json({
      success: true,
      message: 'Diet plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting diet plan'
    });
  }
};