import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Test endpoint without authentication for debugging
router.post('/test-verify', (req, res) => {
  console.log('🧪 Test verify endpoint - Request body:', JSON.stringify(req.body, null, 2));
  console.log('🧪 Test verify endpoint - Headers:', req.headers);
  
  res.json({
    success: true,
    message: 'Test endpoint working',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// Protect all routes
router.use(protect);

// Routes accessible to both super admin and gym owners
// Get Razorpay public key
router.get('/razorpay/key', paymentController.getRazorpayKey);

// Health check for Razorpay
router.get('/razorpay/health', paymentController.checkRazorpayHealth);

// Create a Razorpay order - needed for subscription renewal
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay payment - needed for subscription renewal
router.post('/razorpay/verify', 
  (req, res, next) => {
    console.log('🔍 Regular payment verification middleware - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Content-Type:', req.headers['content-type']);
    console.log('🔍 Request method:', req.method);
    next();
  },
  paymentController.verifyRazorpayPayment
);

// Account activation routes (for gym owners)
router.post('/razorpay/verify-activation', 
  (req, res, next) => {
    console.log('🔍 Payment verification middleware - Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Content-Type:', req.headers['content-type']);
    console.log('🔍 Request method:', req.method);
    next();
  },
  restrictTo('gym-owner'), 
  paymentController.verifyActivationPayment
);
router.post('/test-activation', restrictTo('gym-owner'), paymentController.testModeActivation);

// Member payment tracking routes (for gym owners)
router.post('/member-payments', restrictTo('gym-owner'), paymentController.recordMemberPayment);
router.get('/member-payments', restrictTo('gym-owner'), paymentController.getMemberPayments);
router.get('/member-payments/stats', restrictTo('gym-owner'), paymentController.getPaymentStats);
router.get('/member-payments/report', restrictTo('gym-owner'), paymentController.generatePaymentReport);

// Routes restricted to super admin
router.use(restrictTo('super-admin'));

// Generate QR code for payment
router.post('/razorpay/generate-qr', paymentController.generatePaymentQR);

export default router;