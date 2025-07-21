import dotenv from 'dotenv';
import { getRazorpayInstance, validateRazorpayCredentials, getRazorpayPublicKey } from './src/config/razorpay.js';

// Load environment variables
dotenv.config();

console.log('=== Razorpay Configuration Test ===');

// Test 1: Validate credentials
console.log('\n1. Testing Razorpay credentials validation...');
const isValid = validateRazorpayCredentials();

if (isValid) {
  console.log('✅ Razorpay credentials are valid');
  
  // Test 2: Get public key
  console.log('\n2. Testing public key retrieval...');
  const publicKey = getRazorpayPublicKey();
  console.log('📝 Public Key:', publicKey);
  
  // Test 3: Create a test order
  console.log('\n3. Testing order creation...');
  try {
    const razorpayInstance = getRazorpayInstance();
    const order = await razorpayInstance.orders.create({
      amount: 100, // ₹1.00 in paise
      currency: 'INR',
      receipt: 'test_receipt_' + Date.now(),
      notes: {
        test: 'This is a test order'
      }
    });
    
    console.log('✅ Test order created successfully:');
    console.log('Order ID:', order.id);
    console.log('Amount:', order.amount);
    console.log('Currency:', order.currency);
    console.log('Status:', order.status);
    
  } catch (error) {
    console.error('❌ Failed to create test order:', error.message);
  }
} else {
  console.error('❌ Razorpay credentials validation failed');
}

console.log('\n=== Test Complete ===');