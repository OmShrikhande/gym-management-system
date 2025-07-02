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

// Get all diet plans (admin, gym-owner, and trainer)
export const getAllDietPlans = async (req, res) => {
  try {
    let dietPlans = [];
    
    if (req.user.role === 'super-admin') {
      // Super admin can see all diet plans
      dietPlans = await DietPlan.find()
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'gym-owner') {
      // Gym owner can see diet plans from their trainers
      const trainers = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: req.user._id },
          { createdBy: req.user._id }
        ]
      });
      
      const trainerIds = trainers.map(trainer => trainer._id);
      
      dietPlans = await DietPlan.find({ 
        $or: [
          { gym: req.user._id },
          { trainer: { $in: trainerIds } }
        ]
      })
        .populate('trainer', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'trainer') {
      // Trainer can only see their own diet plans
      dietPlans = await DietPlan.find({ trainer: req.user._id })
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
    
    // Validate member ID
    if (!mongoose.Types.ObjectId.isValid(memberId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid member ID'
      });
    }
    
    // Check if user is authorized to view member diet plans
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
    
    let dietPlans = [];
    
    // If member has an assigned trainer, show all diet plans from that trainer
    if (member.assignedTrainer) {
      dietPlans = await DietPlan.find({ trainer: member.assignedTrainer })
        .populate('trainer', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // If no assigned trainer, show diet plans from all trainers in the same gym
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
        
        dietPlans = await DietPlan.find({ trainer: { $in: trainerIds } })
          .populate('trainer', 'name email')
          .sort({ createdAt: -1 });
      }
    }
    
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

// Assign diet plan to members
export const assignDietPlan = async (req, res) => {
  try {
    const { dietPlanId } = req.params;
    const { memberIds } = req.body;
    
    // Validate diet plan ID
    if (!mongoose.Types.ObjectId.isValid(dietPlanId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid diet plan ID'
      });
    }
    
    // Validate member IDs
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide valid member IDs'
      });
    }
    
    // Find the diet plan
    const dietPlan = await DietPlan.findById(dietPlanId);
    
    if (!dietPlan) {
      return res.status(404).json({
        success: false,
        message: 'Diet plan not found'
      });
    }
    
    // Check if user is authorized to assign this diet plan
    if (req.user.role !== 'super-admin' && 
        req.user.role !== 'gym-owner' && 
        req.user._id.toString() !== dietPlan.trainer.toString()) {
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
    
    // Create individual diet plan assignments for each member
    const assignedDietPlans = [];
    
    for (const memberId of validMemberIds) {
      // Create a copy of the diet plan for each member
      const assignedDietPlan = new DietPlan({
        name: dietPlan.name,
        goalType: dietPlan.goalType,
        totalCalories: dietPlan.totalCalories,
        description: dietPlan.description,
        meals: dietPlan.meals,
        trainer: dietPlan.trainer,
        trainerName: dietPlan.trainerName,
        gym: dietPlan.gym,
        assignedTo: memberId,
        createdAt: new Date()
      });
      
      const savedDietPlan = await assignedDietPlan.save();
      assignedDietPlans.push(savedDietPlan);
    }
    
    res.status(200).json({
      success: true,
      message: `Diet plan assigned to ${validMemberIds.length} member${validMemberIds.length !== 1 ? 's' : ''}`,
      data: { 
        assignedDietPlans,
        assignedCount: validMemberIds.length
      }
    });
  } catch (error) {
    console.error('Error assigning diet plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign diet plan',
      error: error.message
    });
  }
};