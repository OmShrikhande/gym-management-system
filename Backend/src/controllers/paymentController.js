import User from '../models/userModel.js';
import Subscription from '../models/subscriptionModel.js';
import Payment from '../models/paymentModel.js';
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
  
  try {
    console.log('🔄 Creating Razorpay order...');
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
    let razorpay;
    try {
      razorpay = getRazorpayInstance();
      if (!razorpay) {
        throw new Error('Razorpay instance is null');
      }
    } catch (error) {
      console.error('Failed to get Razorpay instance:', error);
      return next(new AppError('Payment service initialization failed. Please check your Razorpay configuration.', 503));
    }
    const orderData = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt,
      notes: {
        ...notes,
        userId: req.user._id,
        userRole: req.user.role
      }
    };
    
    console.log('📝 Order data:', orderData);
    
    const order = await razorpay.orders.create(orderData);
    
    console.log('✅ Order created successfully:', order.id);
    
    res.status(200).json({
      status: 'success',
      data: {
        order
      }
    });
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    
    // Provide more specific error messages
    if (error.message.includes('authentication')) {
      return next(new AppError('Payment service authentication failed. Please contact support.', 503));
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      return next(new AppError('Payment service temporarily unavailable. Please try again.', 503));
    } else {
      return next(new AppError(`Failed to create payment order: ${error.message}`, 500));
    }
  }
});

// Verify Razorpay payment and create gym owner
export const verifyRazorpayPayment = catchAsync(async (req, res, next) => {
  console.log('🔍 Payment verification request body:', JSON.stringify(req.body, null, 2));
  console.log('🔍 Request user:', req.user ? { id: req.user._id, role: req.user.role, email: req.user.email } : 'No user');
  console.log('🔍 Request headers:', req.headers);
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }
  
  try {
    // Verify Razorpay payment signature for security
    const razorpay_secret = process.env.NODE_ENV === 'production' 
      ? process.env.RAZORPAY_LIVE_KEY_SECRET 
      : process.env.RAZORPAY_TEST_KEY_SECRET;
    
    if (!razorpay_secret) {
      return next(new AppError('Razorpay secret key not configured', 500));
    }
    
    const generated_signature = crypto.createHmac('sha256', razorpay_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
    
    if (generated_signature !== razorpay_signature) {
      console.error('Payment signature verification failed:', {
        expected: generated_signature,
        received: razorpay_signature,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
      return next(new AppError('Invalid payment signature', 400));
    }
    
    console.log('✅ Payment signature verified successfully');
    
    // Payment signature is valid, proceed with creating the gym owner
    
    // Get the gym owner data from the request body
    console.log('Payment verification request body:', JSON.stringify(req.body, null, 2));
    
    // Enhanced gym owner data validation with fallback
    let formData, planId;
    
    // For testing purposes, if no gym owner data is provided, create some default data
    if (!gymOwnerData || !gymOwnerData.formData || !gymOwnerData.planId) {
      console.log('No gym owner data in request body, checking session...');
      
      // Fallback to session if not in request body
      if (!req.session || !req.session.pendingGymOwner) {
        console.log('No gym owner data in session either, creating default data for testing');
        
        // Create default test data
        formData = {
          name: "Test Gym Owner",
          email: "testgymowner" + Date.now() + "@example.com",
          password: "password123",
          phone: "1234567890",
          gymName: "Test Gym " + Date.now(),
          role: "gym-owner"
        };
        
        planId = "basic";
        
        console.log('Created default test data:', { formData, planId });
      } else {
        console.log('Using gym owner data from session');
        try {
          const sessionData = req.session.pendingGymOwner;
          formData = sessionData.formData || {};
          planId = sessionData.planId || "basic";
        } catch (sessionError) {
          console.error('Error accessing session data:', sessionError);
          // Use default data as fallback
          formData = {
            name: "Test Gym Owner",
            email: "testgymowner" + Date.now() + "@example.com",
            password: "password123",
            phone: "1234567890",
            gymName: "Test Gym " + Date.now(),
            role: "gym-owner"
          };
          planId = "basic";
        }
      }
    } else {
      console.log('Using gym owner data from request body');
      try {
        formData = gymOwnerData.formData || {};
        planId = gymOwnerData.planId || "basic";
      } catch (destructureError) {
        console.error('Error destructuring gymOwnerData:', destructureError);
        // Use default data as fallback
        formData = {
          name: "Test Gym Owner",
          email: "testgymowner" + Date.now() + "@example.com",
          password: "password123",
          phone: "1234567890",
          gymName: "Test Gym " + Date.now(),
          role: "gym-owner"
        };
        planId = "basic";
      }
    }
    
    console.log('Gym owner form data:', formData);
    console.log('Selected plan ID:', planId);
    
    // Create the gym owner
    console.log('Creating gym owner with data:', formData);
    
    // Make sure we have all required fields with safety checks
    if (!formData || typeof formData !== 'object') {
      console.error('❌ Invalid formData structure:', formData);
      return next(new AppError('Invalid form data structure', 400));
    }
    
    if (!formData.name || !formData.email || !formData.password) {
      console.error('❌ Missing required fields:', { 
        hasName: !!formData.name, 
        hasEmail: !!formData.email, 
        hasPassword: !!formData.password 
      });
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
      console.error('❌ Invalid plan ID:', planId, 'Available plans:', plans.map(p => p.id));
      return next(new AppError('Invalid subscription plan selected', 400));
    }
    
    console.log('✅ Selected plan:', selectedPlan);
    
    // Calculate end date (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Create or update subscription
    let subscription;
    try {
      // Validate savedUser before proceeding
      if (!savedUser || !savedUser._id) {
        console.error('❌ Invalid savedUser:', savedUser);
        throw new Error('User creation failed - no valid user ID');
      }
      
      console.log('✅ Creating subscription for user:', { id: savedUser._id, email: savedUser.email });
      
      // Check if a subscription already exists for this user
      const existingSubscription = await Subscription.findOne({ gymOwner: savedUser._id });
      
      if (existingSubscription) {
        console.log('Subscription already exists for this user, updating it:', existingSubscription);
        
        // Update the existing subscription with safety checks
        existingSubscription.plan = selectedPlan.name || 'Basic';
        existingSubscription.price = selectedPlan.price || 49;
        existingSubscription.startDate = startDate;
        existingSubscription.endDate = endDate;
        existingSubscription.isActive = true;
        existingSubscription.paymentStatus = 'Paid';
        
        // Add new payment to history with safety checks
        existingSubscription.paymentHistory.push({
          amount: selectedPlan.price || 49,
          date: startDate,
          method: 'razorpay',
          status: 'Success',
          transactionId: razorpay_payment_id || 'unknown'
        });
        
        subscription = await existingSubscription.save();
        console.log('Subscription updated successfully:', subscription);
      } else {
        // Create a new subscription with safety checks
        subscription = await Subscription.create({
          gymOwner: savedUser._id,
          plan: selectedPlan.name || 'Basic',
          price: selectedPlan.price || 49,
          startDate,
          endDate,
          isActive: true,
          paymentStatus: 'Paid',
          paymentHistory: [
            {
              amount: selectedPlan.price || 49,
              date: startDate,
              method: 'razorpay',
              status: 'Success',
              transactionId: razorpay_payment_id || 'unknown'
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
    if (req.session && req.session.pendingGymOwner) {
      delete req.session.pendingGymOwner;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: savedUser,
        subscription
      }
    });
  } catch (error) {
    console.error('❌ Payment verification error in verifyRazorpayPayment:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    
    // Log the current state of variables for debugging
    try {
      console.error('❌ Debug info:', {
        hasFormData: typeof formData !== 'undefined' && formData !== null,
        formDataType: typeof formData,
        hasPlanId: typeof planId !== 'undefined' && planId !== null,
        planIdType: typeof planId,
        requestBodyKeys: Object.keys(req.body || {}),
        userExists: !!req.user
      });
    } catch (debugError) {
      console.error('❌ Error in debug logging:', debugError.message);
    }
    
    return next(new AppError(`Failed to verify payment: ${error.message}`, 500));
  }
});

// Get Razorpay public key for frontend
export const getRazorpayKey = catchAsync(async (req, res, next) => {
  console.log('🔍 Checking Razorpay availability...');
  
  // Force re-validation of credentials
  const isValid = validateRazorpayCredentials();
  if (!isValid) {
    console.error('❌ Razorpay credentials validation failed');
    return next(new AppError('Payment service configuration error', 503));
  }
  
  if (!isRazorpayAvailable()) {
    console.error('❌ Razorpay service not available');
    return next(new AppError('Payment service is not available', 503));
  }
  
  const keyId = getRazorpayPublicKey();
  
  if (!keyId) {
    console.error('❌ Failed to get Razorpay public key');
    return next(new AppError('Razorpay key not configured', 500));
  }
  
  console.log('✅ Razorpay key retrieved successfully');
  
  res.status(200).json({
    status: 'success',
    data: {
      keyId,
      mode: process.env.NODE_ENV === 'production' ? 'live' : 'test'
    }
  });
});

// Health check for Razorpay service
export const checkRazorpayHealth = catchAsync(async (req, res, next) => {
  console.log('🏥 Razorpay health check requested...');
  
  try {
    // Force re-validation
    const isValid = validateRazorpayCredentials();
    const isAvailable = isRazorpayAvailable();
    
    let instanceStatus = 'not_initialized';
    let testOrderStatus = 'not_tested';
    
    try {
      const instance = getRazorpayInstance();
      instanceStatus = 'initialized';
      
      // Try to create a test order
      const testOrder = await instance.orders.create({
        amount: 100, // 1 rupee in paise
        currency: 'INR',
        receipt: 'health_check_' + Date.now()
      });
      
      testOrderStatus = 'success';
      
      res.status(200).json({
        status: 'success',
        data: {
          credentials_valid: isValid,
          service_available: isAvailable,
          instance_status: instanceStatus,
          test_order_status: testOrderStatus,
          test_order_id: testOrder.id,
          mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
          timestamp: new Date().toISOString()
        }
      });
    } catch (instanceError) {
      console.error('❌ Razorpay instance error:', instanceError);
      
      res.status(503).json({
        status: 'error',
        data: {
          credentials_valid: isValid,
          service_available: isAvailable,
          instance_status: 'failed',
          test_order_status: 'failed',
          error: instanceError.message,
          mode: process.env.NODE_ENV === 'production' ? 'live' : 'test',
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    });
  }
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
  console.log('🔍 Payment verification request body:', JSON.stringify(req.body, null, 2));
  
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planData } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }
  
  // Enhanced planData validation with multiple fallback strategies
  let finalPlanData = planData;
  
  if (!finalPlanData) {
    console.error('❌ Plan data is missing from request body');
    console.log('Available request body keys:', Object.keys(req.body));
    
    // Strategy 1: Try to extract plan info from order notes if available
    try {
      const razorpay = getRazorpayInstance();
      if (razorpay && razorpay_order_id) {
        console.log('🔍 Attempting to fetch order details from Razorpay...');
        const orderDetails = await razorpay.orders.fetch(razorpay_order_id);
        console.log('📋 Order details from Razorpay:', orderDetails);
        
        if (orderDetails && orderDetails.notes) {
          const { planId, planName } = orderDetails.notes;
          if (planId && planName) {
            // Map plan ID to plan details
            const planMap = {
              'basic': { id: 'basic', name: 'Basic', price: 49, maxMembers: 200, maxTrainers: 5 },
              'premium': { id: 'premium', name: 'Premium', price: 99, maxMembers: 500, maxTrainers: 15 },
              'enterprise': { id: 'enterprise', name: 'Enterprise', price: 199, maxMembers: 1000, maxTrainers: 50 }
            };
            
            finalPlanData = planMap[planId] || planMap['basic'];
            console.log('✅ Extracted plan data from order notes:', finalPlanData);
          }
        }
      }
    } catch (orderFetchError) {
      console.warn('⚠️ Could not fetch order details from Razorpay:', orderFetchError.message);
    }
    
    // Strategy 2: Use default plan data as final fallback
    if (!finalPlanData) {
      finalPlanData = {
        id: "basic",
        name: "Basic",
        price: 49,
        maxMembers: 200,
        maxTrainers: 5
      };
      
      console.log('🔄 Using default plan data as final fallback:', finalPlanData);
    }
  }
  
  // Validate planData structure
  if (!finalPlanData.name || !finalPlanData.price) {
    console.error('❌ Invalid plan data structure:', finalPlanData);
    return next(new AppError('Invalid plan data structure', 400));
  }
  
  console.log('✅ Plan data validated successfully:', finalPlanData);
  
  try {
    // Verify Razorpay payment signature for security
    const razorpay_secret = process.env.NODE_ENV === 'production' 
      ? process.env.RAZORPAY_LIVE_KEY_SECRET 
      : process.env.RAZORPAY_TEST_KEY_SECRET;
    
    if (!razorpay_secret) {
      return next(new AppError('Razorpay secret key not configured', 500));
    }
    
    const generated_signature = crypto.createHmac('sha256', razorpay_secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');
    
    if (generated_signature !== razorpay_signature) {
      console.error('Payment signature verification failed:', {
        expected: generated_signature,
        received: razorpay_signature,
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
      return next(new AppError('Invalid payment signature', 400));
    }
    
    console.log('✅ Payment signature verified successfully');
    
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
        
        // Update the existing subscription with safety checks
        try {
          existingSubscription.plan = finalPlanData.name || 'Basic';
          existingSubscription.price = finalPlanData.price || 49;
          existingSubscription.startDate = startDate;
          existingSubscription.endDate = endDate;
          existingSubscription.isActive = true;
          existingSubscription.paymentStatus = 'Paid';
          
          // Add new payment to history with safety checks
          existingSubscription.paymentHistory.push({
            amount: finalPlanData.price || 49,
            date: startDate,
            method: 'razorpay',
            status: 'Success',
            transactionId: razorpay_payment_id || 'unknown'
          });
          
          console.log('📝 Updated subscription data:', {
            plan: existingSubscription.plan,
            price: existingSubscription.price,
            isActive: existingSubscription.isActive
          });
        } catch (updateError) {
          console.error('❌ Error updating subscription fields:', updateError);
          throw new Error(`Failed to update subscription: ${updateError.message}`);
        }
        
        subscription = await existingSubscription.save();
        console.log('Subscription updated successfully:', subscription);
      } else {
        // Create a new subscription with safety checks
        try {
          const subscriptionData = {
            gymOwner: gymOwner._id,
            plan: finalPlanData.name || 'Basic',
            price: finalPlanData.price || 49,
            startDate,
            endDate,
            isActive: true,
            paymentStatus: 'Paid',
            paymentHistory: [
              {
                amount: finalPlanData.price || 49,
                date: startDate,
                method: 'razorpay',
                status: 'Success',
                transactionId: razorpay_payment_id || 'unknown'
              }
            ],
            autoRenew: true
          };
          
          console.log('📝 Creating new subscription with data:', subscriptionData);
          subscription = await Subscription.create(subscriptionData);
        } catch (createError) {
          console.error('❌ Error creating new subscription:', createError);
          throw new Error(`Failed to create subscription: ${createError.message}`);
        }
        
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

// Member Payment Tracking Functions

// Record a member payment
export const recordMemberPayment = catchAsync(async (req, res, next) => {
  const {
    memberId,
    amount,
    planType,
    duration,
    paymentMethod,
    transactionId,
    notes,
    membershipStartDate,
    membershipEndDate
  } = req.body;

  // Validate required fields
  if (!memberId || !amount || !planType || !duration) {
    return next(new AppError('Missing required payment information', 400));
  }

  // Validate gym owner
  if (!req.user || req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can record member payments', 403));
  }

  try {
    // Verify member belongs to this gym owner
    const member = await User.findOne({
      _id: memberId,
      gymId: req.user._id,
      role: 'member'
    });

    if (!member) {
      return next(new AppError('Member not found or does not belong to your gym', 404));
    }

    // Calculate plan and trainer costs
    const planCosts = {
      'Basic': 500,
      'Standard': 1000,
      'Premium': 1500
    };

    const planCost = planCosts[planType] || planCosts['Basic'];
    const trainerCost = member.assignedTrainer ? 500 : 0;
    const totalAmount = (planCost + trainerCost) * parseInt(duration);

    // Validate amount matches calculation
    if (Math.abs(amount - totalAmount) > 1) { // Allow 1 rupee difference for rounding
      console.warn(`Amount mismatch: provided ${amount}, calculated ${totalAmount}`);
    }

    // Calculate membership period
    const startDate = membershipStartDate ? new Date(membershipStartDate) : new Date();
    const endDate = membershipEndDate ? new Date(membershipEndDate) : new Date(startDate);
    if (!membershipEndDate) {
      endDate.setMonth(endDate.getMonth() + parseInt(duration));
    }

    // Create payment record
    const payment = await Payment.create({
      member: memberId,
      gymOwner: req.user._id,
      amount: amount,
      planCost: planCost * parseInt(duration),
      trainerCost: trainerCost * parseInt(duration),
      planType,
      duration: parseInt(duration),
      paymentMethod: paymentMethod || 'Cash',
      transactionId,
      notes,
      assignedTrainer: member.assignedTrainer,
      membershipPeriod: {
        startDate,
        endDate
      }
    });

    // Update member's membership information
    await User.findByIdAndUpdate(memberId, {
      membershipStatus: 'Active',
      membershipStartDate: startDate,
      membershipEndDate: endDate,
      membershipDuration: duration.toString(),
      membershipType: planType,
      planType: planType
    });

    // Populate the payment with member details
    const populatedPayment = await Payment.findById(payment._id)
      .populate('member', 'name email phone')
      .populate('assignedTrainer', 'name');

    res.status(201).json({
      status: 'success',
      message: 'Payment recorded successfully',
      data: {
        payment: populatedPayment
      }
    });

  } catch (error) {
    console.error('Error recording member payment:', error);
    return next(new AppError(`Failed to record payment: ${error.message}`, 500));
  }
});

// Get member payments for a gym owner
export const getMemberPayments = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can view member payments', 403));
  }

  try {
    const {
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      planType,
      memberName,
      page = 1,
      limit = 50
    } = req.query;

    // Build filter object
    const filters = {
      gymOwner: req.user._id
    };

    // Add date filter
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    filters.paymentDate = {
      $gte: startDate,
      $lte: endDate
    };

    // Add plan type filter
    if (planType && planType !== '') {
      filters.planType = planType;
    }

    // Build aggregation pipeline
    const pipeline = [
      { $match: filters },
      {
        $lookup: {
          from: 'users',
          localField: 'member',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTrainer',
          foreignField: '_id',
          as: 'trainerDetails'
        }
      },
      {
        $unwind: '$memberDetails'
      },
      {
        $unwind: {
          path: '$trainerDetails',
          preserveNullAndEmptyArrays: true
        }
      }
    ];

    // Add member name filter if provided
    if (memberName && memberName.trim() !== '') {
      pipeline.push({
        $match: {
          'memberDetails.name': {
            $regex: memberName.trim(),
            $options: 'i'
          }
        }
      });
    }

    // Add sorting
    pipeline.push({
      $sort: { paymentDate: -1 }
    });

    // Execute aggregation
    const payments = await Payment.aggregate(pipeline);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayments = payments.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      totalAmount: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalPayments: payments.length,
      uniqueMembers: new Set(payments.map(payment => payment.member.toString())).size,
      planBreakdown: {}
    };

    // Calculate plan breakdown
    payments.forEach(payment => {
      if (!stats.planBreakdown[payment.planType]) {
        stats.planBreakdown[payment.planType] = {
          count: 0,
          amount: 0
        };
      }
      stats.planBreakdown[payment.planType].count++;
      stats.planBreakdown[payment.planType].amount += payment.amount;
    });

    res.status(200).json({
      status: 'success',
      results: paginatedPayments.length,
      totalResults: payments.length,
      data: {
        payments: paginatedPayments,
        stats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(payments.length / limit),
          hasNextPage: endIndex < payments.length,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching member payments:', error);
    return next(new AppError(`Failed to fetch payments: ${error.message}`, 500));
  }
});

// Get payment statistics for dashboard
export const getPaymentStats = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can view payment statistics', 403));
  }

  try {
    const {
      startDate,
      endDate,
      period = 'monthly'
    } = req.query;

    let dateFilter = {};
    
    if (startDate && endDate) {
      dateFilter = {
        paymentDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    } else if (period === 'monthly') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      dateFilter = {
        paymentDate: {
          $gte: firstDay,
          $lte: lastDay
        }
      };
    } else if (period === 'yearly') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), 0, 1);
      const lastDay = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      dateFilter = {
        paymentDate: {
          $gte: firstDay,
          $lte: lastDay
        }
      };
    }

    // Get revenue statistics
    const revenueStats = await Payment.getRevenueStats(req.user._id, dateFilter);

    // Get monthly breakdown for the current year
    const monthlyBreakdown = await Payment.aggregate([
      {
        $match: {
          gymOwner: req.user._id,
          paymentDate: {
            $gte: new Date(new Date().getFullYear(), 0, 1),
            $lte: new Date(new Date().getFullYear(), 11, 31, 23, 59, 59)
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$paymentDate' },
            year: { $year: '$paymentDate' }
          },
          totalRevenue: { $sum: '$amount' },
          totalPayments: { $sum: 1 },
          uniqueMembers: { $addToSet: '$member' }
        }
      },
      {
        $project: {
          month: '$_id.month',
          year: '$_id.year',
          totalRevenue: 1,
          totalPayments: 1,
          uniqueMembers: { $size: '$uniqueMembers' }
        }
      },
      {
        $sort: { '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        revenueStats: revenueStats[0] || {
          totalRevenue: 0,
          totalPayments: 0,
          uniqueMembers: 0,
          avgPaymentAmount: 0
        },
        monthlyBreakdown
      }
    });

  } catch (error) {
    console.error('Error fetching payment statistics:', error);
    return next(new AppError(`Failed to fetch payment statistics: ${error.message}`, 500));
  }
});

// Generate member payment report
export const generatePaymentReport = catchAsync(async (req, res, next) => {
  if (!req.user || req.user.role !== 'gym-owner') {
    return next(new AppError('Only gym owners can generate payment reports', 403));
  }

  try {
    const {
      month = new Date().getMonth() + 1,
      year = new Date().getFullYear(),
      format = 'json'
    } = req.query;

    // Get payments for the specified period
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const payments = await Payment.find({
      gymOwner: req.user._id,
      paymentDate: {
        $gte: startDate,
        $lte: endDate
      }
    })
    .populate('member', 'name email phone membershipType')
    .populate('assignedTrainer', 'name')
    .sort({ paymentDate: -1 });

    // Calculate summary statistics
    const summary = {
      totalRevenue: payments.reduce((sum, payment) => sum + payment.amount, 0),
      totalPayments: payments.length,
      uniqueMembers: new Set(payments.map(payment => payment.member._id.toString())).size,
      planBreakdown: {},
      paymentMethodBreakdown: {}
    };

    // Calculate breakdowns
    payments.forEach(payment => {
      // Plan breakdown
      if (!summary.planBreakdown[payment.planType]) {
        summary.planBreakdown[payment.planType] = { count: 0, amount: 0 };
      }
      summary.planBreakdown[payment.planType].count++;
      summary.planBreakdown[payment.planType].amount += payment.amount;

      // Payment method breakdown
      if (!summary.paymentMethodBreakdown[payment.paymentMethod]) {
        summary.paymentMethodBreakdown[payment.paymentMethod] = { count: 0, amount: 0 };
      }
      summary.paymentMethodBreakdown[payment.paymentMethod].count++;
      summary.paymentMethodBreakdown[payment.paymentMethod].amount += payment.amount;
    });

    const reportData = {
      period: {
        month: parseInt(month),
        year: parseInt(year),
        monthName: new Date(year, month - 1).toLocaleString('default', { month: 'long' })
      },
      summary,
      payments: payments.map(payment => ({
        id: payment._id,
        paymentId: payment.paymentId,
        memberName: payment.member.name,
        memberEmail: payment.member.email,
        memberPhone: payment.member.phone,
        amount: payment.amount,
        planType: payment.planType,
        duration: payment.duration,
        paymentDate: payment.paymentDate,
        paymentMethod: payment.paymentMethod,
        transactionId: payment.transactionId,
        referenceId: payment.referenceId,
        trainerName: payment.assignedTrainer?.name || 'No Trainer'
      }))
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvHeader = 'Payment ID,Member Name,Member Email,Amount,Plan Type,Duration,Payment Date,Payment Method,Transaction ID,Trainer\n';
      const csvRows = reportData.payments.map(payment => 
        `${payment.paymentId},${payment.memberName},${payment.memberEmail},${payment.amount},${payment.planType},${payment.duration},${payment.paymentDate.toISOString().split('T')[0]},${payment.paymentMethod},${payment.transactionId || ''},${payment.trainerName}`
      ).join('\n');
      
      const csvContent = csvHeader + csvRows;
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payment-report-${year}-${month}.csv"`);
      return res.send(csvContent);
    }

    res.status(200).json({
      status: 'success',
      data: reportData
    });

  } catch (error) {
    console.error('Error generating payment report:', error);
    return next(new AppError(`Failed to generate payment report: ${error.message}`, 500));
  }
});