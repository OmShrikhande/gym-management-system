/**
 * Fix Trainer Gym Assignment Script
 * This script fixes trainers that don't have gymId assigned properly
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

const fixTrainerGymAssignments = async () => {
  try {
    console.log('🔍 Finding trainers without gymId...');
    
    // Find all trainers that don't have gymId set properly
    const trainersWithoutGym = await User.find({
      role: 'trainer',
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' },
        { gymId: { $type: 'string', $eq: '' } }
      ]
    });

    console.log(`Found ${trainersWithoutGym.length} trainers without gymId`);

    if (trainersWithoutGym.length === 0) {
      console.log('✅ All trainers already have gymId assigned');
      return;
    }

    // For each trainer, try to find their gym owner using createdBy field
    for (const trainer of trainersWithoutGym) {
      console.log(`\n🔧 Fixing trainer: ${trainer.name} (${trainer.email})`);
      
      if (trainer.createdBy) {
        // Check if createdBy is a gym owner
        const gymOwner = await User.findById(trainer.createdBy);
        
        if (gymOwner && gymOwner.role === 'gym-owner') {
          console.log(`  ✅ Found gym owner: ${gymOwner.name} (${gymOwner.email})`);
          
          // Update trainer with gymId
          await User.findByIdAndUpdate(trainer._id, {
            gymId: gymOwner._id
          });
          
          console.log(`  ✅ Updated trainer ${trainer.name} with gymId: ${gymOwner._id}`);
        } else {
          console.log(`  ❌ CreatedBy user is not a gym owner or not found`);
          
          // Try to find any gym owner to assign this trainer to
          const anyGymOwner = await User.findOne({ role: 'gym-owner' });
          if (anyGymOwner) {
            await User.findByIdAndUpdate(trainer._id, {
              gymId: anyGymOwner._id,
              createdBy: anyGymOwner._id
            });
            console.log(`  ⚠️  Assigned trainer to first available gym owner: ${anyGymOwner.name}`);
          } else {
            console.log(`  ❌ No gym owners found in the system`);
          }
        }
      } else {
        console.log(`  ❌ Trainer has no createdBy field`);
        
        // Try to find any gym owner to assign this trainer to
        const anyGymOwner = await User.findOne({ role: 'gym-owner' });
        if (anyGymOwner) {
          await User.findByIdAndUpdate(trainer._id, {
            gymId: anyGymOwner._id,
            createdBy: anyGymOwner._id
          });
          console.log(`  ⚠️  Assigned trainer to first available gym owner: ${anyGymOwner.name}`);
        } else {
          console.log(`  ❌ No gym owners found in the system`);
        }
      }
    }

    console.log('\n✅ Trainer gym assignment fix completed');

    // Verify the fix
    const remainingTrainersWithoutGym = await User.find({
      role: 'trainer',
      $or: [
        { gymId: { $exists: false } },
        { gymId: null },
        { gymId: '' },
        { gymId: { $type: 'string', $eq: '' } }
      ]
    });

    console.log(`\n📊 Verification: ${remainingTrainersWithoutGym.length} trainers still without gymId`);
    
    if (remainingTrainersWithoutGym.length > 0) {
      console.log('Remaining trainers without gymId:');
      remainingTrainersWithoutGym.forEach(trainer => {
        console.log(`  - ${trainer.name} (${trainer.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error fixing trainer gym assignments:', error);
  }
};

const showTrainerGymStatus = async () => {
  try {
    console.log('\n📊 Current Trainer-Gym Assignment Status:');
    console.log('=' .repeat(50));
    
    const allTrainers = await User.find({ role: 'trainer' }).populate('gymId', 'name email');
    
    console.log(`Total trainers: ${allTrainers.length}`);
    
    for (const trainer of allTrainers) {
      const gymOwner = trainer.gymId;
      if (gymOwner) {
        console.log(`✅ ${trainer.name} → ${gymOwner.name} (${gymOwner.email})`);
      } else {
        console.log(`❌ ${trainer.name} → NO GYM ASSIGNED`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error showing trainer status:', error);
  }
};

const main = async () => {
  await connectDB();
  
  console.log('🚀 Starting Trainer Gym Assignment Fix...\n');
  
  // Show current status
  await showTrainerGymStatus();
  
  // Fix the assignments
  await fixTrainerGymAssignments();
  
  // Show final status
  await showTrainerGymStatus();
  
  console.log('\n🎉 Script completed successfully!');
  process.exit(0);
};

// Run the script
main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});