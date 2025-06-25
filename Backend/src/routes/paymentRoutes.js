import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes accessible to both super admin and gym owners
// Create a Razorpay order - needed for subscription renewal
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay payment - needed for subscription renewal
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);

// Routes restricted to super admin
router.use(restrictTo('super-admin'));

// Generate QR code for payment
router.post('/razorpay/generate-qr', paymentController.generatePaymentQR);

export default router;