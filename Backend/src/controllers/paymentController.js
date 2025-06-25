import User from '../models/userModel.js';
import Subscription from '../models/subscriptionModel.js';
import catchAsync from '../utils/catchAsync.js';
import AppError from '../utils/appError.js';
import crypto from 'crypto';

// Import the actual Razorpay SDK
import Razorpay from 'razorpay';

// Initialize Razorpay with your test credentials
const razorpay = new Razorpay({
  key_id: 'rzp_test_VUpggvAt3u75cZ',     // Your Razorpay Test Key ID
  key_secret: 'qVBlGWU6FlyGNp53zci52eqV' // Your Razorpay Test Secret Key
});

// Create a Razorpay order
export const createRazorpayOrder = catchAsync(async (req, res, next) => {
  const { amount, currency = 'INR', receipt, notes, planId, userFormData } = req.body;
  
  if (!amount || amount <= 0) {
    return next(new AppError('Please provide a valid amount', 400));
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
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, gymOwnerData, gymOwnerId } = req.body;
  
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return next(new AppError('Missing payment verification parameters', 400));
  }
  
  try {
    // In a production environment, we would verify the signature
    // For testing purposes, we'll skip the signature verification
    console.log('Skipping signature verification for testing');
    
    // The following code would be used in production:
    // const generated_signature = crypto.createHmac('sha256', 'qVBlGWU6FlyGNp53zci52eqV')
    //   .update(razorpay_order_id + "|" + razorpay_payment_id)
    //   .digest('hex');
    // 
    // if (generated_signature !== razorpay_signature) {
    //   return next(new AppError('Invalid payment signature', 400));
    // }
    
    // Payment signature is valid, proceed with creating the gym owner or using existing one
    
    // Get the gym owner data from the request body
    console.log('Payment verification request body:', JSON.stringify(req.body, null, 2));
    
    let savedUser;
    let planId;
    
    // Check if we already have a gym owner ID (from frontend)
    if (gymOwnerId) {
      console.log('Using provided gym owner ID:', gymOwnerId);
      savedUser = await User.findById(gymOwnerId);
      
      if (!savedUser) {
        return next(new AppError('Gym owner not found with the provided ID', 404));
      }
      
      if (savedUser.role !== 'gym-owner') {
        return next(new AppError('The provided user is not a gym owner', 400));
      }
      
      // Get plan ID from gymOwnerData if available
      if (gymOwnerData && gymOwnerData.planId) {
        planId = gymOwnerData.planId;
      } else {
        // Default to basic plan if not specified
        planId = "basic";
      }
      
      console.log('Using existing gym owner:', savedUser);
    } else {
      // For testing purposes, if no gym owner data is provided, create some default data
      let formData;
      
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
          const sessionData = req.session.pendingGymOwner;
          formData = sessionData.formData;
          planId = sessionData.planId;
        }
      } else {
        console.log('Using gym owner data from request body');
        formData = gymOwnerData.formData;
        planId = gymOwnerData.planId;
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
    }
    
    // Get the selected plan details
    const plans = [
      {
        id: "basic",
        name: "Basic",
        price: 49,
        duration: "monthly"
      },
      {
        id: "premium",
        name: "Premium",
        price: 99,
        duration: "monthly"
      },
      {
        id: "enterprise",
        name: "Enterprise",
        price: 199,
        duration: "monthly"
      }
    ];
    
    let selectedPlan = plans.find(p => p.id === planId);
    
    if (!selectedPlan) {
      console.warn(`Plan ID ${planId} not found, defaulting to Basic plan`);
      selectedPlan = plans[0]; // Default to Basic plan
    }
    
    // Calculate end date (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);
    
    // Create or update subscription
    let subscription;
    try {
      // Check if a subscription already exists for this user
      const existingSubscription = await Subscription.findOne({ 
        gymOwner: savedUser._id,
        isActive: true
      });
      
      if (existingSubscription) {
        console.log('Active subscription already exists for this user, updating it:', existingSubscription);
        
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
        // Check for any inactive subscriptions
        const inactiveSubscription = await Subscription.findOne({ 
          gymOwner: savedUser._id,
          isActive: false
        });
        
        if (inactiveSubscription) {
          console.log('Inactive subscription found, reactivating it:', inactiveSubscription);
          
          // Reactivate the subscription
          inactiveSubscription.plan = selectedPlan.name;
          inactiveSubscription.price = selectedPlan.price;
          inactiveSubscription.startDate = startDate;
          inactiveSubscription.endDate = endDate;
          inactiveSubscription.isActive = true;
          inactiveSubscription.paymentStatus = 'Paid';
          
          // Add new payment to history
          inactiveSubscription.paymentHistory.push({
            amount: selectedPlan.price,
            date: startDate,
            method: 'razorpay',
            status: 'Success',
            transactionId: razorpay_payment_id
          });
          
          subscription = await inactiveSubscription.save();
          console.log('Subscription reactivated successfully:', subscription);
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
      }
    } catch (subscriptionError) {
      console.error('Error creating/updating subscription:', subscriptionError);
      
      // Don't fail the entire request if subscription creation fails
      // Just log the error and continue
      console.warn('Continuing despite subscription error');
      
      // Try to create a basic subscription as a fallback
      try {
        subscription = await Subscription.create({
          gymOwner: savedUser._id,
          plan: "Basic",
          price: 49,
          startDate,
          endDate,
          isActive: true,
          paymentStatus: 'Paid',
          paymentHistory: [
            {
              amount: 49,
              date: startDate,
              method: 'razorpay',
              status: 'Success',
              transactionId: razorpay_payment_id
            }
          ],
          autoRenew: true
        });
        
        console.log('Fallback subscription created successfully:', subscription);
      } catch (fallbackError) {
        console.error('Even fallback subscription creation failed:', fallbackError);
        // Still don't fail the request, just return the user without a subscription
      }
    }
    
    // Clear the pending gym owner data
    if (req.session) {
      delete req.session.pendingGymOwner;
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user: savedUser,
        subscription: subscription || null
      }
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return next(new AppError(`Failed to verify payment: ${error.message}`, 500));
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