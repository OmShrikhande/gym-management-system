import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UtensilsCrossed, Calendar, Clock, Target, User, TrendingDown, Dumbbell } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const MyDiet = () => {
  const { user, authFetch } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [dietPlans, setDietPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load member's assigned diet plans
  const loadMyDietPlans = async () => {
    if (!user?._id) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await authFetch(`/diet-plans/member/${user._id}`);
      
      if (response.success || response.status === 'success') {
        const dietPlansData = response.data?.dietPlans || [];
        setDietPlans(dietPlansData);
      } else {
        setError(response.message || 'Failed to load diet plans');
        toast.error(response.message || 'Failed to load diet plans');
      }
    } catch (error) {
      console.error('Error loading diet plans:', error);
      setError('Failed to load diet plans. Please try again later.');
      toast.error('Failed to load diet plans. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      loadMyDietPlans();
    }
  }, [user?._id]);

  // Filter diet plans based on search term
  const filteredDietPlans = useMemo(() => {
    return dietPlans.filter(plan =>
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plan.goalType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [dietPlans, searchTerm]);

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

  // Helper function to get goal badge
  const getGoalBadge = (goalType) => {
    switch (goalType) {
      case 'weight-loss':
        return <Badge className="bg-red-500/20 text-red-300 hover:bg-red-500/30">Weight Loss</Badge>;
      case 'muscle-gain':
        return <Badge className="bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30">Muscle Gain</Badge>;
      case 'maintenance':
        return <Badge className="bg-blue-500/20 text-blue-300 hover:bg-blue-500/30">Maintenance</Badge>;
      case 'performance':
        return <Badge className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30">Performance</Badge>;
      default:
        return <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30">General Health</Badge>;
    }
  };

  // Calculate total calories for the day
  const calculateTotalCalories = (meals) => {
    return meals.reduce((total, meal) => total + (parseInt(meal.calories) || 0), 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white">My Diet Plans</h1>
            <p className="text-gray-400 mt-1">
              View and follow your assigned nutrition plans
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search diet plans..."
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
              <CardTitle className="text-sm font-medium text-gray-400">Total Plans</CardTitle>
              <UtensilsCrossed className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{dietPlans.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Avg Daily Calories</CardTitle>
              <Target className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {dietPlans.length > 0 
                  ? Math.round(dietPlans.reduce((sum, plan) => sum + (parseInt(plan.totalCalories) || 0), 0) / dietPlans.length)
                  : 0
                }
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Active Goals</CardTitle>
              <TrendingDown className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {new Set(dietPlans.map(plan => plan.goalType)).size}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Diet Plans Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-400">Loading your diet plans...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 mb-4">{error}</div>
            <Button onClick={loadMyDietPlans} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredDietPlans.length === 0 ? (
          <div className="text-center py-12">
            <UtensilsCrossed className="h-12 w-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">
              {searchTerm ? 'No diet plans found' : 'No diet plans assigned yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'Try adjusting your search terms' 
                : 'Your trainer will assign diet plans to you soon'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredDietPlans.map((plan) => (
              <Card key={plan._id} className="bg-gray-700/50 border-gray-600 hover:bg-gray-700/70 transition-colors">
                <div className="bg-gradient-to-r from-green-600 to-blue-600 h-1.5"></div>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg mb-2">{plan.name}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {getGoalBadge(plan.goalType)}
                        <Badge variant="outline">{plan.totalCalories} cal/day</Badge>
                        <Badge variant="secondary">{plan.meals?.length || 0} meals</Badge>
                      </div>
                    </div>
                    <UtensilsCrossed className="h-8 w-8 text-green-400 ml-2" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-300 text-sm mb-4 line-clamp-3">{plan.description}</p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between text-gray-400">
                      <span>Trainer:</span>
                      <span className="text-white font-medium">{plan.trainerName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Goal:</span>
                      <span className="text-white capitalize">{plan.goalType.replace('-', ' ')}</span>
                    </div>
                  </div>

                  {/* Meals Overview */}
                  {plan.meals && plan.meals.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white font-medium mb-2">Daily Meals:</h4>
                      <div className="space-y-2">
                        {plan.meals.map((meal, index) => (
                          <div key={index} className="bg-gray-800/50 rounded-lg p-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-white font-medium text-sm">{meal.type}</span>
                              <span className="text-gray-400 text-xs">{meal.time}</span>
                            </div>
                            <p className="text-gray-300 text-xs mb-1 line-clamp-2">{meal.items}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-blue-400 text-xs">{meal.calories} calories</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-600">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-400 text-sm">Total Daily Calories:</span>
                          <span className="text-white font-bold">{calculateTotalCalories(plan.meals)} cal</span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="bg-gray-800/50 border-t border-gray-700 text-xs text-gray-400">
                  <div className="w-full flex justify-between items-center">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Assigned: {formatDate(plan.createdAt)}</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="h-3 w-3 mr-1" />
                      <span>{plan.goalType.replace('-', ' ')}</span>
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

export default MyDiet;