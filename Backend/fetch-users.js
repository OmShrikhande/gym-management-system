import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log(`Connecting to MongoDB at: ${process.env.MONGODB_URI}`);
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    console.log(`Database Name: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// Define a simplified User schema for fetching data
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String,
  phone: String,
  gender: String,
  dob: String,
  goal: String,
  planType: String,
  address: String,
  whatsapp: String,
  height: String,
  weight: String,
  emergencyContact: String,
  medicalConditions: String,
  notes: String,
  membershipStatus: String,
  membershipStartDate: Date,
  membershipEndDate: Date,
  membershipDuration: String,
  membershipType: String,
  createdAt: Date
});

// Create the User model
const User = mongoose.model('User', userSchema);

// Fetch all users
const fetchAllUsers = async () => {
  try {
    // Connect to the database
    await connectDB();
    
    // Fetch all users
    const users = await User.find({}).select('-password');
    
    console.log('=== ALL USERS ===');
    console.log(`Total users found: ${users.length}`);
    console.log('=================\n');
    
    // Display user information
    users.forEach((user, index) => {
      console.log(`User #${index + 1}:`);
      console.log(`ID: ${user._id}`);
      console.log(`Name: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Phone: ${user.phone || 'N/A'}`);
      console.log(`Gender: ${user.gender || 'N/A'}`);
      console.log(`Created At: ${user.createdAt}`);
      
      // Show membership details for members
      if (user.role === 'member') {
        console.log(`Membership Status: ${user.membershipStatus || 'N/A'}`);
        console.log(`Membership Type: ${user.membershipType || user.planType || 'N/A'}`);
        console.log(`Membership Start: ${user.membershipStartDate || 'N/A'}`);
        console.log(`Membership End: ${user.membershipEndDate || 'N/A'}`);
      }
      
      console.log('-------------------');
    });
    
    // Close the connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error fetching users:', error);
    // Ensure the connection is closed even if there's an error
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
  }
};

// Execute the function
fetchAllUsers();