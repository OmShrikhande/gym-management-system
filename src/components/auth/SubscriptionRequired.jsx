import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, AlertTriangle, Calendar, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { 
  getRazorpayKeyWithValidation, 
  loadRazorpayScript, 
  createRazorpayOrder, 
  verifyRazorpayPayment,
  initializeRazorpayCheckout 
} from "@/utils/razorpayUtils";

// API URL
// API URL - Use environment variable or fallback to production
const API_URL = import.meta.env.VITE_API_URL || 'https://gym-management-system-ckb0.onrender.com/api';

const SubscriptionRequired = () => {
  const { user, subscription, logout, authFetch, checkSubscriptionStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  // Fetch plans from API (created by super admin)
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/subscription-plans');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data.plans || []);
      } else {
        console.error('Failed to fetch plans:', response.message);
        // Use default plans as fallback
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
      console.error('Error fetching plans:', error);
      // Use default plans as fallback
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

  // Fetch plans when component mounts
  useEffect(() => {
    fetchPlans();
  }, []);

  // Handle plan selection
  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    // Scroll to payment section
    document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle test mode payment (skip payment)
  const handleTestModePayment = async () => {
    if (!user || !selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Determine if this is a new subscription or renewal
      const isRenewal = subscription?.subscription?._id;
      
      // Generate a mock transaction ID
      const mockTransactionId = `test_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      let endpoint, method, body;
      
      if (isRenewal) {
        // Renew existing subscription
        endpoint = `${API_URL}/subscriptions/${subscription.subscription._id}/renew`;
        method = 'POST';
        body = {
          durationMonths: 1,
          paymentMethod: 'test_mode',
          transactionId: mockTransactionId
        };
      } else {
        // Create new subscription
        endpoint = `${API_URL}/subscriptions`;
        method = 'POST';
        body = {
          gymOwnerId: user._id,
          plan: selectedPlan.name,
          price: selectedPlan.price,
          durationMonths: 1,
          paymentMethod: 'test_mode',
          transactionId: mockTransactionId
        };
      }
      
      // Make API call
      const response = await authFetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (response.success || response.status === 'success') {
        toast.success(`Subscription ${isRenewal ? 'renewed' : 'purchased'} successfully in test mode!`);
        
        // Refresh subscription status
        await checkSubscriptionStatus(user._id, null, true);
        
        // Navigate to dashboard
        navigate("/");
      } else {
        toast.error(response.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('Test mode subscription error:', err);
      toast.error('Subscription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle subscription purchase or renewal
  const handlePayment = async () => {
    if (!user || !selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Determine if this is a new subscription or renewal
      const isRenewal = subscription?.subscription?._id;
      
      console.log('🚀 Starting payment process...', { isRenewal, plan: selectedPlan.name });
      
      // Use the improved Razorpay initialization
      const checkoutInstance = await initializeRazorpayCheckout(authFetch, {
        amount: selectedPlan.price,
        currency: 'INR',
        receipt: `${isRenewal ? 'renewal' : 'subscription'}_${Date.now()}`,
        notes: {
          subscriptionId: isRenewal ? subscription.subscription._id : undefined,
          gymOwnerId: user._id,
          plan: selectedPlan.name
        },
        name: 'GymFlow',
        description: `${isRenewal ? 'Subscription Renewal' : 'New Subscription'} - ${selectedPlan.name}`,
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        handler: async function(response) {
          try {
            console.log('💳 Payment completed, verifying...', response);
            
            // Step 4: Verify payment and create/renew subscription
            let endpoint, method, body;
            
            if (isRenewal) {
              // Renew existing subscription
              endpoint = `/subscriptions/${subscription.subscription._id}/renew`;
              method = 'POST';
              body = {
                durationMonths: 1,
                paymentMethod: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              };
              
              const renewResponse = await authFetch(endpoint, {
                method,
                body: JSON.stringify(body)
              });
              
              if (renewResponse.success || renewResponse.status === 'success') {
                toast.success('Subscription renewed successfully!');
                await checkSubscriptionStatus(user._id, null, true);
                navigate("/");
              } else {
                toast.error(renewResponse.message || 'Subscription renewal failed. Please try again.');
              }
            } else {
              // Create new subscription with Razorpay verification
              const verifyResponse = await verifyRazorpayPayment(authFetch, {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                gymOwnerData: {
                  gymOwnerId: user._id,
                  plan: selectedPlan.name,
                  price: selectedPlan.price
                }
              });
              
              if (verifyResponse.success || verifyResponse.status === 'success') {
                toast.success('Subscription purchased successfully!');
                await checkSubscriptionStatus(user._id, null, true);
                navigate("/");
              } else {
                toast.error(verifyResponse.message || 'Subscription failed. Please try again.');
              }
            }
          } catch (error) {
            console.error('❌ Error verifying payment:', error);
            toast.error('Failed to verify payment. Please contact support if amount was deducted.');
          } finally {
            setIsProcessing(false);
          }
        },
        onDismiss: () => {
          console.log('Payment modal dismissed');
          setIsProcessing(false);
        }
      });
      
      // Open the payment modal
      checkoutInstance.open();
      
    } catch (err) {
      console.error('❌ Subscription error:', err);
      
      // Provide more specific error messages
      if (err.message.includes('Authentication')) {
        toast.error('Authentication failed. Please log in again.');
      } else if (err.message.includes('script')) {
        toast.error('Failed to load payment system. Please check your internet connection.');
      } else if (err.message.includes('key')) {
        toast.error('Payment configuration error. Please contact support.');
      } else {
        toast.error('Subscription failed. Please try again.');
      }
      
      setIsProcessing(false);
    }
  };

  // If user is not a gym owner, redirect to dashboard
  useEffect(() => {
    if (user && user.role !== 'gym-owner') {
      navigate("/");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Subscription Required</h1>
          <p className="mt-2 text-gray-400">
            Your subscription has expired. Please renew to continue using the system.
          </p>
        </div>

        {subscription && subscription.subscription && (
          <Card className="bg-red-900/20 border-red-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />
                Subscription Expired
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your {subscription.subscription.plan} plan expired on {new Date(subscription.subscription.endDate).toLocaleDateString()}.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300">
                To regain access to your dashboard and continue managing your gym, please renew your subscription.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {isLoading ? (
            // Loading state
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading subscription plans...</p>
            </div>
          ) : plans.length === 0 ? (
            // No plans found
            <div className="col-span-full text-center py-8">
              <p className="text-gray-400">No subscription plans available at the moment.</p>
            </div>
          ) : (
            // Plans list
            plans.map((plan) => (
            <Card 
              key={plan.id}
              className={`bg-gray-800/50 border-gray-700 relative ${
                selectedPlan?.id === plan.id ? "ring-2 ring-blue-500" : ""
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full">
                    Recommended
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-white">{plan.name}</CardTitle>
                <CardDescription className="text-gray-400">
                  <span className="text-2xl font-bold text-white">₹{plan.price}</span> / month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className={`w-full ${
                    selectedPlan?.id === plan.id 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-gray-700 hover:bg-gray-600"
                  }`}
                  onClick={() => handlePlanSelection(plan)}
                >
                  {selectedPlan?.id === plan.id ? "Selected" : "Select Plan"}
                </Button>
              </CardFooter>
            </Card>
            ))
          )}
        </div>

        {/* Payment Section */}
        {selectedPlan && (
          <div id="payment-section" className="mt-8 bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4">Complete Your Subscription</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Order Summary</h4>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Plan:</span>
                    <span className="text-white font-medium">{selectedPlan.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Duration:</span>
                    <span className="text-white font-medium">1 Month</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Price:</span>
                    <span className="text-white font-medium">₹{selectedPlan.price}</span>
                  </div>
                  <div className="border-t border-gray-600 my-2 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-white font-bold">₹{selectedPlan.price}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Payment Method</h4>
                <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-300 mb-1">Card Number</label>
                      <Input 
                        className="bg-gray-800 border-gray-600 text-white" 
                        placeholder="**** **** **** ****" 
                        value="4242 4242 4242 4242"
                        disabled
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-gray-300 mb-1">Expiry Date</label>
                        <Input 
                          className="bg-gray-800 border-gray-600 text-white" 
                          placeholder="MM/YY"
                          value="12/25"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-gray-300 mb-1">CVC</label>
                        <Input 
                          className="bg-gray-800 border-gray-600 text-white" 
                          placeholder="***"
                          value="123"
                          disabled
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-300 mb-1">Name on Card</label>
                      <Input 
                        className="bg-gray-800 border-gray-600 text-white" 
                        placeholder="John Doe"
                        value={user?.name || "John Doe"}
                        disabled
                      />
                    </div>
                    
                    <div className="pt-4 flex flex-col gap-4">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700 flex items-center flex-1"
                          size="lg"
                          disabled={isProcessing}
                          onClick={handlePayment}
                        >
                          {isProcessing ? (
                            <>Processing...</>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-5 w-5" />
                              Pay with Razorpay
                            </>
                          )}
                        </Button>
                        <Button 
                          variant="outline" 
                          className="border-gray-700 text-gray-300 hover:bg-gray-800"
                          size="lg"
                          onClick={logout}
                        >
                          Logout
                        </Button>
                      </div>

                    </div>
                    <div className="mt-2 text-center space-y-1">
                      <p className="text-xs text-gray-400">
                        Secure payment powered by Razorpay. Your subscription will be activated immediately after payment.
                      </p>
                      <p className="text-xs text-green-500/70 italic">
                        🔒 SSL Encrypted • 100% Secure Payment Gateway
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionRequired;