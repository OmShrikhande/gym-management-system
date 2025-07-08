import Subscription from '../models/subscriptionModel.js';
import User from '../models/userModel.js';

// Function to clean up expired subscriptions
export const cleanupExpiredSubscriptions = async () => {
  try {
    const today = new Date();
    console.log(`[${new Date().toISOString()}] Starting subscription cleanup...`);
    
    // Find all expired subscriptions that are still marked as active
    const expiredSubscriptions = await Subscription.find({
      isActive: true,
      endDate: { $lt: today }
    });
    
    console.log(`Found ${expiredSubscriptions.length} expired subscriptions to clean up`);
    
    // Update expired subscriptions
    const updateResult = await Subscription.updateMany(
      { 
        isActive: true,
        endDate: { $lt: today }
      },
      { 
        $set: { 
          isActive: false,
          paymentStatus: 'Overdue'
        }
      }
    );
    
    console.log(`Updated ${updateResult.modifiedCount} expired subscriptions`);
    
    // Update gym owners' account status to inactive if their subscription expired
    for (const subscription of expiredSubscriptions) {
      await User.findByIdAndUpdate(
        subscription.gymOwner,
        { accountStatus: 'inactive' },
        { new: true }
      );
    }
    
    console.log(`[${new Date().toISOString()}] Subscription cleanup completed`);
    
    return {
      success: true,
      expiredCount: expiredSubscriptions.length,
      updatedCount: updateResult.modifiedCount
    };
  } catch (error) {
    console.error('Error during subscription cleanup:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to run cleanup periodically
export const startSubscriptionCleanup = () => {
  // Run cleanup immediately on startup
  cleanupExpiredSubscriptions();
  
  // Then run every 6 hours (21600000 milliseconds)
  setInterval(() => {
    cleanupExpiredSubscriptions();
  }, 6 * 60 * 60 * 1000);
  
  console.log('Subscription cleanup scheduled to run every 6 hours');
};

// Function to get accurate active gym count
export const getAccurateActiveGymCount = async () => {
  try {
    const today = new Date();
    
    // First cleanup expired subscriptions
    await cleanupExpiredSubscriptions();
    
    // Then count active gyms
    const result = await Subscription.aggregate([
      {
        $match: {
          isActive: true,
          endDate: { $gte: today },
          paymentStatus: { $ne: 'Overdue' }
        }
      },
      {
        $group: {
          _id: "$gymOwner"
        }
      },
      {
        $group: {
          _id: null,
          activeGymCount: { $sum: 1 }
        }
      }
    ]);
    
    return result.length > 0 ? result[0].activeGymCount : 0;
  } catch (error) {
    console.error('Error getting accurate active gym count:', error);
    return 0;
  }
};