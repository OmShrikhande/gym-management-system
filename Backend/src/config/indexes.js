import User from '../models/userModel.js';
import Subscription from '../models/subscriptionModel.js';
import Notification from '../models/notificationModel.js';

/**
 * Create database indexes for optimal performance with 200-400 concurrent users
 */
export const createIndexes = async () => {
  try {
    console.log('Creating database indexes for optimal performance...');

    // Wait for connection to be ready
    if (mongoose.connection.readyState !== 1) {
      console.log('Waiting for database connection...');
      await new Promise(resolve => {
        if (mongoose.connection.readyState === 1) {
          resolve();
        } else {
          mongoose.connection.once('connected', resolve);
        }
      });
    }

    // User model indexes with error handling
    try {
      await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
      console.log('✅ Created email index');
    } catch (error) {
      if (error.code !== 11000) { // Ignore duplicate key error
        console.log('📝 Email index already exists or created');
      }
    }

    const userIndexes = [
      { key: { role: 1 }, options: { background: true } },
      { key: { gymId: 1 }, options: { background: true } },
      { key: { accountStatus: 1 }, options: { background: true } },
      { key: { createdAt: -1 }, options: { background: true } },
      { key: { membershipStatus: 1 }, options: { background: true } },
      { key: { membershipEndDate: 1 }, options: { background: true } },
      { key: { role: 1, accountStatus: 1 }, options: { background: true } },
      { key: { gymId: 1, role: 1 }, options: { background: true } },
      { key: { gymId: 1, membershipStatus: 1 }, options: { background: true } },
      { key: { role: 1, createdAt: -1 }, options: { background: true } }
    ];

    for (const index of userIndexes) {
      try {
        await User.collection.createIndex(index.key, index.options);
      } catch (error) {
        // Index might already exist, continue
        console.log(`📝 User index ${JSON.stringify(index.key)} already exists or created`);
      }
    }

    // Subscription model indexes
    const subscriptionIndexes = [
      { key: { gymOwner: 1 }, options: { background: true } },
      { key: { isActive: 1 }, options: { background: true } },
      { key: { endDate: 1 }, options: { background: true } },
      { key: { paymentStatus: 1 }, options: { background: true } },
      { key: { createdAt: -1 }, options: { background: true } },
      { key: { isActive: 1, endDate: 1 }, options: { background: true } },
      { key: { gymOwner: 1, isActive: 1 }, options: { background: true } },
      { key: { isActive: 1, paymentStatus: 1 }, options: { background: true } },
      { key: { gymOwner: 1, createdAt: -1 }, options: { background: true } }
    ];

    for (const index of subscriptionIndexes) {
      try {
        await Subscription.collection.createIndex(index.key, index.options);
      } catch (error) {
        console.log(`📝 Subscription index ${JSON.stringify(index.key)} already exists or created`);
      }
    }

    // Notification model indexes
    const notificationIndexes = [
      { key: { recipient: 1 }, options: { background: true } },
      { key: { isRead: 1 }, options: { background: true } },
      { key: { createdAt: -1 }, options: { background: true } },
      { key: { type: 1 }, options: { background: true } },
      { key: { recipient: 1, isRead: 1 }, options: { background: true } },
      { key: { recipient: 1, createdAt: -1 }, options: { background: true } },
      { key: { recipient: 1, type: 1 }, options: { background: true } }
    ];

    for (const index of notificationIndexes) {
      try {
        await Notification.collection.createIndex(index.key, index.options);
      } catch (error) {
        console.log(`📝 Notification index ${JSON.stringify(index.key)} already exists or created`);
      }
    }

    // Text indexes for search functionality
    await User.collection.createIndex({ 
      name: 'text', 
      email: 'text', 
      phone: 'text' 
    }, { 
      name: 'user_search_index',
      weights: { name: 10, email: 5, phone: 1 }
    });

    console.log('✅ Database indexes created successfully');
    
    // Log index information
    const currentUserIndexes = await User.collection.listIndexes().toArray();
    const currentSubscriptionIndexes = await Subscription.collection.listIndexes().toArray();
    const currentNotificationIndexes = await Notification.collection.listIndexes().toArray();
    
    console.log(`📊 User collection indexes: ${currentUserIndexes.length}`);
    console.log(`📊 Subscription collection indexes: ${currentSubscriptionIndexes.length}`);
    console.log(`📊 Notification collection indexes: ${currentNotificationIndexes.length}`);

  } catch (error) {
    console.error('❌ Error creating database indexes:', error.message);
    // Don't throw error to prevent app startup failure
  }
};

/**
 * Drop all custom indexes (useful for development/testing)
 */
export const dropIndexes = async () => {
  try {
    console.log('Dropping custom database indexes...');
    
    // Get all indexes except _id
    const allUserIndexes = await User.collection.listIndexes().toArray();
    const allSubscriptionIndexes = await Subscription.collection.listIndexes().toArray();
    const allNotificationIndexes = await Notification.collection.listIndexes().toArray();
    
    // Drop custom indexes (keep _id index)
    for (const index of allUserIndexes) {
      if (index.name !== '_id_') {
        await User.collection.dropIndex(index.name);
      }
    }
    
    for (const index of allSubscriptionIndexes) {
      if (index.name !== '_id_') {
        await Subscription.collection.dropIndex(index.name);
      }
    }
    
    for (const index of allNotificationIndexes) {
      if (index.name !== '_id_') {
        await Notification.collection.dropIndex(index.name);
      }
    }
    
    console.log('✅ Custom indexes dropped successfully');
  } catch (error) {
    console.error('❌ Error dropping indexes:', error.message);
  }
};

/**
 * Get index statistics for performance monitoring
 */
export const getIndexStats = async () => {
  try {
    const stats = {
      user: await User.collection.listIndexes().toArray(),
      subscription: await Subscription.collection.listIndexes().toArray(),
      notification: await Notification.collection.listIndexes().toArray()
    };
    
    return {
      success: true,
      data: stats,
      summary: {
        userIndexes: stats.user.length,
        subscriptionIndexes: stats.subscription.length,
        notificationIndexes: stats.notification.length,
        totalIndexes: stats.user.length + stats.subscription.length + stats.notification.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};