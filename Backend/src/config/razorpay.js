import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay with environment variables
const razorpay = new Razorpay({
  key_id: process.env.NODE_ENV === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID,
  key_secret: process.env.NODE_ENV === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    : process.env.RAZORPAY_TEST_KEY_SECRET
});

// Validate Razorpay credentials
const validateRazorpayCredentials = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const keyId = isProduction ? process.env.RAZORPAY_LIVE_KEY_ID : process.env.RAZORPAY_TEST_KEY_ID;
  const keySecret = isProduction ? process.env.RAZORPAY_LIVE_KEY_SECRET : process.env.RAZORPAY_TEST_KEY_SECRET;
  
  if (!keyId || !keySecret) {
    console.error('⚠️  Razorpay credentials are missing! Please check your environment variables.');
    console.error('Required env vars:', {
      NODE_ENV: process.env.NODE_ENV,
      RAZORPAY_TEST_KEY_ID: process.env.RAZORPAY_TEST_KEY_ID ? '✓ SET' : '✗ MISSING',
      RAZORPAY_TEST_KEY_SECRET: process.env.RAZORPAY_TEST_KEY_SECRET ? '✓ SET' : '✗ MISSING',
      RAZORPAY_LIVE_KEY_ID: process.env.RAZORPAY_LIVE_KEY_ID ? '✓ SET' : '✗ MISSING',
      RAZORPAY_LIVE_KEY_SECRET: process.env.RAZORPAY_LIVE_KEY_SECRET ? '✓ SET' : '✗ MISSING'
    });
    return false;
  }
  
  console.log('✅ Razorpay credentials validated successfully');
  console.log(`📝 Using ${isProduction ? 'LIVE' : 'TEST'} mode`);
  console.log(`🔑 Key ID: ${keyId.substring(0, 8)}...`);
  return true;
};

// Verify Razorpay payment signature
const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  const razorpaySecret = process.env.NODE_ENV === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    : process.env.RAZORPAY_TEST_KEY_SECRET;
    
  const generatedSignature = crypto
    .createHmac('sha256', razorpaySecret)
    .update(orderId + "|" + paymentId)
    .digest('hex');
    
  return generatedSignature === signature;
};

// Get Razorpay public key for frontend
const getRazorpayPublicKey = () => {
  return process.env.NODE_ENV === 'production' 
    ? process.env.RAZORPAY_LIVE_KEY_ID 
    : process.env.RAZORPAY_TEST_KEY_ID;
};

export { 
  razorpay, 
  validateRazorpayCredentials, 
  verifyRazorpaySignature, 
  getRazorpayPublicKey 
};