import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, User, Edit, Trash2, Calendar, Target, X, AlertCircle, CreditCard } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import QRPaymentModal from "@/components/payment/QRPaymentModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const NewMembers = () => {
  const { createMember, updateMember, deleteMember, isGymOwner, users, fetchUsers, user, subscription, authFetch, checkSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  
  // State for member list and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [members, setMembers] = useState([]);
  
  // State for add member form
  const [showAddForm, setShowAddForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    goal: 'weight-loss',
    planType: 'Basic',
    requiresTrainer: false,
    membershipDuration: '1',
    fitnessGoalDescription: ''
  });
  
  // State for payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMemberData, setPendingMemberData] = useState(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // State for messages
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State for subscription info
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    maxMembers: 0,
    currentMembers: 0,
    hasActiveSubscription: false,
    membershipFee: 500 // Default membership fee
  });
  
  // State for member details modal
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  
  // State for editing member
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load data only once when component mounts
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        if (fetchUsers) {
          await fetchUsers();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (isMounted) {
          setMessage({ type: 'error', text: 'Failed to load data' });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - run only once on mount
  
  // Check subscription status only once when user changes
  useEffect(() => {
    let isMounted = true;
    
    if (user && isGymOwner && checkSubscriptionStatus) {
      const checkStatus = async () => {
        try {
          await checkSubscriptionStatus(user._id);
        } catch (error) {
          console.error('Error checking subscription status:', error);
        }
      };
      
      checkStatus();
    }
    
    return () => {
      isMounted = false;
    };
  }, [user, isGymOwner, checkSubscriptionStatus]);
  
  // Update subscription info when subscription changes
  useEffect(() => {
    if (!user || !isGymOwner || !subscription) return;
    
    // Get subscription info
    const hasActiveSubscription = subscription?.hasActiveSubscription || false;
    const plan = subscription?.subscription?.plan || 'Basic';
    
    // Set max members based on plan
    let maxMembers = 200; // Default for Basic plan
    if (plan === 'Premium') maxMembers = 500;
    if (plan === 'Enterprise') maxMembers = 1000;
    
    // Count current members
    const currentMembers = users ? users.filter(u => u.role === 'member').length : 0;
    
    setSubscriptionInfo(prevState => {
      // Only update if values have changed
      if (
        prevState.maxMembers !== maxMembers ||
        prevState.currentMembers !== currentMembers ||
        prevState.hasActiveSubscription !== hasActiveSubscription
      ) {
        return {
          maxMembers,
          currentMembers,
          hasActiveSubscription,
          membershipFee: 500 // Default membership fee
        };
      }
      return prevState;
    });
  }, [subscription, users, user, isGymOwner]);

  // Process users to get members
  useEffect(() => {
    if (!users) return;
    
    // Filter users to get only members
    const membersList = users
      .filter(user => user.role === 'member')
      .map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        mobile: member.phone || '',
        gender: member.gender || 'Not specified',
        goal: member.goal || 'general-fitness',
        membershipStatus: member.membershipStatus || 'Active',
        planType: member.planType || 'Basic',
        requiresTrainer: member.requiresTrainer || false
      }));
    
    setMembers(membersList);
  }, [users]); // Only depend on users

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  // Handle next step
  const handleNextStep = (e) => {
    e.preventDefault();
    
    if (currentStep === 1) {
      // Validate basic information
      if (!formData.name || !formData.email || !formData.password || !formData.mobile) {
        setMessage({ type: 'error', text: 'Please fill in all required fields' });
        return;
      }
      
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
      }
      
      setMessage({ type: '', text: '' });
      setCurrentStep(2);
      return;
    }
    
    if (currentStep === 2) {
      // Validate membership details
      if (!formData.goal || !formData.fitnessGoalDescription) {
        setMessage({ type: 'error', text: 'Please specify fitness goal and description' });
        return;
      }
      
      // Calculate membership fee
      const baseFee = subscriptionInfo.membershipFee;
      const durationMultiplier = parseInt(formData.membershipDuration);
      const planMultiplier = formData.planType === 'Premium' ? 1.5 : 1;
      const trainerFee = formData.requiresTrainer ? 2000 : 0;
      
      const totalFee = (baseFee * durationMultiplier * planMultiplier) + trainerFee;
      
      // Store the member data with calculated fee and show payment modal
      setPendingMemberData({
        ...formData,
        calculatedFee: totalFee
      });
      
      setShowPaymentModal(true);
      setMessage({ type: 'info', text: 'Please complete the payment to create the member' });
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      goal: 'weight-loss',
      planType: 'Basic',
      requiresTrainer: false,
      membershipDuration: '1',
      fitnessGoalDescription: ''
    });
    setCurrentStep(1);
    setMessage({ type: '', text: '' });
  };

  // Handle payment completion
  const handlePaymentComplete = async (paymentData) => {
    if (!pendingMemberData) return;
    
    setFormSubmitting(true);
    setMessage({ type: 'info', text: 'Creating member...' });
    
    try {
      // Generate a membership ID for the new member
      const membershipId = generateMembershipId(pendingMemberData.name);
      
      // Add payment information and membership ID to the member data
      const memberDataWithPayment = {
        ...pendingMemberData,
        paymentStatus: 'Paid',
        paymentId: paymentData.paymentId,
        paymentAmount: paymentData.amount || pendingMemberData.calculatedFee,
        paymentDate: paymentData.timestamp,
        membershipId: membershipId
      };
      
      // Create the member
      const result = await createMember(memberDataWithPayment);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        resetForm();
        setShowAddForm(false);
        setShowPaymentModal(false);
        setPendingMemberData(null);
        
        // Refresh members list
        await fetchUsers();
        
        // Show success toast with membership card info
        toast.success(
          <div>
            <p>Member created successfully!</p>
            <p className="text-sm mt-1">Membership card generated with ID: <span className="font-mono font-bold">{membershipId}</span></p>
          </div>
        );
      } else {
        setMessage({ type: 'error', text: result.message });
        setShowPaymentModal(false);
      }
    } catch (error) {
      console.error('Error creating member:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating the member' });
      setShowPaymentModal(false);
    } finally {
      setFormSubmitting(false);
    }
  };

  // Filter members based on search term and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = filterGoal === "all" || member.goal === filterGoal;
    const matchesStatus = filterStatus === "all" || member.membershipStatus === filterStatus;
    return matchesSearch && matchesGoal && matchesStatus;
  });

  // Get goal badge
  const getGoalBadge = (goal) => {
    const goalConfig = {
      'weight-loss': { variant: 'destructive', label: 'Weight Loss' },
      'weight-gain': { variant: 'default', label: 'Weight Gain' },
      'general-fitness': { variant: 'secondary', label: 'General Fitness' }
    };
    const config = goalConfig[goal] || { variant: 'outline', label: goal };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const variant = status === 'Active' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  // Member stats
  const memberStats = {
    total: members.length,
    active: members.filter(m => m.membershipStatus === 'Active').length,
    weightLoss: members.filter(m => m.goal === 'weight-loss').length,
    weightGain: members.filter(m => m.goal === 'weight-gain').length,
    premium: members.filter(m => m.planType === 'Premium').length
  };
  
  // Function to generate a random membership ID
  const generateMembershipId = (name) => {
    const prefix = "GYM";
    const namePart = name.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${namePart}-${randomNum}`;
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Member Management</h1>
            <p className="text-gray-400">Manage gym members, assignments, and goals</p>
          </div>
          {isGymOwner && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 mt-4 md:mt-0"
              onClick={() => {
                console.log("Add Member button clicked");
                setShowAddForm(true);
                resetForm();
              }}
              disabled={!subscriptionInfo.hasActiveSubscription || subscriptionInfo.currentMembers >= subscriptionInfo.maxMembers}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Member
            </Button>
          )}
        </div>
        
        {/* Subscription Warning */}
        {isGymOwner && !subscriptionInfo.hasActiveSubscription && (
          <Card className="bg-red-900/20 border-red-800 mb-6">
            <CardContent className="p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-300">Inactive Subscription</h4>
                <p className="text-red-200 text-sm">Your subscription is inactive. Please renew your subscription to add new members.</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-red-700 text-red-300 hover:bg-red-900/50"
                  onClick={() => navigate('/subscription')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Member Limit Warning */}
        {isGymOwner && subscriptionInfo.hasActiveSubscription && subscriptionInfo.currentMembers >= subscriptionInfo.maxMembers && (
          <Card className="bg-amber-900/20 border-amber-800 mb-6">
            <CardContent className="p-4 flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-300">Member Limit Reached</h4>
                <p className="text-amber-200 text-sm">
                  You have reached the maximum member limit ({subscriptionInfo.maxMembers}) for your subscription plan.
                  Please upgrade your plan to add more members.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 border-amber-700 text-amber-300 hover:bg-amber-900/50"
                  onClick={() => navigate('/subscription')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Users className="h-8 w-8 text-blue-400 mb-2" />
              <p className="text-gray-400 text-sm">Total Members</p>
              <h3 className="text-2xl font-bold text-white">{memberStats.total}</h3>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <User className="h-8 w-8 text-green-400 mb-2" />
              <p className="text-gray-400 text-sm">Active Members</p>
              <h3 className="text-2xl font-bold text-white">{memberStats.active}</h3>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Target className="h-8 w-8 text-red-400 mb-2" />
              <p className="text-gray-400 text-sm">Weight Loss</p>
              <h3 className="text-2xl font-bold text-white">{memberStats.weightLoss}</h3>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <Target className="h-8 w-8 text-blue-400 mb-2" />
              <p className="text-gray-400 text-sm">Weight Gain</p>
              <h3 className="text-2xl font-bold text-white">{memberStats.weightGain}</h3>
            </CardContent>
          </Card>
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-4 flex flex-col items-center justify-center">
              <CreditCard className="h-8 w-8 text-purple-400 mb-2" />
              <p className="text-gray-400 text-sm">Premium Members</p>
              <h3 className="text-2xl font-bold text-white">{memberStats.premium}</h3>
            </CardContent>
          </Card>
        </div>
        
        {/* Search and Filters */}
        <Card className="bg-gray-800/50 border-gray-700 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="Search members..."
                    className="pl-8 bg-gray-700 border-gray-600 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex flex-col md:flex-row gap-4">
                <div>
                  <select
                    className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                    value={filterGoal}
                    onChange={(e) => setFilterGoal(e.target.value)}
                  >
                    <option value="all">All Goals</option>
                    <option value="weight-loss">Weight Loss</option>
                    <option value="weight-gain">Weight Gain</option>
                    <option value="general-fitness">General Fitness</option>
                  </select>
                </div>
                <div>
                  <select
                    className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Members Cards */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader className="pb-0">
            <CardTitle className="text-white">Member Cards</CardTitle>
            <CardDescription className="text-gray-400">
              {filteredMembers.length} members found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">Loading members...</p>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400">No members found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMembers.map((member) => (
                  <Card key={member.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white">{member.name}</h3>
                          <p className="text-sm text-gray-400">{member.email}</p>
                        </div>
                        <div>
                          {getStatusBadge(member.membershipStatus)}
                        </div>
                      </div>
                      
                      <div className="bg-gray-900 p-3 rounded-lg mb-4 border border-gray-700">
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400 text-sm">Membership ID</span>
                          <span className="text-white font-mono">{member.membershipId || `GYM-${member.name.substring(0, 3).toUpperCase()}-${member.id?.substring(0, 4)}`}</span>
                        </div>
                        <div className="flex justify-between mb-2">
                          <span className="text-gray-400 text-sm">Plan</span>
                          <span className="text-white">{member.planType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400 text-sm">Goal</span>
                          <span>{getGoalBadge(member.goal)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-gray-400">
                            <span className="mr-2">📱</span>{member.mobile || 'No mobile'}
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 hover:text-white"
                              onClick={() => {
                                setSelectedMember(member);
                                setEditFormData({
                                  id: member.id,
                                  name: member.name,
                                  email: member.email,
                                  mobile: member.mobile,
                                  goal: member.goal,
                                  planType: member.planType,
                                  requiresTrainer: member.requiresTrainer,
                                  membershipStatus: member.membershipStatus
                                });
                                setIsEditing(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-gray-400 hover:text-white"
                              onClick={() => {
                                setSelectedMember(member);
                                setIsDeleting(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* View Details Button */}
                        <Button 
                          className="w-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-800"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowMemberDetails(true);
                          }}
                        >
                          View Member Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Add Member Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-gray-800 z-10">
                <div>
                  <CardTitle className="text-white">Add New Member</CardTitle>
                  <CardDescription className="text-gray-400">
                    {currentStep === 1 ? "Step 1: Basic Information" : "Step 2: Membership Details"}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAddForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Step indicator */}
                <div className="flex items-center justify-center">
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-700'
                  }`}>
                    <span className="text-white text-sm">1</span>
                  </div>
                  <div className={`h-1 w-16 mx-2 ${
                    currentStep > 1 ? 'bg-blue-600' : 'bg-gray-700'
                  }`}></div>
                  <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                    currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'
                  }`}>
                    <span className="text-white text-sm">2</span>
                  </div>
                </div>
                
                {/* Step 1: Basic Information */}
                {currentStep === 1 && (
                  <form onSubmit={handleNextStep} className="space-y-6">
                    <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-white">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="name" className="mb-2 block text-gray-300">Full Name *</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="mb-2 block text-gray-300">Email Address *</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter email address"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="password" className="mb-2 block text-gray-300">Password *</Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            placeholder="Enter password (min 6 characters)"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="mobile" className="mb-2 block text-gray-300">Mobile Number *</Label>
                          <Input
                            id="mobile"
                            name="mobile"
                            value={formData.mobile}
                            onChange={handleInputChange}
                            placeholder="Enter mobile number"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-end">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => setShowAddForm(false)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                      >
                        Next Step
                      </Button>
                    </div>
                    
                    {/* Display message */}
                    {message.text && (
                      <div className={`mt-6 p-4 rounded-lg flex items-center ${
                        message.type === 'error' 
                          ? 'bg-red-900/50 text-red-200 border border-red-700' 
                          : message.type === 'info'
                            ? 'bg-blue-900/50 text-blue-200 border border-blue-700'
                            : 'bg-green-900/50 text-green-200 border border-green-700'
                      }`}>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <div>{message.text}</div>
                      </div>
                    )}
                  </form>
                )}
                
                {/* Step 2: Membership Details */}
                {currentStep === 2 && (
                  <form onSubmit={handleNextStep} className="space-y-6">
                    <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-white">Gym Membership Requirements</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                        <div>
                          <Label htmlFor="goal" className="mb-2 block text-gray-300">Fitness Goal *</Label>
                          <select
                            id="goal"
                            name="goal"
                            value={formData.goal}
                            onChange={handleInputChange}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="weight-loss">Weight Loss</option>
                            <option value="weight-gain">Weight Gain</option>
                            <option value="general-fitness">General Fitness</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="requiresTrainer" className="mb-2 block text-gray-300">Requires Trainer? *</Label>
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              id="requiresTrainer"
                              name="requiresTrainer"
                              checked={formData.requiresTrainer}
                              onChange={handleCheckboxChange}
                              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-600"
                            />
                            <label htmlFor="requiresTrainer" className="ml-2 text-gray-300">
                              Yes, assign a trainer (additional fee applies)
                            </label>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="fitnessGoalDescription" className="mb-2 block text-gray-300">
                            Reason for joining gym / Fitness goals *
                          </Label>
                          <textarea
                            id="fitnessGoalDescription"
                            name="fitnessGoalDescription"
                            value={formData.fitnessGoalDescription}
                            onChange={handleInputChange}
                            placeholder="Describe why you're joining the gym and what you want to achieve"
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2 min-h-[100px]"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-white">Membership Plan</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                          <Label htmlFor="planType" className="mb-2 block text-gray-300">Plan Type *</Label>
                          <select
                            id="planType"
                            name="planType"
                            value={formData.planType}
                            onChange={handleInputChange}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="Basic">Basic</option>
                            <option value="Premium">Premium</option>
                          </select>
                          <p className="text-sm text-gray-400 mt-1">
                            {formData.planType === 'Basic' ? 
                              'Basic plan includes standard gym access' : 
                              'Premium plan includes all facilities and priority booking'}
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="membershipDuration" className="mb-2 block text-gray-300">Duration *</Label>
                          <select
                            id="membershipDuration"
                            name="membershipDuration"
                            value={formData.membershipDuration}
                            onChange={handleInputChange}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="1">1 Year</option>
                            <option value="2">2 Years</option>
                            <option value="3">3 Years</option>
                          </select>
                          <p className="text-sm text-gray-400 mt-1">
                            Longer durations offer better value
                          </p>
                        </div>
                      </div>
                      
                      {/* Payment summary */}
                      <div className="mt-6 p-4 bg-blue-900/20 border border-blue-800 rounded-lg">
                        <h5 className="font-medium text-blue-400 mb-2">Payment Summary</h5>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-gray-300">Base Membership Fee</p>
                            <p className="text-white">₹{subscriptionInfo.membershipFee}</p>
                          </div>
                          {formData.planType === 'Premium' && (
                            <div className="flex justify-between">
                              <p className="text-gray-300">Premium Plan</p>
                              <p className="text-white">x1.5</p>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <p className="text-gray-300">Duration</p>
                            <p className="text-white">x{formData.membershipDuration} year(s)</p>
                          </div>
                          {formData.requiresTrainer && (
                            <div className="flex justify-between">
                              <p className="text-gray-300">Trainer Fee</p>
                              <p className="text-white">₹2,000</p>
                            </div>
                          )}
                          <div className="border-t border-blue-800 pt-2 mt-2">
                            <div className="flex justify-between font-bold">
                              <p className="text-gray-300">Total Amount</p>
                              <p className="text-white">₹{
                                (subscriptionInfo.membershipFee * 
                                parseInt(formData.membershipDuration) * 
                                (formData.planType === 'Premium' ? 1.5 : 1)) + 
                                (formData.requiresTrainer ? 2000 : 0)
                              }</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 justify-end">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handlePreviousStep}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        Previous Step
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                      >
                        Proceed to Payment
                      </Button>
                    </div>
                    
                    {/* Display message */}
                    {message.text && (
                      <div className={`mt-6 p-4 rounded-lg flex items-center ${
                        message.type === 'error' 
                          ? 'bg-red-900/50 text-red-200 border border-red-700' 
                          : message.type === 'info'
                            ? 'bg-blue-900/50 text-blue-200 border border-blue-700'
                            : 'bg-green-900/50 text-green-200 border border-green-700'
                      }`}>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        <div>{message.text}</div>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* QR Payment Modal */}
        {showPaymentModal && pendingMemberData && (
          <QRPaymentModal
            isOpen={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setPendingMemberData(null);
              setMessage({ type: '', text: '' });
            }}
            onPaymentComplete={handlePaymentComplete}
            memberData={pendingMemberData}
            paymentAmount={pendingMemberData.calculatedFee || subscriptionInfo.membershipFee}
            paymentDescription={`Gym Membership Fee for ${pendingMemberData?.name || 'New Member'} (${pendingMemberData?.membershipDuration || '1'} Year ${pendingMemberData?.planType || 'Basic'} Plan${pendingMemberData?.requiresTrainer ? ' with Trainer' : ''})`}
          />
        )}
        
        {/* Member Details Modal */}
        {showMemberDetails && selectedMember && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-gray-800 z-10">
                <div>
                  <CardTitle className="text-white">Member Details</CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete information about {selectedMember.name}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowMemberDetails(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Membership Card */}
                <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg overflow-hidden border border-blue-700">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white">{selectedMember.name}</h3>
                        <p className="text-gray-300">{selectedMember.email}</p>
                        <p className="text-gray-300 mt-1">{selectedMember.mobile || 'No mobile'}</p>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="mb-2">
                          {getStatusBadge(selectedMember.membershipStatus)}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-300">Membership ID</p>
                          <p className="font-mono text-white font-bold">{selectedMember.membershipId || `GYM-${selectedMember.name.substring(0, 3).toUpperCase()}-${selectedMember.id?.substring(0, 4)}`}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-900/40 p-3 rounded-lg border border-blue-800">
                        <p className="text-sm text-gray-300 mb-1">Plan Type</p>
                        <p className="text-lg font-semibold text-white">{selectedMember.planType}</p>
                      </div>
                      <div className="bg-blue-900/40 p-3 rounded-lg border border-blue-800">
                        <p className="text-sm text-gray-300 mb-1">Fitness Goal</p>
                        <div>{getGoalBadge(selectedMember.goal)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Membership Details */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Membership Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-sm text-gray-400">Membership Status</p>
                      <p className="text-white">{selectedMember.membershipStatus}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Membership Type</p>
                      <p className="text-white">{selectedMember.planType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Start Date</p>
                      <p className="text-white">{new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Expiry Date</p>
                      <p className="text-white">{new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Requires Trainer</p>
                      <p className="text-white">{selectedMember.requiresTrainer ? 'Yes' : 'No'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Gender</p>
                      <p className="text-white">{selectedMember.gender}</p>
                    </div>
                  </div>
                </div>
                
                {/* Payment History */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Payment History</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableHead className="text-gray-400">Date</TableHead>
                          <TableHead className="text-gray-400">Amount</TableHead>
                          <TableHead className="text-gray-400">Payment ID</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow className="border-gray-700 hover:bg-gray-800/50">
                          <TableCell className="text-gray-300">{new Date().toLocaleDateString()}</TableCell>
                          <TableCell className="text-gray-300">₹{subscriptionInfo.membershipFee}</TableCell>
                          <TableCell className="font-mono text-gray-300">PAY-{Math.floor(100000 + Math.random() * 900000)}</TableCell>
                          <TableCell>
                            <Badge variant="default">Paid</Badge>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex flex-wrap gap-4 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowMemberDetails(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Close
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setEditFormData({
                        id: selectedMember.id,
                        name: selectedMember.name,
                        email: selectedMember.email,
                        mobile: selectedMember.mobile,
                        goal: selectedMember.goal,
                        planType: selectedMember.planType,
                        requiresTrainer: selectedMember.requiresTrainer,
                        membershipStatus: selectedMember.membershipStatus
                      });
                      setIsEditing(true);
                      setShowMemberDetails(false);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Member
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      setIsDeleting(true);
                      setShowMemberDetails(false);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Member
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Edit Member Modal */}
        {isEditing && editFormData && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Edit Member</CardTitle>
                  <CardDescription className="text-gray-400">
                    Update member information
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name" className="text-gray-300">Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editFormData.name} 
                    onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-email" className="text-gray-300">Email</Label>
                  <Input 
                    id="edit-email" 
                    value={editFormData.email} 
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-mobile" className="text-gray-300">Mobile</Label>
                  <Input 
                    id="edit-mobile" 
                    value={editFormData.mobile} 
                    onChange={(e) => setEditFormData({...editFormData, mobile: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-goal" className="text-gray-300">Fitness Goal</Label>
                  <select
                    id="edit-goal"
                    value={editFormData.goal}
                    onChange={(e) => setEditFormData({...editFormData, goal: e.target.value})}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                  >
                    <option value="weight-loss">Weight Loss</option>
                    <option value="weight-gain">Weight Gain</option>
                    <option value="general-fitness">General Fitness</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-plan" className="text-gray-300">Plan Type</Label>
                  <select
                    id="edit-plan"
                    value={editFormData.planType}
                    onChange={(e) => setEditFormData({...editFormData, planType: e.target.value})}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                  >
                    <option value="Basic">Basic</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-status" className="text-gray-300">Membership Status</Label>
                  <select
                    id="edit-status"
                    value={editFormData.membershipStatus}
                    onChange={(e) => setEditFormData({...editFormData, membershipStatus: e.target.value})}
                    className="w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-trainer"
                    checked={editFormData.requiresTrainer}
                    onChange={(e) => setEditFormData({...editFormData, requiresTrainer: e.target.checked})}
                    className="rounded border-gray-600 text-blue-600"
                  />
                  <Label htmlFor="edit-trainer" className="text-gray-300">Requires Trainer</Label>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={async () => {
                    try {
                      // Call the updateMember function from AuthContext
                      if (updateMember) {
                        const result = await updateMember(editFormData);
                        
                        if (result.success) {
                          toast.success("Member updated successfully");
                          setIsEditing(false);
                          
                          // Refresh the members list
                          await fetchUsers();
                        } else {
                          toast.error(result.message || "Failed to update member");
                        }
                      } else {
                        toast.error("Update function not available");
                      }
                    } catch (error) {
                      console.error("Error updating member:", error);
                      toast.error("An error occurred while updating the member");
                    }
                  }}
                >
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
        
        {/* Delete Confirmation Modal */}
        {isDeleting && selectedMember && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Confirm Deletion</CardTitle>
                  <CardDescription className="text-gray-400">
                    Are you sure you want to delete this member?
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setIsDeleting(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <CardContent>
                <div className="bg-red-900/20 p-4 rounded-lg border border-red-800 mb-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-300">This action cannot be undone. This will permanently delete the member:</p>
                      <p className="font-semibold text-white mt-2">{selectedMember.name}</p>
                      <p className="text-gray-400">{selectedMember.email}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDeleting(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  variant="destructive"
                  onClick={async () => {
                    try {
                      // Call the deleteMember function from AuthContext
                      if (deleteMember) {
                        const result = await deleteMember(selectedMember.id);
                        
                        if (result.success) {
                          toast.success("Member deleted successfully");
                          setIsDeleting(false);
                          setSelectedMember(null);
                          
                          // Refresh the members list
                          await fetchUsers();
                        } else {
                          toast.error(result.message || "Failed to delete member");
                        }
                      } else {
                        toast.error("Delete function not available");
                      }
                    } catch (error) {
                      console.error("Error deleting member:", error);
                      toast.error("An error occurred while deleting the member");
                    }
                  }}
                >
                  Delete Member
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NewMembers;