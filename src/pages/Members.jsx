import { useState, useEffect, useCallback } from "react";
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

const Members = () => {
  const { createMember, isGymOwner, users, fetchUsers, user, subscription, authFetch, checkSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  // Initial form data with default values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    gender: 'Male',
    dob: '',
    goal: 'weight-loss',
    planType: 'Basic Member', // Will be updated after gymOwnerPlans is loaded
    address: '',
    whatsapp: '',
    height: '',
    weight: '',
    emergencyContact: '',
    medicalConditions: '',
    requiresTrainer: false,
    membershipDuration: '1', // in years
    fitnessGoalDescription: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [realMembers, setRealMembers] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMemberData, setPendingMemberData] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: Basic Info, 2: Membership Details, 3: Review
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    maxMembers: 0,
    currentMembers: 0,
    hasActiveSubscription: false,
    membershipFee: 500 // Default membership fee
  });
  
  // State for gym owner plans
  const [gymOwnerPlans, setGymOwnerPlans] = useState([
    {
      id: "basic-member",
      name: "Basic Member",
      price: 19,
      duration: "monthly",
      features: ["Member Management", "Basic Attendance Tracking", "Email Support"],
      status: "Active"
    },
    {
      id: "premium-member",
      name: "Premium Member",
      price: 39,
      duration: "monthly",
      features: ["All Basic Features", "Fitness Progress Tracking", "Workout Plans", "Priority Support"],
      status: "Active",
      recommended: true
    },
    {
      id: "elite-member",
      name: "Elite Member",
      price: 79,
      duration: "monthly",
      features: ["All Premium Features", "Nutrition Planning", "Personal Training Sessions", "24/7 Support"],
      status: "Active"
    }
  ]);
  
  // Fetch gym owner plans
  const fetchGymOwnerPlans = async () => {
    if (!user || !isGymOwner) return;
    
    try {
      const response = await authFetch('/gym-owner-plans');
      
      if (response.success || response.status === 'success') {
        setGymOwnerPlans(response.data.plans);
      } else {
        // If API fails, keep the default plans
        console.log('Using default gym owner plans');
      }
    } catch (error) {
      console.error('Error fetching gym owner plans:', error);
      // Keep using the default plans
    }
  };

  // Fetch subscription info to check member limits
  const fetchSubscriptionInfo = async () => {
    if (!user || !isGymOwner) return;
    
    try {
      // Get current subscription info
      const hasActiveSubscription = subscription?.hasActiveSubscription || false;
      
      // Get subscription plan details
      try {
        // Use the authFetch function which already has the API_URL prefix
        const response = await authFetch(`/subscriptions/details/${user._id}`);
        
        if (response.success !== false) {
          const plan = response.data?.subscription?.plan || 'Basic';
          
          // Set max members based on plan
          let maxMembers = 200; // Default for Basic plan
          if (plan === 'Premium') maxMembers = 500;
          if (plan === 'Enterprise') maxMembers = 1000;
          
          // Count current members
          const currentMembers = users.filter(u => u.role === 'member').length;
          
          setSubscriptionInfo({
            maxMembers,
            currentMembers,
            hasActiveSubscription,
            membershipFee: 500 // Default membership fee
          });
          return;
        }
      } catch (apiError) {
        console.error('API error:', apiError);
        // Continue to fallback
      }
      
      // Fallback if API call fails
      // Use subscription from context if available
      const plan = subscription?.subscription?.plan || 'Basic';
      
      // Set max members based on plan
      let maxMembers = 200; // Default for Basic plan
      if (plan === 'Premium') maxMembers = 500;
      if (plan === 'Enterprise') maxMembers = 1000;
      
      // Count current members
      const currentMembers = users.filter(u => u.role === 'member').length;
      
      setSubscriptionInfo({
        maxMembers,
        currentMembers,
        hasActiveSubscription,
        membershipFee: 500 // Default membership fee
      });
    } catch (error) {
      console.error('Error fetching subscription info:', error);
      // Set default values
      setSubscriptionInfo({
        maxMembers: 200,
        currentMembers: users.filter(u => u.role === 'member').length,
        hasActiveSubscription: false,
        membershipFee: 500
      });
    }
  };

  // Combined data loading effect to reduce re-renders
  useEffect(() => {
    const loadData = async () => {
      if (!isLoading) setIsLoading(true);
      
      try {
        // Step 1: Fetch users
        await fetchUsers();
        
        // Step 2: Check subscription status if user is gym owner
        if (user && isGymOwner && checkSubscriptionStatus) {
          await checkSubscriptionStatus(user._id);
        }
        
        // Step 3: Fetch subscription info if needed
        if (user && isGymOwner && users.length > 0) {
          await fetchSubscriptionInfo();
        }
        
        // Step 4: Fetch gym owner plans
        if (user && isGymOwner) {
          await fetchGymOwnerPlans();
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage({ type: 'error', text: 'Failed to load data' });
      }
    };
    
    loadData();
    // We'll set isLoading to false after processing the data in the next useEffect
  }, [fetchUsers, user, isGymOwner, checkSubscriptionStatus]);

  // Process users to get members - only runs when users array changes
  useEffect(() => {
    if (!users || users.length === 0) return;
    
    // Filter users to get only members
    const members = users
      .filter(user => user.role === 'member')
      .map(member => ({
        id: member._id,
        name: member.name,
        email: member.email,
        mobile: member.phone || '',
        whatsapp: member.whatsapp || '',
        gender: member.gender || 'Not specified',
        dob: member.dob || '',
        joinDate: member.createdAt || new Date().toISOString(),
        assignedTrainer: member.assignedTrainer || 'Not assigned',
        goal: member.goal || 'general-fitness',
        membershipStatus: member.membershipStatus || 'Active',
        planType: member.planType || 'Basic',
        profileImage: member.profileImage || null,
        address: member.address || '',
        height: member.height || '',
        weight: member.weight || '',
        emergencyContact: member.emergencyContact || '',
        medicalConditions: member.medicalConditions || '',
        lastCheckIn: member.lastCheckIn || '',
        attendanceRate: member.attendanceRate || '0%',
        paymentStatus: member.paymentStatus || 'Paid',
        notes: member.notes || ''
      }));
    
    setRealMembers(members);
    // Only set loading to false after we've processed the data
    setIsLoading(false);
  }, [users]);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const filteredMembers = realMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (member.assignedTrainer && member.assignedTrainer.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
    const matchesGoal = filterGoal === "all" || member.goal === filterGoal;
    const matchesStatus = filterStatus === "all" || member.membershipStatus === filterStatus;
    return matchesSearch && matchesGoal && matchesStatus;
  });

  const getGoalBadge = (goal) => {
    const goalConfig = {
      'weight-loss': { variant: 'destructive', label: 'Weight Loss' },
      'weight-gain': { variant: 'default', label: 'Weight Gain' },
      'general-fitness': { variant: 'secondary', label: 'General Fitness' }
    };
    const config = goalConfig[goal] || { variant: 'outline', label: goal };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variant = status === 'Active' ? 'default' : 'destructive';
    return <Badge variant={variant}>{status}</Badge>;
  };

  const getPlanBadge = (plan) => {
    const variant = plan === 'Premium' ? 'default' : 'secondary';
    return <Badge variant={variant}>{plan}</Badge>;
  };

  const memberStats = {
    total: realMembers.length,
    active: realMembers.filter(m => m.membershipStatus === 'Active').length,
    weightLoss: realMembers.filter(m => m.goal === 'weight-loss').length,
    weightGain: realMembers.filter(m => m.goal === 'weight-gain').length,
    premium: realMembers.filter(m => m.planType === 'Premium').length
  };

  // Memoized input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = () => {
    // Get the first plan name from gymOwnerPlans, or use "Basic Member" as fallback
    const defaultPlanName = gymOwnerPlans.length > 0 ? gymOwnerPlans[0].name : "Basic Member";
    
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      gender: 'Male',
      dob: '',
      goal: 'weight-loss',
      planType: defaultPlanName,
      address: '',
      whatsapp: '',
      height: '',
      weight: '',
      emergencyContact: '',
      medicalConditions: '',
      requiresTrainer: false,
      membershipDuration: '1',
      fitnessGoalDescription: ''
    });
    setMessage({ type: '', text: '' });
    setFormStep(1); // Reset to first step
  };

  const handleViewMember = (member) => {
    setSelectedMember(member);
    setShowDetailView(true);
  };
  
  const handleCloseDetailView = () => {
    setSelectedMember(null);
    setShowDetailView(false);
  };
  
  // State for form submission
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentData) => {
    if (!pendingMemberData) return;
    
    setFormSubmitting(true);
    setMessage({ type: 'info', text: 'Creating member...' });
    
    try {
      // Add payment information to the member data
      const memberDataWithPayment = {
        ...pendingMemberData,
        paymentStatus: 'Paid',
        paymentId: paymentData.paymentId,
        paymentAmount: paymentData.amount || pendingMemberData.calculatedFee,
        paymentDate: paymentData.timestamp,
        // Include the new fields
        requiresTrainer: pendingMemberData.requiresTrainer || false,
        membershipDuration: pendingMemberData.membershipDuration || '1',
        fitnessGoalDescription: pendingMemberData.fitnessGoalDescription || ''
      };
      
      // Create the member
      const result = await createMember(memberDataWithPayment);
      
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        resetForm();
        setShowAddForm(false);
        setShowPaymentModal(false);
        setPendingMemberData(null);
        setFormStep(1); // Reset to first step
        
        // Refresh members list
        await fetchUsers();
        
        // Show success toast
        toast.success("Member created successfully with payment verification");
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
  
  // Handle form step navigation - memoized to prevent unnecessary re-renders
  const handleNextStep = useCallback((e) => {
    e.preventDefault();
    
    // Validate current step
    if (formStep === 1) {
      // Validate basic information
      if (!formData.name || !formData.email || !formData.password) {
        setMessage({ type: 'error', text: 'Name, email, and password are required' });
        return;
      }
      
      // Validate password length
      if (formData.password.length < 6) {
        setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
        return;
      }
      
      // Clear any error messages
      setMessage({ type: '', text: '' });
      
      // Move to next step
      setFormStep(2);
      return;
    }
    
    if (formStep === 2) {
      // Validate membership details
      if (!formData.goal || !formData.fitnessGoalDescription) {
        setMessage({ type: 'error', text: 'Please specify fitness goal and description' });
        return;
      }
      
      // Clear any error messages
      setMessage({ type: '', text: '' });
      
      // Move to final review step
      setFormStep(3);
      return;
    }
  }, [formStep, formData]);
  
  const handlePreviousStep = useCallback(() => {
    if (formStep > 1) {
      setFormStep(formStep - 1);
    }
  }, [formStep]);
  
  const handleCreateMember = useCallback(async (e) => {
    e.preventDefault();
    
    // Check subscription status
    if (!subscriptionInfo.hasActiveSubscription) {
      setMessage({ 
        type: 'error', 
        text: 'Your subscription is inactive. Please renew your subscription to add members.' 
      });
      return;
    }
    
    // Check if member limit is reached
    if (subscriptionInfo.currentMembers >= subscriptionInfo.maxMembers) {
      setMessage({ 
        type: 'error', 
        text: `You have reached the maximum member limit (${subscriptionInfo.maxMembers}) for your subscription plan. Please upgrade your plan to add more members.` 
      });
      return;
    }
    
    // Find the selected plan
    const selectedPlan = gymOwnerPlans.find(plan => plan.name === formData.planType) || gymOwnerPlans[0];
    
    // Calculate membership fee based on duration and plan
    const monthlyFee = selectedPlan.price || subscriptionInfo.membershipFee;
  const durationInMonths = parseInt(formData.membershipDuration) * 12; // Convert years to months
  const trainerFee = formData.requiresTrainer ? 2000 : 0;
    
    // Calculate total fee based on plan price, duration, and trainer fee
    const totalFee = (monthlyFee * durationInMonths) + trainerFee;
  
    
    // Store the member data with calculated fee and show payment modal
    setPendingMemberData({
      ...formData,
      calculatedFee: totalFee
    });
     setShowPaymentModal(true);
  setMessage({ type: 'info', text: 'Please complete the payment to create the member' });
}, [formData, subscriptionInfo, gymOwnerPlans, setMessage, setPendingMemberData, setShowPaymentModal]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">Member Management</h1>
              <p className="text-gray-400">Manage gym members, assignments, and goals</p>
            </div>
            {isGymOwner && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  console.log("Add Member button clicked");
                  setShowAddForm(true);
                  setFormStep(1); // Reset to first step
                  resetForm(); // Reset form data
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
            <Card className="bg-red-900/20 border-red-800">
              <CardContent className="p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Inactive Subscription</h3>
                  <p className="text-gray-300 text-sm">
                    Your subscription is inactive. Please renew your subscription to add new members.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-red-700 text-red-300 hover:bg-red-800/50"
                    onClick={() => navigate("/gym-owner-plans")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Renew Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Member Limit Warning */}
          {isGymOwner && subscriptionInfo.hasActiveSubscription && subscriptionInfo.currentMembers >= subscriptionInfo.maxMembers && (
            <Card className="bg-yellow-900/20 border-yellow-800">
              <CardContent className="p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Member Limit Reached</h3>
                  <p className="text-gray-300 text-sm">
                    You have reached the maximum member limit ({subscriptionInfo.maxMembers}) for your subscription plan.
                    Please upgrade your plan to add more members.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 border-yellow-700 text-yellow-300 hover:bg-yellow-800/50"
                    onClick={() => navigate("/gym-owner-plans")}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Upgrade Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Member Limit Info */}
          {isGymOwner && subscriptionInfo.hasActiveSubscription && subscriptionInfo.currentMembers < subscriptionInfo.maxMembers && (
            <Card className="bg-blue-900/20 border-blue-800">
              <CardContent className="p-4 flex items-start space-x-3">
                <Users className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Member Capacity</h3>
                  <p className="text-gray-300 text-sm">
                    You have {subscriptionInfo.currentMembers} out of {subscriptionInfo.maxMembers} members.
                    You can add {subscriptionInfo.maxMembers - subscriptionInfo.currentMembers} more members with your current plan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Member Detail View */}
          {showDetailView && selectedMember && (
            <Card key={`detail-${selectedMember.id}`} className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Member Details</CardTitle>
                  <CardDescription className="text-gray-400">
                    Complete information about {selectedMember.name}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleCloseDetailView}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Full Name</p>
                        <p className="text-white">{selectedMember.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Email Address</p>
                        <p className="text-white">{selectedMember.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Member ID</p>
                        <p className="text-white">{selectedMember.id}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Mobile Number</p>
                        <p className="text-white">{selectedMember.mobile || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">WhatsApp Number</p>
                        <p className="text-white">{selectedMember.whatsapp || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Address</p>
                        <p className="text-white">{selectedMember.address || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Emergency Contact</p>
                        <p className="text-white">{selectedMember.emergencyContact || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Membership Details */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Membership Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Join Date</p>
                        <p className="text-white">{new Date(selectedMember.joinDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Membership Status</p>
                        <div>{getStatusBadge(selectedMember.membershipStatus)}</div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Plan Type</p>
                        <div>{getPlanBadge(selectedMember.planType)}</div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Fitness Goal</p>
                        <div>{getGoalBadge(selectedMember.goal)}</div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Assigned Trainer</p>
                        <p className="text-white">{selectedMember.assignedTrainer}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Payment Status</p>
                        <p className="text-white">{selectedMember.paymentStatus || 'Not recorded'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Physical Information */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Physical Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Gender</p>
                        <p className="text-white">{selectedMember.gender}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Date of Birth</p>
                        <p className="text-white">{selectedMember.dob ? new Date(selectedMember.dob).toLocaleDateString() : 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Height</p>
                        <p className="text-white">{selectedMember.height || 'Not recorded'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Weight</p>
                        <p className="text-white">{selectedMember.weight || 'Not recorded'}</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm mb-1">Medical Conditions</p>
                      <p className="text-white">{selectedMember.medicalConditions || 'None recorded'}</p>
                    </div>
                  </div>
                  
                  {/* Attendance Information */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Attendance Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Last Check-in</p>
                        <p className="text-white">{selectedMember.lastCheckIn ? new Date(selectedMember.lastCheckIn).toLocaleString() : 'No check-ins recorded'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm mb-1">Attendance Rate</p>
                        <p className="text-white">{selectedMember.attendanceRate || '0%'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Notes */}
                  <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                    <h4 className="text-lg font-semibold mb-4 text-white">Notes</h4>
                    <p className="text-white">{selectedMember.notes || 'No notes recorded for this member.'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Add Member Form */}
          {showAddForm && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">Add New Member</CardTitle>
                  <CardDescription className="text-gray-400">
                    {formStep === 1 ? "Step 1: Basic Information" : 
                     formStep === 2 ? "Step 2: Membership Details" : 
                     "Step 3: Review & Payment"}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    resetForm();
                    setShowAddForm(false);
                  }}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent>
                {/* Step indicator */}
                <div className="mb-6 flex items-center justify-between">
                  <div className="w-full flex items-center">
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                      formStep >= 1 ? 'bg-blue-600' : 'bg-gray-700'
                    }`}>
                      <span className="text-white text-sm">1</span>
                    </div>
                    <div className={`h-1 flex-1 mx-2 ${
                      formStep > 1 ? 'bg-blue-600' : 'bg-gray-700'
                    }`}></div>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                      formStep >= 2 ? 'bg-blue-600' : 'bg-gray-700'
                    }`}>
                      <span className="text-white text-sm">2</span>
                    </div>
                    <div className={`h-1 flex-1 mx-2 ${
                      formStep > 2 ? 'bg-blue-600' : 'bg-gray-700'
                    }`}></div>
                    <div className={`rounded-full h-8 w-8 flex items-center justify-center ${
                      formStep >= 3 ? 'bg-blue-600' : 'bg-gray-700'
                    }`}>
                      <span className="text-white text-sm">3</span>
                    </div>
                  </div>
                </div>

                {/* Step 1: Basic Information */}
                {formStep === 1 && (
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
                    
                    <div className="flex flex-wrap gap-4 mt-6 justify-end">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => {
                          resetForm();
                          setShowAddForm(false);
                        }}
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
                        <div className={`mr-3 p-2 rounded-full ${
                          message.type === 'error' 
                            ? 'bg-red-800' 
                            : message.type === 'info'
                              ? 'bg-blue-800'
                              : 'bg-green-800'
                        }`}>
                          {message.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : message.type === 'info' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>{message.text}</div>
                      </div>
                    )}
                  </form>
                )}

                {/* Step 2: Membership Details */}
                {formStep === 2 && (
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
                          <select
                            id="requiresTrainer"
                            name="requiresTrainer"
                            value={formData.requiresTrainer.toString()}
                            onChange={(e) => setFormData({
                              ...formData,
                              requiresTrainer: e.target.value === "true"
                            })}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
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
                            {gymOwnerPlans.map(plan => (
                              <option key={plan.id} value={plan.name}>
                                {plan.name} (₹{plan.price}/{plan.duration})
                              </option>
                            ))}
                          </select>
                          <p className="text-sm text-gray-400 mt-1">
                            {gymOwnerPlans.find(plan => plan.name === formData.planType)?.features?.[0] || 
                             'Plan includes standard gym access'}
                          </p>
                          <div className="mt-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              className="text-xs border-gray-600 text-blue-400 hover:bg-gray-700"
                              onClick={() => navigate("/gym-owner-plans")}
                            >
                              Manage Member Plans
                            </Button>
                          </div>
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
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-6 justify-end">
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
                        <div className={`mr-3 p-2 rounded-full ${
                          message.type === 'error' 
                            ? 'bg-red-800' 
                            : message.type === 'info'
                              ? 'bg-blue-800'
                              : 'bg-green-800'
                        }`}>
                          {message.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : message.type === 'info' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>{message.text}</div>
                      </div>
                    )}
                  </form>
                )}

                {/* Step 3: Review & Payment */}
                {formStep === 3 && (
                  <form onSubmit={handleCreateMember} className="space-y-6">
                    <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                      <h4 className="text-lg font-semibold mb-4 text-white">Review Member Information</h4>
                      
                      <div className="space-y-4">
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-400 mb-2">Basic Information</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-sm">Full Name</p>
                              <p className="text-white">{formData.name}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Email Address</p>
                              <p className="text-white">{formData.email}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Mobile</p>
                              <p className="text-white">{formData.mobile || 'Not provided'}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Gender</p>
                              <p className="text-white">{formData.gender}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-400 mb-2">Fitness Goals</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-sm">Fitness Goal</p>
                              <p className="text-white">
                                {formData.goal === 'weight-loss' ? 'Weight Loss' : 
                                 formData.goal === 'weight-gain' ? 'Weight Gain' : 
                                 'General Fitness'}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Requires Trainer</p>
                              <p className="text-white">{formData.requiresTrainer ? 'Yes' : 'No'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-gray-400 text-sm">Goal Description</p>
                              <p className="text-white">{formData.fitnessGoalDescription}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-gray-800/50 p-4 rounded-lg">
                          <h5 className="font-medium text-blue-400 mb-2">Membership Details</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-gray-400 text-sm">Membership Plan</p>
                              <p className="text-white">{formData.planType}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Duration</p>
                              <p className="text-white">{formData.membershipDuration} Year(s)</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800">
                          <h5 className="font-medium text-blue-400 mb-2">Payment Summary</h5>
                          <div className="space-y-2">
                            {/* Find the selected plan */}
                            {(() => {
                              const selectedPlan = gymOwnerPlans.find(plan => plan.name === formData.planType) || gymOwnerPlans[0];
                              return (
                                <div className="flex justify-between">
                                  <p className="text-gray-300">{selectedPlan.name} Plan</p>
                                  <p className="text-white">₹{selectedPlan.price}/{selectedPlan.duration}</p>
                                </div>
                              );
                            })()}
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
                    </div>
                    
                    <div className="flex flex-wrap gap-4 mt-6 justify-end">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={handlePreviousStep}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        disabled={formSubmitting}
                      >
                        Previous Step
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 px-6"
                        disabled={formSubmitting}
                      >
                        {formSubmitting ? 'Processing...' : 'Proceed to Payment'}
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
                        <div className={`mr-3 p-2 rounded-full ${
                          message.type === 'error' 
                            ? 'bg-red-800' 
                            : message.type === 'info'
                              ? 'bg-blue-800'
                              : 'bg-green-800'
                        }`}>
                          {message.type === 'error' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          ) : message.type === 'info' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <div>{message.text}</div>
                      </div>
                    )}
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          {isLoading ? (
            <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
              <p className="text-gray-400">Loading member statistics...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Members</p>
                      <p className="text-2xl font-bold text-white">{memberStats.total}</p>
                    </div>
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active</p>
                      <p className="text-2xl font-bold text-white">{memberStats.active}</p>
                    </div>
                    <User className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Weight Loss</p>
                      <p className="text-2xl font-bold text-white">{memberStats.weightLoss}</p>
                    </div>
                    <Target className="h-6 w-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Weight Gain</p>
                      <p className="text-2xl font-bold text-white">{memberStats.weightGain}</p>
                    </div>
                    <Target className="h-6 w-6 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Premium</p>
                      <p className="text-2xl font-bold text-white">{memberStats.premium}</p>
                    </div>
                    <Calendar className="h-6 w-6 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filters */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Member Directory</CardTitle>
              <CardDescription className="text-gray-400">
                Search and manage gym members with goal tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search members, emails, or trainers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                    disabled={isLoading}
                  />
                </div>
                <select
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  disabled={isLoading}
                >
                  <option value="all">All Goals</option>
                  <option value="weight-loss">Weight Loss</option>
                  <option value="weight-gain">Weight Gain</option>
                  <option value="general-fitness">General Fitness</option>
                </select>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                  disabled={isLoading}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* Members Table */}
              {isLoading ? (
                <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
                  <p className="text-gray-400">Loading members...</p>
                </div>
              ) : (
                <div className="rounded-md border border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-700 hover:bg-gray-800/50">
                        <TableHead className="text-gray-300">Member Details</TableHead>
                        <TableHead className="text-gray-300">Contact</TableHead>
                        <TableHead className="text-gray-300">Goal & Plan</TableHead>
                        <TableHead className="text-gray-300">Trainer</TableHead>
                        <TableHead className="text-gray-300">Status</TableHead>
                        <TableHead className="text-gray-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            <p className="text-gray-400">No members found matching your filters.</p>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredMembers.map((member) => (
                      <TableRow key={`member-${member.id}`} className="border-gray-700 hover:bg-gray-800/30">
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="font-medium text-white">{member.name}</p>
                              <p className="text-sm text-gray-400">
                                {member.gender} • Joined {new Date(member.joinDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-white">{member.email}</p>
                            <p className="text-sm text-gray-400">{member.mobile}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getGoalBadge(member.goal)}
                            <div>{getPlanBadge(member.planType)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-white">{member.assignedTrainer}</p>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(member.membershipStatus)}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => handleViewMember(member)}
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* QR Payment Modal */}
          {showPaymentModal && pendingMemberData && (
            <QRPaymentModal
              isOpen={showPaymentModal}
              onClose={() => {
                setShowPaymentModal(false);
                setPendingMemberData(null);
                setMessage({ type: '', text: '' });
                setFormStep(1); // Reset to first step when closing payment modal
              }}
              onPaymentComplete={handlePaymentComplete}
              memberData={pendingMemberData}
              paymentAmount={pendingMemberData.calculatedFee || subscriptionInfo.membershipFee}
              paymentDescription={`Gym Membership Fee for ${pendingMemberData?.name || 'New Member'} (${pendingMemberData?.membershipDuration || '1'} Year ${pendingMemberData?.planType || 'Basic'} Plan${pendingMemberData?.requiresTrainer ? ' with Trainer' : ''})`}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Members;