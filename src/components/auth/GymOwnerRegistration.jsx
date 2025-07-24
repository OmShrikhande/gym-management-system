import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  CreditCard, 
  Building2, 
  Users, 
  Loader2, 
  AlertCircle,
  ArrowRight,
  Shield,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { 
  getRazorpayKeyWithValidation, 
  loadRazorpayScript 
} from "@/utils/razorpayUtils";

const GymOwnerRegistration = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [pendingActivation, setPendingActivation] = useState(null);
  
  const { user, authFetch, login } = useAuth();

  // Subscription plans
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 49,
      duration: "monthly",
      maxMembers: 200,
      maxTrainers: 5,
      features: [
        "Member Management",
        "Basic Reports", 
        "Email Support",
        "Attendance Tracking",
        "Payment Processing"
      ],
      popular: false
    },
    {
      id: "premium", 
      name: "Premium",
      price: 99,
      duration: "monthly",
      maxMembers: 500,
      maxTrainers: 15,
      features: [
        "All Basic Features",
        "Advanced Reports",
        "SMS Integration", 
        "Priority Support",
        "Workout Plans",
        "Diet Management",
        "Custom Branding"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise", 
      price: 199,
      duration: "monthly",
      maxMembers: 1000,
      maxTrainers: 50,
      features: [
        "All Premium Features",
        "Multi-location Support",
        "Advanced Analytics",
        "24/7 Support", 
        "Custom Branding",
        "API Access",
        "White Label Solution"
      ],
      popular: false
    }
  ];

  // Check for pending activation on component mount
  useEffect(() => {
    const stored = localStorage.getItem('pendingActivation');
    if (stored) {
      try {
        const activationData = JSON.parse(stored);
        setPendingActivation(activationData);
        setPaymentCompleted(true);
        
        // Find the plan that was paid for
        const plan = plans.find(p => p.id === activationData.planData?.id);
        if (plan) {
          setSelectedPlan(plan);
        }
      } catch (error) {
        console.error('Error parsing pending activation data:', error);
        localStorage.removeItem('pendingActivation');
      }
    }
  }, []);

  // Handle plan selection and payment
  const handleSelectPlan = async (plan) => {
    if (!plan || !plan.id || !plan.name || !plan.price) {
      toast.error('Invalid plan selected. Please try again.');
      return;
    }

    setSelectedPlan(plan);
    setIsProcessing(true);

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await authFetch('/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: plan.price,
          currency: 'INR',
          receipt: `gym_activation_${Date.now()}`,
          notes: {
            planId: plan.id,
            gymOwnerId: user._id,
            planName: plan.name,
            isActivation: true
          }
        })
      });

      if (!orderResponse || (!orderResponse.success && orderResponse.status !== 'success')) {
        throw new Error('Failed to create payment order');
      }

      const order = orderResponse.data?.order;
      if (!order) {
        throw new Error('Invalid order response');
      }

      // Step 2: Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Step 3: Get Razorpay key
      const razorpayKey = await getRazorpayKeyWithValidation(authFetch);
      if (!razorpayKey) {
        throw new Error('Payment configuration not available');
      }

      // Step 4: Configure and open Razorpay checkout
      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        name: 'GymFlow',
        description: `Gym Owner Activation - ${plan.name} Plan`,
        order_id: order.id,
        handler: function(response) {
          // Payment successful - store details for completion
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

          // Store in localStorage for manual completion
          localStorage.setItem('pendingActivation', JSON.stringify(paymentDetails));
          setPendingActivation(paymentDetails);
          setPaymentCompleted(true);
          setIsProcessing(false);

          toast.success('Payment successful! Now complete your registration to activate your account.');
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function(response) {
        toast.error(`Payment failed: ${response.error.description}`);
        setIsProcessing(false);
      });

      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      toast.error(error.message || 'Failed to initiate payment');
      setIsProcessing(false);
    }
  };

  // Handle registration completion
  const handleCompleteRegistration = async () => {
    if (!pendingActivation) {
      toast.error('No pending payment found. Please make a payment first.');
      return;
    }

    setIsProcessing(true);

    try {
      // Verify payment and activate account
      const activationResponse = await authFetch('/payments/razorpay/verify-activation', {
        method: 'POST',
        body: JSON.stringify(pendingActivation)
      });

      if (activationResponse.success || activationResponse.status === 'success') {
        // Clear stored payment details
        localStorage.removeItem('pendingActivation');
        setPendingActivation(null);
        
        toast.success('🎉 Registration completed successfully! Welcome to GymFlow!');
        
        // Force re-authentication to get updated user data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } else {
        throw new Error(activationResponse.message || 'Account activation failed');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      toast.error(error.message || 'Failed to complete registration');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle test mode activation (for development)
  const handleTestActivation = async (plan) => {
    setIsProcessing(true);
    
    try {
      const mockTransactionId = `test_${Date.now()}`;
      
      const activationResponse = await authFetch('/payments/test-activation', {
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
        toast.success('🎉 Account activated successfully in test mode!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        throw new Error(activationResponse.message || 'Test activation failed');
      }
    } catch (error) {
      console.error('Test activation error:', error);
      toast.error(error.message || 'Failed to activate account');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
              <Building2 className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Activate Your Gym Owner Account
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose a subscription plan to unlock the full power of GymFlow and start managing your gym efficiently
          </p>
        </div>

        {/* Payment Success Banner */}
        {paymentCompleted && (
          <Card className="mb-8 bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <CheckCircle className="h-8 w-8 text-green-400" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-100">Payment Successful!</h3>
                    <p className="text-green-200">
                      Your payment for the {selectedPlan?.name} plan has been processed successfully.
                    </p>
                  </div>
                </div>
                <Button 
                  onClick={handleCompleteRegistration}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Activating...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative bg-gray-800 border-gray-700 ${
                plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''
              } ${paymentCompleted && selectedPlan?.id === plan.id ? 'ring-2 ring-green-500' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Zap className="w-3 h-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {paymentCompleted && selectedPlan?.id === plan.id && (
                <div className="absolute -top-3 right-4">
                  <Badge className="bg-green-600 text-white px-3 py-1">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Paid
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold text-white">
                  {plan.name}
                </CardTitle>
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  ₹{plan.price}
                  <span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
                <CardDescription className="text-gray-400">
                  Perfect for {plan.maxMembers <= 200 ? 'small' : plan.maxMembers <= 500 ? 'medium' : 'large'} gyms
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Plan Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{plan.maxMembers}</div>
                    <div className="text-xs text-gray-400">Max Members</div>
                  </div>
                  <div className="text-center p-3 bg-gray-700/50 rounded-lg">
                    <Shield className="h-5 w-5 text-green-400 mx-auto mb-1" />
                    <div className="text-lg font-bold text-white">{plan.maxTrainers}</div>
                    <div className="text-xs text-gray-400">Max Trainers</div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold text-white mb-3">Features Included:</h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-gray-300">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-4">
                  {paymentCompleted && selectedPlan?.id === plan.id ? (
                    <Button 
                      onClick={handleCompleteRegistration}
                      disabled={isProcessing}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating Account...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Complete Registration
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={() => handleSelectPlan(plan)}
                        disabled={isProcessing || paymentCompleted}
                        className={`w-full py-3 ${
                          plan.popular 
                            ? 'bg-blue-600 hover:bg-blue-700' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        } text-white`}
                      >
                        {isProcessing && selectedPlan?.id === plan.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="mr-2 h-4 w-4" />
                            Choose {plan.name}
                          </>
                        )}
                      </Button>
                      
                      {/* Test Mode Button (Development only) */}
                      {process.env.NODE_ENV === 'development' && (
                        <Button 
                          onClick={() => handleTestActivation(plan)}
                          disabled={isProcessing || paymentCompleted}
                          variant="outline"
                          className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white py-2"
                        >
                          Test Activation (Dev Only)
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Section */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <AlertCircle className="h-6 w-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
                <p className="text-gray-300 mb-4">
                  If you encounter any issues during the payment process or account activation, 
                  please contact our support team at support@gymflow.com or call +91-XXXX-XXXX-XX.
                </p>
                <div className="text-sm text-gray-400">
                  <p>• Payment is processed securely through Razorpay</p>
                  <p>• You can cancel your subscription anytime</p>
                  <p>• 30-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GymOwnerRegistration;