import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Users, User, Edit, Trash2, Calendar, Target, X, AlertCircle, Video, Dumbbell } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const WorkoutPage = () => {
  const { user, users, fetchUsers, isTrainer, isGymOwner, isMember, authFetch } = useAuth();
  const navigate = useNavigate();
  
  // State for workout data
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  // State for workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',
    type: 'intermediate',
    description: '',
    videoLink: '',
    assignedTo: '',
    duration: '30',
    exercises: '',
    notes: ''
  });
  
  // State for filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // State for editing
  const [isEditing, setIsEditing] = useState(false);
  const [editWorkoutId, setEditWorkoutId] = useState(null);
  
  // Load workouts data
  useEffect(() => {
    const loadWorkouts = async () => {
      setIsLoading(true);
      try {
        // Fetch workouts based on user role
        let endpoint = '/workouts';
        
        if (isTrainer) {
          endpoint = `/workouts/trainer/${user._id}`;
        } else if (isMember) {
          endpoint = `/workouts/member/${user._id}`;
        } else if (isGymOwner) {
          endpoint = `/workouts/gym/${user._id}`;
        }
        
        console.log('Fetching workouts from endpoint:', endpoint);
        console.log('User role:', isGymOwner ? 'Gym Owner' : isTrainer ? 'Trainer' : isMember ? 'Member' : 'Unknown');
        console.log('User ID:', user._id);
        
        const response = await authFetch(endpoint);
        
        console.log('Workout API response:', response);
        
        if (response.success) {
          console.log('Workouts data received:', response.data.workouts || []);
          setWorkouts(response.data.workouts || []);
        } else {
          console.error('Failed to load workouts:', response.message);
          setMessage({ type: 'error', text: response.message || 'Failed to load workouts' });
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
        setMessage({ type: 'error', text: 'Failed to load workouts' });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user) {
      loadWorkouts();
    }
  }, [user, isTrainer, isMember, isGymOwner, authFetch]);
  
  // Load users data for trainer to assign workouts
  useEffect(() => {
    if (isTrainer && fetchUsers) {
      fetchUsers();
    }
  }, [isTrainer, fetchUsers]);
  
  // Filter members for trainer to assign workouts
  const availableMembers = useMemo(() => {
    if (!users || !isTrainer) return [];
    
    return users.filter(u => u.role === 'member');
  }, [users, isTrainer]);
  
  // Filter workouts based on search and filter
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(workout => {
      const matchesSearch = 
        workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        workout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (workout.focus ? workout.focus.toLowerCase().includes(searchTerm.toLowerCase()) : false);
      
      const matchesType = filterType === 'all' || workout.type === filterType;
      
      return matchesSearch && matchesType;
    });
  }, [workouts, searchTerm, filterType]);
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorkoutFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select change
  const handleSelectChange = (name, value) => {
    setWorkoutFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Reset form
  const resetForm = () => {
    setWorkoutFormData({
      title: '',
      type: 'intermediate',
      description: '',
      videoLink: '',
      assignedTo: '',
      duration: '30',
      exercises: '',
      notes: ''
    });
    setIsEditing(false);
    setEditWorkoutId(null);
  };
  
  // Handle form submission
  const handleSubmitWorkout = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!workoutFormData.title || !workoutFormData.focus || !workoutFormData.description || !workoutFormData.assignedTo) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }
    
    setFormSubmitting(true);
    setMessage({ type: 'info', text: isEditing ? 'Updating workout...' : 'Creating workout...' });
    
    try {
      // Prepare workout data
      const workoutData = {
        ...workoutFormData,
        trainer: user._id,
        trainerName: user.name,
      };
      
      let response;
      
      if (isEditing && editWorkoutId) {
        // Update existing workout
        response = await authFetch(`/workouts/${editWorkoutId}`, {
          method: 'PUT',
          body: JSON.stringify(workoutData),
        });
      } else {
        // Create new workout
        response = await authFetch('/workouts', {
          method: 'POST',
          body: JSON.stringify(workoutData),
        });
      }
      
      if (response.success) {
        toast.success(isEditing ? 'Workout updated successfully' : 'Workout created successfully');
        
        // Refresh workouts list
        const updatedWorkouts = await authFetch(`/workouts/trainer/${user._id}`);
        if (updatedWorkouts.success) {
          setWorkouts(updatedWorkouts.data.workouts || []);
        }
        
        // Reset form and close modal
        resetForm();
        setShowWorkoutForm(false);
      } else {
        setMessage({ 
          type: 'error', 
          text: response.message || (isEditing ? 'Failed to update workout' : 'Failed to create workout') 
        });
      }
    } catch (error) {
      console.error('Error submitting workout:', error);
      setMessage({ 
        type: 'error', 
        text: isEditing ? 'Failed to update workout' : 'Failed to create workout' 
      });
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle edit workout
  const handleEditWorkout = (workout) => {
    setWorkoutFormData({
      title: workout.title,
      type: workout.type,
      focus: workout.focus,
      description: workout.description,
      videoLink: workout.videoLink || '',
      assignedTo: workout.assignedTo._id || workout.assignedTo,
      duration: workout.duration || '30',
    });
    setIsEditing(true);
    setEditWorkoutId(workout._id);
    setShowWorkoutForm(true);
  };
  
  // Handle delete workout
  const handleDeleteWorkout = async (workoutId) => {
    if (!workoutId) return;
    
    if (!confirm('Are you sure you want to delete this workout?')) return;
    
    try {
      const response = await authFetch(`/workouts/${workoutId}`, {
        method: 'DELETE',
      });
      
      if (response.success) {
        toast.success('Workout deleted successfully');
        
        // Update workouts list
        setWorkouts(prev => prev.filter(w => w._id !== workoutId));
      } else {
        toast.error(response.message || 'Failed to delete workout');
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      toast.error('Failed to delete workout');
    }
  };
  
  // Get type badge
  const getTypeBadge = (type) => {
    const typeConfig = {
      'beginner': { variant: 'secondary', label: 'Beginner' },
      'intermediate': { variant: 'default', label: 'Intermediate' },
      'advanced': { variant: 'destructive', label: 'Advanced' },
      'weight-loss': { variant: 'outline', label: 'Weight Loss' },
      'weight-gain': { variant: 'default', label: 'Weight Gain' },
    };
    
    const config = typeConfig[type] || { variant: 'outline', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Workout Management</h1>
            <p className="text-gray-400">
              {isTrainer ? 'Create and manage workout plans for your members' : 
               isMember ? 'View your assigned workout plans' : 
               'Monitor all workout plans in your gym'}
            </p>
          </div>
          
          {isTrainer && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700 mt-4 md:mt-0"
              onClick={() => {
                resetForm();
                setShowWorkoutForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Workout
            </Button>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Workouts</p>
                  <p className="text-3xl font-bold text-white">{workouts.length}</p>
                </div>
                <div className="bg-blue-900/30 p-3 rounded-full">
                  <Dumbbell className="h-6 w-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weight Loss Plans</p>
                  <p className="text-3xl font-bold text-white">
                    {workouts.filter(w => w.type === 'weight-loss').length}
                  </p>
                </div>
                <div className="bg-red-900/30 p-3 rounded-full">
                  <Target className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Weight Gain Plans</p>
                  <p className="text-3xl font-bold text-white">
                    {workouts.filter(w => w.type === 'weight-gain').length}
                  </p>
                </div>
                <div className="bg-green-900/30 p-3 rounded-full">
                  <Dumbbell className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search workouts..." 
              className="pl-10 bg-gray-800 border-gray-700 text-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select value={filterType} onValueChange={(value) => setFilterType(value)}>
            <SelectTrigger className="w-full md:w-[180px] bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700 text-white">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
              <SelectItem value="weight-loss">Weight Loss</SelectItem>
              <SelectItem value="weight-gain">Weight Gain</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Workouts List */}
        {isLoading ? (
          <div className="text-center py-10">
            <p className="text-gray-400">Loading workouts...</p>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
            <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Workouts Found</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              {isTrainer ? 
                "You haven't created any workouts yet. Click 'Create Workout' to get started." : 
                "No workouts have been assigned to you yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <Card key={workout._id} className="bg-gray-800 border-gray-700 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-white">{workout.title}</CardTitle>
                      <CardDescription className="text-gray-400">
                        {getTypeBadge(workout.type)}
                      </CardDescription>
                    </div>
                    {isTrainer && (
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-white"
                          onClick={() => handleEditWorkout(workout)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-gray-400 hover:text-white"
                          onClick={() => handleDeleteWorkout(workout._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Focus Area</p>
                    <p className="text-white">{workout.focus}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Description</p>
                    <p className="text-gray-300 text-sm line-clamp-3">{workout.description}</p>
                  </div>
                  
                  {workout.videoLink && (
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Video Tutorial</p>
                      <a 
                        href={workout.videoLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
                      >
                        <Video className="h-4 w-4 mr-1" />
                        Watch Tutorial
                      </a>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-400">Assigned To</p>
                        <p className="text-sm text-white flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {workout.assignedTo?.name || 'Unknown Member'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm text-white">{workout.duration || 30} min</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
                  <div className="w-full flex justify-between items-center">
                    <span>By {workout.trainerName || 'Unknown Trainer'}</span>
                    <span>{formatDate(workout.createdAt || new Date())}</span>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        
        {/* Create/Edit Workout Modal */}
        {showWorkoutForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">
                    {isEditing ? 'Edit Workout' : 'Create New Workout'}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {isEditing ? 'Update workout details' : 'Fill in the details to create a new workout'}
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowWorkoutForm(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              
              <form onSubmit={handleSubmitWorkout}>
                <CardContent className="space-y-4">
                  {message.text && (
                    <div className={`p-3 rounded-md ${
                      message.type === 'error' ? 'bg-red-900/20 text-red-300 border border-red-800' :
                      message.type === 'success' ? 'bg-green-900/20 text-green-300 border border-green-800' :
                      'bg-blue-900/20 text-blue-300 border border-blue-800'
                    }`}>
                      {message.text}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-gray-300">Workout Title</Label>
                    <Input 
                      id="title" 
                      name="title"
                      value={workoutFormData.title} 
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., Full Body Workout"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type" className="text-gray-300">Workout Type</Label>
                      <Select 
                        value={workoutFormData.type} 
                        onValueChange={(value) => handleSelectChange('type', value)}
                      >
                        <SelectTrigger id="type" className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                          <SelectItem value="weight-loss">Weight Loss</SelectItem>
                          <SelectItem value="weight-gain">Weight Gain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="duration" className="text-gray-300">Duration (minutes)</Label>
                      <Input 
                        id="duration" 
                        name="duration"
                        type="number"
                        min="5"
                        max="180"
                        value={workoutFormData.duration} 
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="focus" className="text-gray-300">Focus Area</Label>
                    <Input 
                      id="focus" 
                      name="focus"
                      value={workoutFormData.focus} 
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., Upper Body, Core, Legs"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Workout Description</Label>
                    <Textarea 
                      id="description" 
                      name="description"
                      value={workoutFormData.description} 
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                      placeholder="Provide detailed instructions for the workout..."
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="videoLink" className="text-gray-300">Video Tutorial Link (optional)</Label>
                    <Input 
                      id="videoLink" 
                      name="videoLink"
                      value={workoutFormData.videoLink} 
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., https://youtube.com/watch?v=..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="assignedTo" className="text-gray-300">Assign to Member</Label>
                    <Select 
                      value={workoutFormData.assignedTo} 
                      onValueChange={(value) => handleSelectChange('assignedTo', value)}
                      required
                    >
                      <SelectTrigger id="assignedTo" className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-[200px]">
                        {availableMembers.length === 0 ? (
                          <SelectItem value="" disabled>No members available</SelectItem>
                        ) : (
                          availableMembers.map(member => (
                            <SelectItem key={member._id} value={member._id}>
                              {member.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setShowWorkoutForm(false)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Create Workout'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default WorkoutPage;