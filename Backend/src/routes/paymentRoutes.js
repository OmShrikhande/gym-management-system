import express from 'express';
import * as paymentController from '../controllers/paymentController.js';
import { protect, restrictTo } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes restricted to super admin
router.use(restrictTo('super-admin'));

// Create a Razorpay order
router.post('/razorpay/create-order', paymentController.createRazorpayOrder);

// Verify Razorpay payment and create gym owner
router.post('/razorpay/verify', paymentController.verifyRazorpayPayment);

// Generate QR code for payment
router.post('/razorpay/generate-qr', paymentController.generatePaymentQR);

export default router;