import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Video, Edit, Trash2, Calendar, X, User, Dumbbell } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Memoized Workout Card component to prevent unnecessary re-renders
const WorkoutCard = React.memo(({ 
  workout, 
  isTrainer, 
  handleEditWorkout, 
  handleDeleteWorkout, 
  formatDate 
}) => {
  return (
    <Card key={workout._id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2">{workout.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant={workout.type === 'beginner' ? 'outline' : workout.type === 'advanced' ? 'destructive' : 'default'}>
                {workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
              </Badge>
              <Badge variant="secondary">{workout.focus}</Badge>
              <Badge variant="outline">{workout.duration} min</Badge>
            </div>
          </div>
          <Dumbbell className="h-8 w-8 text-green-400 ml-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{workout.description}</p>
        
        {workout.videoLink && (
          <div className="mb-4">
            <a 
              href={workout.videoLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
            >
              <Video className="h-4 w-4 mr-1" />
              Watch Video Tutorial
            </a>
          </div>
        )}
        
        {isTrainer && (
          <div className="flex space-x-2">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
              onClick={() => handleEditWorkout(workout)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-gray-600"
              onClick={() => handleDeleteWorkout(workout._id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Created: {formatDate(workout.createdAt)}</span>
          </div>
          <span>By: {workout.trainerName || 'Unknown'}</span>
        </div>
      </CardFooter>
    </Card>
  );
});

const Workouts = () => {
  const { user, users, fetchUsers, isTrainer, isGymOwner, isMember, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterTrainer, setFilterTrainer] = useState("all");
  const [trainers, setTrainers] = useState([]);
  
  // State for workouts data
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for workout form
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editWorkoutId, setEditWorkoutId] = useState(null);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',
    type: 'intermediate',
    focus: '',
    description: '',
    videoLink: '',
    duration: '30',
  });
  
  // Define loadWorkouts as a memoized callback
  const loadWorkouts = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch workouts based on user role
      let endpoint = '/workouts';
      
      if (isTrainer) {
        endpoint = `/workouts/trainer/${user._id}`;
      } else if (isMember) {
        endpoint = `/workouts/member/${user._id}`;
      } else if (isGymOwner) {
        // Gym owners can see all workouts created by their trainers
        endpoint = `/workouts/gym/${user._id}`;
        console.log('Gym owner fetching workouts from:', endpoint);
      }
      
      const response = await authFetch(endpoint);
      console.log('Workouts response:', response);
      
      if (response.success || response.status === 'success') {
        setWorkouts(response.data?.workouts || []);
        console.log('Workouts loaded:', response.data?.workouts?.length || 0);
      } else {
        setError(response.message || 'Failed to load workouts');
        toast.error(response.message || 'Failed to load workouts');
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Failed to load workouts');
      toast.error('Failed to load workouts');
    } finally {
      setIsLoading(false);
    }
  }, [user, isTrainer, isMember, isGymOwner, authFetch, user?._id]);
  
  // Load workouts data
  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [loadWorkouts]);
  
  // Load users data for trainer to assign workouts and for gym owner to filter by trainer
  useEffect(() => {
    if ((isTrainer || isGymOwner) && fetchUsers) {
      fetchUsers();
    }
  }, [isTrainer, isGymOwner, fetchUsers]);
  
  // Extract trainers from users for filtering using useMemo
  const extractedTrainers = useMemo(() => {
    const trainers = isGymOwner ? (users?.filter(u => u.role === 'trainer') || []) : [];
    console.log('Extracted trainers for workouts:', trainers.length, trainers);
    return trainers;
  }, [users, isGymOwner]);
  
  // Extract members for trainer to assign workouts using useMemo
  const availableMembers = useMemo(() => {
    return users?.filter(u => u.role === 'member') || [];
  }, [users]);
  
  // Update trainers state when extracted data changes
  useEffect(() => {
    if (extractedTrainers.length > 0) {
      setTrainers(extractedTrainers);
    }
  }, [extractedTrainers]);
  
  // Removed debugging useEffect to prevent unnecessary renders
  
  // Filter workouts based on search and filter using useMemo
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(workout => {
      const matchesSearch = 
        (workout.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (workout.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
        (workout.trainerName?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      
      const matchesGoal = filterGoal === "all" || workout.type === filterGoal;
      const matchesDifficulty = filterDifficulty === "all" || 
        (filterDifficulty === "Beginner" && workout.type === "beginner") ||
        (filterDifficulty === "Intermediate" && workout.type === "intermediate") ||
        (filterDifficulty === "Advanced" && workout.type === "advanced");
      const matchesTrainer = filterTrainer === "all" || 
        (workout.trainer && workout.trainer.toString() === filterTrainer) ||
        (workout.trainerName && workout.trainerName === filterTrainer);
      
      return matchesSearch && matchesGoal && matchesDifficulty && matchesTrainer;
    });
  }, [workouts, searchTerm, filterGoal, filterDifficulty, filterTrainer]);
  
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
      focus: '',
      description: '',
      videoLink: '',
      duration: '30',
    });
    setIsEditing(false);
    setEditWorkoutId(null);
  };
  
  // Handle form submission
  const handleSubmitWorkout = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!workoutFormData.title || !workoutFormData.focus || !workoutFormData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      // Prepare workout data
      const workoutData = {
        ...workoutFormData,
        trainer: user._id,
        trainerName: user.name,
      };
      
      console.log('Submitting workout data:', workoutData);
      
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
      
      console.log('Workout submission response:', response);
      
      if (response.success || response.status === 'success') {
        toast.success(isEditing ? 'Workout updated successfully' : 'Workout created successfully');
        
        // Refresh workouts list
        const updatedWorkouts = await authFetch(`/workouts/trainer/${user._id}`);
        console.log('Updated workouts response:', updatedWorkouts);
        
        if (updatedWorkouts.success || updatedWorkouts.status === 'success') {
          setWorkouts(updatedWorkouts.data?.workouts || []);
        }
        
        // Reset form and close modal
        resetForm();
        setShowWorkoutForm(false);
      } else {
        toast.error(response.message || (isEditing ? 'Failed to update workout' : 'Failed to create workout'));
      }
    } catch (error) {
      console.error('Error submitting workout:', error);
      toast.error(isEditing ? 'Failed to update workout' : 'Failed to create workout');
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
      
      console.log('Delete workout response:', response);
      
      if (response.success || response.status === 'success') {
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
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Calculate workout stats
  const workoutStats = {
    total: workouts.length,
    totalViews: workouts.reduce((sum, workout) => sum + (workout.views || 0), 0),
    avgDuration: workouts.length ? Math.round(workouts.reduce((sum, workout) => sum + (parseInt(workout.duration) || 30), 0) / workouts.length) : 0,
    advanced: workouts.filter(w => w.type === 'advanced').length
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">Workout Management</h1>
            {isGymOwner ? (
              <p className="text-gray-400">View all workouts created by your trainers</p>
            ) : (
              <p className="text-gray-400">Upload and manage workout videos by goal and difficulty</p>
            )}
          </div>
          {isTrainer && (
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => {
                resetForm();
                setShowWorkoutForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Upload New Workout
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Workouts</p>
                  <p className="text-2xl font-bold text-white">{workoutStats.total}</p>
                </div>
                <Video className="h-6 w-6 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Views</p>
                  <p className="text-2xl font-bold text-white">{workoutStats.totalViews}</p>
                </div>
                <Video className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Avg Duration</p>
                  <p className="text-2xl font-bold text-white">{workoutStats.avgDuration}min</p>
                </div>
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Advanced</p>
                  <p className="text-2xl font-bold text-white">{workoutStats.advanced}</p>
                </div>
                <Video className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Workout Library</CardTitle>
            <CardDescription className="text-gray-400">
              Search and manage workout videos by goal and difficulty level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 content-grid">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search workouts, descriptions, or trainers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Goals</option>
                <option value="weight-loss">Weight Loss</option>
                <option value="weight-gain">Weight Gain</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <select
                value={filterDifficulty}
                onChange={(e) => setFilterDifficulty(e.target.value)}
                className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              >
                <option value="all">All Levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              
              {isGymOwner && (
                <select
                  value={filterTrainer}
                  onChange={(e) => setFilterTrainer(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
                >
                  <option value="all">All Trainers</option>
                  {trainers.map(trainer => (
                    <option key={trainer._id} value={trainer._id}>{trainer.name}</option>
                  ))}
                </select>
              )}
            </div>

            {/* Workout Grid */}
            {isLoading ? (
              <div className="text-center py-10">
                <p className="text-gray-400">Loading workouts...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                <p className="text-red-400">{error}</p>
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                <Video className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Workouts Found</h3>
                <p className="text-gray-400 max-w-md mx-auto">
                  {isTrainer ? 
                    "You haven't created any workouts yet. Click 'Upload New Workout' to get started." : 
                    "No workouts available matching your filters."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-grid">
                {filteredWorkouts.map((workout) => (
                  <Card key={workout._id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-2"></div>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-lg mb-2">{workout.title}</CardTitle>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {getTypeBadge(workout.type)}
                          </div>
                        </div>
                        <Video className="h-8 w-8 text-blue-400 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <CardDescription className="text-gray-300 mb-3">
                        {workout.description}
                      </CardDescription>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-400">
                          <span>Duration:</span>
                          <span className="text-white">{workout.duration} minutes</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Focus:</span>
                          <span className="text-white">{workout.focus}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Trainer:</span>
                          <span className="text-white">{workout.trainerName}</span>
                        </div>
                        <div className="flex justify-between text-gray-400">
                          <span>Views:</span>
                          <span className="text-white">{workout.views || 0}</span>
                        </div>
                        {workout.videoLink && (
                          <div className="mt-2">
                            <a 
                              href={workout.videoLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <Video className="h-4 w-4 mr-1" />
                              Watch Video Tutorial
                            </a>
                          </div>
                        )}
                      </div>
                      {isTrainer && workout.trainer === user._id && (
                        <div className="flex space-x-2 mt-4">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => handleEditWorkout(workout)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                            onClick={() => handleDeleteWorkout(workout._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
                      <div className="w-full flex justify-between items-center">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>Created: {formatDate(workout.createdAt)}</span>
                        </div>
                        <span>By: {workout.trainerName || 'Unknown'}</span>
                      </div>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
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
                    <Label htmlFor="videoLink" className="text-gray-300">Video Tutorial Link</Label>
                    <Input 
                      id="videoLink" 
                      name="videoLink"
                      value={workoutFormData.videoLink} 
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="e.g., https://youtube.com/watch?v=..."
                    />
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

export default Workouts;