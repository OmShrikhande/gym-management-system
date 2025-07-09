import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, User, Edit, Trash2, Calendar, Target, X, AlertCircle, CreditCard, RefreshCw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import QRPaymentModal from "@/components/payment/QRPaymentModal";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

// Helper function to get trainer fee consistently
const getTrainerFee = (trainer) => {
  if (!trainer) return 0;
  return trainer.trainerFee || parseInt(trainer.salary) || 0;
};

// const Members = () => {
const Members = () => {
  const { createMember, isGymOwner, isTrainer, users, fetchUsers, user, subscription, authFetch, checkSubscriptionStatus, updateMember, deleteMember } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Initial form data with default values
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    gender: 'Male',
    dob: '',
    goal: 'weight-loss',
    planType: '', // Will be updated after gymOwnerPlans is loaded
    address: '',
    whatsapp: '',
    height: '',
    weight: '',
    emergencyContact: '',
    medicalConditions: '',
    requiresTrainer: false,
    assignedTrainer: '', // Trainer ID will be stored here
    membershipDuration: '1', // in months (default 1 month)
    durationType: 'preset', // 'preset' or 'custom'
    fitnessGoalDescription: ''
  });
  
  // State for available trainers
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [realMembers, setRealMembers] = useState([]);
  const [trainerMembers, setTrainerMembers] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingMemberData, setPendingMemberData] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: Basic Info, 2: Membership Details, 3: Review
  const [customDuration, setCustomDuration] = useState(''); // For custom duration input
  const [subscriptionInfo, setSubscriptionInfo] = useState({
    maxMembers: 0,
    currentMembers: 0,
    hasActiveSubscription: false,
    plan: 'Basic'
  });
  
  // State for gym owner plans
  const [gymOwnerPlans, setGymOwnerPlans] = useState([]);
  
  // State for form submission
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  // Fetch gym owner plans
  const fetchGymOwnerPlans = useCallback(async () => {
    if (!user || !isGymOwner) return;
    
    try {
      console.log('Fetching gym owner plans for:', user._id);
      
      // Try to fetch existing plans first
      const response = await authFetch('/gym-owner-plans');
      
      if (response.success || response.status === 'success') {
        const plans = response.data?.plans || [];
        
        // If no plans exist, create default ones
        if (plans.length === 0) {
          console.log('No plans found, creating default plans');
          const defaultResponse = await authFetch('/gym-owner-plans/default');
          
          if (defaultResponse.success || defaultResponse.status === 'success') {
            const defaultPlans = defaultResponse.data?.plans || [];
            console.log('Default plans created:', defaultPlans.length);
            setGymOwnerPlans(defaultPlans);
            
            // Update the default planType
            if (defaultPlans.length > 0) {
              setFormData(prev => ({
                ...prev,
                planType: defaultPlans[0].name
              }));
            }
          }
        } else {
          console.log('Gym owner plans fetched successfully:', plans.length);
          setGymOwnerPlans(plans);
          
          // Update the default planType if needed
          if (plans.length > 0) {
            setFormData(prev => ({
              ...prev,
              planType: plans[0].name
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching gym owner plans:', error);
      // No fallback - user should create plans first
      setGymOwnerPlans([]);
      toast.error('Failed to load membership plans. Please create your membership plans first.');
    }
  }, [user, isGymOwner, authFetch]);

  // Fetch subscription info to check member limits - USE CONTEXT DATA INSTEAD OF API CALLS
  const fetchSubscriptionInfo = useCallback(() => {
    if (!user || !isGymOwner) return;
    
    try {
      console.log('Processing subscription info for gym owner:', user._id);
      console.log('Current subscription from context:', subscription);
      
      // Use data from context instead of making API calls
      let hasActiveSubscription = subscription?.hasActiveSubscription || false;
      let plan = subscription?.subscription?.plan || 'Basic';
      let maxMembers = 200; // Default for Basic plan
      
      // Set max members based on plan
      if (plan === 'Premium' || plan === 'Premium Member') maxMembers = 500;
      if (plan === 'Enterprise' || plan === 'Elite Member') maxMembers = 1000;
      
      // Count current members
      const currentMembers = users.filter(u => u.role === 'member').length;
      
      console.log('Max members:', maxMembers, 'Current members:', currentMembers);
      
      // Only update if the values have actually changed
      setSubscriptionInfo(prev => {
        const newInfo = {
          maxMembers,
          currentMembers,
          hasActiveSubscription,
          plan
        };
        
        // Check if anything has actually changed
        if (prev.maxMembers === newInfo.maxMembers &&
            prev.currentMembers === newInfo.currentMembers &&
            prev.hasActiveSubscription === newInfo.hasActiveSubscription &&
            prev.plan === newInfo.plan) {
          return prev; // No change, return previous state
        }
        
        console.log('Subscription info set:', newInfo);
        return newInfo;
      });
      
    } catch (error) {
      console.error('Error processing subscription info:', error);
      // Set default values
      const currentMembers = users.filter(u => u.role === 'member').length;
      const defaultInfo = {
        maxMembers: 200,
        currentMembers,
        hasActiveSubscription: subscription?.hasActiveSubscription || false,
        plan: 'Basic'
      };
      
      setSubscriptionInfo(defaultInfo);
      console.log('Using default subscription info:', defaultInfo);
    }
  }, [user?._id, isGymOwner, subscription?.hasActiveSubscription, subscription?.subscription?.plan, users.length]);

  // Use ref to prevent multiple data loads
  const hasInitiallyLoaded = useRef(false);
  const lastUserId = useRef(null);
  
  // Reset loading flag when user changes
  useEffect(() => {
    if (user?._id !== lastUserId.current) {
      hasInitiallyLoaded.current = false;
      lastUserId.current = user?._id;
    }
  }, [user?._id]);

  // Function to fetch trainers for the current gym
  const fetchTrainers = useCallback(() => {
    if (!user || !isGymOwner) return;
    
    try {
      // Filter trainers from users array
      const gymTrainers = users.filter(u => u.role === 'trainer');
      setAvailableTrainers(prev => {
        // Only update if the trainers have actually changed
        if (prev.length !== gymTrainers.length || 
            !prev.every(trainer => gymTrainers.some(gt => gt._id === trainer._id))) {
          return gymTrainers;
        }
        return prev;
      });
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  }, [user?._id, isGymOwner, users.length]);
  
  // Function to fetch members assigned to the current trainer
  const fetchTrainerMembers = useCallback(async () => {
    if (!user || !isTrainer) return;
    
    try {
      console.log('Fetching members for trainer:', user._id);
      const response = await authFetch(`/users/trainer/${user._id}/members`);
      console.log('Trainer members response:', response);
      
      if (response.success || response.status === 'success') {
        const members = response.data?.members || [];
        console.log('Trainer assigned members:', members.length);
        
        // Process members data
        const processedMembers = members.map(member => ({
          id: member._id,
          name: member.name,
          email: member.email,
          mobile: member.phone || '',
          whatsapp: member.whatsapp || '',
          gender: member.gender || 'Not specified',
          dob: member.dob || '',
          joinDate: member.createdAt || new Date().toISOString(),
          assignedTrainer: member.assignedTrainer || null,
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
        
        setTrainerMembers(processedMembers);
      }
    } catch (error) {
      console.error('Error fetching trainer members:', error);
    }
  }, [user, isTrainer, authFetch]);

  // Combined data loading effect to reduce re-renders
  useEffect(() => {
    // Use a ref to prevent multiple loads
    let loadingTimeout;
    
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (hasInitiallyLoaded.current) return;
      hasInitiallyLoaded.current = true;
      
      // Clear any existing timeout
      if (loadingTimeout) clearTimeout(loadingTimeout);
      
      // Set a small delay before showing loading state to prevent flickering
      loadingTimeout = setTimeout(() => {
        if (!isLoading) setIsLoading(true);
      }, 300);
      
      try {
        console.log('Loading data for Members page...');
        
        // Step 1: Fetch users (force refresh to get latest data)
        await fetchUsers(true);
        
        // Step 2: Check subscription status if user is gym owner (only once)
        if (user && isGymOwner && checkSubscriptionStatus && !subscription?.hasActiveSubscription) {
          console.log('Checking subscription status for gym owner:', user._id);
          await checkSubscriptionStatus(user._id, null, true);
        }
        
        // Step 3: Fetch gym owner plans if needed
        if (user && isGymOwner) {
          console.log('Fetching gym owner plans');
          await fetchGymOwnerPlans();
        }
        
        console.log('Data loading complete');
        
        // Clear the loading timeout
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setMessage({ type: 'error', text: 'Failed to load data' });
        
        // Clear the loading timeout
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
        
        // Set loading to false
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Cleanup function to clear timeout if component unmounts
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [fetchUsers, user, isGymOwner, isTrainer]); // Simplified dependencies

  // Separate effect to process subscription info when users or subscription changes
  useEffect(() => {
    if (user && isGymOwner && subscription && users.length > 0) {
      console.log('Processing subscription info for gym owner');
      fetchSubscriptionInfo();
    }
  }, [subscription?.hasActiveSubscription, subscription?.subscription?.plan, users.length, user, isGymOwner]); // Only depend on specific values

  // Separate effect to fetch trainers when users are loaded
  useEffect(() => {
    if (user && isGymOwner && users.length > 0) {
      console.log('Fetching trainers');
      fetchTrainers();
    }
  }, [users.length, user, isGymOwner]);

  // Separate effect to fetch trainer members
  useEffect(() => {
    if (user && isTrainer) {
      console.log('Fetching trainer members');
      fetchTrainerMembers();
    }
  }, [user, isTrainer]);

  // Process users to get members - only runs when users array changes
  useEffect(() => {
    // Use a debounce to prevent flickering
    const processTimeout = setTimeout(() => {
      console.log('Processing users to get members, users count:', users?.length || 0);
      
      if (!users || users.length === 0) {
        console.log('No users found, skipping member processing');
        setIsLoading(false);
        return;
      }
      
      // Filter users to get only members
      const members = users
        .filter(user => user.role === 'member')
        .map(member => {
          // Calculate membership end date if not present but duration is available
          let membershipEndDate = member.membershipEndDate;
          if (!membershipEndDate && member.membershipDuration && (member.membershipStartDate || member.createdAt)) {
            const startDate = new Date(member.membershipStartDate || member.createdAt);
            const endDate = new Date(startDate);
            const duration = parseInt(member.membershipDuration || '1'); // Default to 1 month if not specified
            endDate.setMonth(endDate.getMonth() + duration);
            membershipEndDate = endDate.toISOString();
          }
          
          return {
            id: member._id,
            name: member.name,
            email: member.email,
            mobile: member.phone || '',
            whatsapp: member.whatsapp || '',
            gender: member.gender || 'Not specified',
            dob: member.dob || '',
            joinDate: member.createdAt || new Date().toISOString(),
            assignedTrainer: member.assignedTrainer || null,
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
            notes: member.notes || '',
            // Membership details
            membershipStartDate: member.membershipStartDate || member.createdAt,
            membershipEndDate: membershipEndDate,
            membershipDuration: member.membershipDuration || '1',
            // Attendance data
            attendance: member.attendance || []
          };
        });
      
      console.log('Setting real members, count:', members.length);
      
      // Batch state updates to reduce re-renders
      const batchUpdates = () => {
        setRealMembers(members);
        
        // Update subscription info with current member count
        if (isGymOwner) {
          setSubscriptionInfo(prev => ({
            ...prev,
            currentMembers: members.length
          }));
        }
        
        // Only set loading to false after we've processed the data
        setIsLoading(false);
      };
      
      // Execute batch updates
      batchUpdates();
    }, 100); // Small delay to batch updates
    
    // Cleanup function
    return () => clearTimeout(processTimeout);
  }, [users, isGymOwner]);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Determine which members list to use based on user role
  const membersToFilter = isTrainer ? trainerMembers : realMembers;

  const filteredMembers = membersToFilter.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         (member.assignedTrainer && typeof member.assignedTrainer === 'string' && member.assignedTrainer.toLowerCase().includes(debouncedSearchTerm.toLowerCase()));
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

  const memberStats = isTrainer 
    ? {
        total: trainerMembers.length,
        active: trainerMembers.filter(m => m.membershipStatus === 'Active').length,
        weightLoss: trainerMembers.filter(m => m.goal === 'weight-loss').length,
        weightGain: trainerMembers.filter(m => m.goal === 'weight-gain').length,
        premium: trainerMembers.filter(m => 
          m.planType === 'Premium' || 
          m.planType === 'Premium Member' || 
          m.planType?.toLowerCase().includes('premium')
        ).length
      }
    : {
        total: realMembers.length,
        active: realMembers.filter(m => m.membershipStatus === 'Active').length,
        weightLoss: realMembers.filter(m => m.goal === 'weight-loss').length,
        weightGain: realMembers.filter(m => m.goal === 'weight-gain').length,
        premium: realMembers.filter(m => 
          m.planType === 'Premium' || 
          m.planType === 'Premium Member' || 
          m.planType?.toLowerCase().includes('premium')
        ).length
      };

  // Memoized input change handler to prevent unnecessary re-renders
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = () => {
    // Get the first plan name from gymOwnerPlans, or leave empty if none available
    const defaultPlanName = gymOwnerPlans.length > 0 ? gymOwnerPlans[0].name : '';
    
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
      assignedTrainer: '',
      membershipDuration: '1',
      durationType: 'preset',
      fitnessGoalDescription: ''
    });
    setCustomDuration('');
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
    setIsEditMode(false);
  };
  
  // Handle edit member
  const handleEditMember = (member) => {
    setSelectedMember(member);
    setIsEditMode(true);
    setShowDetailView(true);
    
    // Populate form data with member details
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // Don't populate password for security
      mobile: member.mobile || '',
      gender: member.gender || 'Male',
      dob: member.dob || '',
      goal: member.goal || 'weight-loss',
      planType: member.planType || 'Basic Member',
      address: member.address || '',
      whatsapp: member.whatsapp || '',
      height: member.height || '',
      weight: member.weight || '',
      emergencyContact: member.emergencyContact || '',
      medicalConditions: member.medicalConditions || '',
      requiresTrainer: !!member.assignedTrainer,
      assignedTrainer: member.assignedTrainer || '',
      membershipDuration: '1', // Default
      fitnessGoalDescription: member.notes || ''
    });
  };
  
  // Handle update member
  const handleUpdateMember = async () => {
    if (!selectedMember) return;
    
    setFormSubmitting(true);
    setMessage({ type: 'info', text: 'Updating member...' });
    
    try {
      // Prepare data for API
      const updateData = {
        id: selectedMember.id, // Include ID in the request body
        name: formData.name,
        email: formData.email,
        phone: formData.mobile,
        gender: formData.gender,
        dob: formData.dob,
        goal: formData.goal,
        planType: formData.planType,
        address: formData.address,
        whatsapp: formData.whatsapp,
        height: formData.height,
        weight: formData.weight,
        emergencyContact: formData.emergencyContact,
        medicalConditions: formData.medicalConditions,
        assignedTrainer: formData.requiresTrainer ? formData.assignedTrainer : null,
        notes: formData.fitnessGoalDescription,
        role: 'member' // Ensure role is specified
      };
      
      // If password is provided, include it
      if (formData.password && formData.password.length >= 6) {
        updateData.password = formData.password;
      }
      
      console.log(`Attempting to update member with ID: ${selectedMember.id}`);
      
      // Use the updateMember function from AuthContext
      const result = await updateMember(updateData);
      
      if (result.success) {
        // Refresh users list
        await fetchUsers();
        
        // If the member has been assigned to a trainer, trigger an event to refresh the trainer stats
        if (formData.requiresTrainer && formData.assignedTrainer) {
          // Create and dispatch a custom event
          const event = new CustomEvent('memberAssignmentChanged', {
            detail: {
              memberId: selectedMember.id,
              trainerId: formData.assignedTrainer
            }
          });
          window.dispatchEvent(event);
          console.log(`Dispatched memberAssignmentChanged event for trainer ${formData.assignedTrainer}`);
        }
        
        setMessage({ type: 'success', text: 'Member updated successfully' });
        toast.success('Member updated successfully');
        
        // Close detail view after a short delay
        setTimeout(() => {
          handleCloseDetailView();
        }, 1500);
      } else {
        console.error('Failed to update member:', result);
        setMessage({ type: 'error', text: result.message || 'Failed to update member' });
        toast.error(result.message || 'Failed to update member');
      }
    } catch (error) {
      console.error('Error updating member:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating the member' });
      toast.error('An error occurred while updating the member');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle delete member
  const handleDeleteMember = async (memberId) => {
    if (!memberId) {
      toast.error('Invalid member ID');
      setFormSubmitting(false);
      setShowDeleteConfirm(false);
      return;
    }
    
    try {
      setFormSubmitting(true);
      console.log(`Attempting to delete member with ID: ${memberId}`);
      
      // Use the deleteMember function from AuthContext
      const result = await deleteMember(memberId);
      
      console.log('Delete response:', result);
      
      if (result.success) {
        // Refresh users list
        await fetchUsers();
        
        toast.success('Member deleted successfully');
        
        // Close detail view if open
        if (showDetailView) {
          handleCloseDetailView();
        }
      } else {
        toast.error(result.message || 'Failed to delete member');
      }
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('An error occurred while deleting the member');
    } finally {
      // Close delete confirmation
      setShowDeleteConfirm(false);
      setFormSubmitting(false);
    }
  };
  
  // Handle payment completion
  const handlePaymentComplete = async (paymentData) => {
    console.log('=== PAYMENT COMPLETION STARTED ===');
    console.log('Payment data received:', paymentData);
    console.log('Pending member data:', pendingMemberData);
    
    if (!pendingMemberData) {
      console.error('No pending member data found');
      toast.error('No member data found. Please try again.');
      return;
    }
    
    setFormSubmitting(true);
    setMessage({ type: 'info', text: 'Creating member...' });
    
    try {
      // Add payment information to the member data
      const memberDataWithPayment = {
        ...pendingMemberData,
        // Map mobile to phone for backend compatibility
        phone: pendingMemberData.mobile || pendingMemberData.phone,
        paymentStatus: 'Paid',
        paymentId: paymentData.paymentId,
        paymentAmount: paymentData.amount || pendingMemberData.calculatedFee,
        paymentDate: paymentData.timestamp,
        // Include the new fields
        requiresTrainer: pendingMemberData.requiresTrainer || false,
        assignedTrainer: pendingMemberData.requiresTrainer && pendingMemberData.assignedTrainer ? pendingMemberData.assignedTrainer : null,
        membershipDuration: pendingMemberData.membershipDuration || '1',
        fitnessGoalDescription: pendingMemberData.fitnessGoalDescription || ''
      };
      
      // Remove mobile field to avoid confusion
      delete memberDataWithPayment.mobile;
      
      // Create the member
      console.log('Creating member with data:', memberDataWithPayment);
      console.log('Payment data received:', paymentData);
      
      const result = await createMember(memberDataWithPayment);
      console.log('Member creation result:', result);
      
      // Additional debugging
      if (!result) {
        console.error('createMember returned null/undefined');
        throw new Error('Member creation returned no result');
      }
      
      if (typeof result !== 'object') {
        console.error('createMember returned unexpected type:', typeof result, result);
        throw new Error('Member creation returned unexpected result type');
      }
      
      if (result.success) {
        console.log('✅ Member creation successful!');
        console.log('Created member:', result.user);
        
        setMessage({ type: 'success', text: result.message });
        resetForm();
        setShowAddForm(false);
        setShowPaymentModal(false);
        setPendingMemberData(null);
        setFormStep(1); // Reset to first step
        
        // Refresh members list
        console.log('Refreshing users list...');
        await fetchUsers();
        console.log('Users list refreshed');
        
        // If the new member has been assigned to a trainer, trigger an event to refresh the trainer stats
        if (memberDataWithPayment.requiresTrainer && memberDataWithPayment.assignedTrainer) {
          // Create and dispatch a custom event
          const event = new CustomEvent('memberAssignmentChanged', {
            detail: {
              memberId: result.user?._id,
              trainerId: memberDataWithPayment.assignedTrainer
            }
          });
          window.dispatchEvent(event);
          console.log(`Dispatched memberAssignmentChanged event for trainer ${memberDataWithPayment.assignedTrainer}`);
        }
        
        // Show success toast
        toast.success("Member created successfully with payment verification");
        console.log('=== MEMBER CREATION COMPLETED SUCCESSFULLY ===');
      } else {
        console.error('❌ Member creation failed:', result);
        setMessage({ type: 'error', text: result.message || 'Failed to create member' });
        setShowPaymentModal(false);
        toast.error(result.message || 'Failed to create member');
      }
    } catch (error) {
      console.error('❌ ERROR CREATING MEMBER:', error);
      console.error('Error stack:', error.stack);
      
      const errorMessage = error.message || 'An error occurred while creating the member';
      setMessage({ type: 'error', text: errorMessage });
      setShowPaymentModal(false);
      toast.error(errorMessage);
      
      console.log('=== MEMBER CREATION FAILED ===');
    } finally {
      setFormSubmitting(false);
      console.log('Form submitting set to false');
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
      
      // Validate plan selection
      if (!formData.planType) {
        setMessage({ type: 'error', text: 'Please select a membership plan' });
        return;
      }
      
      // Validate that plans are available
      if (gymOwnerPlans.length === 0) {
        setMessage({ type: 'error', text: 'No membership plans available. Please create plans first.' });
        return;
      }
      
      // Validate duration
      if (!formData.membershipDuration || formData.membershipDuration === 'custom' && !customDuration) {
        setMessage({ type: 'error', text: 'Please select a valid membership duration' });
        return;
      }
      
      // Validate trainer selection if requiresTrainer is true
      if (formData.requiresTrainer && !formData.assignedTrainer) {
        setMessage({ type: 'error', text: 'Please select a trainer' });
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
    
    // Check if plans are available
    if (gymOwnerPlans.length === 0) {
      setMessage({ 
        type: 'error', 
        text: 'No membership plans available. Please create your membership plans first.' 
      });
      return;
    }
    
    // Find the selected plan
    const selectedPlan = gymOwnerPlans.find(plan => plan.name === formData.planType);
    
    if (!selectedPlan) {
      setMessage({ 
        type: 'error', 
        text: 'Please select a valid membership plan.' 
      });
      return;
    }
    
    const durationInMonths = parseInt(formData.membershipDuration); // Duration is already in months
    
    // Calculate plan cost based on duration
    let planCost = 0;
    const planPrice = parseFloat(selectedPlan.price) || 0;
    const planDuration = selectedPlan.duration;
    
    // Calculate cost based on plan duration type and selected duration
    if (planDuration === 'monthly') {
      planCost = planPrice * durationInMonths;
    } else if (planDuration === 'yearly') {
      planCost = planPrice * Math.ceil(durationInMonths / 12);
    } else if (planDuration === 'quarterly') {
      planCost = planPrice * Math.ceil(durationInMonths / 3);
    } else {
      // Default to monthly if duration type is unclear
      planCost = planPrice * durationInMonths;
    }
    
    // Calculate trainer fee based on selected trainer's actual fee
    let totalTrainerCost = 0;
    if (formData.requiresTrainer && formData.assignedTrainer) {
      const selectedTrainer = availableTrainers.find(trainer => trainer._id === formData.assignedTrainer);
      if (selectedTrainer) {
        // Use trainer's fee if available, check both trainerFee and salary fields
        const monthlyTrainerFee = getTrainerFee(selectedTrainer);
        console.log(`Using trainer fee: ₹${monthlyTrainerFee} for trainer: ${selectedTrainer.name}`);
        
        if (monthlyTrainerFee === 0) {
          console.warn(`No fee set for trainer: ${selectedTrainer.name}. Please set trainer fee in trainer profile.`);
          setMessage({ 
            type: 'error', 
            text: `Cannot proceed: No fee is set for trainer "${selectedTrainer.name}". Please update the trainer's fee in their profile before creating a member with this trainer.` 
          });
          return; // Stop execution - don't show payment modal
        }
        
        totalTrainerCost = monthlyTrainerFee * durationInMonths;
      } else {
        console.warn('Selected trainer not found in available trainers list');
        setMessage({ 
          type: 'error', 
          text: 'Selected trainer not found. Please select a valid trainer.' 
        });
        return;
      }
    }
    
    // Calculate total fee based on plan cost and trainer cost
    const totalFee = planCost + totalTrainerCost;
  
    
    // Store the member data with calculated fee and show payment modal
    setPendingMemberData({
      ...formData,
      calculatedFee: totalFee,
      paymentBreakdown: {
        planName: selectedPlan.name,
        planPrice: planPrice,
        planDuration: planDuration,
        planCost: planCost,
        selectedDuration: durationInMonths,
        trainerCost: totalTrainerCost,
        totalAmount: totalFee
      }
    });
    setShowPaymentModal(true);
    setMessage({ type: 'info', text: 'Please complete the payment to create the member' });
}, [formData, subscriptionInfo, gymOwnerPlans, availableTrainers, setMessage, setPendingMemberData, setShowPaymentModal]);

  // Debug function - expose to window for testing
  useEffect(() => {
    window.debugMemberCreation = {
      testCreateMember: async () => {
        const testMemberData = {
          name: "Test Member",
          email: "test@example.com",
          password: "password123",
          phone: "1234567890",
          gender: "Male",
          goal: "weight-loss",
          planType: gymOwnerPlans[0]?.name || "Basic",
          membershipDuration: "1",
          paymentStatus: "Paid",
          paymentId: "TEST-DEBUG",
          paymentAmount: 1000,
          paymentDate: new Date().toISOString()
        };
        
        console.log('=== DEBUG: Testing member creation ===');
        console.log('Test data:', testMemberData);
        
        try {
          const result = await createMember(testMemberData);
          console.log('Debug result:', result);
          return result;
        } catch (error) {
          console.error('Debug error:', error);
          return { success: false, error: error.message };
        }
      },
      currentFormData: formData,
      pendingMemberData: pendingMemberData,
      gymOwnerPlans: gymOwnerPlans
    };
    
    return () => {
      delete window.debugMemberCreation;
    };
  }, [createMember, formData, pendingMemberData, gymOwnerPlans]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isTrainer ? 'My Assigned Members' : 'Member Management'}
              </h1>
              <p className="text-gray-400">
                {isTrainer 
                  ? 'View and manage members assigned to you' 
                  : 'Manage gym members, assignments, and goals'}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="border-gray-700 text-gray-300 hover:bg-gray-800"
                disabled={isLoading}
                onClick={async () => {
                  // Use a small delay before showing loading state to prevent flickering
                  const loadingTimer = setTimeout(() => {
                    setIsLoading(true);
                  }, 300);
                  
                  try {
                    // Force refresh all data
                    const promises = [
                      fetchUsers(true)
                    ];
                    
                    if (user && isGymOwner) {
                      promises.push(checkSubscriptionStatus(user._id, null, true));
                    }
                    
                    // Wait for all promises to resolve
                    await Promise.all(promises);
                    
                    // Then fetch subscription info if needed
                    if (user && isGymOwner) {
                      await fetchSubscriptionInfo();
                    }
                    
                    toast.success("Data refreshed successfully");
                  } catch (error) {
                    console.error("Error refreshing data:", error);
                    toast.error("Failed to refresh data");
                  } finally {
                    clearTimeout(loadingTimer);
                    // Small delay before removing loading state to prevent flickering
                    setTimeout(() => {
                      setIsLoading(false);
                    }, 300);
                  }
                }}
              >
                {isLoading ? (
                  <div className="animate-spin mr-2">
                    <RefreshCw className="h-4 w-4" />
                  </div>
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              
              {isGymOwner && (
                <Button 
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    console.log("Add Member button clicked");
                    console.log("Subscription info:", subscriptionInfo);
                    setShowAddForm(true);
                    setFormStep(1); // Reset to first step
                    resetForm(); // Reset form data
                  }}
                  disabled={!subscriptionInfo.hasActiveSubscription || subscriptionInfo.currentMembers >= subscriptionInfo.maxMembers}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Member
                  {subscriptionInfo.hasActiveSubscription ? 
                    ` (${subscriptionInfo.currentMembers}/${subscriptionInfo.maxMembers})` : 
                    ' (Inactive Subscription)'}
                </Button>
              )}
            </div>
            
          </div>
          
          {/* Loading Indicator */}
          {isLoading && (
            <Card className="bg-blue-900/20 border-blue-800">
              <CardContent className="p-4 flex items-center justify-center">
                <div className="animate-spin mr-2">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                </div>
                <p className="text-blue-300">Loading member data...</p>
              </CardContent>
            </Card>
          )}
          
          {/* Subscription Warning */}
          {isGymOwner && !subscriptionInfo.hasActiveSubscription && !isLoading && (
            <Card className="bg-red-900/20 border-red-800">
              <CardContent className="p-4 flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-medium">Inactive Subscription</h3>
                  <p className="text-gray-300 text-sm">
                    Your subscription is inactive. Please renew your subscription to add new members.
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-red-700 text-red-300 hover:bg-red-800/50"
                      onClick={() => navigate("/gym-owner-plans")}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Renew Subscription
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-yellow-700 text-yellow-300 hover:bg-yellow-800/50"
                      onClick={async () => {
                        // Force refresh subscription status
                        setIsLoading(true);
                        if (checkSubscriptionStatus) {
                          await checkSubscriptionStatus(user._id, null, true);
                        }
                        await fetchSubscriptionInfo();
                        setIsLoading(false);
                        toast.info("Subscription status refreshed");
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                  </div>
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
                  <CardTitle className="text-white">
                    {isEditMode ? "Edit Member" : "Member Details"}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {isEditMode 
                      ? "Update information for " + selectedMember.name
                      : "Complete information about " + selectedMember.name
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {!isEditMode && (
                    <>
                      {/* Only show edit button for trainers, not gym owners */}
                      {isTrainer && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleEditMember(selectedMember)}
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowDeleteConfirm(true)}
                        className="border-red-800 text-red-300 hover:bg-red-900/30"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCloseDetailView}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
  {isEditMode ? (
    // Edit Form
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleUpdateMember();
      }}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-white">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="name" className="mb-2 block text-gray-300">
                Full Name *
              </Label>
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
              <Label htmlFor="email" className="mb-2 block text-gray-300">
                Email Address *
              </Label>
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
              <Label htmlFor="password" className="mb-2 block text-gray-300">
                Password (leave blank to keep current)
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password (min 6 characters)"
                className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="mobile" className="mb-2 block text-gray-300">
                Mobile Number *
              </Label>
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
            <div>
              <Label htmlFor="gender" className="mb-2 block text-gray-300">
                Gender
              </Label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <Label htmlFor="whatsapp" className="mb-2 block text-gray-300">
                WhatsApp Number
              </Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleInputChange}
                placeholder="Enter WhatsApp number"
                className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Membership Details */}
        <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
          <h4 className="text-lg font-semibold mb-4 text-white">Membership Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label htmlFor="goal" className="mb-2 block text-gray-300">
                Fitness Goal
              </Label>
              <select
                id="goal"
                name="goal"
                value={formData.goal}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="general-fitness">General Fitness</option>
              </select>
            </div>
            <div>
              <Label htmlFor="planType" className="mb-2 block text-gray-300">
                Plan Type
              </Label>
              <select
                id="planType"
                name="planType"
                value={formData.planType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                {gymOwnerPlans.map((plan) => (
                  <option key={plan.id} value={plan.name}>
                    {plan.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="flex items-center space-x-2 mb-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.requiresTrainer}
                  onChange={(e) =>
                    setFormData({ ...formData, requiresTrainer: e.target.checked })
                  }
                  className="rounded bg-gray-700 border-gray-600 text-blue-600"
                />
                <span>Assign Trainer</span>
              </Label>
              {formData.requiresTrainer && (
                <select
                  name="assignedTrainer"
                  value={formData.assignedTrainer}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="">Select a trainer</option>
                  {availableTrainers.map((trainer) => {
                    const trainerFee = getTrainerFee(trainer);
                    return (
                      <option key={trainer._id} value={trainer._id}>
                        {trainer.name} {trainerFee > 0 ? `(₹${trainerFee})` : '(Fee not set)'}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <div>
              <Label htmlFor="fitnessGoalDescription" className="mb-2 block text-gray-300">
                Goal Description
              </Label>
              <Textarea
                id="fitnessGoalDescription"
                name="fitnessGoalDescription"
                value={formData.fitnessGoalDescription}
                onChange={handleInputChange}
                placeholder="Describe fitness goals in detail"
                className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCloseDetailView}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
            disabled={formSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={formSubmitting}
          >
            {formSubmitting ? 'Updating...' : 'Update Member'}
          </Button>
        </div>

        {/* Display message */}
        {message.text && (
          <div
            className={`mt-6 p-4 rounded-lg flex items-center ${
              message.type === "error"
                ? "bg-red-900/30 text-red-200 border border-red-600"
                : message.type === "info"
                ? "bg-blue-900/30 text-blue-600 border border-blue-600"
                : "bg-green-900/30 text-green-600 border border-green-600"
            }`}
          >
            <div
              className={`mr-3 p-2 rounded-full ${
                message.type === "error"
                  ? "bg-red-600"
                  : message.type === "info"
                  ? "bg-blue-600"
                  : "bg-green-600"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : message.type === "info" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <div>{message.text}</div>
          </div>
        )}
      </div>
    </form>
  ) : (
    // View Mode
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
            <p className="text-white">{selectedMember.mobile || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">WhatsApp Number</p>
            <p className="text-white">{selectedMember.whatsapp || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Address</p>
            <p className="text-white">{selectedMember.address || "Not provided"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Emergency Contact</p>
            <p className="text-white">{selectedMember.emergencyContact || "Not provided"}</p>
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
            <p className="text-gray-400 text-sm mb-1">Membership Start</p>
            <p className="text-white">
              {selectedMember.membershipStartDate 
                ? new Date(selectedMember.membershipStartDate).toLocaleDateString() 
                : new Date(selectedMember.joinDate).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Membership Expiry</p>
            {selectedMember.membershipEndDate ? (
              <div className="space-y-1">
                <p className="text-white">{new Date(selectedMember.membershipEndDate).toLocaleDateString()}</p>
                {(() => {
                  // Calculate days remaining
                  const today = new Date();
                  const endDate = new Date(selectedMember.membershipEndDate);
                  const diffTime = endDate - today;
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const daysRemaining = diffDays > 0 ? diffDays : 0;
                  const isExpired = endDate < today;
                  
                  if (isExpired) {
                    return (
                      <div className="flex items-center gap-1 text-red-400 text-sm">
                        <AlertCircle className="h-3 w-3" />
                        <span>Expired</span>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex items-center gap-1 text-sm">
                        <span className={`
                          ${daysRemaining > 30 ? 'text-green-400' : 
                          daysRemaining > 10 ? 'text-yellow-400' : 'text-red-400'}
                        `}>
                          {daysRemaining} days remaining
                        </span>
                      </div>
                    );
                  }
                })()}
              </div>
            ) : (
              <p className="text-gray-400">Not set</p>
            )}
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Fitness Goal</p>
            <div>{getGoalBadge(selectedMember.goal)}</div>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Assigned Trainer</p>
            <p className="text-white">
              {(() => {
                // Find the trainer by ID
                if (selectedMember.assignedTrainer) {
                  const trainer = availableTrainers.find((t) => t._id === selectedMember.assignedTrainer);
                  return trainer ? trainer.name : "Not assigned";
                }
                return "Not assigned";
              })()}
            </p>
          </div>
        </div>
      </div>

      {/* Payment Information */}
      <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-white">Payment Information</h4>
          <Badge variant={selectedMember.paymentStatus === "Paid" ? "default" : "destructive"}>
            {selectedMember.paymentStatus || "Not Recorded"}
          </Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <p className="text-gray-400 text-sm mb-1">Payment Amount</p>
            <p className="text-white font-medium">
              {selectedMember.paymentAmount
                ? new Intl.NumberFormat("en-IN", {
                    style: "currency",
                    currency: "INR",
                    maximumFractionDigits: 0,
                  }).format(selectedMember.paymentAmount)
                : "Not recorded"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Payment Date</p>
            <p className="text-white">
              {selectedMember.paymentDate
                ? new Date(selectedMember.paymentDate).toLocaleDateString()
                : "Not recorded"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Payment ID</p>
            <p className="text-white">{selectedMember.paymentId || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Membership Duration</p>
            <p className="text-white">
              {selectedMember.membershipDuration
                ? (() => {
                    const duration = parseInt(selectedMember.membershipDuration);
                    if (duration >= 12 && duration % 12 === 0) {
                      const years = duration / 12;
                      return `${years} ${years > 1 ? "Years" : "Year"}`;
                    }
                    return `${duration} ${duration > 1 ? "Months" : "Month"}`;
                  })()
                : "12 Months (Default)"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Next Payment Due</p>
            <p className="text-white">
              {selectedMember.paymentDate
                ? (() => {
                    const paymentDate = new Date(selectedMember.paymentDate);
                    const duration = parseInt(selectedMember.membershipDuration || "12");
                    paymentDate.setMonth(paymentDate.getMonth() + duration);
                    return paymentDate.toLocaleDateString();
                  })()
                : "Not applicable"}
            </p>
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
            <p className="text-white">
              {selectedMember.dob ? new Date(selectedMember.dob).toLocaleDateString() : "Not provided"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Height</p>
            <p className="text-white">{selectedMember.height || "Not recorded"}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Weight</p>
            <p className="text-white">{selectedMember.weight || "Not recorded"}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-gray-400 text-sm mb-1">Medical Conditions</p>
          <p className="text-white">{selectedMember.medicalConditions || "None recorded"}</p>
        </div>
      </div>

      {/* Attendance Information */}
      <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-white">Attendance Information</h4>
          <Button
            size="sm"
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
            onClick={() => navigate(`/attendance/${selectedMember.id}`)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            View Full History
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <p className="text-gray-400 text-sm mb-1">Last Check-in</p>
            <p className="text-white">
              {selectedMember.attendance && selectedMember.attendance.length > 0
                ? new Date(selectedMember.attendance[selectedMember.attendance.length - 1].timestamp).toLocaleString()
                : "No check-ins recorded"}
            </p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">Total Visits</p>
            <p className="text-white">{selectedMember.attendance ? selectedMember.attendance.length : 0}</p>
          </div>
          <div>
            <p className="text-gray-400 text-sm mb-1">This Month</p>
            <p className="text-white">
              {selectedMember.attendance ? 
                selectedMember.attendance.filter(record => {
                  const recordDate = new Date(record.timestamp);
                  const now = new Date();
                  return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
                }).length : 0}
            </p>
          </div>
        </div>
        
        {/* Recent Attendance */}
        {selectedMember.attendance && selectedMember.attendance.length > 0 && (
          <div className="mt-4">
            <p className="text-gray-400 text-sm mb-2">Recent Check-ins</p>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {selectedMember.attendance
                .slice(-5)
                .reverse()
                .map((record, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      {new Date(record.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-gray-400">
                      {new Date(record.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Notes */}
      <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
        <h4 className="text-lg font-semibold mb-4 text-white">Notes</h4>
        <p className="text-white">{selectedMember.notes || "No notes recorded for this member."}</p>
      </div>
    </div>
  )}
</CardContent>
</Card>
          )}
          
          {/* Delete Confirmation Dialog */}
          {showDeleteConfirm && selectedMember && (
            <div 
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
              onClick={(e) => {
                // Prevent clicks on the backdrop from closing the modal
                e.stopPropagation();
              }}
            >
              <div 
                className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-md w-full"
                onClick={(e) => {
                  // Prevent clicks on the modal from bubbling up
                  e.stopPropagation();
                }}
              >
                <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete {selectedMember.name}? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowDeleteConfirm(false);
                    }}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={formSubmitting}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedMember && selectedMember.id) {
                        handleDeleteMember(selectedMember.id);
                      } else {
                        toast.error('Invalid member selected');
                        setShowDeleteConfirm(false);
                      }
                    }}
                    disabled={formSubmitting}
                    type="button"
                  >
                    {formSubmitting ? "Deleting..." : "Delete Member"}
                  </Button>
                </div>
              </div>
            </div>
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
                              requiresTrainer: e.target.value === "true",
                              // Reset assignedTrainer if requiresTrainer is set to false
                              assignedTrainer: e.target.value === "false" ? "" : formData.assignedTrainer
                            })}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                          </select>
                        </div>
                        
                        {/* Trainer selection dropdown - only shown when requiresTrainer is true */}
                        {formData.requiresTrainer && (
                          <div>
                            <Label htmlFor="assignedTrainer" className="mb-2 block text-gray-300">Select Trainer *</Label>
                            <select
                              id="assignedTrainer"
                              name="assignedTrainer"
                              value={formData.assignedTrainer}
                              onChange={handleInputChange}
                              className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                              required
                            >
                              <option value="">-- Select a Trainer --</option>
                              {availableTrainers.map(trainer => (
                                <option key={trainer._id} value={trainer._id}>
                                  {trainer.name} - {trainer.specialization || 'General Fitness'}
                                </option>
                              ))}
                            </select>
                            {availableTrainers.length === 0 && (
                              <p className="text-yellow-500 text-sm mt-1">
                                No trainers available. Please add trainers first.
                              </p>
                            )}
                          </div>
                        )}
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
                            {gymOwnerPlans.length > 0 ? (
                              <>
                                <option value="">-- Select a Plan --</option>
                                {gymOwnerPlans.map(plan => (
                                  <option key={plan._id || plan.id} value={plan.name}>
                                    {plan.name} (₹{plan.price}/{plan.duration})
                                  </option>
                                ))}
                              </>
                            ) : (
                              <option value="">No plans available - Create plans first</option>
                            )}
                          </select>
                          {gymOwnerPlans.length > 0 ? (
                            <p className="text-sm text-gray-400 mt-1">
                              {formData.planType && gymOwnerPlans.find(plan => plan.name === formData.planType)?.features?.[0] || 
                               'Select a plan to view features'}
                            </p>
                          ) : (
                            <p className="text-sm text-red-400 mt-1">
                              No membership plans available. Please create plans first.
                            </p>
                          )}
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
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData({
                                ...formData,
                                membershipDuration: value,
                                durationType: value === 'custom' ? 'custom' : 'preset'
                              });
                              // Reset custom duration when switching from custom to preset
                              if (value !== 'custom') {
                                setCustomDuration('');
                              }
                            }}
                            className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                            required
                          >
                            <option value="1">1 Month</option>
                            <option value="2">2 Months</option>
                            <option value="3">3 Months</option>
                            <option value="6">6 Months</option>
                            <option value="9">9 Months</option>
                            <option value="12">1 Year (12 Months)</option>
                            <option value="18">18 Months</option>
                            <option value="24">2 Years (24 Months)</option>
                            <option value="36">3 Years (36 Months)</option>
                            <option value="custom">Custom Duration</option>
                          </select>
                          
                          {/* Custom duration input */}
                          {formData.membershipDuration === 'custom' && (
                            <div className="mt-3">
                              <Label htmlFor="customDuration" className="mb-2 block text-gray-300">
                                Enter months *
                              </Label>
                              <Input
                                id="customDuration"
                                type="number"
                                min="1"
                                max="120"
                                value={customDuration}
                                onChange={(e) => {
                                  const months = e.target.value;
                                  setCustomDuration(months);
                                  // Update formData with custom duration
                                  setFormData({
                                    ...formData,
                                    membershipDuration: months || '1'
                                  });
                                }}
                                placeholder="Enter number of months"
                                className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 text-white"
                                required
                              />
                              <p className="text-xs text-gray-400 mt-1">
                                Enter duration between 1 and 120 months (10 years)
                              </p>
                            </div>
                          )}
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-400">
                              Longer durations offer better value
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-blue-400" />
                              <span className="text-white">
                                Expires: {(() => {
                                  const startDate = new Date();
                                  const endDate = new Date(startDate);
                                  const months = parseInt(formData.membershipDuration === 'custom' ? customDuration || '1' : formData.membershipDuration);
                                  endDate.setMonth(endDate.getMonth() + months);
                                  return endDate.toLocaleDateString();
                                })()}
                              </span>
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
                            {formData.requiresTrainer && formData.assignedTrainer && (
                              <div>
                                <p className="text-gray-400 text-sm">Assigned Trainer</p>
                                <p className="text-white">
                                  {availableTrainers.find(t => t._id === formData.assignedTrainer)?.name || 'Unknown Trainer'}
                                </p>
                              </div>
                            )}
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
                              <p className="text-white">{(() => {
                                const duration = parseInt(formData.membershipDuration);
                                if (duration === 1) return '1 Month';
                                if (duration < 12) return `${duration} Months`;
                                if (duration === 12) return '1 Year';
                                if (duration === 24) return '2 Years';
                                if (duration === 36) return '3 Years';
                                if (duration % 12 === 0) return `${duration / 12} Year${duration / 12 > 1 ? 's' : ''}`;
                                return `${duration} Months`;
                              })()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Start Date</p>
                              <p className="text-white">{new Date().toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-sm">Expiry Date</p>
                              <p className="text-white">{(() => {
                                const startDate = new Date();
                                const endDate = new Date(startDate);
                                const months = parseInt(formData.membershipDuration);
                                endDate.setMonth(endDate.getMonth() + months);
                                return endDate.toLocaleDateString();
                              })()}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-800">
                          <h5 className="font-medium text-blue-400 mb-2">Payment Summary</h5>
                          <div className="space-y-2">
                            {/* Find the selected plan and calculate pricing */}
                            {(() => {
                              const selectedPlan = gymOwnerPlans.find(plan => plan.name === formData.planType) || gymOwnerPlans[0];
                              const selectedDuration = parseInt(formData.membershipDuration);
                              const selectedTrainer = availableTrainers.find(trainer => trainer._id === formData.assignedTrainer);
                              const trainerFee = formData.requiresTrainer && selectedTrainer ? getTrainerFee(selectedTrainer) : 0;
                              
                              // Calculate plan cost based on duration
                              let planCost = 0;
                              if (selectedPlan) {
                                const planPrice = parseFloat(selectedPlan.price) || 0;
                                const planDuration = selectedPlan.duration;
                                
                                // Calculate cost based on plan duration type and selected duration
                                if (planDuration === 'monthly') {
                                  planCost = planPrice * selectedDuration;
                                } else if (planDuration === 'yearly') {
                                  planCost = planPrice * Math.ceil(selectedDuration / 12);
                                } else if (planDuration === 'quarterly') {
                                  planCost = planPrice * Math.ceil(selectedDuration / 3);
                                } else {
                                  // Default to monthly if duration type is unclear
                                  planCost = planPrice * selectedDuration;
                                }
                              }
                              
                              // Calculate trainer cost for the entire duration
                              const totalTrainerCost = trainerFee > 0 ? trainerFee * selectedDuration : 0;
                              
                              const totalAmount = planCost + totalTrainerCost;
                              
                              return (
                                <>
                                  <div className="flex justify-between">
                                    <p className="text-gray-300">{selectedPlan?.name || 'Unknown'} Plan</p>
                                    <p className="text-white">₹{selectedPlan?.price || 0}/{selectedPlan?.duration || 'month'}</p>
                                  </div>
                                  <div className="flex justify-between">
                                    <p className="text-gray-300">Duration Selected</p>
                                    <p className="text-white">
                                      {selectedDuration === 1 ? '1 Month' :
                                       selectedDuration < 12 ? `${selectedDuration} Months` :
                                       selectedDuration === 12 ? '1 Year' :
                                       selectedDuration === 24 ? '2 Years' :
                                       selectedDuration === 36 ? '3 Years' :
                                       selectedDuration % 12 === 0 ? `${selectedDuration / 12} Year${selectedDuration / 12 > 1 ? 's' : ''}` :
                                       `${selectedDuration} Months`}
                                    </p>
                                  </div>
                                  <div className="flex justify-between">
                                    <p className="text-gray-300">Plan Cost</p>
                                    <p className="text-white">₹{planCost.toFixed(2)}</p>
                                  </div>
                                  {formData.requiresTrainer && formData.assignedTrainer && (
                                    <>
                                      <div className="flex justify-between">
                                        <p className="text-gray-300">Trainer: {selectedTrainer?.name || 'Unknown'}</p>
                                        <p className="text-white">₹{trainerFee}/month</p>
                                      </div>
                                      <div className="flex justify-between">
                                        <p className="text-gray-300">Total Trainer Cost</p>
                                        <p className="text-white">₹{totalTrainerCost.toFixed(2)}</p>
                                      </div>
                                    </>
                                  )}
                                  <div className="border-t border-blue-800 pt-2 mt-2">
                                    <div className="flex justify-between font-bold">
                                      <p className="text-gray-300">Total Amount</p>
                                      <p className="text-white">₹{totalAmount.toFixed(2)}</p>
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
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
                    <CreditCard className="h-6 w-6 text-purple-500" />
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
                            {isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="animate-spin mr-2">
                                  <RefreshCw className="h-5 w-5 text-blue-400" />
                                </div>
                                <p className="text-blue-300">Loading members...</p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-gray-400 mb-2">No members found matching your filters.</p>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-gray-700 text-gray-300 hover:bg-gray-800"
                                  disabled={isLoading}
                                  onClick={async () => {
                                    // Use a small delay before showing loading state
                                    const loadingTimer = setTimeout(() => {
                                      setIsLoading(true);
                                    }, 300);
                                    
                                    try {
                                      await fetchUsers(true);
                                      if (user && isGymOwner) {
                                        await fetchSubscriptionInfo();
                                      }
                                    } catch (error) {
                                      console.error("Error refreshing data:", error);
                                    } finally {
                                      clearTimeout(loadingTimer);
                                      // Small delay before removing loading state
                                      setTimeout(() => {
                                        setIsLoading(false);
                                      }, 300);
                                    }
                                  }}
                                >
                                  {isLoading ? (
                                    <div className="animate-spin mr-2">
                                      <RefreshCw className="h-4 w-4" />
                                    </div>
                                  ) : (
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                  )}
                                  Refresh Data
                                </Button>
                              </div>
                            )}
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
                          <p className="text-white">
                            {(() => {
                              // Find the trainer by ID
                              if (member.assignedTrainer) {
                                const trainer = availableTrainers.find(t => t._id === member.assignedTrainer);
                                return trainer ? trainer.name : 'Not assigned';
                              }
                              return 'Not assigned';
                            })()}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {getStatusBadge(member.membershipStatus)}
                            
                            {member.membershipEndDate && (
                              <div className="text-sm">
                                <div className="flex items-center gap-1 text-gray-300">
                                  <Calendar className="h-3 w-3 text-gray-400" />
                                  <span>Expires: {new Date(member.membershipEndDate).toLocaleDateString()}</span>
                                </div>
                                
                                {(() => {
                                  // Calculate days remaining
                                  const today = new Date();
                                  const endDate = new Date(member.membershipEndDate);
                                  const diffTime = endDate - today;
                                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                  const daysRemaining = diffDays > 0 ? diffDays : 0;
                                  const isExpired = endDate < today;
                                  
                                  if (isExpired) {
                                    return (
                                      <div className="flex items-center gap-1 text-red-400">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Expired</span>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-center gap-1">
                                        <span className={`
                                          ${daysRemaining > 30 ? 'text-green-400' : 
                                          daysRemaining > 10 ? 'text-yellow-400' : 'text-red-400'}
                                        `}>
                                          {daysRemaining} days left
                                        </span>
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => handleViewMember(member)}
                              title="View Member Details"
                            >
                              <User className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => navigate(`/attendance/${member.id}`)}
                              title="View Attendance"
                            >
                              <Calendar className="h-4 w-4" />
                            </Button>
                            {/* Only show edit button for trainers, not gym owners */}
                            {isTrainer && (
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => handleEditMember(member)}
                                title="Edit Member"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setSelectedMember(member);
                                setShowDeleteConfirm(true);
                              }}
                              title="Delete Member"
                            >
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
              paymentDescription={`Gym Membership Fee for ${pendingMemberData?.name || 'New Member'} (${pendingMemberData?.membershipDuration || '1'} Year ${pendingMemberData?.planType || 'Basic'} Plan${
                pendingMemberData?.requiresTrainer 
                  ? ` with Trainer: ${availableTrainers.find(t => t._id === pendingMemberData?.assignedTrainer)?.name || 'Selected Trainer'}` 
                  : ''
              })`}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Members;