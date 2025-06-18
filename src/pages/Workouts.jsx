import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Video, Calendar, Dumbbell } from "lucide-react";
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
  const { user, users, fetchUsers, isGymOwner, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterDifficulty, setFilterDifficulty] = useState("all");
  const [filterTrainer, setFilterTrainer] = useState("all");
  const [trainers, setTrainers] = useState([]);
  
  // State for workouts data
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Define loadWorkouts as a memoized callback
  const loadWorkouts = useCallback(async () => {
    if (!user || !user._id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Gym owners can see all workouts created by their trainers
      const endpoint = `/workouts/gym/${user._id}`;
      console.log(`Fetching workouts for gym owner from: ${endpoint}`);
      
      const response = await authFetch(endpoint);
      console.log('API Response:', response);
      
      if (response.success || response.status === 'success') {
        const workoutsData = response.data?.workouts || [];
        console.log(`Successfully loaded ${workoutsData.length} workouts`);
        
        // Sort workouts by creation date (newest first)
        const sortedWorkouts = [...workoutsData].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        
        setWorkouts(sortedWorkouts);
        
        if (workoutsData.length === 0) {
          console.log('No workouts found for this gym owner');
        }
      } else {
        console.error('Failed to load workouts:', response.message);
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
  }, [user, authFetch]);
  
  // Load workouts data only when user is available and stable
  useEffect(() => {
    if (user && user._id) {
      loadWorkouts();
    }
  }, [user?._id]);
  
  // Load users data for gym owner to filter by trainer
  useEffect(() => {
    if (isGymOwner && fetchUsers) {
      fetchUsers();
    }
  }, [isGymOwner, fetchUsers]);
  
  // Extract trainers from users for filtering using useMemo
  const extractedTrainers = useMemo(() => {
    const trainers = isGymOwner ? (users?.filter(u => u.role === 'trainer') || []) : [];
    return trainers;
  }, [users, isGymOwner]);
  
  // Update trainers state when extracted data changes
  useEffect(() => {
    // Only update if there's a difference to avoid unnecessary re-renders
    if (extractedTrainers.length > 0 && 
        (trainers.length !== extractedTrainers.length || 
         JSON.stringify(trainers.map(t => t._id)) !== JSON.stringify(extractedTrainers.map(t => t._id)))) {
      setTrainers(extractedTrainers);
    }
  }, [extractedTrainers, trainers]);
  
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
            <h1 className="text-3xl font-bold text-white">Trainer Workout Plans</h1>
            <p className="text-gray-400">
              Monitor all workout plans created by your trainers for gym members. 
              {workouts.length > 0 ? 
                ` Currently showing ${workouts.length} workout plans from ${trainers.length} trainers.` : 
                ' No workout plans have been created yet.'}
            </p>
          </div>
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
            <CardTitle className="text-white">Trainer Workout Library</CardTitle>
            <CardDescription className="text-gray-400">
              Browse and monitor all workout plans created by your trainers for gym members
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
    </DashboardLayout>
  );
};

export default Workouts;