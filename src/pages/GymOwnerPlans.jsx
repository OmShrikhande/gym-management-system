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

const GymOwnerPlans = () => {
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
  }, [user, checkSubscriptionStatus, isGymOwner]);
  
  // Fetch gym owner plans from API
  const fetchGymOwnerPlans = async () => {
    setIsLoading(true);
    try {
      const response = await authFetch('/gym-owner-plans');
      
      if (response.success || response.status === 'success') {
        setPlans(response.data.plans);
      } else {
        // If API fails, use default plans
        setPlans([
          {
            id: "basic-member",
            name: "Basic Member",
            price: 19,
            duration: "monthly",
            maxMembers: 50,
            maxTrainers: 2,
            features: ["Member Management", "Basic Attendance Tracking", "Email Support"],
            status: "Active"
          },
          {
            id: "premium-member",
            name: "Premium Member",
            price: 39,
            duration: "monthly",
            maxMembers: 100,
            maxTrainers: 5,
            features: ["All Basic Features", "Fitness Progress Tracking", "Workout Plans", "Priority Support"],
            status: "Active",
            recommended: true
          },
          {
            id: "elite-member",
            name: "Elite Member",
            price: 79,
            duration: "monthly",
            maxMembers: 200,
            maxTrainers: 10,
            features: ["All Premium Features", "Nutrition Planning", "Personal Training Sessions", "24/7 Support"],
            status: "Active"
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching gym owner plans:', error);
      toast.error('Failed to load gym owner plans');
      
      // Use default plans if API fails
      setPlans([
        {
          id: "basic-member",
          name: "Basic Member",
          price: 19,
          duration: "monthly",
          maxMembers: 50,
          maxTrainers: 2,
          features: ["Member Management", "Basic Attendance Tracking", "Email Support"],
          status: "Active"
        },
        {
          id: "premium-member",
          name: "Premium Member",
          price: 39,
          duration: "monthly",
          maxMembers: 100,
          maxTrainers: 5,
          features: ["All Basic Features", "Fitness Progress Tracking", "Workout Plans", "Priority Support"],
          status: "Active",
          recommended: true
        },
        {
          id: "elite-member",
          name: "Elite Member",
          price: 79,
          duration: "monthly",
          maxMembers: 200,
          maxTrainers: 10,
          features: ["All Premium Features", "Nutrition Planning", "Personal Training Sessions", "24/7 Support"],
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
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Member Plans</h1>
            <p className="text-gray-400">Manage subscription plans for your gym members</p>
          </div>
          <Button 
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleCreatePlan}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Plan
          </Button>
        </div>

        {/* Current Subscription Status */}
        {isGymOwner && currentSubscription && (
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
          </Card>
        )}

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

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Member Subscription Plans</CardTitle>
              <CardDescription className="text-gray-400">
                Manage plans for your gym members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card 
                    key={plan.id} 
                    className={`bg-gray-700/50 border-gray-600 relative ${
                      plan.recommended ? 'ring-2 ring-blue-500' : ''
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
                            <span className="text-xl font-bold text-white">₹{plan.price}</span>/{plan.duration}
                          </CardDescription>
                        </div>
                        {getStatusBadge(plan.status)}
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
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {isLoading && (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Member Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Member Subscriptions</CardTitle>
              <CardDescription className="text-gray-400">
                View and manage subscriptions for your gym members
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4">
                <div className="relative w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Search subscriptions..."
                    className="pl-8 bg-gray-700 border-gray-600 text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
              
              <div className="rounded-md border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-800">
                    <TableRow className="hover:bg-gray-800/50 border-gray-700">
                      <TableHead className="text-gray-400">Invoice #</TableHead>
                      <TableHead className="text-gray-400">Member</TableHead>
                      <TableHead className="text-gray-400">Plan</TableHead>
                      <TableHead className="text-gray-400">Amount</TableHead>
                      <TableHead className="text-gray-400">Status</TableHead>
                      <TableHead className="text-gray-400">Start Date</TableHead>
                      <TableHead className="text-gray-400">End Date</TableHead>
                      <TableHead className="text-gray-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memberSubscriptions.map(subscription => (
                      <TableRow key={subscription.id} className="hover:bg-gray-700/50 border-gray-700">
                        <TableCell className="text-white">{subscription.invoiceNumber}</TableCell>
                        <TableCell className="text-white">{subscription.memberName}</TableCell>
                        <TableCell className="text-white">{subscription.planName}</TableCell>
                        <TableCell className="text-white">₹{subscription.amount}</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell className="text-white">{subscription.startDate}</TableCell>
                        <TableCell className="text-white">{subscription.endDate}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white">
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

      {/* Plan Creation/Editing Dialog */}
      <Dialog open={showPlanDialog} onOpenChange={setShowPlanDialog}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-white">{editingPlan ? 'Edit Member Plan' : 'Create New Member Plan'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingPlan ? 'Update the details of this member plan.' : 'Fill in the details for the new member plan.'}
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
                  placeholder="e.g. Basic Member, Premium Member"
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
                  placeholder="e.g. 39"
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
                  placeholder="e.g. 50"
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
                  placeholder="e.g. 2"
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
                  placeholder="e.g. Member Management, Basic Attendance Tracking, Email Support"
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

export default GymOwnerPlans;