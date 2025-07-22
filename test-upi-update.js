// Test script to verify UPI ID update functionality
import mongoose from 'mongoose';
import User from './Backend/src/models/userModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://omshrikhande:Myname0803@cluster0.je7trvw.mongodb.net/viscous?retryWrites=true&w=majority&appName=Cluster0');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test UPI ID update
const testUpiUpdate = async () => {
  try {
    // Find a gym owner to test with
    const gymOwner = await User.findOne({ role: 'gym-owner' });
    
    if (!gymOwner) {
      console.log('❌ No gym owner found for testing');
      return;
    }
    
    console.log('📝 Found gym owner:', {
      name: gymOwner.name,
      email: gymOwner.email,
      currentUpiId: gymOwner.upiId
    });
    
    // Test UPI ID update
    const testUpiId = `test-${Date.now()}@paytm`;
    console.log('🔄 Updating UPI ID to:', testUpiId);
    
    gymOwner.upiId = testUpiId;
    const savedUser = await gymOwner.save();
    
    console.log('✅ UPI ID updated successfully:', savedUser.upiId);
    
    // Verify by fetching fresh from database
    const freshUser = await User.findById(gymOwner._id);
    console.log('🔍 Verified UPI ID in database:', freshUser.upiId);
    
    // Test the API endpoint functionality
    console.log('🔄 Testing API endpoint functionality...');
    
    if (freshUser.upiId) {
      console.log('✅ API would return: hasUpiId: true, upiId:', freshUser.upiId);
    } else {
      console.log('❌ API would return: hasUpiId: false');
    }
    
  } catch (error) {
    console.error('❌ Error testing UPI update:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
};

// Run the test
const runTest = async () => {
  await connectDB();
  await testUpiUpdate();
};

runTest();