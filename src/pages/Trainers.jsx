import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, User, Edit, Trash2, Calendar, X, Award, Dumbbell } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";

const Trainers = () => {
  const { users, fetchUsers, isGymOwner, createTrainer } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [filterGym, setFilterGym] = useState("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDetailView, setShowDetailView] = useState(false);
  const [selectedTrainer, setSelectedTrainer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    mobile: '',
    gender: 'Male',
    specialization: 'Weight Training',
    experience: '',
    certifications: '',
    availability: '',
    bio: '',
    address: '',
    whatsapp: '',
    salary: '',
    joiningDate: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [realTrainers, setRealTrainers] = useState([]);
  
  // Fetch trainers when component mounts
  useEffect(() => {
    const loadTrainers = async () => {
      if (!isLoading) setIsLoading(true);
      try {
        await fetchUsers();
      } catch (error) {
        console.error('Error fetching trainers:', error);
        setMessage({ type: 'error', text: 'Failed to load trainers' });
      }
      // We'll set isLoading to false after processing the data in the next useEffect
    };
    
    loadTrainers();
  }, [fetchUsers]);
  
  // Process users to get trainers
  useEffect(() => {
    if (users) {
      // Filter users to get only trainers
      const trainers = users
        .filter(user => user.role === 'trainer')
        .map(trainer => ({
          id: trainer._id,
          name: trainer.name,
          email: trainer.email,
          mobile: trainer.phone || '',
          whatsapp: trainer.whatsapp || '',
          gender: trainer.gender || 'Not specified',
          specialization: trainer.specialization || 'General Fitness',
          experience: trainer.experience || '1 year',
          assignedGym: trainer.assignedGym || 'Main Gym',
          assignedMembers: trainer.assignedMembers || 0,
          profileImage: trainer.profileImage || null,
          address: trainer.address || '',
          certifications: trainer.certifications || '',
          availability: trainer.availability || '',
          bio: trainer.bio || '',
          salary: trainer.salary || '',
          joiningDate: trainer.joiningDate || '',
          rating: trainer.rating || '4.5',
          status: trainer.status || 'Active'
        }));
      
      setRealTrainers(trainers);
      // Only set loading to false after we've processed the data
      setIsLoading(false);
    }
  }, [users]);

  // Debounce search term to prevent excessive filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  const filteredTrainers = realTrainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         trainer.email.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
                         trainer.specialization.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
    const matchesGym = filterGym === "all" || trainer.assignedGym === filterGym;
    return matchesSearch && matchesGym;
  });

  const getSpecializationBadge = (specialization) => {
    const colors = {
      'Weight Training': 'default',
      'Cardio & Weight Loss': 'destructive',
      'Strength Training': 'secondary',
      'Yoga & Flexibility': 'outline',
      'General Fitness': 'default'
    };
    const variant = colors[specialization] || 'outline';
    return <Badge variant={variant}>{specialization}</Badge>;
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      mobile: '',
      gender: 'Male',
      specialization: 'Weight Training',
      experience: '',
      certifications: '',
      availability: '',
      bio: '',
      address: '',
      whatsapp: '',
      salary: '',
      joiningDate: ''
    });
    setMessage({ type: '', text: '' });
  };
  
  const handleViewTrainer = (trainer) => {
    setSelectedTrainer(trainer);
    setShowDetailView(true);
  };
  
  const handleCloseDetailView = () => {
    setSelectedTrainer(null);
    setShowDetailView(false);
  };
  
  const handleCreateTrainer = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name || !formData.email || !formData.password) {
      setMessage({ type: 'error', text: 'Name, email, and password are required' });
      return;
    }
    
    // Validate password length
    if (formData.password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    
    // Set loading state for the form only, not the entire page
    setFormSubmitting(true);
    setMessage({ type: 'info', text: 'Creating trainer...' });
    
    try {
      // Add role to form data
      const trainerData = { ...formData, role: 'trainer' };
      
      const result = await createTrainer(trainerData);
      
      if (result && result.success) {
        setMessage({ type: 'success', text: result.message });
        resetForm();
        setShowAddForm(false);
        
        // Refresh trainers list
        await fetchUsers();
      } else {
        setMessage({ type: 'error', text: result ? result.message : 'Failed to create trainer' });
      }
    } catch (error) {
      console.error('Error creating trainer:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating the trainer' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const trainerStats = {
    total: realTrainers.length,
    totalMembers: realTrainers.length > 0 
      ? realTrainers.reduce((sum, trainer) => sum + (trainer.assignedMembers || 0), 0)
      : 0,
    averageMembers: realTrainers.length > 0 
      ? Math.round(realTrainers.reduce((sum, trainer) => sum + (trainer.assignedMembers || 0), 0) / realTrainers.length)
      : 0,
    experienced: realTrainers.filter(t => {
      const years = parseInt(t.experience);
      return !isNaN(years) && years > 3;
    }).length
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Trainer Management</h1>
            <p className="text-gray-400">Manage gym trainers and their member assignments</p>
          </div>
          {isGymOwner && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Trainer
            </Button>
          )}
        </div>

        {/* Trainer Detail View */}
        {showDetailView && selectedTrainer && (
          <Card key={`detail-${selectedTrainer.id}`} className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Trainer Details</CardTitle>
                <CardDescription className="text-gray-400">
                  Complete information about {selectedTrainer.name}
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
                      <p className="text-white">{selectedTrainer.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Email Address</p>
                      <p className="text-white">{selectedTrainer.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Trainer ID</p>
                      <p className="text-white">{selectedTrainer.id}</p>
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Mobile Number</p>
                      <p className="text-white">{selectedTrainer.mobile || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">WhatsApp Number</p>
                      <p className="text-white">{selectedTrainer.whatsapp || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Address</p>
                      <p className="text-white">{selectedTrainer.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Gender</p>
                      <p className="text-white">{selectedTrainer.gender}</p>
                    </div>
                  </div>
                </div>
                
                {/* Professional Details */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Professional Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Specialization</p>
                      <div>{getSpecializationBadge(selectedTrainer.specialization)}</div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Experience</p>
                      <p className="text-white">{selectedTrainer.experience}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Assigned Gym</p>
                      <p className="text-white">{selectedTrainer.assignedGym}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Assigned Members</p>
                      <p className="text-white">{selectedTrainer.assignedMembers}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Rating</p>
                      <p className="text-white">{selectedTrainer.rating} / 5</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Status</p>
                      <p className="text-white">{selectedTrainer.status}</p>
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Certifications</p>
                      <p className="text-white">{selectedTrainer.certifications || 'None recorded'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Availability</p>
                      <p className="text-white">{selectedTrainer.availability || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-gray-400 text-sm mb-1">Bio</p>
                      <p className="text-white">{selectedTrainer.bio || 'No bio available'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Employment Details */}
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Joining Date</p>
                      <p className="text-white">{selectedTrainer.joiningDate ? new Date(selectedTrainer.joiningDate).toLocaleDateString() : 'Not recorded'}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Salary</p>
                      <p className="text-white">{selectedTrainer.salary ? `₹${selectedTrainer.salary}` : 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Add Trainer Form */}
        {showAddForm && (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Add New Trainer</CardTitle>
                <CardDescription className="text-gray-400">
                  Create a new trainer account
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
            <CardContent>
              <form onSubmit={handleCreateTrainer} className="space-y-6">
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Basic Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <Label htmlFor="name" className="mb-2 block text-gray-300">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Enter full name"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="mb-2 block text-gray-300">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="Enter email address"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="password" className="mb-2 block text-gray-300">Password</Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Enter password (min 6 characters)"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="mobile" className="mb-2 block text-gray-300">Mobile Number</Label>
                      <Input
                        id="mobile"
                        name="mobile"
                        value={formData.mobile}
                        onChange={handleInputChange}
                        placeholder="Enter mobile number"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="whatsapp" className="mb-2 block text-gray-300">WhatsApp Number</Label>
                      <Input
                        id="whatsapp"
                        name="whatsapp"
                        value={formData.whatsapp}
                        onChange={handleInputChange}
                        placeholder="Enter WhatsApp number (if different)"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="address" className="mb-2 block text-gray-300">Address</Label>
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Enter residential address"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender" className="mb-2 block text-gray-300">Gender</Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Professional Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                    <div>
                      <Label htmlFor="specialization" className="mb-2 block text-gray-300">Specialization</Label>
                      <select
                        id="specialization"
                        name="specialization"
                        value={formData.specialization}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2"
                      >
                        <option value="Weight Training">Weight Training</option>
                        <option value="Cardio & Weight Loss">Cardio & Weight Loss</option>
                        <option value="Strength Training">Strength Training</option>
                        <option value="Yoga & Flexibility">Yoga & Flexibility</option>
                        <option value="General Fitness">General Fitness</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="experience" className="mb-2 block text-gray-300">Experience (years)</Label>
                      <Input
                        id="experience"
                        name="experience"
                        value={formData.experience}
                        onChange={handleInputChange}
                        placeholder="Enter years of experience"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="certifications" className="mb-2 block text-gray-300">Certifications</Label>
                      <Input
                        id="certifications"
                        name="certifications"
                        value={formData.certifications}
                        onChange={handleInputChange}
                        placeholder="Enter certifications"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="availability" className="mb-2 block text-gray-300">Availability</Label>
                      <Input
                        id="availability"
                        name="availability"
                        value={formData.availability}
                        onChange={handleInputChange}
                        placeholder="E.g., Mon-Fri, 9AM-5PM"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="bio" className="mb-2 block text-gray-300">Bio</Label>
                      <textarea
                        id="bio"
                        name="bio"
                        value={formData.bio}
                        onChange={handleInputChange}
                        placeholder="Enter trainer bio"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500 rounded-md p-2 h-24"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-800/30 p-6 rounded-lg border border-gray-700">
                  <h4 className="text-lg font-semibold mb-4 text-white">Employment Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="salary" className="mb-2 block text-gray-300">Salary (₹)</Label>
                      <Input
                        id="salary"
                        name="salary"
                        type="number"
                        value={formData.salary}
                        onChange={handleInputChange}
                        placeholder="Enter monthly salary"
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="joiningDate" className="mb-2 block text-gray-300">Joining Date</Label>
                      <Input
                        id="joiningDate"
                        name="joiningDate"
                        type="date"
                        value={formData.joiningDate}
                        onChange={handleInputChange}
                        className="w-full bg-gray-700 border-gray-600 focus:border-blue-500"
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
                    disabled={formSubmitting}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Creating...' : 'Create Trainer'}
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
            </CardContent>
          </Card>
        )}
        
        {/* Stats Cards */}
        {isLoading ? (
          <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
            <p className="text-gray-400">Loading trainer statistics...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Trainers</p>
                  <p className="text-2xl font-bold text-white">{trainerStats.total}</p>
                </div>
                <Users className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Members</p>
                  <p className="text-2xl font-bold text-white">{trainerStats.totalMembers}</p>
                </div>
                <User className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Members</p>
                  <p className="text-2xl font-bold text-white">{trainerStats.averageMembers}</p>
                </div>
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Experienced</p>
                  <p className="text-2xl font-bold text-white">{trainerStats.experienced}</p>
                </div>
                <Award className="h-6 w-6 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Trainer Directory</CardTitle>
            <CardDescription className="text-gray-400">
              Search and manage gym trainers with member assignments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search trainers, emails, or specializations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                  disabled={isLoading}
                />
              </div>
              <select
                value={filterGym}
                onChange={(e) => setFilterGym(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                disabled={isLoading}
              >
                <option value="all">All Gyms</option>
                <option value="PowerFit Gym">PowerFit Gym</option>
                <option value="FitZone Studio">FitZone Studio</option>
                <option value="Main Gym">Main Gym</option>
              </select>
            </div>

            {/* Trainers Table */}
            {isLoading ? (
              <div className="text-center p-8 bg-gray-800/30 rounded border border-gray-700">
                <p className="text-gray-400">Loading trainers...</p>
              </div>
            ) : (
              <div className="rounded-md border border-gray-700 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800/50">
                      <TableHead className="text-gray-300">Trainer Details</TableHead>
                      <TableHead className="text-gray-300">Contact</TableHead>
                      <TableHead className="text-gray-300">Specialization</TableHead>
                      <TableHead className="text-gray-300">Experience</TableHead>
                      <TableHead className="text-gray-300">Members</TableHead>
                      <TableHead className="text-gray-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrainers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <p className="text-gray-400">No trainers found matching your filters.</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrainers.map((trainer) => (
                        <TableRow key={trainer.id} className="border-gray-700 hover:bg-gray-800/30">
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4 text-blue-400" />
                              <div>
                                <p className="font-medium text-white">{trainer.name}</p>
                                <p className="text-sm text-gray-400">{trainer.gender} • {trainer.assignedGym}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-white">{trainer.email}</p>
                              <p className="text-sm text-gray-400">{trainer.mobile}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getSpecializationBadge(trainer.specialization)}
                          </TableCell>
                          <TableCell>
                            <p className="text-white">{trainer.experience}</p>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Users className="h-4 w-4 text-blue-400" />
                              <span className="text-white">{trainer.assignedMembers}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                onClick={() => handleViewTrainer(trainer)}
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
      </div>
    </DashboardLayout>
  );
};

export default Trainers;