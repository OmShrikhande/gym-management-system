import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import deviceSocketService from './services/deviceSocketService.js';

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

import deviceRoutes from './routes/deviceRoutes.js';
import deviceConnectionRoutes from './routes/deviceConnectionRoutes.js';
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
const server = createServer(app);

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

app.use('/api/devices', deviceRoutes);
app.use('/api/device-connections', deviceConnectionRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/enquiries', enquiryRoutes);





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
  
  // Initialize Socket.IO for device communication
  deviceSocketService.initialize(server);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api`);
    console.log(`🔌 WebSocket server available at ws://localhost:${PORT}`);
    console.log(`📻 Devices can connect and listen for QR scan responses`);
  });
});