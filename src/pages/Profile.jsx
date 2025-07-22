import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, Clock, Camera, Save, Loader2, CreditCard, Target, Dumbbell, Badge, UtensilsCrossed, AlertCircle, ChevronRight, Edit, X, Video } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Badge as UIBadge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { extractId } from "@/utils/idUtils";

// Helper function to calculate days passed since a date
const getDaysPassed = (startDateStr) => {
  if (!startDateStr) return 0;
  const startDate = new Date(startDateStr);
  const today = new Date();
  const diffTime = today - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

const Profile = () => {
  const { user, authFetch, updateCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTrainerSelection, setShowTrainerSelection] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [availableTrainers, setAvailableTrainers] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [membershipExpired, setMembershipExpired] = useState(false);
  const [workoutPlans, setWorkoutPlans] = useState([]);
  const [dietPlans, setDietPlans] = useState([]);
  const [fitnessProgressEditing, setFitnessProgressEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    phone: "",
    gender: "Male",
    specialization: "",
    experience: "",
    bio: "",
    availability: "",
    certifications: "",
    gymName: "",
    address: "",
    whatsapp: "",
    upiId: "",
    // Health metrics for members
    height: "",
    weight: "",
    fitnessGoal: "weight-loss",
    initialWeight: "",
    targetWeight: "",
    // Fitness progress metrics
    currentProgress: "",
    progressNotes: "",
    progressHistory: []
  });
  
  // State for membership data
  const [membershipData, setMembershipData] = useState({
    status: "Active",
    startDate: null,
    endDate: null,
    type: "Standard",
    assignedTrainer: null,
    trainerName: "",
    daysRemaining: 0
  });

  // Function to fetch available trainers
  const fetchAvailableTrainers = async () => {
    try {
      const response = await authFetch('/auth/users?role=trainer');
      if (response.ok) {
        const data = await response.json();
        setAvailableTrainers(data.data.users || []);
      } else {
        toast.error('Failed to load available trainers');
      }
    } catch (error) {
      console.error('Error fetching trainers:', error);
      toast.error('Failed to load available trainers');
    }
  };
  
  // Handle trainer payment and assignment
  const handleTrainerPayment = async () => {
    if (!selectedTrainer) {
      toast.error('Please select a trainer first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create a payment record
      const paymentResponse = await authFetch('/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: paymentAmount,
          paymentType: 'Trainer Fee',
          paymentMethod: 'Card',
          status: 'Paid',
          description: `Trainer fee for ${selectedTrainer.name}`,
          trainerId: selectedTrainer._id
        })
      });
      
      if (!paymentResponse.ok) {
        throw new Error('Payment failed');
      }
      
      // Update user profile with assigned trainer
      const updateResponse = await authFetch('/auth/update-me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          assignedTrainer: selectedTrainer._id
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update profile');
      }
      
      // Update local state
      setMembershipData(prev => ({
        ...prev,
        assignedTrainer: selectedTrainer._id,
        trainerName: selectedTrainer.name
      }));
      
      // Update user context
      if (updateCurrentUser) {
        updateCurrentUser({
          ...user,
          assignedTrainer: selectedTrainer._id,
          trainerName: selectedTrainer.name
        });
      }
      
      toast.success(`Successfully assigned ${selectedTrainer.name} as your trainer`);
      setShowPaymentForm(false);
      setSelectedTrainer(null);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check membership expiration on mount
  useEffect(() => {
    if (user && user.role === 'member') {
      // Always set membership as active
      setMembershipExpired(false);
      
      // Calculate days remaining if end date exists
      if (user.membershipEndDate) {
        const today = new Date();
        const endDate = new Date(user.membershipEndDate);
        const diffTime = endDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        setMembershipData(prev => ({
          ...prev,
          daysRemaining: diffDays > 0 ? diffDays : 0,
          status: 'Active'
        }));
      } else {
        // If no end date, set a default value
        setMembershipData(prev => ({
          ...prev,
          daysRemaining: 365, // Default to 1 year
          status: 'Active'
        }));
      }
    }
  }, [user]);

  // Load user data when component mounts
  useEffect(() => {
  if (user) {
    setProfileData({
      fullName: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      gender: user.gender || "Male",
      specialization: user.specialization || "",
      experience: user.experience || "",
      bio: user.bio || "",
      availability: user.availability || "",
      certifications: user.certifications || "",
      gymName: user.gymName || "",
      address: user.address || "",
      whatsapp: user.whatsapp || "",
      upiId: user.upiId || "",
      height: user.height || "",
      weight: user.weight || "",
      fitnessGoal: user.fitnessGoal || user.goal || "weight-loss",
      initialWeight: user.initialWeight || "",
      targetWeight: user.targetWeight || "",
      currentProgress: user.currentProgress || "",
      progressNotes: user.progressNotes || "",
      progressHistory: user.progressHistory || []
    });

    // Calculate days remaining in membership
    const calculateDaysRemaining = (endDate) => {
      if (!endDate) return 0;
      const end = new Date(endDate);
      const today = new Date();
      const diffTime = end - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    };

    // Check if membership is expired
    const checkMembershipExpired = (endDate) => {
      if (!endDate) return true;
      const end = new Date(endDate);
      const today = new Date();
      return end < today;
    };

    // Set membership data if available
    if (user.membershipStatus || user.membershipEndDate) {
      const daysRemaining = calculateDaysRemaining(user.membershipEndDate);
      const isExpired = checkMembershipExpired(user.membershipEndDate);

      setMembershipData({
        status: isExpired ? "Expired" : user.membershipStatus || "Active",
        startDate: user.membershipStartDate || user.createdAt,
        endDate: user.membershipEndDate || null,
        type: user.membershipType || "Standard",
        assignedTrainer: user.assignedTrainer || null,
        trainerName: user.trainerName || "",
        daysRemaining: daysRemaining
      });

      setMembershipExpired(isExpired);
    }

    // If user is a member, fetch additional membership details
    if (user.role === 'member') {
      const fetchMemberDetails = async () => {
        try {
          // Fetch member details including subscription info
          const response = await authFetch(`/users/${user._id}/details`);

          if (response.success || response.status === 'success') {
            const memberData = response.data?.user || {};

            // Update membership data
            if (memberData.membership) {
              const daysRemaining = calculateDaysRemaining(memberData.membership.endDate);
              const isExpired = checkMembershipExpired(memberData.membership.endDate);

              setMembershipData({
                status: isExpired ? "Expired" : memberData.membership.status || "Active",
                startDate: memberData.membership.startDate || user.membershipStartDate || user.createdAt,
                endDate: memberData.membership.endDate,
                type: memberData.membership.type || "Standard",
                assignedTrainer: memberData.assignedTrainer || null,
                trainerName: memberData.trainerName || "",
                daysRemaining: daysRemaining
              });

              setMembershipExpired(isExpired);

              // Update user context with membership data
              updateCurrentUser({
                ...user,
                membershipStatus: isExpired ? "Expired" : memberData.membership.status,
                membershipEndDate: memberData.membership.endDate,
                membershipType: memberData.membership.type,
                membershipDaysRemaining: daysRemaining
              });
            }

            // Update health metrics if available
            if (memberData.healthMetrics) {
              setProfileData(prev => ({
                ...prev,
                height: memberData.healthMetrics.height || prev.height,
                weight: memberData.healthMetrics.weight || prev.weight,
                initialWeight: memberData.healthMetrics.initialWeight || prev.initialWeight,
                targetWeight: memberData.healthMetrics.targetWeight || prev.targetWeight,
                fitnessGoal: memberData.healthMetrics.fitnessGoal || prev.fitnessGoal,
                currentProgress: memberData.healthMetrics.currentProgress || prev.currentProgress,
                progressNotes: memberData.healthMetrics.progressNotes || prev.progressNotes,
                progressHistory: memberData.healthMetrics.progressHistory || prev.progressHistory
              }));

              // Update user context with health metrics
              updateCurrentUser({
                ...user,
                height: memberData.healthMetrics.height,
                weight: memberData.healthMetrics.weight,
                initialWeight: memberData.healthMetrics.initialWeight,
                targetWeight: memberData.healthMetrics.targetWeight,
                fitnessGoal: memberData.healthMetrics.fitnessGoal,
                currentProgress: memberData.healthMetrics.currentProgress,
                progressNotes: memberData.healthMetrics.progressNotes,
                progressHistory: memberData.healthMetrics.progressHistory
              });
            }
          } else {
            console.warn('Failed to fetch member details:', response.message);
          }

          // If there's an assigned trainer, fetch trainer details
          if (user.assignedTrainer) {
            // Handle case where assignedTrainer might be an object or a string ID
            const trainerId = extractId(user.assignedTrainer);

            // Skip if trainerId is null or invalid
            if (!trainerId) {
              console.warn('Invalid or missing assignedTrainer ID for user:', user._id);
            } else {
              try {
                // Fetch trainer details
                const trainerResponse = await authFetch(`/users/${trainerId}`);
                if (trainerResponse.success || trainerResponse.status === 'success') {
                  const trainerName = trainerResponse.data?.user?.name || "Unknown Trainer";

                  // Update membership data with trainer name
                  setMembershipData(prev => ({
                    ...prev,
                    trainerName
                  }));

                  // Update user context with trainer name
                  updateCurrentUser({
                    ...user,
                    trainerName
                  });
                } else {
                  console.warn('Failed to fetch trainer details:', trainerResponse.message);
                }

                // Fetch workout plans assigned by the trainer
                try {
                  const workoutResponse = await authFetch(`/workouts/member/${user._id}`);
                  if (workoutResponse.success || workoutResponse.status === 'success') {
                    setWorkoutPlans(workoutResponse.data?.workouts || []);
                  } else {
                    console.warn('Failed to fetch workout plans:', workoutResponse.message);
                    setWorkoutPlans([]);
                  }
                } catch (error) {
                  console.error('Error fetching workout plans:', error);
                  setWorkoutPlans([]);
                }

                // Fetch diet plans assigned by the trainer
                try {
                  const dietResponse = await authFetch(`/diet-plans/member/${user._id}`);
                  if (dietResponse.success || dietResponse.status === 'success') {
                    setDietPlans(dietResponse.data?.dietPlans || []);
                  } else {
                    console.warn('Failed to fetch diet plans:', dietResponse.message);
                    setDietPlans([]);
                  }
                } catch (error) {
                  console.error('Error fetching diet plans:', error);
                  setDietPlans([]);
                }
              } catch (error) {
                console.error('Error fetching trainer details:', error);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching member details:', error);
        }
      };

      fetchMemberDetails();

      // If member doesn't have a trainer yet, fetch available trainers
      if (!user.assignedTrainer) {
        fetchAvailableTrainers();
      }
    }
  }
}, [user, authFetch, updateCurrentUser]);
  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Prepare data for API
      const updateData = {
        name: profileData.fullName,
        email: profileData.email,
        phone: profileData.phone,
        gender: profileData.gender,
        specialization: profileData.specialization,
        experience: profileData.experience,
        bio: profileData.bio,
        availability: profileData.availability,
        certifications: profileData.certifications,
        gymName: profileData.gymName,
        address: profileData.address,
        whatsapp: profileData.whatsapp,
        upiId: profileData.upiId
      };
      
      // Debug UPI ID updates
      if (user?.role === 'gym-owner' && updateData.upiId !== undefined) {
        console.log(`🔄 Updating profile with UPI ID: ${updateData.upiId || 'None'}`);
        console.log('Current user UPI ID:', user.upiId || 'None');
      }
      
      // Add member-specific fields if user is a member
      if (user?.role === 'member') {
        updateData.height = profileData.height;
        updateData.weight = profileData.weight;
        updateData.goal = profileData.fitnessGoal;
        updateData.targetWeight = profileData.targetWeight;
        
        // Only set initialWeight if it's not already set
        if (!user.initialWeight && profileData.weight) {
          updateData.initialWeight = profileData.weight;
        }
        
        // Add fitness progress metrics
        if (fitnessProgressEditing) {
          // Create a new progress history entry
          const newProgressEntry = {
            date: new Date().toISOString(),
            weight: profileData.weight,
            notes: profileData.progressNotes
          };
          
          // Add to progress history
          const updatedHistory = [...(profileData.progressHistory || []), newProgressEntry];
          
          updateData.currentProgress = profileData.currentProgress;
          updateData.progressNotes = profileData.progressNotes;
          updateData.progressHistory = updatedHistory;
          
          // Reset fitness progress editing mode
          setFitnessProgressEditing(false);
        }
      }

      // Call API to update user
      const response = await authFetch(`/users/update-me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.status === 'error' || response.success === false) {
        throw new Error(response.message || 'Failed to update profile');
      }
      
      const data = response;
      
      // Debug the response
      if (user?.role === 'gym-owner' && updateData.upiId !== undefined) {
        console.log('📋 Profile update response:', data);
        console.log('✅ Updated user UPI ID:', data.data?.user?.upiId || 'None');
      }
      
      // Update user in context
      updateCurrentUser(data.data.user);
      
      // If UPI ID was updated, trigger a custom event for other components to listen to
      if (user?.role === 'gym-owner' && updateData.upiId !== undefined) {
        console.log('🔄 Triggering UPI ID update event');
        window.dispatchEvent(new CustomEvent('upiIdUpdated', { 
          detail: { 
            upiId: data.data?.user?.upiId,
            gymOwnerId: user._id
          } 
        }));
      }
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle fitness progress update
  const handleFitnessProgressUpdate = async () => {
    setIsLoading(true);
    try {
      // Create a new progress history entry
      const newProgressEntry = {
        date: new Date().toISOString(),
        weight: profileData.weight,
        notes: profileData.progressNotes
      };
      
      // Add to progress history
      const updatedHistory = [...(profileData.progressHistory || []), newProgressEntry];
      
      // Prepare update data
      const updateData = {
        currentProgress: profileData.currentProgress,
        progressNotes: profileData.progressNotes,
        progressHistory: updatedHistory,
        weight: profileData.weight
      };
      
      // Call API to update user
      const response = await authFetch(`/users/update-me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });
      
      if (response.status === 'error' || response.success === false) {
        throw new Error(response.message || 'Failed to update fitness progress');
      }
      
      // Update profile data with new history
      setProfileData(prev => ({
        ...prev,
        progressHistory: updatedHistory
      }));
      
      // Update user in context
      updateCurrentUser({
        ...user,
        currentProgress: profileData.currentProgress,
        progressNotes: profileData.progressNotes,
        progressHistory: updatedHistory,
        weight: profileData.weight
      });
      
      setFitnessProgressEditing(false);
      toast.success('Fitness progress updated successfully');
    } catch (error) {
      console.error('Error updating fitness progress:', error);
      toast.error(error.message || 'Failed to update fitness progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      {/* Membership Expired Warning */}
      {membershipExpired && user?.role === 'member' && (
        <div className="bg-red-900/30 border border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <AlertCircle className="h-6 w-6 text-red-400 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-white">Your membership has expired</h3>
              <p className="text-gray-300 mt-1">
                Please renew your membership to continue accessing all features of the gym.
              </p>
              <Button 
                className="mt-3 bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/billing-plans')}
              >
                Renew Membership
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content - Only show if membership is active or user is not a member */}
      {(!membershipExpired || user?.role !== 'member') && (
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <p className="text-gray-400">Manage your personal and professional information</p>
            </div>
            <Button 
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isEditing ? (
                isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )
              ) : (
                "Edit Profile"
              )}
            </Button>
          </div>
        

        {/* Profile Picture & Basic Info */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={profileData.avatar || "/placeholder.svg"} alt="Profile picture" />
                  <AvatarFallback className="bg-gray-600 text-white text-2xl">
                    {profileData.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Button 
                    size="sm" 
                    className="absolute bottom-0 right-0 rounded-full"
                    variant="secondary"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white mb-2">{profileData.fullName}</h2>
                <p className="text-gray-400 mb-2">{profileData.specialization}</p>
                <p className="text-gray-400 mb-4">{profileData.experience} of experience</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm text-gray-300">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4" />
                    <span>{profileData.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4" />
                    <span>{profileData.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <User className="h-5 w-5 mr-2" />
              Personal Information
            </CardTitle>
            <CardDescription className="text-gray-400">
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fullName" className="text-gray-300">Full Name</Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  disabled={!isEditing}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  disabled={!isEditing}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  disabled={!isEditing}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div>
                <Label htmlFor="gender" className="text-gray-300">Gender</Label>
                <select
                  id="gender"
                  value={profileData.gender}
                  onChange={(e) => handleInputChange("gender", e.target.value)}
                  disabled={!isEditing}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="bio" className="text-gray-300">Bio</Label>
              <Textarea
                id="bio"
                value={profileData.bio}
                onChange={(e) => handleInputChange("bio", e.target.value)}
                disabled={!isEditing}
                className="bg-gray-700 border-gray-600 text-white"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Membership Information for Members */}
        {user?.role === 'member' && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Membership Information
              </CardTitle>
              <CardDescription className="text-gray-400">
                Your current membership details and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className={`bg-gradient-to-r ${membershipExpired ? 'from-red-900 to-red-700' : 'from-blue-900 to-blue-700'} rounded-lg p-6 shadow-lg`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{profileData.fullName}</h3>
                    <p className="text-blue-200 text-sm">Member ID: {user?._id?.substring(0, 8) || 'N/A'}</p>
                  </div>
                  <UIBadge variant={membershipExpired ? "destructive" : "outline"} className={membershipExpired ? "bg-red-800 text-white border-red-500" : "bg-blue-800 text-white border-blue-500"}>
                    {membershipData.status || 'Active'}
                  </UIBadge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-blue-200">Start Date</p>
                    <p className="text-white font-medium">
                      {membershipData.startDate ? new Date(membershipData.startDate).toLocaleDateString() : 
                       user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-200">Expiry Date</p>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">
                        {membershipData.endDate ? new Date(membershipData.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                      {!membershipExpired && membershipData.endDate && (
                        <UIBadge className="bg-blue-600 text-white border-blue-500">
                          {membershipData.daysRemaining} days left
                        </UIBadge>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Membership Timeline */}
                {membershipData.startDate && membershipData.endDate && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-blue-200 mb-1">
                      <span>Start</span>
                      <span>Expiry</span>
                    </div>
                    <div className="relative h-2 bg-blue-900/50 rounded-full overflow-hidden">
                      {!membershipExpired ? (
                        <>
                          <div 
                            className="absolute h-full bg-blue-500" 
                            style={{ 
                              width: `${Math.min(100, 100 - (membershipData.daysRemaining / (membershipData.daysRemaining + getDaysPassed(membershipData.startDate)) * 100))}%` 
                            }}
                          />
                          <div className="absolute h-3 w-3 bg-white rounded-full top-1/2 transform -translate-y-1/2 -translate-x-1/2"
                            style={{ 
                              left: `${Math.min(100, 100 - (membershipData.daysRemaining / (membershipData.daysRemaining + getDaysPassed(membershipData.startDate)) * 100))}%` 
                            }}
                          />
                        </>
                      ) : (
                        <div className="absolute h-full bg-red-500 w-full" />
                      )}
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-blue-200 mb-1">Membership Type</p>
                    <p className="text-white font-medium">{membershipData.type || 'Standard'}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 mb-1">Membership Status</p>
                    {membershipExpired ? (
                      <div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-4 w-4 text-red-400" />
                          <p className="text-red-400 font-medium">Expired</p>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => navigate('/billing-plans')}
                          className="mt-2 bg-red-600/20 hover:bg-red-600/30 border-red-500 text-red-100"
                        >
                          Renew Now
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${
                            membershipData.daysRemaining > 30 ? 'bg-green-400' : 
                            membershipData.daysRemaining > 10 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}></div>
                          <p className={`font-medium ${
                            membershipData.daysRemaining > 30 ? 'text-green-400' : 
                            membershipData.daysRemaining > 10 ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            Active ({membershipData.daysRemaining} days remaining)
                          </p>
                        </div>
                        
                        {membershipData.daysRemaining < 30 && (
                          <div className="mt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate('/billing-plans')}
                              className={`
                                ${membershipData.daysRemaining <= 10 ? 
                                  'bg-red-600/20 hover:bg-red-600/30 border-red-500 text-red-100' : 
                                  'bg-yellow-600/20 hover:bg-yellow-600/30 border-yellow-500 text-yellow-100'}
                              `}
                            >
                              Renew Membership
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Trainer Information */}
                <div className="mt-4 pt-4 border-t border-blue-600">
                  <p className="text-blue-200 mb-1">Assigned Trainer</p>
                  {membershipData.assignedTrainer ? (
                    <div>
                      <p className="text-white font-medium">{membershipData.trainerName || 'Not assigned'}</p>
                      <p className="text-blue-200 text-sm mt-1">Your trainer has assigned workout and diet plans for you</p>
                    </div>
                  ) : (
                    user?.role === 'member' && !membershipExpired && (
                      <div className="mt-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowTrainerSelection(true)}
                          className="bg-blue-600/20 hover:bg-blue-600/30 border-blue-500 text-blue-100"
                        >
                          <Dumbbell className="h-4 w-4 mr-2" />
                          Select a Trainer
                        </Button>
                      </div>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-specific Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {user?.role === 'super-admin' ? 'Admin Information' : 
               user?.role === 'gym-owner' ? 'Gym Information' : 
               user?.role === 'member' ? 'Personal Information' : 
               'Professional Information'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {user?.role === 'super-admin' ? 'Manage your admin details' : 
               user?.role === 'gym-owner' ? 'Manage your gym details' : 
               user?.role === 'member' ? 'Manage your personal details' :
               'Manage your specialization, experience, and availability'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Super Admin Fields */}
            {user?.role === 'super-admin' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp Number</Label>
                  <Input
                    id="whatsapp"
                    value={profileData.whatsapp}
                    onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="experience" className="text-gray-300">Experience</Label>
                  <Input
                    id="experience"
                    value={profileData.experience}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            
            {/* Gym Owner Fields */}
            {user?.role === 'gym-owner' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="gymName" className="text-gray-300">Gym Name</Label>
                    <Input
                      id="gymName"
                      value={profileData.gymName}
                      onChange={(e) => handleInputChange("gymName", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      value={profileData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address" className="text-gray-300">Gym Address</Label>
                  <Textarea
                    id="address"
                    value={profileData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={2}
                  />
                </div>
              </>
            )}
            
            {/* Payment Settings for Gym Owners */}
            {user?.role === 'gym-owner' && (
              <div className="border-t border-gray-600 pt-4 mt-4">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Settings
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Set up your UPI ID to receive payments from members directly
                </p>
                <div>
                  <Label htmlFor="upiId" className="text-gray-300">UPI ID</Label>
                  <Input
                    id="upiId"
                    value={profileData.upiId}
                    onChange={(e) => handleInputChange("upiId", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g., yourname@paytm, 9876543210@ybl"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This UPI ID will be shown to members when they make payments for membership fees
                  </p>
                </div>
              </div>
            )}
            
            {/* Trainer Fields */}
            {user?.role === 'trainer' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="specialization" className="text-gray-300">Specialization</Label>
                    <Input
                      id="specialization"
                      value={profileData.specialization}
                      onChange={(e) => handleInputChange("specialization", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience" className="text-gray-300">Experience</Label>
                    <Input
                      id="experience"
                      value={profileData.experience}
                      onChange={(e) => handleInputChange("experience", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="certifications" className="text-gray-300">Certifications</Label>
                  <Input
                    id="certifications"
                    value={profileData.certifications}
                    onChange={(e) => handleInputChange("certifications", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="availability" className="text-gray-300 flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Availability Schedule
                  </Label>
                  <Textarea
                    id="availability"
                    value={profileData.availability}
                    onChange={(e) => handleInputChange("availability", e.target.value)}
                    disabled={!isEditing}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={4}
                  />
                </div>
              </>
            )}
            
            {/* Member Fields */}
            {user?.role === 'member' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address" className="text-gray-300">Address</Label>
                    <Textarea
                      id="address"
                      value={profileData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label htmlFor="whatsapp" className="text-gray-300">WhatsApp Number</Label>
                    <Input
                      id="whatsapp"
                      value={profileData.whatsapp}
                      onChange={(e) => handleInputChange("whatsapp", e.target.value)}
                      disabled={!isEditing}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                
                {/* Health Metrics */}
                <div className="mt-6">
                  <h3 className="text-white font-medium text-lg mb-4 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-400" />
                    Health Metrics
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="height" className="text-gray-300">Height (cm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={profileData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="weight" className="text-gray-300">Current Weight (kg)</Label>
                      <Input
                        id="weight"
                        type="number"
                        value={profileData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetWeight" className="text-gray-300">Target Weight (kg)</Label>
                      <Input
                        id="targetWeight"
                        type="number"
                        value={profileData.targetWeight}
                        onChange={(e) => handleInputChange("targetWeight", e.target.value)}
                        disabled={!isEditing}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Label htmlFor="fitnessGoal" className="text-gray-300">Fitness Goal</Label>
                    <select
                      id="fitnessGoal"
                      value={profileData.fitnessGoal}
                      onChange={(e) => handleInputChange("fitnessGoal", e.target.value)}
                      disabled={!isEditing}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                    >
                      <option value="weight-loss">Weight Loss</option>
                      <option value="weight-gain">Weight Gain</option>
                      <option value="general-fitness">General Fitness</option>
                    </select>
                  </div>
                  
                  {/* Fitness Progress Section */}
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                      {fitnessProgressEditing && (
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setFitnessProgressEditing(false)}
                            className="bg-gray-700 hover:bg-gray-600 border-gray-600 text-gray-200"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleFitnessProgressUpdate}
                            className="bg-green-600 hover:bg-green-700"
                            disabled={isLoading}
                          >
                            {isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Progress
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {/* Progress Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-4 bg-gray-700/30 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-gray-300 text-sm">Initial Weight</p>
                            <p className="text-white font-medium">{profileData.initialWeight || 'Not set'} {profileData.initialWeight ? 'kg' : ''}</p>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-gray-300 text-sm">Current Weight</p>
                            {fitnessProgressEditing ? (
                              <Input
                                type="number"
                                value={profileData.weight}
                                onChange={(e) => handleInputChange("weight", e.target.value)}
                                className="w-24 h-8 bg-gray-600 border-gray-500 text-white text-right"
                              />
                            ) : (
                              <p className="text-white font-medium">{profileData.weight || 'Not set'} {profileData.weight ? 'kg' : ''}</p>
                            )}
                          </div>
                        </div>
                        
                        {profileData.initialWeight && profileData.weight && (
                          <div className="mt-3">
                            <p className="text-gray-300 text-sm mb-1">Weight Progress</p>
                            <div className="flex items-center">
                              <Progress 
                                value={Math.min(100, (parseFloat(profileData.weight) / parseFloat(profileData.targetWeight || profileData.initialWeight)) * 100)} 
                                className="h-2 flex-1"
                                indicatorClassName={
                                  parseFloat(profileData.weight) < parseFloat(profileData.initialWeight) ? 'bg-green-500' : 'bg-red-500'
                                }
                              />
                              <span className={`ml-3 font-medium ${parseFloat(profileData.weight) < parseFloat(profileData.initialWeight) ? 'text-green-400' : 'text-red-400'}`}>
                                {parseFloat(profileData.weight) < parseFloat(profileData.initialWeight) ? '↓' : '↑'} 
                                {Math.abs(parseFloat(profileData.weight) - parseFloat(profileData.initialWeight)).toFixed(1)} kg
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                    
                  </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      )}
      
      {/* Workout and Diet Plans Section */}
      {user?.role === 'member' && membershipData.assignedTrainer && !membershipExpired && (
        <div className="space-y-8 mt-8">
          <h2 className="text-2xl font-bold text-white">My Training Plans</h2>
          {/* Workout Plans */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Dumbbell className="h-5 w-5 mr-2 text-blue-400" />
                Workout Plans
              </CardTitle>
              <CardDescription className="text-gray-400">
                Workout plans assigned by your trainer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {workoutPlans.length > 0 ? (
                <div className="space-y-4">
                  {workoutPlans.map((plan, index) => (
                    <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-white">{plan.title}</h3>
                        <UIBadge variant="outline" className="bg-blue-800/30 text-blue-300 border-blue-700">
                          {plan.type}
                        </UIBadge>
                      </div>
                      <p className="text-gray-300 mb-3">{plan.description}</p>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-400">Duration</p>
                          <p className="text-white">{plan.duration || 30} minutes</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Focus</p>
                          <p className="text-white">{plan.focus || 'General'}</p>
                        </div>
                      </div>
                      
                      {plan.exercises && (
                        <div className="mt-3">
                          <p className="text-gray-400 mb-1">Exercises</p>
                          <p className="text-white">{plan.exercises}</p>
                        </div>
                      )}
                      
                      {plan.videoLink && (
                        <div className="mt-3">
                          <a 
                            href={plan.videoLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-400 flex items-center hover:text-blue-300"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Watch Workout Video
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Dumbbell className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-white mb-1">No Workout Plans Yet</h3>
                  <p className="text-gray-400">Your trainer hasn't assigned any workout plans yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Diet Plans */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UtensilsCrossed className="h-5 w-5 mr-2 text-green-400" />
                Diet Plans
              </CardTitle>
              <CardDescription className="text-gray-400">
                Diet plans assigned by your trainer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {dietPlans.length > 0 ? (
                <div className="space-y-4">
                  {dietPlans.map((plan, index) => (
                    <div key={index} className="p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                        <UIBadge variant="outline" className="bg-green-800/30 text-green-300 border-green-700">
                          {plan.goalType}
                        </UIBadge>
                      </div>
                      <p className="text-gray-300 mb-3">{plan.description}</p>
                      
                      <div className="mb-3">
                        <p className="text-gray-400 mb-1">Total Calories</p>
                        <p className="text-white font-medium">{plan.totalCalories} kcal/day</p>
                      </div>
                      
                      {plan.meals && plan.meals.length > 0 && (
                        <div>
                          <p className="text-gray-400 mb-2">Meal Plan</p>
                          <div className="space-y-3">
                            {plan.meals.map((meal, mealIndex) => (
                              <div key={mealIndex} className="p-3 bg-gray-800/50 rounded border border-gray-700">
                                <div className="flex justify-between items-center mb-1">
                                  <p className="text-white font-medium">{meal.type}</p>
                                  <p className="text-gray-400 text-sm">{meal.time}</p>
                                </div>
                                <p className="text-gray-300 text-sm">{meal.items}</p>
                                {meal.calories && (
                                  <p className="text-gray-400 text-sm mt-1">{meal.calories} kcal</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <UtensilsCrossed className="h-12 w-12 text-gray-500 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-white mb-1">No Diet Plans Yet</h3>
                  <p className="text-gray-400">Your trainer hasn't assigned any diet plans yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Trainer Selection Dialog */}
      {showTrainerSelection && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Dumbbell className="h-5 w-5 mr-2 text-blue-400" />
              Select a Trainer
            </h3>
            
            <p className="text-gray-300 mb-4">
              Choose a trainer to help you achieve your fitness goals. A trainer fee will apply.
            </p>
            
            <div className="max-h-60 overflow-y-auto mb-4 space-y-3">
              {availableTrainers.length > 0 ? (
                availableTrainers.map(trainer => (
                  <div 
                    key={trainer._id}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      selectedTrainer?._id === trainer._id 
                        ? 'bg-blue-600/20 border-blue-500' 
                        : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedTrainer(trainer);
                      // Use trainer's actual fee, check both trainerFee and salary fields
                      const actualFee = trainer.trainerFee || parseInt(trainer.salary) || 0;
                      setPaymentAmount(actualFee);
                      if (actualFee === 0) {
                        console.warn(`No fee set for trainer: ${trainer.name}`);
                      }
                    }}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarFallback className="bg-blue-600 text-white">
                          {trainer.name?.charAt(0) || 'T'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium text-white">{trainer.name}</h4>
                        <p className="text-sm text-gray-400">
                          {trainer.specialization || 'General Fitness'} • 
                          {trainer.experience ? ` ${trainer.experience} exp.` : ' Experienced'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No trainers available at the moment.</p>
              )}
            </div>
            
            {selectedTrainer && (
              <div className="mb-4 p-3 bg-blue-900/20 rounded-md border border-blue-800">
                <p className="text-sm text-blue-300 mb-1">Trainer Fee</p>
                <p className="text-white font-medium">
                  ₹{paymentAmount.toLocaleString()} per month
                </p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowTrainerSelection(false);
                  setSelectedTrainer(null);
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowTrainerSelection(false);
                  setShowPaymentForm(true);
                }}
                disabled={!selectedTrainer}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50"
              >
                Continue to Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Form Dialog */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-400" />
              Trainer Payment
            </h3>
            
            <div className="mb-4 p-3 bg-gray-700/50 rounded-md border border-gray-600">
              <div className="flex items-center mb-3">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedTrainer?.name?.charAt(0) || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium text-white">{selectedTrainer?.name}</h4>
                  <p className="text-sm text-gray-400">
                    {selectedTrainer?.specialization || 'General Fitness'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Trainer Fee</p>
                <p className="text-white font-medium">₹{paymentAmount.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <Label htmlFor="cardNumber" className="text-gray-300">Card Number</Label>
                <Input 
                  id="cardNumber" 
                  placeholder="1234 5678 9012 3456" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiry" className="text-gray-300">Expiry Date</Label>
                  <Input 
                    id="expiry" 
                    placeholder="MM/YY" 
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cvv" className="text-gray-300">CVV</Label>
                  <Input 
                    id="cvv" 
                    placeholder="123" 
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="name" className="text-gray-300">Name on Card</Label>
                <Input 
                  id="name" 
                  placeholder="John Doe" 
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowPaymentForm(false);
                  setSelectedTrainer(null);
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleTrainerPayment}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay ₹{paymentAmount.toLocaleString()}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default Profile;