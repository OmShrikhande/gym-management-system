// Test subscription creation directly
import mongoose from 'mongoose';
import Subscription from './src/models/subscriptionModel.js';
import User from './src/models/userModel.js';
import Notification from './src/models/notificationModel.js';
import connectDB from './src/config/database.js';

// Connect to database
await connectDB();

const testData = {
  gymOwnerId: '686a9e61d8e5a11f0271c01e',
  plan: 'Premium',
  price: 999,
  durationMonths: 1,
  paymentMethod: 'test_mode',
  transactionId: 'test_123456'
};

console.log('Testing subscription creation with data:', testData);

try {
  // Check if user exists
  console.log('Checking if user exists...');
  const user = await User.findById(testData.gymOwnerId);
  console.log('User found:', user ? { _id: user._id, email: user.email, role: user.role } : 'not found');
  
  if (!user) {
    console.log('User not found, creating test user...');
    const newUser = await User.create({
      name: 'Test Gym Owner',
      email: 'test@gym.com',
      password: 'password123',
      role: 'gym-owner'
    });
    console.log('Test user created:', newUser._id);
  }
  
  // Create subscription
  console.log('Creating subscription...');
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + testData.durationMonths);
  
  const subscription = await Subscription.create({
    gymOwner: testData.gymOwnerId,
    plan: testData.plan,
    price: testData.price,
    startDate,
    endDate,
    isActive: true,
    paymentStatus: 'Paid',
    paymentHistory: [
      {
        amount: testData.price,
        date: startDate,
        method: testData.paymentMethod,
        status: 'Success',
        transactionId: testData.transactionId
      }
    ],
    autoRenew: true
  });
  
  console.log('Subscription created successfully:', subscription._id);
  
  // Test notification creation
  console.log('Creating notification...');
  const notification = await Notification.create({
    recipient: testData.gymOwnerId,
    type: 'payment_success',
    title: 'Test Notification',
    message: 'Test message',
    actionLink: '/test'
  });
  
  console.log('Notification created successfully:', notification._id);
  
} catch (error) {
  console.error('Error:', error);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: error.stack
  });
}

process.exit(0);