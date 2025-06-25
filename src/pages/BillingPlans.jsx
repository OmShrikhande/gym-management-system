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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Navigate } from "react-router-dom";

const BillingPlans = () => {
  const [activeTab, setActiveTab] = useState("plans");
  const [searchTerm, setSearchTerm] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
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
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [overdueAmount, setOverdueAmount] = useState(0);
  
  const { 
    user, 
    authFetch, 
    subscription, 
    checkSubscriptionStatus,
    isSuperAdmin,
    isGymOwner,
    isMember,
    updateCurrentUser
  } = useAuth();
  
  // Redirect gym owners to their specific plans page
  if (isGymOwner && !isSuperAdmin) {
    return <Navigate to="/gym-owner-plans" replace />;
  }
  
  // For members, we'll show available membership plans they can renew with
  
  // Fetch subscription data when component mounts
  useEffect(() => {
    fetchPlans();
    if (isSuperAdmin) {
      fetchBillingStats();
    }
  }, [user, isSuperAdmin]);
  
  // Fetch plans from API
  const fetchPlans = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/subscription-plans');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data.plans);
      } else {
        // If API fails, use default plans
        setPlans([
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
        ]);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Failed to load subscription plans');
      
      // Use default plans if API fails
      setPlans([
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
      ]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch billing statistics
  const fetchBillingStats = async () => {
    try {
      // Fetch total revenue
      const revenueResponse = await authFetch('/subscriptions/revenue/total');
      if (revenueResponse.success || revenueResponse.status === 'success') {
        setTotalRevenue(revenueResponse.data.totalRevenue || 0);
      }
      
      // For pending and overdue amounts, we would need additional API endpoints
      // For now, we'll use mock data
      setPendingAmount(149);
      setOverdueAmount(99);
    } catch (error) {
      console.error('Error fetching billing stats:', error);
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
        features: featuresArray
      };
      
      let response;
      
      if (editingPlan) {
        // Update existing plan
        response = await authFetch(`/subscription-plans/${editingPlan._id}`, {
          method: 'PATCH',
          body: JSON.stringify(planData)
        });
      } else {
        // Create new plan
        response = await authFetch('/subscription-plans', {
          method: 'POST',
          body: JSON.stringify(planData)
        });
      }
      
      if (response.success || response.status === 'success') {
        toast.success(editingPlan ? 'Plan updated successfully' : 'Plan created successfully');
        setShowPlanDialog(false);
        fetchPlans(); // Refresh plans list
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
      const response = await authFetch(`/subscription-plans/${planId}`, {
        method: 'DELETE'
      });
      
      if (response.success || response.status === 'success' || response.status === 204) {
        toast.success('Plan deleted successfully');
        fetchPlans(); // Refresh plans list
      } else {
        toast.error(response.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('An error occurred while deleting the plan');
    }
  };
  
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
      // If this is a member renewing their membership
      if (isMember) {
        // Calculate new end date based on plan duration
        const startDate = new Date();
        const endDate = new Date();
        
        // Set duration based on plan
        if (selectedPlan.duration === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1);
        } else if (selectedPlan.duration === 'quarterly') {
          endDate.setMonth(endDate.getMonth() + 3);
        } else if (selectedPlan.duration === 'yearly') {
          endDate.setMonth(endDate.getMonth() + 12);
        } else {
          // Default to 1 month
          endDate.setMonth(endDate.getMonth() + 1);
        }
        
        // Create payment record
        const paymentResponse = await authFetch('/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: selectedPlan.price,
            paymentType: 'Membership Renewal',
            paymentMethod: 'Card',
            status: 'Paid',
            description: `Membership renewal - ${selectedPlan.name} (${selectedPlan.duration})`,
            memberId: user._id
          })
        });
        
        if (!paymentResponse.ok && !paymentResponse.success) {
          throw new Error('Payment failed');
        }
        
        // Update member's membership status
        const updateResponse = await authFetch(`/users/${user._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            membershipStatus: 'Active',
            membershipStartDate: startDate.toISOString(),
            membershipEndDate: endDate.toISOString(),
            membershipType: selectedPlan.name,
            planType: selectedPlan.name
          })
        });
        
        if (!updateResponse.ok && !updateResponse.success) {
          throw new Error('Failed to update membership');
        }
        
        // Calculate days remaining
        const daysRemaining = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        // Update user context
        const updatedUser = {
          ...user,
          membershipStatus: 'Active',
          membershipEndDate: endDate.toISOString(),
          membershipType: selectedPlan.name,
          planType: selectedPlan.name,
          membershipDaysRemaining: daysRemaining
        };
        
        updateCurrentUser(updatedUser);
        
        toast.success(`Successfully renewed membership with ${selectedPlan.name} plan`);
        
        // Redirect to dashboard after successful renewal
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
        
        return;
      }
      
      // For gym owners - handle subscription
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

  // Calculate invoice stats for display if API stats are not available
  const invoiceRevenue = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0);
  
  // Use API stats if available, otherwise use calculated values from invoices
  const displayRevenue = totalRevenue || invoiceRevenue;
  const displayPendingAmount = pendingAmount || invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const displayOverdueAmount = overdueAmount || invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
  
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
            <h1 className="text-3xl font-bold text-white">Gym Owner Billing & Plans</h1>
            <p className="text-gray-400">Manage subscription plans and billing for gym owners</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleCreatePlan}
          >
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
                  <p className="text-2xl font-bold text-white">₹{displayRevenue}</p>
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
                  <p className="text-2xl font-bold text-white">₹{displayPendingAmount}</p>
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
                  <p className="text-2xl font-bold text-white">₹{displayOverdueAmount}</p>
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
            Gym Owner Plans
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "invoices" 
                ? "text-blue-400 border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Invoices
          </button>
          <button
            onClick={() => setActiveTab("revenue")}
            className={`pb-4 px-2 font-medium transition-colors ${
              activeTab === "revenue" 
                ? "text-blue-400 border-b-2 border-blue-400" 
                : "text-gray-400 hover:text-white"
            }`}
          >
            Revenue
          </button>
        </div>



        {/* Plans Tab */}
        {activeTab === "plans" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Gym Owner Subscription Plans</CardTitle>
              <CardDescription className="text-gray-400">
                Manage subscription plans for gym owners
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
                      ) : isSuperAdmin ? (
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => handleEditPlan(plan)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button 
                            variant="outline" 
                            className="border-gray-600 text-red-400 hover:bg-red-900/20 hover:text-red-300"
                            onClick={() => handleDeletePlan(plan._id || plan.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="outline" 
                          className="w-full border-gray-600 text-gray-300 hover:bg-gray-600"
                          disabled={true}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
              
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
      </div>

      {/* Plan Creation/Editing Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingPlan ? 'Update the details of this subscription plan.' : 'Fill in the details for the new subscription plan.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="name" className="text-white">Plan Name</Label>
                <Input
                  id="name"
                  name="name"
                  value={planFormData.name}
                  onChange={handlePlanFormChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g. Basic, Premium, Enterprise"
                />
              </div>
              
              <div>
                <Label htmlFor="price" className="text-white">Price (₹)</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={planFormData.price}
                  onChange={handlePlanFormChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g. 99"
                />
              </div>
              
              <div>
                <Label htmlFor="duration" className="text-white">Duration</Label>
                <Select 
                  name="duration" 
                  value={planFormData.duration} 
                  onValueChange={(value) => handlePlanFormChange({ target: { name: 'duration', value } })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="maxMembers" className="text-white">Max Members</Label>
                <Input
                  id="maxMembers"
                  name="maxMembers"
                  type="number"
                  value={planFormData.maxMembers}
                  onChange={handlePlanFormChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g. 200"
                />
              </div>
              
              <div>
                <Label htmlFor="maxTrainers" className="text-white">Max Trainers</Label>
                <Input
                  id="maxTrainers"
                  name="maxTrainers"
                  type="number"
                  value={planFormData.maxTrainers}
                  onChange={handlePlanFormChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="e.g. 5"
                />
              </div>
              
              <div className="col-span-2">
                <Label htmlFor="features" className="text-white">Features (comma-separated)</Label>
                <Textarea
                  id="features"
                  name="features"
                  value={planFormData.features}
                  onChange={(e) => handleFeaturesChange(e.target.value)}
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  placeholder="e.g. Member Management, Basic Reports, Email Support"
                />
              </div>
              
              <div>
                <Label htmlFor="status" className="text-white">Status</Label>
                <Select 
                  name="status" 
                  value={planFormData.status} 
                  onValueChange={(value) => handlePlanFormChange({ target: { name: 'status', value } })}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600 text-white">
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Deprecated">Deprecated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="recommended" className="text-white">Recommended Plan</Label>
                <Switch
                  id="recommended"
                  name="recommended"
                  checked={planFormData.recommended}
                  onCheckedChange={(checked) => handlePlanFormChange({ target: { name: 'recommended', type: 'checkbox', checked } })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              onClick={() => setShowPlanDialog(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSavePlan}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>Processing...</>
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
    </DashboardLayout>
  );
};

export default BillingPlans;