import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, CreditCard, TrendingUp, Calendar, FileText, Edit, Download, CheckCircle, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// API URL
const API_URL = 'http://localhost:8081/api';

const BillingPlans = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const { 
    user, 
    authFetch, 
    subscription, 
    checkSubscriptionStatus,
    isSuperAdmin,
    isGymOwner
  } = useAuth();
  
  // Fetch subscription data when component mounts
  useEffect(() => {
    if (user && isGymOwner) {
      checkSubscriptionStatus(user._id);
    }
  }, [user, checkSubscriptionStatus, isGymOwner]);

  // Plans data
  const plans = [
    {
      id: "basic",
      name: "Basic",
      price: 49,
      duration: "monthly",
      maxMembers: 200,
      maxTrainers: 5,
      features: ["Member Management", "Basic Reports", "Email Support"],
      status: "Active"
    },
    {
      id: "premium",
      name: "Premium",
      price: 99,
      duration: "monthly",
      maxMembers: 500,
      maxTrainers: 15,
      features: ["All Basic Features", "Advanced Reports", "SMS Integration", "Priority Support"],
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
      features: ["All Premium Features", "Custom Branding", "API Access", "Dedicated Support"],
      status: "Active"
    }
  ];
  
  // Handle plan selection
  const handlePlanSelection = (plan) => {
    setSelectedPlan(plan);
    // Open a modal or scroll to payment section
    document.getElementById('payment-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle subscription purchase or renewal
  const handleSubscription = async () => {
    if (!user || !selectedPlan) {
      toast.error('Please select a plan first');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // In a real app, this would redirect to a payment gateway
      // For demo purposes, we'll simulate a successful payment
      
      // Determine if this is a new subscription or renewal
      const isRenewal = subscription?.subscription?._id;
      
      let endpoint, method, body;
      
      if (isRenewal) {
        // Renew existing subscription
        endpoint = `${API_URL}/subscriptions/${subscription.subscription._id}/renew`;
        method = 'POST';
        body = {
          durationMonths: 1,
          paymentMethod: 'credit_card',
          transactionId: `demo_${Date.now()}`
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
          paymentMethod: 'credit_card',
          transactionId: `demo_${Date.now()}`
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
      
      if (response.ok) {
        toast.success(`Subscription ${isRenewal ? 'renewed' : 'purchased'} successfully!`);
        
        // Refresh subscription status
        await checkSubscriptionStatus(user._id);
        
        // Switch to invoices tab
        setActiveTab("invoices");
      } else {
        const data = await response.json();
        toast.error(data.message || 'Subscription failed. Please try again.');
      }
    } catch (err) {
      console.error('Subscription error:', err);
      toast.error('Subscription failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Mock data for invoices
  const invoices = [
    {
      id: 1,
      invoiceNumber: "INV-2024-001",
      gymName: "PowerFit Gym",
      planName: "Premium",
      amount: 99,
      status: "Paid",
      issueDate: "2024-01-01",
      dueDate: "2024-01-31",
      renewalDate: "2024-02-01"
    },
    {
      id: 2,
      invoiceNumber: "INV-2024-002",
      gymName: "FitZone Studio",
      planName: "Basic",
      amount: 49,
      status: "Pending",
      issueDate: "2024-01-15",
      dueDate: "2024-02-15",
      renewalDate: "2024-02-15"
    },
    {
      id: 3,
      invoiceNumber: "INV-2024-003",
      gymName: "Elite Fitness",
      planName: "Premium",
      amount: 99,
      status: "Overdue",
      issueDate: "2023-12-01",
      dueDate: "2023-12-31",
      renewalDate: "2024-01-01"
    }
  ];

  const getStatusBadge = (status) => {
    const variants = {
      'Active': 'default',
      'Paid': 'default',
      'Pending': 'secondary',
      'Overdue': 'destructive'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  const totalRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  const pendingAmount = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const overdueAmount = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
  
  // Get current subscription info
  const currentSubscription = subscription?.subscription;
  const hasActiveSubscription = subscription?.hasActiveSubscription;
  const daysRemaining = subscription?.daysRemaining || 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Plans</h1>
            <p className="text-gray-400">Manage subscription plans and billing for all gyms</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">${totalRevenue}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Pending Amount</p>
                  <p className="text-2xl font-bold text-white">${pendingAmount}</p>
                </div>
                <Calendar className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Overdue Amount</p>
                  <p className="text-2xl font-bold text-white">${overdueAmount}</p>
                </div>
                <CreditCard className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Plans</p>
                  <p className="text-2xl font-bold text-white">{plans.filter(p => p.status === 'Active').length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("plans")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "plans" 
                ? "text-blue-400 border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Subscription Plans
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "invoices" 
                ? "text-blue-400 border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Billing History
          </button>
        </div>

        {/* Current Subscription Status (for gym owners) */}
        {isGymOwner && currentSubscription && (
          <Card className={`${hasActiveSubscription ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                {hasActiveSubscription ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-green-400" />
                    Active Subscription
                  </>
                ) : (
                  <>
                    <AlertTriangle className="mr-2 h-5 w-5 text-red-400" />
                    Subscription Expired
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
          </Card>
        )}

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Plans</CardTitle>
              <CardDescription className="text-gray-400">
                {isGymOwner ? 'Choose a plan to subscribe or renew' : 'Manage available plans and their features'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`bg-gray-700/50 border-gray-600 relative ${
                      currentSubscription?.plan === plan.name ? 'ring-2 ring-blue-500' : ''
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
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white">{plan.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            <span className="text-xl font-bold text-white">${plan.price}</span>/{plan.duration}
                          </CardDescription>
                        </div>
                        {currentSubscription?.plan === plan.name && hasActiveSubscription ? (
                          <Badge variant="default">Current Plan</Badge>
                        ) : (
                          getStatusBadge(plan.status)
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Limits</p>
                          <p className="text-white">Max Members: {plan.maxMembers}</p>
                          <p className="text-white">Max Trainers: {plan.maxTrainers}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-2">Features</p>
                          <ul className="space-y-1">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="text-sm text-white flex items-center">
                                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {isGymOwner ? (
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                          disabled={isProcessing}
                          onClick={() => handlePlanSelection(plan)}
                        >
                          {selectedPlan?.id === plan.id ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Selected
                            </>
                          ) : (
                            <>
                              {currentSubscription?.plan === plan.name ? (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Select to Renew
                                </>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  Select Plan
                                </>
                              )}
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button variant="outline" className="w-full border-gray-600 text-gray-300 hover:bg-gray-600">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Plan
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {/* Payment Section */}
              {isGymOwner && selectedPlan && (
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
                      
                      <div className="mt-4">
                        <h4 className="text-lg font-medium text-white mb-2">Plan Features</h4>
                        <ul className="bg-gray-700/50 border border-gray-600 rounded-lg p-4 space-y-2">
                          {selectedPlan.features.map((feature, index) => (
                            <li key={index} className="flex items-center text-gray-300">
                              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                              {feature}
                            </li>
                          ))}
                        </ul>
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
                          
                          <div className="pt-4">
                            <Button 
                              className="w-full bg-blue-600 hover:bg-blue-700"
                              disabled={isProcessing}
                              onClick={handleSubscription}
                            >
                              {isProcessing ? (
                                <>Processing...</>
                              ) : (
                                <>
                                  <CreditCard className="h-4 w-4 mr-2" />
                                  {subscription?.subscription?._id ? 'Renew Subscription' : 'Complete Payment'}
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-gray-400 mt-2 text-center">
                              This is a demo. No actual payment will be processed.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Billing History</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage all invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search invoices or gyms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  Export All
                </Button>
              </div>

              <div className="rounded-md border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Invoice Details</TableHead>
                      <TableHead className="text-gray-300">Gym & Plan</TableHead>
                      <TableHead className="text-gray-300">Amount</TableHead>
                      <TableHead className="text-gray-300">Status</TableHead>
                      <TableHead className="text-gray-300">Dates</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{invoice.invoiceNumber}</p>
                            <p className="text-sm text-gray-400">Issued: {invoice.issueDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{invoice.gymName}</p>
                            <p className="text-sm text-gray-400">{invoice.planName} Plan</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white font-medium">${invoice.amount}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(invoice.status)}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <p className="text-white">Due: {invoice.dueDate}</p>
                            <p className="text-gray-400">Renewal: {invoice.renewalDate}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Edit className="h-4 w-4" />
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
      </div>
    </DashboardLayout>
  );
};

export default BillingPlans;