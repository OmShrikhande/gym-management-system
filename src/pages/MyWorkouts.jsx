import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Video, Calendar, Dumbbell, CheckCircle, Clock, Target, User } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MyWorkouts = () => {
  const { user, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load member's assigned workouts
  const loadMyWorkouts = async () => {
    if (!user?._id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authFetch(`/workouts/member/${user._id}`);
      
      if (response.success || response.status === 'success') {
        const workoutsData = response.data?.workouts || [];
        setWorkouts(workoutsData);
      } else {
        setError(response.message || 'Failed to load workouts');
        toast.error(response.message || 'Failed to load workouts');
      }
    } catch (error) {
      console.error('Error loading workouts:', error);
      setError('Failed to load workouts. Please try again later.');
      toast.error('Failed to load workouts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadMyWorkouts();
    }
  }, [user?._id]);

  // Mark workout as completed
  const markWorkoutCompleted = async (workoutId) => {
    try {
      const response = await authFetch(`/workouts/${workoutId}/complete`, {
        method: 'PATCH'
      });

      if (response.success || response.status === 'success') {
        toast.success('Workout marked as completed!');
        // Refresh workouts
        loadMyWorkouts();
      } else {
        toast.error(response.message || 'Failed to mark workout as completed');
      }
    } catch (error) {
      console.error('Error marking workout as completed:', error);
      toast.error('Failed to mark workout as completed');
    }
  };

  // Filter workouts based on search term
  const filteredWorkouts = useMemo(() => {
    return workouts.filter(workout =>
      workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [workouts, searchTerm]);

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

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
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Workouts</h1>
            <p className="text-gray-400 mt-1">
              View and track your assigned workout plans
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-800 border-gray-700 text-white"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Total Workouts</CardTitle>
              <Dumbbell className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{workouts.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {workouts.filter(w => w.isCompleted).length}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {workouts.filter(w => !w.isCompleted).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workouts Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading your workouts...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={loadMyWorkouts} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <div className="text-center py-12">
            <Dumbbell className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchTerm ? 'No workouts found' : 'No workouts assigned yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Your trainer will assign workouts to you soon'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <Card key={workout._id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 h-1.5"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">{workout.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getTypeBadge(workout.type)}
                        {workout.focus && <Badge variant="secondary">{workout.focus}</Badge>}
                        <Badge variant="outline">{workout.duration} min</Badge>
                        {workout.isCompleted && (
                          <Badge variant="success" className="text-green-300">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
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
                    {workout.exercises && (
                      <div className="text-gray-400">
                        <span className="font-medium">Exercises:</span>
                        <p className="text-gray-300 text-xs mt-1 line-clamp-2">{workout.exercises}</p>
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

                  {!workout.isCompleted && (
                    <Button 
                      onClick={() => markWorkoutCompleted(workout._id)}
                      className="w-full bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark as Completed
                    </Button>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Assigned: {formatDate(workout.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      <span>{workout.type}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyWorkouts;