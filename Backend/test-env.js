import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

console.log('=== Environment Variables Test ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('RAZORPAY_LIVE_KEY_ID:', process.env.RAZORPAY_LIVE_KEY_ID ? 'SET' : 'NOT SET');
console.log('RAZORPAY_LIVE_KEY_SECRET:', process.env.RAZORPAY_LIVE_KEY_SECRET ? 'SET' : 'NOT SET');
console.log('RAZORPAY_TEST_KEY_ID:', process.env.RAZORPAY_TEST_KEY_ID ? 'SET' : 'NOT SET');
console.log('RAZORPAY_TEST_KEY_SECRET:', process.env.RAZORPAY_TEST_KEY_SECRET ? 'SET' : 'NOT SET');

// Test Razorpay configuration
import { validateRazorpayCredentials, isRazorpayAvailable, getRazorpayInstance } from './src/config/razorpay.js';

console.log('\n=== Razorpay Configuration Test ===');
console.log('Validating credentials...');
const isValid = validateRazorpayCredentials();
console.log('Credentials valid:', isValid);

console.log('Razorpay available:', isRazorpayAvailable());

try {
  const instance = getRazorpayInstance();
  console.log('Razorpay instance created successfully');
  
  // Test creating an order
  console.log('Testing order creation...');
  const order = await instance.orders.create({
    amount: 100, // 1 rupee in paise
    currency: 'INR',
    receipt: 'test_receipt_' + Date.now()
  });
  console.log('✅ Test order created successfully:', order.id);
} catch (error) {
  console.error('❌ Error:', error.message);
}