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
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    let query = {};
    let dietPlans = [];
    let totalCount = 0;
    
    if (req.user.role === 'super-admin') {
      // Super admin can see all diet plans
      query = {};
    } else if (req.user.role === 'gym-owner') {
      // Optimized query: get trainer IDs first using lean query for better performance
      const trainerIds = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: req.user._id },
          { createdBy: req.user._id }
        ]
      }).select('_id').lean();
      
      const trainerIdArray = trainerIds.map(trainer => trainer._id);
      
      query = {
        $or: [
          { gym: req.user._id },
          { trainer: { $in: trainerIdArray } }
        ]
      };
    } else if (req.user.role === 'trainer') {
      // Trainer can only see their own diet plans
      query = { trainer: req.user._id };
    } else {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    
    // Get total count for pagination
    totalCount = await DietPlan.countDocuments(query);
    
    // Fetch diet plans with optimized population and lean queries for better performance
    dietPlans = await DietPlan.find(query)
      .populate('trainer', 'name email', null, { lean: true })
      .populate('assignedTo', 'name email', null, { lean: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(); // Use lean() for better performance
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
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
    
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Use lean query to verify gym exists (faster than full document)
    const gym = await User.findById(gymId).select('role').lean();
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
    
    let query = {};
    let totalCount = 0;
    
    if (req.user.role === 'gym-owner' && req.user._id.toString() === gymId) {
      // Optimized: Get trainer IDs using lean query
      const trainerIds = await User.find({ 
        role: 'trainer',
        $or: [
          { gym: gymId },
          { createdBy: gymId }
        ]
      }).select('_id').lean();
      
      const trainerIdArray = trainerIds.map(trainer => trainer._id);
      
      query = {
        $or: [
          { gym: gymId },
          { trainer: { $in: trainerIdArray } }
        ]
      };
    } else {
      query = { gym: gymId };
    }
    
    // Get total count
    totalCount = await DietPlan.countDocuments(query);
    
    // Fetch diet plans with pagination and lean queries
    const dietPlans = await DietPlan.find(query)
      .populate('trainer', 'name email', null, { lean: true })
      .populate('assignedTo', 'name email', null, { lean: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
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
    
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Use lean query to verify trainer exists (faster)
    const trainer = await User.findById(trainerId).select('role').lean();
    if (!trainer || trainer.role !== 'trainer') {
      return res.status(404).json({
        success: false,
        message: 'Trainer not found'
      });
    }
    
    // Get total count
    const totalCount = await DietPlan.countDocuments({ trainer: trainerId });
    
    // Find all diet plans created by this trainer with pagination and lean queries
    const dietPlans = await DietPlan.find({ trainer: trainerId })
      .populate('assignedTo', 'name email', null, { lean: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
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
    
    // Add pagination support
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get the member details to find their assigned trainer
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    let dietPlans = [];
    let totalCount = 0;
    
    // If member has an assigned trainer, show all diet plans from that trainer
    if (member.assignedTrainer) {
      totalCount = await DietPlan.countDocuments({ trainer: member.assignedTrainer });
      dietPlans = await DietPlan.find({ trainer: member.assignedTrainer })
        .populate('trainer', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();
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
        }).select('_id').lean();
        
        const trainerIds = trainers.map(trainer => trainer._id);
        
        totalCount = await DietPlan.countDocuments({ trainer: { $in: trainerIds } });
        dietPlans = await DietPlan.find({ trainer: { $in: trainerIds } })
          .populate('trainer', 'name email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean();
      }
    }
    
    res.status(200).json({
      success: true,
      results: dietPlans.length,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      currentPage: page,
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