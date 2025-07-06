// Test the user ID format
const mongoose = require('mongoose');

const userId = '686a9e61d8e5a11f0271c01e';

console.log('Testing user ID:', userId);
console.log('Type:', typeof userId);
console.log('Length:', userId.length);
console.log('Is valid ObjectId:', mongoose.Types.ObjectId.isValid(userId));

// Create ObjectId from string
try {
  const objectId = new mongoose.Types.ObjectId(userId);
  console.log('Created ObjectId:', objectId);
  console.log('ObjectId toString:', objectId.toString());
  console.log('Match test:', /^[0-9a-fA-F]{24}$/.test(userId));
} catch (error) {
  console.error('Error creating ObjectId:', error);
}