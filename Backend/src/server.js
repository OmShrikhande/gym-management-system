import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import subscriptionPlanRoutes from './routes/subscriptionPlanRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import workoutRoutes from './routes/workoutRoutes.js';
import dietPlanRoutes from './routes/dietPlanRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import settingRoutes from './routes/settingRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import nodeMcuRoutes from './routes/nodeMcuRoutes.js';
import deviceRoutes from './routes/deviceRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import connectDB from './config/database.js';
import setupSuperAdmin from './config/setupAdmin.js';
import User from './models/userModel.js';
import Subscription from './models/subscriptionModel.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
// Alias route for membership-plans (points to subscription-plans)
app.use('/api/membership-plans', subscriptionPlanRoutes);
app.use('/api/plans', subscriptionPlanRoutes); // Another alias
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/nodemcu', nodeMcuRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/enquiries', enquiryRoutes);

// NodeMCU specific validation endpoint (Legacy - use /api/devices/validate for new devices)
app.post('/api/nodemcu/validate', async (req, res) => {
  try {
    console.log('NodeMCU validation request received:', req.body);
    
    const { gymOwnerId, memberId, timestamp, deviceId } = req.body;

    // Validate required fields
    if (!gymOwnerId || !memberId) {
      console.log('Missing required fields');
      return res.status(400).json({
        status: 'error',
        message: 'gymOwnerId and memberId are required',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Find the gym owner
    const gymOwner = await User.findById(gymOwnerId);
    if (!gymOwner || gymOwner.role !== 'gym-owner') {
      console.log('Invalid gym owner');
      return res.status(404).json({
        status: 'error',
        message: 'Invalid gym owner',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Find the member
    const member = await User.findById(memberId);
    if (!member || member.role !== 'member') {
      console.log('Invalid member');
      return res.status(404).json({
        status: 'error',
        message: 'Invalid member',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Check if member belongs to this gym
    if (!member.createdBy || member.createdBy.toString() !== gymOwnerId) {
      console.log('Member does not belong to this gym');
      return res.status(403).json({
        status: 'error',
        message: 'Member does not belong to this gym',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Check if gym owner has active subscription
    const subscription = await Subscription.findOne({ 
      gymOwner: gymOwnerId, 
      isActive: true,
      endDate: { $gt: new Date() }
    });

    if (!subscription) {
      console.log('Gym owner subscription inactive or expired');
      return res.status(403).json({
        status: 'error',
        message: 'Gym subscription is inactive or expired',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Check member's subscription status
    if (member.membershipStatus !== 'Active') {
      console.log('Member subscription inactive');
      return res.status(200).json({
        status: 'error',
        message: 'Member subscription is inactive',
        nodeMcuResponse: 'INACTIVE'
      });
    }

    // Mark attendance if timestamp is provided
    if (timestamp) {
      member.attendance = member.attendance || [];
      member.attendance.push({ 
        gymOwnerId, 
        timestamp: new Date(timestamp) 
      });
      await member.save({ validateBeforeSave: false });
      console.log('Attendance marked successfully');
    }

    // Success response
    console.log('Validation successful - sending ACTIVE response');
    res.status(200).json({
      status: 'success',
      message: `Access granted to ${gymOwner.gymName || gymOwner.name + "'s Gym"}`,
      nodeMcuResponse: 'ACTIVE',
      data: {
        memberName: member.name,
        gymName: gymOwner.gymName || gymOwner.name + "'s Gym",
        timestamp: timestamp ? new Date(timestamp) : new Date()
      }
    });

  } catch (error) {
    console.error('NodeMCU validation error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      nodeMcuResponse: 'INACTIVE'
    });
  }
});

// NodeMCU status endpoint is now handled in nodeMcuRoutes.js

// Default route
app.get('/', (req, res) => {
  res.send('GymFlow API is running');
});

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message: err.message
  });
});

// Start server
const PORT = process.env.PORT || 5000;
connectDB().then(async () => {
  // Create super admin user if it doesn't exist
  await setupSuperAdmin();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`NodeMCU API available at http://192.168.1.4:${PORT}/api/nodemcu/validate`);
  });
});