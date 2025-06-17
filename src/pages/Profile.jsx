import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Phone, Calendar, Clock, Camera, Save, Loader2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "react-hot-toast";

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
    whatsapp: ""
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
        whatsapp: user.whatsapp || ""
      });
    }
  }, [user]);

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

        {/* Role-specific Information */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              {user?.role === 'super-admin' ? 'Admin Information' : 
               user?.role === 'gym-owner' ? 'Gym Information' : 
               'Professional Information'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {user?.role === 'super-admin' ? 'Manage your admin details' : 
               user?.role === 'gym-owner' ? 'Manage your gym details' : 
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
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Profile;