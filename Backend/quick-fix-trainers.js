/**
 * Quick Fix for Trainer Gym Assignment
 * This script directly fixes trainers with empty string gymId values
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

const quickFixTrainers = async () => {
  try {
    console.log('🔧 Starting quick fix for trainers...');
    
    // Find all trainers
    const allTrainers = await User.find({ role: 'trainer' });
    console.log(`Found ${allTrainers.length} total trainers`);
    
    // Find gym owners to assign trainers to
    const gymOwners = await User.find({ role: 'gym-owner' });
    console.log(`Found ${gymOwners.length} gym owners`);
    
    if (gymOwners.length === 0) {
      console.log('❌ No gym owners found! Cannot fix trainers.');
      return;
    }
    
    let fixedCount = 0;
    
    for (const trainer of allTrainers) {
      let needsFix = false;
      let gymOwnerToAssign = null;
      
      // Check if trainer needs fixing
      if (!trainer.gymId || trainer.gymId === '' || trainer.gymId === null) {
        needsFix = true;
        console.log(`❌ Trainer ${trainer.name} needs fixing - gymId: "${trainer.gymId}"`);
        
        // Try to find gym owner through createdBy
        if (trainer.createdBy) {
          const creator = await User.findById(trainer.createdBy);
          if (creator && creator.role === 'gym-owner') {
            gymOwnerToAssign = creator;
            console.log(`  → Found creator: ${creator.name}`);
          }
        }
        
        // If no creator found, assign to first gym owner
        if (!gymOwnerToAssign) {
          gymOwnerToAssign = gymOwners[0];
          console.log(`  → Assigning to first gym owner: ${gymOwnerToAssign.name}`);
        }
        
        // Update the trainer
        await User.findByIdAndUpdate(trainer._id, {
          gymId: gymOwnerToAssign._id,
          createdBy: gymOwnerToAssign._id
        });
        
        console.log(`  ✅ Fixed: ${trainer.name} → ${gymOwnerToAssign.name}`);
        fixedCount++;
      } else {
        console.log(`✅ Trainer ${trainer.name} is OK - gymId: ${trainer.gymId}`);
      }
    }
    
    console.log(`\n🎉 Quick fix completed! Fixed ${fixedCount} trainers.`);
    
    // Verify the fix
    const remainingIssues = await User.find({
      role: 'trainer',
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' }
      ]
    });
    
    console.log(`📊 Remaining issues: ${remainingIssues.length}`);
    
    if (remainingIssues.length > 0) {
      console.log('Trainers still with issues:');
      remainingIssues.forEach(trainer => {
        console.log(`  - ${trainer.name} (${trainer.email}) - gymId: "${trainer.gymId}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error in quick fix:', error);
  }
};

const main = async () => {
  await connectDB();
  await quickFixTrainers();
  console.log('\n✅ Script completed!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});