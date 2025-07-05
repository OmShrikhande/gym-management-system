import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import { promisify } from 'util';

const signToken = id => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '90d',
  });
};

// Helper function to create a user with specific role
const createUserWithRole = async (req, res, role) => {
  try {
    const { name, email, password } = req.body;
    console.log(`Creating ${role} with data:`, { name, email });

    if (!name || !email || !password) {
      console.log('Missing required fields');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, email, and password.',
      });
    }

    // Create user object with basic fields
    const userData = {
      name,
      email,
      password,
      role,
      createdBy: req.user._id // Track who created this user
    };
    
    // For trainers, explicitly set the gym field to the gym owner's ID
    if (role === 'trainer' && req.user.role === 'gym-owner') {
      userData.gym = req.user._id;
      console.log(`Creating trainer with gym owner ID: ${req.user._id}`);
    }
    
    // Add additional fields for member
    if (role === 'member') {
      // Add all the additional fields from the request body
      const additionalFields = [
        'phone', 'gender', 'dob', 'goal', 'planType', 'address', 
        'whatsapp', 'height', 'weight', 'emergencyContact', 
        'medicalConditions', 'assignedTrainer', 'notes',
        'membershipStatus', 'membershipStartDate', 'membershipEndDate', 'membershipDuration', 'membershipType'
      ];
      
      additionalFields.forEach(field => {
        if (req.body[field] !== undefined) {
          userData[field] = req.body[field];
        }
      });
    }

    console.log(`Creating new ${role} in database...`);
    const newUser = await User.create(userData);
    
    console.log(`${role} created successfully with ID:`, newUser._id);
    
    // Verify user exists in database immediately after creation
    const verifyUser = await User.findById(newUser._id);
    console.log('Verification - User exists in DB:', verifyUser ? 'Yes' : 'No');
    
    // If this is a member with an assigned trainer, update the trainer's member count
    if (role === 'member' && newUser.assignedTrainer) {
      try {
        const trainer = await User.findById(newUser.assignedTrainer);
        if (trainer) {
          // Count members assigned to this trainer
          const trainerMembers = await User.countDocuments({
            assignedTrainer: newUser.assignedTrainer,
            role: 'member'
          });
          
          // Update the trainer's assignedMembers count
          trainer.assignedMembers = trainerMembers;
          await trainer.save({ validateBeforeSave: false });
          console.log(`Updated trainer ${trainer.name} with ${trainerMembers} assigned members`);
        }
      } catch (error) {
        console.error('Error updating trainer member count:', error);
        // Continue with user creation even if trainer update fails
      }
    }

    // Remove password from output
    newUser.password = undefined;

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser,
      },
    });
  } catch (err) {
    if (err.code === 11000) { // Duplicate key error (e.g., email already exists)
      return res.status(400).json({
        status: 'fail',
        message: 'An account with this email already exists.',
      });
    }
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(el => el.message);
      const message = `Invalid input data. ${errors.join('. ')}`;
      return res.status(400).json({ status: 'fail', message });
    }
    console.error(`CREATE ${role.toUpperCase()} ERROR 💥`, err);
    res.status(500).json({
      status: 'error',
      message: `Something went wrong while creating ${role}. Please try again later.`,
    });
  }
};

// Super Admin can create Gym Owners
export const createGymOwner = async (req, res) => {
  return createUserWithRole(req, res, 'gym-owner');
};

// Gym Owners can create Trainers
export const createTrainer = async (req, res) => {
  return createUserWithRole(req, res, 'trainer');
};

// Gym Owners can create Users (Members)
export const createUser = async (req, res) => {
  return createUserWithRole(req, res, 'member');
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('LOGIN ATTEMPT:', { email, passwordProvided: !!password });

    if (!email || !password) {
      console.log('LOGIN FAILED: Missing email or password');
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password!',
      });
    }

    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error('LOGIN ERROR: JWT_SECRET not found in environment variables');
      return res.status(500).json({
        status: 'error',
        message: 'Server configuration error. Please contact administrator.',
      });
    }

    console.log('Finding user in database...');
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      console.log('LOGIN FAILED: User not found with email:', email);
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    console.log('User found:', { id: user._id, email: user.email, role: user.role });

    // Check password
    const isPasswordCorrect = await user.correctPassword(password, user.password);
    console.log('Password check result:', isPasswordCorrect);

    if (!isPasswordCorrect) {
      console.log('LOGIN FAILED: Incorrect password for user:', email);
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password',
      });
    }

    console.log('Generating JWT token...');
    const token = signToken(user._id);
    console.log('JWT token generated successfully');

    user.password = undefined; // Remove password from output

    console.log('LOGIN SUCCESS:', { userId: user._id, email: user.email, role: user.role });
    
    res.status(200).json({
      status: 'success',
      token,
      data: { user },
    });
  } catch (err) {
    console.error('LOGIN ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Something went wrong during login. Please try again later.',
    });
  }
};

// Protect routes - only authenticated users can access
export const protect = catchAsync(async (req, res, next) => {
  // 1) Get token from request headers
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }
  
  // 2) Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }
  
  // 4) Grant access to protected route
  req.user = currentUser;
  next();
});

// Restrict routes to specific roles
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array like ['super-admin', 'gym-owner']
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    
    next();
  };
};

// Verify token endpoint - used by frontend to check if token is still valid
export const verifyToken = (req, res) => {
  // If middleware passed, token is valid
  res.status(200).json({
    status: 'success',
    message: 'Token is valid',
    data: {
      user: req.user
    }
  });
};

// Get current user data
export const getMe = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      user: req.user
    }
  });
};

// Get users based on role hierarchy
export const getUsers = async (req, res) => {
  try {
    let query = {};
    
    // Super admin can see all users
    if (req.user.role === 'super-admin') {
      // No filter needed, can see all users
    } 
    // Gym owners can only see trainers and members they created
    else if (req.user.role === 'gym-owner') {
      query = { 
        createdBy: req.user._id,
        role: { $in: ['trainer', 'member'] }
      };
    }
    
    const users = await User.find(query).select('-__v');
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (err) {
    console.error('GET USERS ERROR 💥', err);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching users. Please try again later.'
    });
  }
};