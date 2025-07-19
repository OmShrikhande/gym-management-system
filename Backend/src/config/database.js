import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    // Only log URI in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Attempting to connect to MongoDB at: ${process.env.MONGODB_URI}`);
    } else {
      console.log('Attempting to connect to MongoDB...');
    }
    
    // Configure mongoose settings for high load
    // Note: bufferCommands and bufferMaxEntries are deprecated in newer versions
    // mongoose.set('bufferCommands', false);
    // mongoose.set('bufferMaxEntries', 0);
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Connection pool settings for high concurrency
      maxPoolSize: 50, // Increased from 10 to handle more concurrent connections
      minPoolSize: 5,  // Maintain minimum connections
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      
      // Timeout settings
      serverSelectionTimeoutMS: 10000, // Increased from 5000
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000,
      
      // Write concern for better performance
      writeConcern: {
        w: 'majority',
        j: true,
        wtimeout: 5000
      },
      
      // Read preference for load distribution
      readPreference: 'primaryPreferred',
      
      // Compression for better network performance
      compressors: ['zlib'],
      
      // Auto index creation
      autoIndex: process.env.NODE_ENV === 'development'
    });
    
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📄 Database Name: ${conn.connection.name}`);
    
    // Only show detailed info in development
    if (process.env.NODE_ENV === 'development') {
      // List all collections in the database
      const collections = await conn.connection.db.listCollections().toArray();
      console.log('Available collections:');
      collections.forEach(collection => {
        console.log(`- ${collection.name}`);
      });
      
      // Check if users collection exists and count documents
      if (collections.some(col => col.name === 'users')) {
        const userCount = await conn.connection.db.collection('users').countDocuments();
        console.log(`Users collection exists with ${userCount} documents`);
        
        // If there are users, log the first few
        if (userCount > 0) {
          const users = await conn.connection.db.collection('users').find({}).limit(3).toArray();
          console.log('Sample users:', JSON.stringify(users.map(u => ({
            _id: u._id,
            name: u.name,
            email: u.email
          })), null, 2));
        }
      }
    }
    
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    if (process.env.NODE_ENV === 'development') {
      console.error(error);
    }
    process.exit(1);
  }
};

export default connectDB;