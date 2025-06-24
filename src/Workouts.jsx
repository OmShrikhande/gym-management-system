import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Video, Calendar, Dumbbell, Plus } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Memoized Workout Card component to prevent unnecessary re-renders
const WorkoutCard = React.memo(({ workout, formatDate }) => {
  // Get badge variant based on workout type
  const getTypeBadge = (type) => {
    const typeMap = {
      'beginner': { variant: 'outline', color: 'text-blue-400' },
      'intermediate': { variant: 'default', color: 'text-green-400' },
      'advanced': { variant: 'destructive', color: 'text-red-400' },
      'weight-loss': { variant: 'secondary', color: 'text-purple-400' },
      'weight-gain': { variant: 'secondary', color: 'text-yellow-400' }
    };
    
    const config = typeMap[type] || { variant: 'outline', color: 'text-gray-400' };
    return (
      <Badge variant={config.variant} className={config.color}>
        {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
      </Badge>
    );
  };
  
  return (
    <Card key={workout._id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5"></div>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-white text-lg mb-2">{workout.title}</CardTitle>
            <div className="flex flex-wrap gap-2 mb-2">
              {getTypeBadge(workout.type)}
              <Badge variant="secondary">{workout.focus}</Badge>
              <Badge variant="outline">{workout.duration} min</Badge>
              {workout.views > 0 && (
                <Badge variant="outline" className="text-blue-300">
                  {workout.views} {workout.views === 1 ? 'view' : 'views'}
                </Badge>
              )}
            </div>
          </div>
          <Dumbbell className="h-8 w-8 text-green-400 ml-2" />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-gray-300 text-sm mb-4 line-clamp-3">{workout.description}</p>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between text-gray-400">
            <span>Trainer:</span>
            <span className="text-white font-medium">{workout.trainerName || 'Unknown'}</span>
          </div>
          {workout.assignedTo && (
            <div className="flex justify-between text-gray-400">
              <span>Assigned to:</span>
              <span className="text-white">{typeof workout.assignedTo === 'object' ? workout.assignedTo.name : 'A member'}</span>
            </div>
          )}
        </div>
        
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
      </CardContent>
      <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
        <div className="w-full flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>Created: {formatDate(workout.createdAt)}</span>
          </div>
          {workout.isCompleted ? (
            <Badge variant="success" className="text-xs">Completed</Badge>
          ) : (
            <Badge variant="outline" className="text-xs">Active</Badge>
          )}
        </div>
      </CardFooter>
    </Card>
  );
});

const Workouts = () => {
  const { user, users, fetchUsers, isGymOwner: isGymOwnerContext, authFetch, userRole: userRoleContext } = useAuth();
  const userRole = user?.role || userRoleContext || '';
  const isGymOwner = userRole === 'gym-owner' || isGymOwnerContext;
  console.log("Is gym owner from context:", isGymOwnerContext);
  console.log("Is gym owner calculated:", isGymOwner);
  console.log("User role from context:", userRoleContext);
  console.log("User role from user object:", user?.role);
  console.log("Final user role used:", userRole);
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
  const [isEditing, setIsEditing] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',  // Changed from name to title to match backend
    description: '',
    type: 'beginner',
    duration: '30',
    exercises: '',
    videoLink: '',  // Changed from videoUrl to videoLink to match backend
    notes: ''
  });
  
  // Check if user is a trainer
  const isTrainer = userRole === 'trainer';
  
  // Fetch trainers associated with this gym owner
  const fetchGymTrainers = useCallback(async () => {
    if (isGymOwner && user?._id) {
      try {
        console.log("Fetching trainers for gym owner:", user._id);
        const response = await authFetch(`/users/trainers-by-gym/${user._id}`);
        console.log("Gym trainers response:", response);
        
        if (response.success && response.data?.trainers) {
          setTrainers(response.data.trainers);
          console.log(`Found ${response.data.trainers.length} trainers for this gym owner`);
        }
      } catch (error) {
        console.error("Error fetching gym trainers:", error);
      }
    }
  }, [isGymOwner, user?._id, authFetch]);
  
  // Define loadWorkouts as a memoized callback with caching
  const loadWorkouts = useCallback(async () => {
    if (!user || !user._id) return;
    
    console.log("Current user:", user);
    console.log("User role:", userRole);
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Different endpoints based on user role
      let endpoint;
      
      if (userRole === 'gym-owner') {
        // Gym owners can see all workouts created by their trainers
        endpoint = `/workouts/gym/${user._id}`;
        console.log("Gym owner fetching workouts from endpoint:", endpoint);
      } else if (userRole === 'trainer') {
        // Trainers can see workouts they created
        endpoint = `/workouts/trainer/${user._id}`;
      } else if (userRole === 'member') {
        // Members can see all workouts assigned to them or created by their trainer
        endpoint = `/workouts/member/${user._id}`;
      } else {
        // Other roles would have different endpoints
        endpoint = `/workouts/user/${user._id}`;
      }
      
      console.log("Fetching workouts from endpoint:", endpoint);
      
      // For gym owners, we need to ensure we're getting all workouts from their trainers
      let response;
      if (userRole === 'gym-owner') {
        // First, get all trainers associated with this gym owner if not already fetched
        if (trainers.length === 0) {
          await fetchGymTrainers();
        }
        
        console.log(`Fetching workouts for gym owner with ${trainers.length} trainers`);
        
        // Now get workouts from the gym endpoint which should include all trainer workouts
        response = await authFetch(endpoint);
      } else {
        // For other roles, just fetch workouts normally
        response = await authFetch(endpoint);
      }
      console.log("Workout API response:", response);
      
      if (response.success || response.status === 'success') {
        const workoutsData = response.data?.workouts || [];
        console.log("Workouts data received:", workoutsData);
        
        // Sort workouts by creation date (newest first)
        const sortedWorkouts = [...workoutsData].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        // Cache the workouts data in localStorage
        try {
          localStorage.setItem('cached_workouts', JSON.stringify(sortedWorkouts));
          localStorage.setItem('cached_workouts_timestamp', Date.now().toString());
        } catch (e) {
          console.warn('Failed to cache workouts data:', e);
        }
        
        setWorkouts(sortedWorkouts);
        
        if (workoutsData.length === 0) {
          // No workouts found for this gym owner
        }
      } else {
        // Failed to load workouts
        setError(response.message || 'Failed to load workouts');
        toast.error(response.message || 'Failed to load workouts');
      }
    } catch (error) {
      // Error loading workouts
      setError('Failed to load workouts');
      toast.error('Failed to load workouts');
      
      // Try to use cached data as fallback if available
      try {
        const cachedWorkouts = localStorage.getItem('cached_workouts');
        if (cachedWorkouts) {
          const parsedWorkouts = JSON.parse(cachedWorkouts);
          setWorkouts(parsedWorkouts);
          setError('Using cached data. Pull to refresh for latest data.');
        }
      } catch (e) {
        // Failed to load cached workouts
      }
    } finally {
      setIsLoading(false);
    }
  }, [user, userRole, authFetch, fetchGymTrainers, trainers.length]);
  
  // Load workouts data only when user is available and stable
  // Added a localStorage cache to prevent unnecessary API calls
  useEffect(() => {
    if (user && user._id) {
      // For debugging purposes, always load fresh data
      localStorage.removeItem('cached_workouts');
      localStorage.removeItem('cached_workouts_timestamp');
      
      if (userRole === 'gym-owner') {
        // For gym owners, first fetch their trainers, then load workouts
        fetchGymTrainers().then(() => {
          loadWorkouts();
        });
      } else {
        // For other roles, just load workouts directly
        loadWorkouts();
      }
    }
  }, [user?._id, loadWorkouts, userRole, fetchGymTrainers]);
  
  // Load users data for gym owner to filter by trainer - with reduced frequency
  useEffect(() => {
    if (isGymOwner && fetchUsers) {
      // Check if we have cached users and it's not too old
      const cachedTimestamp = window.lastUsersFetchTime || 0;
      const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
      
      if (!users.length || (Date.now() - cachedTimestamp > CACHE_DURATION)) {
        fetchUsers(false); // Use cached data if available
      }
    }
  }, [isGymOwner, fetchUsers, users.length]);
  
  // Load gym trainers when component mounts
  useEffect(() => {
    if (isGymOwner) {
      fetchGymTrainers();
    } else {
      // For non-gym owners, use the filtered users
      const filteredTrainers = users?.filter(u => u.role === 'trainer') || [];
      setTrainers(filteredTrainers);
    }
  }, [isGymOwner, fetchGymTrainers, users]);
  
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
  
  // Format date helper function
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  // Form handling functions
  const resetForm = () => {
    setWorkoutFormData({
      title: '',  // Changed from name to title
      description: '',
      type: 'beginner',
      duration: '30',
      exercises: '',
      videoLink: '',  // Changed from videoUrl to videoLink
      notes: ''
    });
    setIsEditing(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setWorkoutFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name, value) => {
    setWorkoutFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmitWorkout = async (e) => {
    e.preventDefault();
    
    // Validate required fields - using title instead of name
    if (!workoutFormData.title.trim() || !workoutFormData.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate duration is a number
    if (isNaN(parseInt(workoutFormData.duration)) || parseInt(workoutFormData.duration) < 5) {
      toast.error('Please enter a valid duration (minimum 5 minutes)');
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      const endpoint = isEditing 
        ? `/workouts/${workoutFormData._id}` 
        : '/workouts';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Create a copy of the form data with trimmed values
      const submissionData = {
        ...workoutFormData,
        title: workoutFormData.title.trim(),
        description: workoutFormData.description.trim(),
        exercises: workoutFormData.exercises.trim(),
        videoLink: workoutFormData.videoLink.trim(),
        notes: workoutFormData.notes.trim()
      };
      
      const response = await authFetch(endpoint, {
        method,
        body: JSON.stringify(submissionData)
      });
      
      if (response.success || response.status === 'success') {
        toast.success(isEditing ? 'Workout plan updated successfully' : 'Workout plan created successfully');
        setShowWorkoutForm(false);
        resetForm();
        loadWorkouts(); // Refresh the workouts list
      } else {
        toast.error(response.message || 'Failed to save workout plan');
      }
    } catch (error) {
      // Error submitting workout plan - silent error handling
      toast.error('Please check all required fields and try again');
      // Reset form submitting state but keep the form open for user to fix issues
    } finally {
      setFormSubmitting(false);
    }
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
            <h1 className="text-3xl font-bold text-white">
              {isTrainer ? "My Workout Plans" : userRole === 'member' ? "My Workout Plans" : "Trainer Workout Plans"}
            </h1>
            <p className="text-gray-400">
              {isTrainer ? 
                "Create and manage workout plans for your gym members." :
                userRole === 'member' ?
                "View workout plans assigned to you by your trainer." :
                `Monitor all workout plans created by your trainers for gym members. 
                ${workouts.length > 0 ? 
                  `Currently showing ${workouts.length} workout plans from ${trainers.length} trainers.` : 
                  'No workout plans have been created yet.'}`
              }
            </p>
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
              Create New Workout
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
                <Dumbbell className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">
              {userRole === 'member' ? "My Workout Library" : "Trainer Workout Library"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {userRole === 'member' 
                ? "Browse workout plans assigned to you by your trainer" 
                : "Browse and monitor all workout plans created by your trainers for gym members"}
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
            </div>

            {/* Workout Grid */}
            <div className="min-h-[300px]">
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
                  <h3 className="text-xl font-semibold text-white mb-2">No Workout Plans Found</h3>
                  {workouts.length === 0 ? (
                    <div className="text-gray-400 max-w-md mx-auto">
                      <p className="mb-2">Your trainers haven't created any workout plans yet.</p>
                      <p>Encourage your trainers to create workout plans for your gym members.</p>
                    </div>
                  ) : (
                    <p className="text-gray-400 max-w-md mx-auto">
                      No workout plans match your current filters. Try adjusting your search criteria.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-grid">
                  {filteredWorkouts.map((workout) => (
                    <WorkoutCard 
                      key={workout._id} 
                      workout={workout} 
                      formatDate={formatDate} 
                    />
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Workout Form Dialog */}
      <Dialog open={showWorkoutForm} onOpenChange={setShowWorkoutForm}>
        <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Workout Plan' : 'Create New Workout Plan'}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {isEditing ? 'Update the details of this workout plan' : 'Fill in the details to create a new workout plan'}
            </DialogDescription>
          </DialogHeader>
          
          <form id="workout-form" name="workout-form" onSubmit={handleSubmitWorkout}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-gray-300">Workout Name</Label>
                  <Input
                    id="title"
                    name="title"
                    value={workoutFormData.title}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g., Full Body HIIT"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="workout-type" className="text-gray-300">Workout Type</Label>
                  <Select 
                    id="type-select"
                    value={workoutFormData.type} 
                    onValueChange={(value) => handleSelectChange('type', value)}
                    name="type"
                  >
                    <SelectTrigger id="workout-type" className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue id="workout-type-value" name="workout-type-value" placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent id="workout-type-content" className="bg-gray-800 border-gray-700 text-white">
                      <SelectItem id="type-beginner" value="beginner">Beginner</SelectItem>
                      <SelectItem id="type-intermediate" value="intermediate">Intermediate</SelectItem>
                      <SelectItem id="type-advanced" value="advanced">Advanced</SelectItem>
                      <SelectItem id="type-weight-loss" value="weight-loss">Weight Loss</SelectItem>
                      <SelectItem id="type-weight-gain" value="weight-gain">Weight Gain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={workoutFormData.description}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                  placeholder="Describe the workout plan and its benefits..."
                  
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                
                <div className="space-y-2">
                  <Label htmlFor="videoLink" className="text-gray-300">Video URL (optional)</Label>
                  <Input
                    id="videoLink"
                    name="videoLink"
                    value={workoutFormData.videoLink}
                    onChange={handleInputChange}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="e.g., https://youtube.com/watch?v=..."
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="exercises" className="text-gray-300">Exercises</Label>
                <Textarea
                  id="exercises"
                  name="exercises"
                  value={workoutFormData.exercises}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white min-h-[150px]"
                  placeholder="List exercises with sets and reps (e.g., Squats: 3 sets x 12 reps)"    
               />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-gray-300">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={workoutFormData.notes}
                  onChange={handleInputChange}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Any additional instructions or tips..."
                />
              </div>
            </div>
            
            <DialogFooter className="flex justify-end gap-2 pt-4">
              <Button 
                id="cancel-button"
                name="cancel-button"
                type="button" 
                variant="outline" 
                onClick={() => setShowWorkoutForm(false)}
                className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button 
                id="submit-button"
                name="submit-button"
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={formSubmitting}
              >
                {formSubmitting ? 'Saving...' : isEditing ? 'Update Workout' : 'Create Workout'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Workouts;