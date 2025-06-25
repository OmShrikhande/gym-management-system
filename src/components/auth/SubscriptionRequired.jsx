import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { CreditCard, AlertTriangle, Calendar, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// API URL
const API_URL = 'http://localhost:8081/api';

const SubscriptionRequired = () => {
  const { user, subscription, logout, authFetch, checkSubscriptionStatus } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  
  // Fetch subscription plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        // Use authFetch instead of fetch to ensure proper authentication
        const response = await authFetch('/subscription-plans');
        
        if (response && (response.success || response.status === 'success') && response.data?.plans?.length > 0) {
          console.log('Fetched subscription plans:', response.data.plans);
          setPlans(response.data.plans);
        } else {
          console.error('Failed to fetch plans or no plans returned:', data);
          // Fallback to default plans
          setPlans([
            {
              id: "basic",
              name: "Basic",
              price: 49,
              features: ["Up to 200 members", "5 trainers", "Basic reporting", "Email support"],
              recommended: false
            },
            {
              id: "premium",
              name: "Premium",
              price: 99,
              features: ["Up to 500 members", "15 trainers", "Advanced reporting", "Priority support"],
              recommended: true
            },
            {
              id: "enterprise",
              name: "Enterprise",
              price: 199,
              features: ["Unlimited members", "Unlimited trainers", "Custom branding", "Dedicated support"],
              recommended: false
            }
          ]);
        }
      } catch (error) {
        console.error('Error fetching subscription plans:', error);
        // Fallback to default plans
        setPlans([
          {
            id: "basic",
            name: "Basic",
            price: 49,
            features: ["Up to 200 members", "5 trainers", "Basic reporting", "Email support"],
            recommended: false
          },
          {
            id: "premium",
            name: "Premium",
            price: 99,
            features: ["Up to 500 members", "15 trainers", "Advanced reporting", "Priority support"],
            recommended: true
          },
          {
            id: "enterprise",
            name: "Enterprise",
            price: 199,
            features: ["Unlimited members", "Unlimited trainers", "Custom branding", "Dedicated support"],
            recommended: false
          }
        ]);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    
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
      
      console.log('Creating subscription with test mode payment');
      console.log('User ID:', user._id);
      console.log('Plan:', selectedPlan.name);
      console.log('Price:', selectedPlan.price);
      
      // Create new subscription
      const endpoint = `${API_URL}/subscriptions`;
      const method = 'POST';
      const body = {
        gymOwnerId: user._id,
        plan: selectedPlan.name,
        price: selectedPlan.price,
        durationMonths: 1,
        paymentMethod: 'test_mode',
        transactionId: mockTransactionId
      };
      
      // Make API call using authFetch
      const response = await authFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      
      if (response && (response.success || response.status === 'success')) {
        toast.success(`Subscription purchased successfully in test mode!`);
        
        // Refresh subscription status
        await checkSubscriptionStatus(user._id, null, true);
        
        // Navigate to dashboard
        navigate("/dashboard");
      } else {
        console.error('Subscription error response:', response);
        toast.error(response?.message || 'Subscription failed. Please try again.');
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
      
      // Step 1: Create a Razorpay order
      let orderEndpoint, orderBody;
      
      if (isRenewal) {
        // Create order for renewal
        orderEndpoint = `${API_URL}/payments/razorpay/create-order`;
        orderBody = {
          amount: selectedPlan.price,
          currency: 'INR',
          receipt: `renewal_${Date.now()}`,
          notes: {
            subscriptionId: subscription.subscription._id,
            gymOwnerId: user._id,
            plan: selectedPlan.name
          }
        };
      } else {
        // Create order for new subscription
        orderEndpoint = `${API_URL}/payments/razorpay/create-order`;
        orderBody = {
          amount: selectedPlan.price,
          currency: 'INR',
          receipt: `subscription_${Date.now()}`,
          notes: {
            gymOwnerId: user._id,
            plan: selectedPlan.name
          }
        };
      }
      
      const orderResponse = await authFetch(orderEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderBody)
      });
      
      console.log('Order response:', orderResponse);
      
      if (!orderResponse || (!orderResponse.success && orderResponse.status !== 'success')) {
        toast.error('Failed to create payment order');
        setIsProcessing(false);
        return;
      }
      
      const order = orderResponse.data?.order;
      
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
      
      // Step 3: Open Razorpay checkout
      const options = {
        key: 'rzp_test_VUpggvAt3u75cZ', // Replace with your Razorpay key
        amount: order.amount,
        currency: order.currency,
        name: 'GymFlow',
        description: `${isRenewal ? 'Subscription Renewal' : 'New Subscription'} - ${selectedPlan.name}`,
        order_id: order.id,
        handler: async function(response) {
          try {
            // Step 4: Verify payment and create/renew subscription
            let endpoint, method, body;
            
            if (isRenewal) {
              // Renew existing subscription
              endpoint = `${API_URL}/subscriptions/${subscription.subscription._id}/renew`;
              method = 'POST';
              body = {
                durationMonths: 1,
                paymentMethod: 'razorpay',
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              };
            } else {
              // Create new subscription with Razorpay verification
              endpoint = `${API_URL}/payments/razorpay/verify`;
              method = 'POST';
              body = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                gymOwnerData: {
                  gymOwnerId: user._id,
                  plan: selectedPlan.name,
                  price: selectedPlan.price
                }
              };
            }
            
            const verifyResponse = await authFetch(endpoint, {
              method,
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(body)
            });
            
            if (verifyResponse.success || verifyResponse.status === 'success') {
              toast.success(`Subscription ${isRenewal ? 'renewed' : 'purchased'} successfully!`);
              
              // Refresh subscription status
              await checkSubscriptionStatus(user._id, null, true);
              
              // Navigate to dashboard
              navigate("/dashboard");
            } else {
              toast.error(verifyResponse.message || 'Subscription failed. Please try again.');
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
      
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Subscription failed. Please try again.');
      setIsProcessing(false);
    }
  };

  // If user is not a gym owner, redirect to dashboard
  useEffect(() => {
    if (user && user.role !== 'gym-owner') {
      navigate("/dashboard");
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

        {isLoadingPlans ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
            <span className="ml-2 text-gray-400">Loading subscription plans...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {plans.map((plan) => (
              <Card 
                key={plan._id || plan.id}
                className={`bg-gray-800/50 border-gray-700 relative ${
                  selectedPlan?._id === plan._id || selectedPlan?.id === plan.id ? "ring-2 ring-blue-500" : ""
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
                    <span className="text-2xl font-bold text-white">${plan.price}</span> / month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.maxMembers && (
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">Up to {plan.maxMembers} members</span>
                      </li>
                    )}
                    {plan.maxTrainers && (
                      <li className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{plan.maxTrainers} trainers</span>
                      </li>
                    )}
                    {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button 
                    className={`w-full ${
                      (selectedPlan?._id === plan._id || selectedPlan?.id === plan.id)
                        ? "bg-blue-600 hover:bg-blue-700" 
                        : "bg-gray-700 hover:bg-gray-600"
                    }`}
                    onClick={() => handlePlanSelection(plan)}
                  >
                    {(selectedPlan?._id === plan._id || selectedPlan?.id === plan.id) ? "Selected" : "Select Plan"}
                  </Button>
                  
                  {/* Quick subscribe button with test mode */}
                  <Button 
                    variant="outline"
                    className="w-full border-amber-600 text-amber-500 hover:bg-amber-900/20"
                    onClick={() => {
                      setSelectedPlan(plan);
                      setTimeout(() => handleTestModePayment(), 100);
                    }}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Quick Subscribe (Test Mode)'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

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
                    <span className="text-white font-medium">${selectedPlan.price}</span>
                  </div>
                  <div className="border-t border-gray-600 my-2 pt-2">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total:</span>
                      <span className="text-white font-bold">${selectedPlan.price}</span>
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
                      <Button 
                        variant="outline"
                        className="border-amber-600 text-amber-500 hover:bg-amber-900/20"
                        size="lg"
                        disabled={isProcessing}
                        onClick={handleTestModePayment}
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {isProcessing ? 'Processing...' : 'Skip Payment (Test Mode)'}
                      </Button>
                    </div>
                    <div className="mt-2 text-center space-y-1">
                      <p className="text-xs text-gray-400">
                        Secure payment powered by Razorpay. Your subscription will be activated immediately after payment.
                      </p>
                      <p className="text-xs text-amber-500/70 italic">
                        Test Mode: Payments are simulated for development purposes
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