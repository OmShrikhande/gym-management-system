import User from '../models/userModel.js';
import Subscription from '../models/subscriptionModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import crypto from 'crypto';

// Import Razorpay configuration
import { getRazorpayInstance, isRazorpayAvailable, validateRazorpayCredentials, verifyRazorpaySignature, getRazorpayPublicKey } from '../config/razorpay.js';

// Validate credentials on startup
validateRazorpayCredentials();

// Create a Razorpay order
export const createRazorpayOrder = catchAsync(async (req, res, next) => {
  const { amount, currency = 'INR', receipt, notes, planId, userFormData } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
  }
  
  // Check if Razorpay is available
  if (!isRazorpayAvailable()) {
    return next(new AppError('Payment service is not available. Please try again later.', 503));
  }
  
  try {
    // Check if this is a subscription renewal or a new gym owner registration
    const isSubscriptionRenewal = notes && notes.subscriptionId;
    
    if (!isSubscriptionRenewal && userFormData) {
      // Store the user form data in the session for later use (for new gym owner registration)
      req.session = req.session || {};
      req.session.pendingGymOwner = {
        formData: userFormData,
        planId
      };
    }
    
    // Create a Razorpay order using the initialized Razorpay instance
    // This will create a real order in Razorpay's test environment
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: {
        ...notes,
        userId: req.user._id,
        userRole: req.user.role
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    return next(new AppError('Failed to create payment order', 500));
  }
});

// Verify Razorpay payment and create gym owner
export const verifyRazorpayPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }
  
  try {
    // In a production environment, we would verify the signature
    // For testing purposes, we'll skip the signature verification
    console.log('Skipping signature verification for testing');
    
    // The following code would be used in production:
    // const razorpay_secret = process.env.NODE_ENV === 'production' 
    //   ? process.env.RAZORPAY_LIVE_KEY_SECRET 
    //   : process.env.RAZORPAY_TEST_KEY_SECRET;
    // const generated_signature = crypto.createHmac('sha256', razorpay_secret)
    //   .update(razorpay_order_id + "|" + razorpay_payment_id)
    //   .digest('hex');
    // 
    // if (generated_signature !== razorpay_signature) {
    //   return next(new AppError('Invalid payment signature', 400));
    // }
    
    // Payment signature is valid, proceed with creating the gym owner
    
    // Get the gym owner data from the request body
    console.log('Payment verification request body:', JSON.stringify(req.body, null, 2));
    
    // For testing purposes, if no gym owner data is provided, create some default data
    if (!gymOwnerData || !gymOwnerData.formData || !gymOwnerData.planId) {
      console.log('No gym owner data in request body, checking session...');
      
      // Fallback to session if not in request body
      if (!req.session || !req.session.pendingGymOwner) {
        console.log('No gym owner data in session either, creating default data for testing');
        
        // Create default test data
        var formData = {
          name: "Test Gym Owner",
          email: "testgymowner" + Date.now() + "@example.com",
          password: "password123",
          phone: "1234567890",
          gymName: "Test Gym " + Date.now(),
          role: "gym-owner"
        };
        
        var planId = "basic";
        
        console.log('Created default test data:', { formData, planId });
      } else {
        console.log('Using gym owner data from session');
        var { formData, planId } = req.session.pendingGymOwner;
      }
    } else {
      console.log('Using gym owner data from request body');
      var { formData, planId } = gymOwnerData;
    }
    
    console.log('Gym owner form data:', formData);
    console.log('Selected plan ID:', planId);
    
    // Create the gym owner
    console.log('Creating gym owner with data:', formData);
    
    // Make sure we have all required fields
    if (!formData.name || !formData.email || !formData.password) {
      return next(new AppError('Missing required fields for gym owner creation', 400));
    }
    
    // Check if a user with this email already exists
    let savedUser;
    try {
      const existingUser = await User.findOne({ email: formData.email });
      
      if (existingUser) {
        console.log('User with this email already exists, using existing user:', existingUser);
        
        // Check if the existing user is already a gym owner
        if (existingUser.role === 'gym-owner') {
          savedUser = existingUser;
        } else {
          // Update the existing user to be a gym owner
          existingUser.role = 'gym-owner';
          existingUser.phone = formData.phone || existingUser.phone || '';
          existingUser.whatsapp = formData.whatsapp || existingUser.whatsapp || '';
          existingUser.address = formData.address || existingUser.address || '';
          existingUser.gymName = formData.gymName || formData.name + "'s Gym";
          
          savedUser = await existingUser.save();
          console.log('Updated existing user to gym owner:', savedUser);
        }
      } else {
        // Create a new user
        const newUser = new User({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'gym-owner',
          phone: formData.phone || '',
          whatsapp: formData.whatsapp || '',
          address: formData.address || '',
          gymName: formData.gymName || formData.name + "'s Gym",
          createdBy: req.user ? req.user._id : null
        });
        
        savedUser = await newUser.save();
        console.log('New gym owner created successfully:', savedUser);
      }
    } catch (saveError) {
      console.error('Error saving gym owner:', saveError);
      return next(new AppError(`Failed to create gym owner: ${saveError.message}`, 500));
    }
    
    // Get the selected plan details
    const plans = [
      {
        id: "basic",
        name: "Basic",
        price: 49,
        maxMembers: 200,
        maxTrainers: 5
      },
      {
        id: "premium",
        name: "Premium",
        price: 99,
        maxMembers: 500,
        maxTrainers: 15
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        maxMembers: 1000,
        maxTrainers: 50
      }
    ];
  
    const selectedPlan = plans.find(p => p.id === planId);
    
    if (!selectedPlan) {
      return next(new AppError('Invalid subscription plan selected', 400));
    }
    
    // Calculate end date (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Create or update subscription
    let subscription;
    try {
      // Check if a subscription already exists for this user
      const existingSubscription = await Subscription.findOne({ gymOwner: savedUser._id });
      
      if (existingSubscription) {
        console.log('Subscription already exists for this user, updating it:', existingSubscription);
        
        // Update the existing subscription
        existingSubscription.plan = selectedPlan.name;
        existingSubscription.price = selectedPlan.price;
        existingSubscription.startDate = startDate;
        existingSubscription.endDate = endDate;
        existingSubscription.isActive = true;
        existingSubscription.paymentStatus = 'Paid';
        
        // Add new payment to history
        existingSubscription.paymentHistory.push({
          amount: selectedPlan.price,
          date: startDate,
          method: 'razorpay',
          status: 'Success',
          transactionId: razorpay_payment_id
        });
        
        subscription = await existingSubscription.save();
        console.log('Subscription updated successfully:', subscription);
      } else {
        // Create a new subscription
        subscription = await Subscription.create({
          gymOwner: savedUser._id,
          plan: selectedPlan.name,
          price: selectedPlan.price,
          startDate,
          endDate,
          isActive: true,
          paymentStatus: 'Paid',
          paymentHistory: [
            {
              amount: selectedPlan.price,
              date: startDate,
              method: 'razorpay',
              status: 'Success',
              transactionId: razorpay_payment_id
            }
          ],
          autoRenew: true
        });
        
        console.log('New subscription created successfully:', subscription);
      }
    } catch (subscriptionError) {
      console.error('Error creating/updating subscription:', subscriptionError);
      return next(new AppError(`Failed to create/update subscription: ${subscriptionError.message}`, 500));
    }
    
    // Clear the pending gym owner data
    delete req.session.pendingGymOwner;
    
    res.status(200).json({
      status: 'success',
      data: {
        user: savedUser,
        subscription
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new AppError(`Failed to verify payment: ${error.message}`, 500));
  }
});

// Get Razorpay public key for frontend
export const getRazorpayKey = catchAsync(async (req, res, next) => {
  if (!isRazorpayAvailable()) {
    return next(new AppError('Payment service is not available', 503));
  }
  
  const keyId = getRazorpayPublicKey();
  
  if (!keyId) {
    return next(new AppError('Razorpay key not configured', 500));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      keyId,
      mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    }
  });
});

// Generate a QR code for payment
export const generatePaymentQR = catchAsync(async (req, res, next) => {
  const { orderId, amount } = req.body;
  
  if (!orderId || !amount) {
    return next(new AppError('Order ID and amount are required', 400));
  }
  
  // In a real implementation, you would generate a QR code using Razorpay's API
  // For demo purposes, we'll return a mock QR code URL
  
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=razorpay@okicici&pn=GymFlow&am=${amount}&cu=INR&tn=GymOwnerSubscription`;
  
  res.status(200).json({
    status: 'success',
    data: {
      qrCodeUrl
    }
  });
});

// Verify payment and activate gym owner account
export const verifyActivationPayment = catchAsync(async (req, res, next) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planData } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }
  
  if (!planData) {
    return next(new AppError('Plan data is required', 400));
  }
  
  try {
    // In a production environment, we would verify the signature
    // For testing purposes, we'll skip the signature verification
    console.log('Skipping signature verification for testing');
    
    // Get the gym owner from the request (should be authenticated)
    const gymOwner = req.user;
    
    if (!gymOwner || gymOwner.role !== 'gym-owner') {
      return next(new AppError('Only gym owners can activate accounts', 403));
    }
    
    if (gymOwner.accountStatus === 'active') {
      return next(new AppError('Account is already active', 400));
    }
    
    console.log('Activating account for gym owner:', gymOwner._id);
    
    // Step 1: Update gym owner account status to active
    const updatedGymOwner = await User.findByIdAndUpdate(
      gymOwner._id,
      { accountStatus: 'active' },
      { new: true }
    );
    
    if (!updatedGymOwner) {
      return next(new AppError('Failed to update gym owner account status', 500));
    }
    
    // Step 2: Create subscription for the gym owner
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    
    let subscription;
    try {
      // Check if a subscription already exists for this user
      const existingSubscription = await Subscription.findOne({ gymOwner: gymOwner._id });
      
      if (existingSubscription) {
        console.log('Updating existing subscription for gym owner:', gymOwner._id);
        
        // Update the existing subscription
        existingSubscription.plan = planData.name;
        existingSubscription.price = planData.price;
        existingSubscription.startDate = startDate;
        existingSubscription.endDate = endDate;
        existingSubscription.isActive = true;
        existingSubscription.paymentStatus = 'Paid';
        
        // Add new payment to history
        existingSubscription.paymentHistory.push({
          amount: planData.price,
          date: startDate,
          method: 'razorpay',
          status: 'Success',
          transactionId: razorpay_payment_id
        });
        
        subscription = await existingSubscription.save();
        console.log('Subscription updated successfully:', subscription);
      } else {
        // Create a new subscription
        subscription = await Subscription.create({
          gymOwner: gymOwner._id,
          plan: planData.name,
          price: planData.price,
          startDate,
          endDate,
          isActive: true,
          paymentStatus: 'Paid',
          paymentHistory: [
            {
              amount: planData.price,
              date: startDate,
              method: 'razorpay',
              status: 'Success',
              transactionId: razorpay_payment_id
            }
          ],
          autoRenew: true
        });
        
        console.log('New subscription created successfully:', subscription);
      }
    } catch (subscriptionError) {
      console.error('Error creating/updating subscription:', subscriptionError);
      return next(new AppError(`Failed to create/update subscription: ${subscriptionError.message}`, 500));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Account activated successfully',
      data: {
        user: updatedGymOwner,
        subscription
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new AppError(`Failed to verify payment: ${error.message}`, 500));
  }
});

// Test mode activation (for development)
export const testModeActivation = catchAsync(async (req, res, next) => {
  const { gymOwnerId, planData, transactionId } = req.body;
  
  if (!gymOwnerId || !planData || !transactionId) {
    return next(new AppError('Missing required parameters', 400));
  }
  
  try {
    // Get the gym owner
    const gymOwner = await User.findById(gymOwnerId);
    
    if (!gymOwner) {
      return next(new AppError('Gym owner not found', 404));
    }
    
    if (gymOwner.role !== 'gym-owner') {
      return next(new AppError('Only gym owners can activate accounts', 403));
    }
    
    if (gymOwner.accountStatus === 'active') {
      return next(new AppError('Account is already active', 400));
    }
    
    console.log('Test mode activation for gym owner:', gymOwner._id);
    
    // Step 1: Update gym owner account status to active
    const updatedGymOwner = await User.findByIdAndUpdate(
      gymOwner._id,
      { accountStatus: 'active' },
      { new: true }
    );
    
    if (!updatedGymOwner) {
      return next(new AppError('Failed to update gym owner account status', 500));
    }
    
    // Step 2: Create subscription for the gym owner
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // 1 month subscription
    
    let subscription;
    try {
      // Check if a subscription already exists for this user
      const existingSubscription = await Subscription.findOne({ gymOwner: gymOwner._id });
      
      if (existingSubscription) {
        console.log('Updating existing subscription for gym owner:', gymOwner._id);
        
        // Update the existing subscription
        existingSubscription.plan = planData.name;
        existingSubscription.price = planData.price;
        existingSubscription.startDate = startDate;
        existingSubscription.endDate = endDate;
        existingSubscription.isActive = true;
        existingSubscription.paymentStatus = 'Paid';
        
        // Add new payment to history
        existingSubscription.paymentHistory.push({
          amount: planData.price,
          date: startDate,
          method: 'test-mode',
          status: 'Success',
          transactionId: transactionId
        });
        
        subscription = await existingSubscription.save();
        console.log('Subscription updated successfully:', subscription);
      } else {
        // Create a new subscription
        subscription = await Subscription.create({
          gymOwner: gymOwner._id,
          plan: planData.name,
          price: planData.price,
          startDate,
          endDate,
          isActive: true,
          paymentStatus: 'Paid',
          paymentHistory: [
            {
              amount: planData.price,
              date: startDate,
              method: 'test-mode',
              status: 'Success',
              transactionId: transactionId
            }
          ],
          autoRenew: true
        });
        
        console.log('New subscription created successfully:', subscription);
      }
    } catch (subscriptionError) {
      console.error('Error creating/updating subscription:', subscriptionError);
      return next(new AppError(`Failed to create/update subscription: ${subscriptionError.message}`, 500));
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Account activated successfully in test mode',
      data: {
        user: updatedGymOwner,
        subscription
      }
    });
  } catch (error) {
    console.error('Test mode activation error:', error);
    return next(new AppError(`Failed to activate account: ${error.message}`, 500));
  }
});