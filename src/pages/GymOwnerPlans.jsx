import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, CreditCard, TrendingUp, Calendar, FileText, Edit, Download, CheckCircle, AlertTriangle, Trash2, X, Save } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  getRazorpayKeyWithValidation, 
  loadRazorpayScript, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  initializeRazorpayCheckout 
} from "@/utils/razorpayUtils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigate } from "react-router-dom";

const GymOwnerPlans = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCompletionButton, setShowCompletionButton] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlanDialog, setShowPlanDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planFormData, setPlanFormData] = useState({
    name: '',
    price: '',
    duration: 'monthly',
    maxMembers: '',
    maxTrainers: '',
    features: '',
    status: 'Active',
    recommended: false
  });
  
  const { 
    user, 
    authFetch, 
    subscription, 
    checkSubscriptionStatus,
    isSuperAdmin,
    isGymOwner
  } = useAuth();
  
  // Redirect super admins to their specific plans page
  if (isSuperAdmin && !isGymOwner) {
    return <Navigate to="/billing-plans" replace />;
  }
  
  // Fetch subscription data when component mounts
  useEffect(() => {
    if (user && isGymOwner) {
      checkSubscriptionStatus(user._id);
    }
    
    fetchGymOwnerPlans();
    
    // Check for pending payment completion
    const pendingPayment = localStorage.getItem('pendingActivation');
    if (pendingPayment) {
      console.log('🔍 Found pending payment, showing completion button');
      setShowCompletionButton(true);
    }
  }, [user, checkSubscriptionStatus, isGymOwner]);
  
  // Fetch gym owner plans from API
  const fetchGymOwnerPlans = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/gym-owner-plans/default');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data.plans);
      } else {
        // If API fails, use default gym owner subscription plans
        setPlans([
          {
            id: "basic",
            name: "Basic",
            price: 49,
            duration: "monthly",
            maxMembers: 200,
            maxTrainers: 5,
            features: ["Member Management", "Basic Reports", "Email Support", "Attendance Tracking"],
            status: "Active"
          },
          {
            id: "premium",
            name: "Premium",
            price: 99,
            duration: "monthly",
            maxMembers: 500,
            maxTrainers: 15,
            features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support", "Workout Plans"],
            status: "Active",
            recommended: true
          },
          {
            id: "enterprise",
            name: "Enterprise",
            price: 199,
            duration: "monthly",
            maxMembers: 1000,
            maxTrainers: 50,
            features: ["All Premium Features", "Multi-location Support", "Advanced Analytics", "24/7 Support", "Custom Branding"],
            status: "Active"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching gym owner plans:', error);
      toast.error('Failed to load gym owner plans');
      
      // Use default gym owner subscription plans if API fails
      setPlans([
        {
          id: "basic",
          name: "Basic",
          price: 49,
          duration: "monthly",
          maxMembers: 200,
          maxTrainers: 5,
          features: ["Member Management", "Basic Reports", "Email Support", "Attendance Tracking"],
          status: "Active"
        },
        {
          id: "premium",
          name: "Premium",
          price: 99,
          duration: "monthly",
          maxMembers: 500,
          maxTrainers: 15,
          features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support", "Workout Plans"],
          status: "Active",
          recommended: true
        },
        {
          id: "enterprise",
          name: "Enterprise",
          price: 199,
          duration: "monthly",
          maxMembers: 1000,
          maxTrainers: 50,
          features: ["All Premium Features", "Multi-location Support", "Advanced Analytics", "24/7 Support", "Custom Branding"],
          status: "Active"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle plan form input changes
  const handlePlanFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlanFormData({
      ...planFormData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  // Handle features input (comma-separated string to array)
  const handleFeaturesChange = (value) => {
    setPlanFormData({
      ...planFormData,
      features: value
    });
  };
  
  // Open dialog for creating a new plan
  const handleCreatePlan = () => {
    setEditingPlan(null);
    setPlanFormData({
      name: '',
      price: '',
      duration: 'monthly',
      maxMembers: '',
      maxTrainers: '',
      features: '',
      status: 'Active',
      recommended: false
    });
    setShowPlanDialog(true);
  };
  
  // Open dialog for editing an existing plan
  const handleEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration || 'monthly',
      maxMembers: plan.maxMembers,
      maxTrainers: plan.maxTrainers,
      features: Array.isArray(plan.features) ? plan.features.join(', ') : plan.features,
      status: plan.status || 'Active',
      recommended: plan.recommended || false
    });
    setShowPlanDialog(true);
  };
  
  // Save plan (create or update)
  const handleSavePlan = async () => {
    // Validate form data
    if (!planFormData.name || !planFormData.price || !planFormData.maxMembers || !planFormData.maxTrainers) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Convert features from string to array
      const featuresArray = planFormData.features
        .split(',')
        .map(feature => feature.trim())
        .filter(feature => feature.length > 0);
      
      const planData = {
        ...planFormData,
        price: Number(planFormData.price),
        maxMembers: Number(planFormData.maxMembers),
        maxTrainers: Number(planFormData.maxTrainers),
        features: featuresArray,
        gymOwnerId: user._id // Associate plan with gym owner
      };
      
      let response;
      
      if (editingPlan) {
        // Update existing plan
        response = await authFetch(`/gym-owner-plans/${editingPlan._id || editingPlan.id}`, {
          method: 'PATCH',
          body: JSON.stringify(planData)
        });
      } else {
        // Create new plan
        response = await authFetch('/gym-owner-plans', {
          method: 'POST',
          body: JSON.stringify(planData)
        });
      }
      
      if (response.success || response.status === 'success') {
        toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowPlanDialog(false);
        fetchGymOwnerPlans(); // Refresh plans list
      } else {
        toast.error(response.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('An error occurred while saving the plan');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Delete a plan
  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan? This action cannot be undone.')) {
      return;
    }
    
    try {
      const response = await authFetch(`/gym-owner-plans/${planId}`, {
        method: 'DELETE'
      });
      
      if (response.success || response.status === 'success' || response.status === 204) {
        toast.success('Plan deleted successfully');
        fetchGymOwnerPlans(); // Refresh plans list
      } else {
        toast.error(response.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('An error occurred while deleting the plan');
    }
  };
  
  // Handle member subscription
  const handleMemberSubscription = async (memberId, planId) => {
    setIsProcessing(true);
    
    try {
      const response = await authFetch('/member-subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          memberId,
          planId,
          gymOwnerId: user._id,
          startDate: new Date().toISOString(),
          paymentStatus: 'Paid'
        })
      });
      
      if (response.success || response.status === 'success') {
        toast.success('Member subscription added successfully');
      } else {
        toast.error(response.message || 'Failed to add member subscription');
      }
    } catch (error) {
      console.error('Error adding member subscription:', error);
      toast.error('An error occurred while adding the member subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle test mode renewal (skip payment)
  const handleTestModeRenewal = async () => {
    try {
      setIsProcessing(true);
      
      // Generate a mock transaction ID
      const mockTransactionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      // Call the renew endpoint directly with test payment data
      const renewResponse = await authFetch(`/subscriptions/${currentSubscription._id}/renew`, {
        method: 'POST',
        body: JSON.stringify({
          durationMonths: 1,
          paymentMethod: 'test_mode',
          transactionId: mockTransactionId
        })
      });
      
      if (renewResponse.success || renewResponse.status === 'success') {
        toast.success('Subscription renewed successfully in test mode!');
        // Refresh subscription status
        await checkSubscriptionStatus(user._id, null, true);
      } else {
        toast.error(renewResponse.message || 'Failed to renew subscription');
      }
    } catch (error) {
      console.error('Error renewing subscription in test mode:', error);
      toast.error('Failed to renew subscription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle subscription renewal with Razorpay
  const handleRenewSubscription = async () => {
    try {
      setIsProcessing(true);
      
      // Step 1: Create a Razorpay order
      const orderResponse = await authFetch(`/payments/razorpay/create-order`, {
        method: 'POST',
        body: JSON.stringify({
          amount: currentSubscription.price,
          currency: 'INR',
          receipt: `renewal_${Date.now()}`,
          notes: {
            subscriptionId: currentSubscription._id,
            gymOwnerId: user._id,
            plan: currentSubscription.plan
          }
        })
      });
      
      console.log('Order response:', orderResponse);
      
      if (!orderResponse || (!orderResponse.success && orderResponse.status !== 'success')) {
        toast.error('Failed to create payment order');
        setIsProcessing(false);
        return;
      }
      
      const order = orderResponse.data?.order;
      if (!order) {
        toast.error('Invalid order response');
        setIsProcessing(false);
        return;
      }
      
      // Step 2: Load Razorpay script
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            resolve(false);
          };
          document.body.appendChild(script);
        });
      };
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay checkout');
        setIsProcessing(false);
        return;
      }
      
      // Step 3: Get Razorpay key dynamically
      const razorpayKey = await getRazorpayKeyWithValidation(authFetch);
      if (!razorpayKey) {
        toast.error('Failed to get payment configuration');
        setIsProcessing(false);
        return;
      }
      
      // Step 4: Open Razorpay checkout
      const options = {
        key: razorpayKey, // Dynamic key based on environment
        amount: order.amount,
        currency: order.currency,
        name: 'GymFlow',
        description: `Subscription Renewal - ${currentSubscription.plan}`,
        order_id: order.id,
        handler: async function(response) {
          try {
            // Step 4: Verify payment and renew subscription
            const renewResponse = await authFetch(`/subscriptions/${currentSubscription._id}/renew`, {
              method: 'POST',
              body: JSON.stringify({
                durationMonths: 1,
                paymentMethod: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            
            if (renewResponse.success || renewResponse.status === 'success') {
              toast.success('Subscription renewed successfully!');
              // Refresh subscription status
              await checkSubscriptionStatus(user._id, null, true);
            } else {
              toast.error(renewResponse.message || 'Failed to renew subscription');
            }
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast.error('Failed to verify payment');
          } finally {
            setIsProcessing(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#3B82F6'
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (error) {
      console.error('Error renewing subscription:', error);
      toast.error('Failed to renew subscription');
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'default',
      'Paid': 'default',
      'Pending': 'secondary',
      'Overdue': 'destructive',
      'Inactive': 'outline'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  // Handle manual completion of registration after payment
  const handleCompleteRegistration = async () => {
    try {
      setIsProcessing(true);
      
      // Get stored payment details
      const storedPaymentDetails = localStorage.getItem('pendingActivation');
      if (!storedPaymentDetails) {
        toast.error('No pending payment found. Please try again.');
        return;
      }
      
      const paymentDetails = JSON.parse(storedPaymentDetails);
      console.log('🔍 Completing registration with payment details:', paymentDetails);
      
      // Send activation request
      const activationResponse = await authFetch(`/payments/razorpay/verify-activation`, {
        method: 'POST',
        body: JSON.stringify(paymentDetails)
      });
      
      console.log('🔍 Activation response:', activationResponse);
      
      if (activationResponse.success || activationResponse.status === 'success') {
        toast.success('Registration completed successfully! Welcome to GymFlow!');
        
        // Clear stored payment details
        localStorage.removeItem('pendingActivation');
        setShowCompletionButton(false);
        
        // Refresh the page to update user status
        window.location.reload();
      } else {
        console.error('❌ Registration completion failed:', activationResponse);
        toast.error(`Registration failed: ${activationResponse.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error completing registration:', error);
      toast.error(`Failed to complete registration: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle account activation by purchasing a plan
  const handleActivateAccount = async (plan) => {
    // Validate plan data
    if (!plan || !plan.id || !plan.name || !plan.price) {
      console.error('❌ Invalid plan data:', plan);
      toast.error('Invalid plan data. Please try again.');
      return;
    }
    
    console.log('🚀 Starting account activation for plan:', plan);
    
    try {
      setIsProcessing(true);
      
      // Step 1: Create a Razorpay order
      const orderResponse = await authFetch(`/payments/razorpay/create-order`, {
        method: 'POST',
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          receipt: `activation_${Date.now()}`,
          notes: {
            planId: plan.id,
            gymOwnerId: user._id,
            planName: plan.name,
            isActivation: true
          }
        })
      });
      
      console.log('Activation order response:', orderResponse);
      
      if (!orderResponse || (!orderResponse.success && orderResponse.status !== 'success')) {
        toast.error('Failed to create payment order');
        setIsProcessing(false);
        return;
      }
      
      const order = orderResponse.data?.order;
      if (!order) {
        toast.error('Invalid order response');
        setIsProcessing(false);
        return;
      }
      
      // Step 2: Load Razorpay script
      const loadRazorpayScript = () => {
        return new Promise((resolve) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => {
            resolve(true);
          };
          script.onerror = () => {
            resolve(false);
          };
          document.body.appendChild(script);
        });
      };
      
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        toast.error('Failed to load Razorpay checkout');
        setIsProcessing(false);
        return;
      }
      
      // Step 3: Get Razorpay key dynamically
      const razorpayKey = await getRazorpayKeyWithValidation(authFetch);
      if (!razorpayKey) {
        toast.error('Failed to get payment configuration');
        setIsProcessing(false);
        return;
      }
      
      // Step 4: Open Razorpay checkout
      const options = {
        key: razorpayKey, // Dynamic key based on environment
        amount: order.amount,
        currency: order.currency,
        name: 'GymFlow',
        description: `Account Activation - ${plan.name}`,
        order_id: order.id,
        handler: function(response) {
          // Payment successful! Store the payment details for manual completion
          console.log('✅ Payment successful:', response);
          
          // Store payment details in localStorage for manual completion
          const paymentDetails = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            planData: {
              id: plan.id,
              name: plan.name,
              price: plan.price,
              maxMembers: plan.maxMembers,
              maxTrainers: plan.maxTrainers
            },
            timestamp: new Date().toISOString()
          };
          
          localStorage.setItem('pendingActivation', JSON.stringify(paymentDetails));
          
          // Show success message and completion button
          toast.success('Payment successful! Please complete your registration.');
          setIsProcessing(false);
          
          // Set a flag to show the completion button
          setShowCompletionButton(true);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          gymOwnerId: user._id,
          planId: plan.id,
          isActivation: true
        },
        theme: {
          color: '#3B82F6'
        }
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function(response) {
        toast.error('Payment failed: ' + response.error.description);
        setIsProcessing(false);
      });
      
      razorpay.open();
    } catch (error) {
      console.error('Error during account activation:', error);
      toast.error('An error occurred during account activation');
      setIsProcessing(false);
    }
  };

  // Handle test mode activation (for development)
  const handleTestModeActivation = async (plan) => {
    try {
      setIsProcessing(true);
      
      // Create a mock transaction for testing
      const mockTransactionId = `mock_${Date.now()}`;
      
      const activationResponse = await authFetch(`/payments/test-activation`, {
        method: 'POST',
        body: JSON.stringify({
          gymOwnerId: user._id,
          planData: {
            id: plan.id,
            name: plan.name,
            price: plan.price,
            maxMembers: plan.maxMembers,
            maxTrainers: plan.maxTrainers
          },
          transactionId: mockTransactionId
        })
      });
      
      if (activationResponse.success || activationResponse.status === 'success') {
        toast.success('Account activated successfully in test mode!');
        
        // Update user in context (they should now be active)
        if (activationResponse.data?.user) {
          // Update user object with new account status
          const updatedUser = { ...user, accountStatus: 'active' };
          // You might need to call a function to update the user in context
          // This depends on your AuthContext implementation
          window.location.reload(); // Temporary solution to refresh the page
        }
        
        // Refresh subscription status
        await checkSubscriptionStatus(user._id, null, true);
      } else {
        toast.error(activationResponse.message || 'Account activation failed');
      }
    } catch (error) {
      console.error('Error activating account in test mode:', error);
      toast.error('Failed to activate account');
    } finally {
      setIsProcessing(false);
    }
  };

  // Get current subscription info
  const currentSubscription = subscription?.subscription;
  const hasActiveSubscription = subscription?.hasActiveSubscription;
  const daysRemaining = subscription?.daysRemaining || 0;

  // Mock data for member subscriptions
  const memberSubscriptions = [
    {
      id: 1,
      invoiceNumber: "MEM-2024-001",
      memberName: "John Smith",
      planName: "Premium Member",
      amount: 39,
      status: "Paid",
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    },
    {
      id: 2,
      invoiceNumber: "MEM-2024-002",
      memberName: "Sarah Johnson",
      planName: "Basic Member",
      amount: 19,
      status: "Pending",
      startDate: "2024-01-15",
      endDate: "2024-02-15"
    },
    {
      id: 3,
      invoiceNumber: "MEM-2024-003",
      memberName: "Michael Brown",
      planName: "Elite Member",
      amount: 79,
      status: "Overdue",
      startDate: "2023-12-01",
      endDate: "2023-12-31"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Pending Payment Notification */}
        {showCompletionButton && (
          <Card className="bg-blue-900/50 border-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-100">Payment Successful!</h3>
                  <p className="text-blue-200">Your payment has been processed. Click "Complete Registration" on any plan to activate your account.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {user?.accountStatus === 'inactive' ? 'Activate Your Account' : 'Subscription Plans'}
            </h1>
            <p className="text-gray-400">
              {user?.accountStatus === 'inactive' 
                ? 'Choose a subscription plan to activate your gym owner account'
                : 'Manage your gym subscription and billing'
              }
            </p>
          </div>
          {user?.accountStatus === 'active' && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleCreatePlan}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Plan
            </Button>
          )}
        </div>

        {/* Account Activation Section for Inactive Gym Owners */}
        {isGymOwner && user?.accountStatus === 'inactive' && (
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />
                Account Activation Required
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your gym owner account is currently inactive. Please complete your first subscription payment to activate your account and access all features.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-white">
                  <p className="mb-2">✨ Complete your account activation by:</p>
                  <ul className="list-disc list-inside text-gray-300 space-y-1">
                    <li>Choosing a subscription plan below</li>
                    <li>Completing the payment process</li>
                    <li>Gaining full access to your gym management dashboard</li>
                  </ul>
                </div>
                
                <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
                  <p className="text-blue-300 font-medium mb-2">🎯 What you'll get after activation:</p>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Full access to member management system</li>
                    <li>• Trainer management and assignment features</li>
                    <li>• Workout and diet plan management</li>
                    <li>• QR code generation for member check-ins</li>
                    <li>• Detailed reports and analytics</li>
                  </ul>
                </div>
                
                <div className="text-center">
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                    onClick={() => {
                      const plansSection = document.getElementById('subscription-plans');
                      if (plansSection) {
                        plansSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                  >
                    <CreditCard className="h-5 w-5 mr-2" />
                    Choose Your Plan & Activate Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Status */}
        {isGymOwner && currentSubscription && user?.accountStatus === 'active' && (
          <Card className={`${hasActiveSubscription ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                {hasActiveSubscription ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
                    Active Gym Subscription
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />
                    Gym Subscription Expired
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {hasActiveSubscription ? (
                  <>
                    Your {currentSubscription.plan} plan is active until {new Date(currentSubscription.endDate).toLocaleDateString()}.
                    {daysRemaining <= 5 && (
                      <span className="text-yellow-400 ml-1">
                        ({daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining)
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Your {currentSubscription.plan} plan expired on {new Date(currentSubscription.endDate).toLocaleDateString()}.
                    Please renew to regain access to all features.
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-3">
                <div className="flex justify-end space-x-3">
                  {!hasActiveSubscription && (
                    <>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleRenewSubscription}
                        disabled={isProcessing}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Renew Subscription'}
                      </Button>
                    </>
                  )}
                  {hasActiveSubscription && daysRemaining <= 5 && (
                    <>
                      <Button 
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleRenewSubscription}
                        disabled={isProcessing}
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        {isProcessing ? 'Processing...' : 'Extend Subscription'}
                      </Button>
                    </>
                  )}
                </div>
                <div className="text-xs text-green-500/70 text-right italic">
                  🔒 Secure Payment Gateway • SSL Encrypted
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        {user?.accountStatus === 'active' && (
          <div className="flex space-x-4 border-b border-gray-700">
            <button
              onClick={() => setActiveTab("plans")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "plans" 
                  ? "text-blue-400 border-b-2 border-blue-400" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Member Plans
            </button>
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`pb-4 px-2 font-medium transition-colors ${
                activeTab === "subscriptions" 
                  ? "text-blue-400 border-b-2 border-blue-400" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Member Subscriptions
            </button>
          </div>
        )}

        {/* Plans Tab */}
        {(activeTab === "plans" || user?.accountStatus === 'inactive') && (
          <Card id="subscription-plans" className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">
                {user?.accountStatus === 'inactive' ? 'Choose Your Subscription Plan' : 'Available Subscription Plans'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {user?.accountStatus === 'inactive' 
                  ? 'Select a plan to activate your gym owner account and start managing your gym'
                  : 'Manage your gym subscription and billing'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`bg-gray-700/50 border-gray-600 relative ${
                      plan.recommended ? 'border-blue-500' : ''
                    }`}
                  >
                    {plan.recommended && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl-md">
                        Recommended
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-white">{plan.name}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {plan.duration === 'monthly' ? 'Monthly' : 'Annual'} Plan
                      </CardDescription>
                      <div className="text-2xl font-bold text-white mt-2">
                        ₹{plan.price}<span className="text-sm font-normal text-gray-400">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center text-gray-300">
                          <span className="font-medium">Max Members:</span>
                          <span className="ml-auto">{plan.maxMembers}</span>
                        </div>
                        <div className="flex items-center text-gray-300">
                          <span className="font-medium">Max Trainers:</span>
                          <span className="ml-auto">{plan.maxTrainers}</span>
                        </div>
                        <div className="border-t border-gray-600 my-3"></div>
                        <div className="text-gray-300 font-medium">Features:</div>
                        <ul className="space-y-1 text-gray-400 text-sm">
                          {Array.isArray(plan.features) ? (
                            plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <CheckCircle className="h-4 w-4 text-green-400 mr-2 mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))
                          ) : (
                            <li>No features listed</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t border-gray-600 pt-4">
                      {user?.accountStatus === 'inactive' ? (
                        // Show activation buttons for inactive accounts
                        <div className="flex flex-col w-full space-y-2">
                          {showCompletionButton ? (
                            // Show completion button if payment is pending
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={handleCompleteRegistration}
                              disabled={isProcessing}
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {isProcessing ? 'Completing...' : 'Complete Registration'}
                            </Button>
                          ) : (
                            // Show normal activation button
                            <Button 
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleActivateAccount(plan)}
                              disabled={isProcessing}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {isProcessing ? 'Processing...' : 'Activate Account'}
                            </Button>
                          )}

                        </div>
                      ) : (
                        // Show normal plan management buttons for active accounts
                        <>
                          <Button 
                            variant="outline" 
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleDeletePlan(plan._id || plan.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && user?.accountStatus === 'active' && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-white">Member Subscriptions</CardTitle>
                  <CardDescription className="text-gray-400">
                    Manage your gym members' subscriptions
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search subscriptions..."
                    className="pl-8 bg-gray-700/50 border-gray-600 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-700">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-700/50 hover:bg-gray-700/70">
                      <TableHead className="text-gray-300">Invoice</TableHead>
                      <TableHead className="text-gray-300">Member</TableHead>
                      <TableHead className="text-gray-300">Plan</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Date</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberSubscriptions
                      .filter(sub => 
                        sub.memberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sub.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        sub.planName.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((subscription) => (
                        <TableRow key={subscription.id} className="hover:bg-gray-700/30">
                          <TableCell className="font-medium text-gray-300">
                            {subscription.invoiceNumber}
                          </TableCell>
                          <TableCell className="text-gray-300">{subscription.memberName}</TableCell>
                          <TableCell className="text-gray-300">{subscription.planName}</TableCell>
                          <TableCell className="text-gray-300">${subscription.amount}</TableCell>
                          <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                          <TableCell className="text-gray-300">
                            {new Date(subscription.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-white"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Dialog */}
        <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
          <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingPlan ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription className="text-gray-400">
                {editingPlan ? 'Update the details of this plan.' : 'Add a new subscription plan for your members.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={planFormData.name}
                  onChange={handlePlanFormChange}
                  className="col-span-3 bg-gray-700 border-gray-600"
                  placeholder="e.g. Basic Plan"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">
                  Price ($)
                </Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={planFormData.price}
                  onChange={handlePlanFormChange}
                  className="col-span-3 bg-gray-700 border-gray-600"
                  placeholder="e.g. 19.99"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <Select 
                  name="duration" 
                  value={planFormData.duration}
                  onValueChange={(value) => handlePlanFormChange({target: {name: 'duration', value}})}
                >
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxMembers" className="text-right">
                  Max Members
                </Label>
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  value={planFormData.maxMembers}
                  onChange={handlePlanFormChange}
                  className="col-span-3 bg-gray-700 border-gray-600"
                  placeholder="e.g. 50"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="maxTrainers" className="text-right">
                  Max Trainers
                </Label>
                <Input
                  id="maxTrainers"
                  name="maxTrainers"
                  type="number"
                  value={planFormData.maxTrainers}
                  onChange={handlePlanFormChange}
                  className="col-span-3 bg-gray-700 border-gray-600"
                  placeholder="e.g. 5"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="features" className="text-right pt-2">
                  Features
                </Label>
                <Textarea
                  id="features"
                  name="features"
                  value={planFormData.features}
                  onChange={(e) => handleFeaturesChange(e.target.value)}
                  className="col-span-3 bg-gray-700 border-gray-600 min-h-[100px]"
                  placeholder="Enter features separated by commas"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select 
                  name="status" 
                  value={planFormData.status}
                  onValueChange={(value) => handlePlanFormChange({target: {name: 'status', value}})}
                >
                  <SelectTrigger className="col-span-3 bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recommended" className="text-right">
                  Recommended
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="recommended"
                    name="recommended"
                    checked={planFormData.recommended}
                    onCheckedChange={(checked) => 
                      handlePlanFormChange({target: {name: 'recommended', type: 'checkbox', checked}})
                    }
                  />
                  <Label htmlFor="recommended" className="text-gray-400">
                    Mark as recommended plan
                  </Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={() => setShowPlanDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSavePlan}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  'Saving...'
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default GymOwnerPlans;