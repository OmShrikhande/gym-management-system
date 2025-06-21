import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, Clock, Camera, Save, Loader2, CreditCard, Target, Dumbbell, Badge } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";
import { Badge as UIBadge } from "@/components/ui/badge";

const Profile = () => {
  const { user, authFetch, updateCurrentUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    // Health metrics for members
    height: "",
    weight: "",
    fitnessGoal: "Weight Loss",
    initialWeight: "",
    targetWeight: ""
  });
  
  // State for membership data
  const [membershipData, setMembershipData] = useState({
    status: "Active",
    startDate: null,
    endDate: null,
    type: "Standard",
    assignedTrainer: null,
    trainerName: ""
  });

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
        // Health metrics
        height: user.height || "",
        weight: user.weight || "",
        fitnessGoal: user.fitnessGoal || "Weight Loss",
        initialWeight: user.initialWeight || "",
        targetWeight: user.targetWeight || ""
      });
      
      // Set membership data if available
      if (user.membershipStatus || user.membershipEndDate) {
        setMembershipData({
          status: user.membershipStatus || "Active",
          startDate: user.createdAt || new Date(),
          endDate: user.membershipEndDate || null,
          type: user.membershipType || "Standard",
          assignedTrainer: user.assignedTrainer || null,
          trainerName: user.trainerName || ""
        });
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
                setMembershipData({
                  status: memberData.membership.status || "Active",
                  startDate: memberData.membership.startDate || user.createdAt,
                  endDate: memberData.membership.endDate,
                  type: memberData.membership.type || "Standard",
                  assignedTrainer: memberData.assignedTrainer || null,
                  trainerName: memberData.trainerName || ""
                });
                
                // Update user context with membership data
                updateCurrentUser({
                  ...user,
                  membershipStatus: memberData.membership.status,
                  membershipEndDate: memberData.membership.endDate,
                  membershipType: memberData.membership.type
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
                  fitnessGoal: memberData.healthMetrics.fitnessGoal || prev.fitnessGoal
                }));
                
                // Update user context with health metrics
                updateCurrentUser({
                  ...user,
                  height: memberData.healthMetrics.height,
                  weight: memberData.healthMetrics.weight,
                  initialWeight: memberData.healthMetrics.initialWeight,
                  targetWeight: memberData.healthMetrics.targetWeight,
                  fitnessGoal: memberData.healthMetrics.fitnessGoal
                });
              }
            }
            
            // If there's an assigned trainer, fetch trainer details
            if (user.assignedTrainer) {
              const trainerResponse = await authFetch(`/users/${user.assignedTrainer}`);
              if (trainerResponse.success || trainerResponse.status === 'success') {
                const trainerName = trainerResponse.data?.user?.name || "Unknown Trainer";
                
                setMembershipData(prev => ({
                  ...prev,
                  trainerName
                }));
                
                // Update user context with trainer name
                updateCurrentUser({
                  ...user,
                  trainerName
                });
              }
            }
          } catch (error) {
            console.error('Error fetching member details:', error);
          }
        };
        
        fetchMemberDetails();
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
        whatsapp: profileData.whatsapp
      };
      
      // Add member-specific fields if user is a member
      if (user?.role === 'member') {
        updateData.height = profileData.height;
        updateData.weight = profileData.weight;
        updateData.fitnessGoal = profileData.fitnessGoal;
        updateData.targetWeight = profileData.targetWeight;
        
        // Only set initialWeight if it's not already set
        if (!user.initialWeight && profileData.weight) {
          updateData.initialWeight = profileData.weight;
        }
      }

      // Call API to update user
      const API_URL = 'http://localhost:8081/api';
      const response = await authFetch(`${API_URL}/users/update-me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const data = await response.json();
      
      // Update user in context
      updateCurrentUser(data.data.user);
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
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
                  <AvatarImage src="/placeholder.svg" alt="Profile picture" />
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
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-lg p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white">{profileData.fullName}</h3>
                    <p className="text-blue-200 text-sm">Member ID: {user?._id?.substring(0, 8) || 'N/A'}</p>
                  </div>
                  <UIBadge variant="outline" className="bg-blue-800 text-white border-blue-500">
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
                    <p className="text-white font-medium">
                      {membershipData.endDate ? new Date(membershipData.endDate).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className="text-blue-200 mb-1">Membership Type</p>
                  <p className="text-white font-medium">{membershipData.type || 'Standard'}</p>
                </div>
                
                {membershipData.assignedTrainer && (
                  <div className="mt-4 pt-4 border-t border-blue-600">
                    <p className="text-blue-200 mb-1">Assigned Trainer</p>
                    <p className="text-white font-medium">{membershipData.trainerName || 'Not assigned'}</p>
                  </div>
                )}
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
                      <option value="Weight Loss">Weight Loss</option>
                      <option value="Muscle Gain">Muscle Gain</option>
                      <option value="Endurance">Endurance</option>
                      <option value="Flexibility">Flexibility</option>
                      <option value="General Fitness">General Fitness</option>
                    </select>
                  </div>
                  
                  {profileData.initialWeight && (
                    <div className="mt-4 p-4 bg-gray-700/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-gray-300 text-sm">Initial Weight</p>
                          <p className="text-white font-medium">{profileData.initialWeight} kg</p>
                        </div>
                        
                        {profileData.weight && (
                          <div className="text-right">
                            <p className="text-gray-300 text-sm">Progress</p>
                            <p className={`font-medium ${parseFloat(profileData.weight) < parseFloat(profileData.initialWeight) ? 'text-green-400' : 'text-red-400'}`}>
                              {parseFloat(profileData.weight) < parseFloat(profileData.initialWeight) ? '↓' : '↑'} 
                              {Math.abs(parseFloat(profileData.weight) - parseFloat(profileData.initialWeight)).toFixed(1)} kg
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;