/**
 * Verify Trainer Fix
 * This script verifies that all trainers now have proper gymId assignments
 */

import mongoose from 'mongoose';
import User from './src/models/userModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const verifyTrainerFix = async () => {
  try {
    console.log('🔍 Verifying trainer gym assignments...\n');
    
    // Get all trainers
    const allTrainers = await User.find({ role: 'trainer' }).populate('gymId', 'name email');
    
    console.log(`📊 Total trainers: ${allTrainers.length}\n`);
    
    let okCount = 0;
    let issueCount = 0;
    
    for (const trainer of allTrainers) {
      const hasValidGymId = trainer.gymId && 
                           trainer.gymId !== '' && 
                           trainer.gymId !== null && 
                           trainer.gymId !== 'undefined';
      
      if (hasValidGymId) {
        console.log(`✅ ${trainer.name} → ${trainer.gymId.name} (${trainer.gymId.email})`);
        okCount++;
      } else {
        console.log(`❌ ${trainer.name} → NO VALID GYM ASSIGNED (gymId: "${trainer.gymId}")`);
        issueCount++;
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`✅ Trainers with valid gym assignment: ${okCount}`);
    console.log(`❌ Trainers with issues: ${issueCount}`);
    
    if (issueCount === 0) {
      console.log(`\n🎉 All trainers are properly assigned! Gate access should work now.`);
    } else {
      console.log(`\n⚠️  ${issueCount} trainer(s) still need manual fixing.`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying trainers:', error);
  }
};

const main = async () => {
  await connectDB();
  await verifyTrainerFix();
  console.log('\n✅ Verification completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});