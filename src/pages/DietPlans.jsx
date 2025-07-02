import DashboardLayout from "@/components/layout/DashboardLayout";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, Users, Clock, Target, Calendar, Loader2, UtensilsCrossed, TrendingDown, Dumbbell, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Loading indicator component
const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    <span className="text-gray-400 text-sm">Loading...</span>
  </div>
);

const DietPlans = () => {
  const { user, userRole: userRoleContext, users, fetchUsers, authFetch, isGymOwner: isGymOwnerContext } = useAuth();
  const navigate = useNavigate();
  const userRole = user?.role || userRoleContext || '';
  const isGymOwner = userRole === 'gym-owner' || isGymOwnerContext;
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGoal, setFilterGoal] = useState("all");
  const [filterTrainer, setFilterTrainer] = useState("all");
  const [dietPlans, setDietPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDietPlanForm, setShowDietPlanForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDietPlanId, setEditDietPlanId] = useState(null);
  const [availableMembers, setAvailableMembers] = useState([]);
  const [trainers, setTrainers] = useState([]);
  
  // Diet plan form state
  const [dietPlanFormData, setDietPlanFormData] = useState({
    name: '',
    goalType: 'general',
    totalCalories: '',
    description: '',
    meals: [
      { type: 'Breakfast', time: '08:00', items: '', calories: '' },
      { type: 'Lunch', time: '13:00', items: '', calories: '' },
      { type: 'Dinner', time: '19:00', items: '', calories: '' }
    ]
  });
  
  // Check user roles
  const isTrainer = userRole === 'trainer';
  
  const isSuperAdmin = userRole === 'super-admin';
  const isMember = userRole === 'member';
  
  // Fetch trainers associated with this gym owner - optimized with caching
  const fetchGymTrainers = useCallback(async () => {
    if (!isGymOwner || !user?._id) return;
    
    // Don't fetch if we already have trainers
    if (trainers.length > 0) {
      return trainers;
    }
    
    try {
      // Check cache first
      const cacheKey = `gym_trainers_${user._id}`;
      const cachedTrainers = sessionStorage.getItem(cacheKey);
      
      if (cachedTrainers) {
        try {
          const parsedTrainers = JSON.parse(cachedTrainers);
          setTrainers(parsedTrainers);
          return parsedTrainers;
        } catch (e) {
          sessionStorage.removeItem(cacheKey);
        }
      }
      
      const response = await authFetch(`/users/trainers-by-gym/${user._id}`);
      
      if (response.success && response.data?.trainers) {
        const trainersData = response.data.trainers;
        setTrainers(trainersData);
        
        // Cache for session
        sessionStorage.setItem(cacheKey, JSON.stringify(trainersData));
        
        return trainersData;
      }
    } catch (error) {
      console.error("Error fetching gym trainers:", error);
    }
    
    return [];
  }, [isGymOwner, user?._id, authFetch, trainers.length]);
  
  // Load diet plans based on user role - stable function with proper dependencies
  const loadDietPlans = useCallback(async (forceRefresh = false) => {
    if (!user?._id || !userRole) {
      setIsLoading(false);
      return;
    }
    
    // Check cache first unless force refresh is requested
    if (!forceRefresh) {
      const cacheKey = `cached_diet_plans_${user._id}_${userRole}`;
      const timestampKey = `cached_diet_plans_timestamp_${user._id}_${userRole}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTimestamp = localStorage.getItem(timestampKey);
      
      // Use cache if it's less than 1 minute old for faster loading
      if (cachedData && cachedTimestamp) {
        const now = new Date().getTime();
        const cacheTime = parseInt(cachedTimestamp);
        const oneMinute = 60 * 1000;
        
        if (now - cacheTime < oneMinute) {
          try {
            const parsedData = JSON.parse(cachedData);
            setDietPlans(parsedData);
            setIsLoading(false);
            return;
          } catch (e) {
            // Clear invalid cache
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(timestampKey);
          }
        }
      }
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine endpoint based on user role
      let endpoint;
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '50'
      });
      
      switch (userRole) {
        case 'trainer':
          endpoint = `/diet-plans/trainer/${user._id}?${queryParams}`;
          break;
        case 'member':
          endpoint = `/diet-plans/member/${user._id}?${queryParams}`;
          break;
        case 'gym-owner':
          endpoint = `/diet-plans/gym/${user._id}?${queryParams}`;
          break;
        case 'super-admin':
          endpoint = `/diet-plans?${queryParams}`;
          break;
        default:
          setError('Invalid user role');
          setIsLoading(false);
          return;
      }
      
      const response = await authFetch(endpoint);
      
      if (response.success || response.status === 'success') {
        const dietPlansData = response.data?.dietPlans || [];
        setDietPlans(dietPlansData);
        
        // Cache the data
        const cacheKey = `cached_diet_plans_${user._id}_${userRole}`;
        const timestampKey = `cached_diet_plans_timestamp_${user._id}_${userRole}`;
        localStorage.setItem(cacheKey, JSON.stringify(dietPlansData));
        localStorage.setItem(timestampKey, new Date().getTime().toString());
      } else {
        const errorMessage = response.message || 'Failed to load diet plans';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error loading diet plans:', error);
      const errorMessage = 'Failed to load diet plans. Please try again later.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?._id, userRole, authFetch]);
  
  // Initialize data loading - simplified and stable
  const hasInitializedRef = React.useRef(false);
  const userIdRef = React.useRef(null);
  
  useEffect(() => {
    // Only initialize once per user
    if (user?._id && userRole && user._id !== userIdRef.current) {
      userIdRef.current = user._id;
      hasInitializedRef.current = false; // Reset when user changes
    }
    
    if (user?._id && userRole && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      
      // Load diet plans immediately
      loadDietPlans().catch(console.error);
      
      // Load additional data for specific roles
      if (userRole === 'gym-owner' || userRole === 'super-admin') {
        fetchUsers().catch(console.error);
      }
    }
  }, [user?._id, userRole, loadDietPlans, fetchUsers]);
  
  // Extract members from users for filtering using useMemo
  const extractedMembers = useMemo(() => {
    return users?.filter(u => u.role === 'member') || [];
  }, [users]);
  
  // Load trainers data when needed
  useEffect(() => {
    if (userRole === 'gym-owner' && user?._id && trainers.length === 0) {
      fetchGymTrainers().catch(console.error);
    } else if ((userRole === 'super-admin') && users?.length > 0 && trainers.length === 0) {
      const filteredTrainers = users.filter(u => u.role === 'trainer');
      setTrainers(filteredTrainers);
    }
  }, [userRole, user?._id, users, trainers.length, fetchGymTrainers]);
  
  // Update state when extracted members data changes
  useEffect(() => {
    if (extractedMembers.length > 0) {
      setAvailableMembers(extractedMembers);
    }
  }, [extractedMembers]);
  


  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDietPlanFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle select changes
  const handleSelectChange = (name, value) => {
    setDietPlanFormData(prev => ({ ...prev, [name]: value }));
  };
  
  // Handle meal input changes
  const handleMealChange = (index, field, value) => {
    const updatedMeals = [...dietPlanFormData.meals];
    updatedMeals[index] = { ...updatedMeals[index], [field]: value };
    setDietPlanFormData(prev => ({ ...prev, meals: updatedMeals }));
  };
  
  // Add a new meal to the form
  const addMeal = () => {
    setDietPlanFormData(prev => ({
      ...prev,
      meals: [...prev.meals, { type: 'Snack', time: '16:00', items: '', calories: '' }]
    }));
  };
  
  // Remove a meal from the form
  const removeMeal = (index) => {
    if (dietPlanFormData.meals.length <= 1) {
      toast.error('Diet plan must have at least one meal');
      return;
    }
    
    const updatedMeals = [...dietPlanFormData.meals];
    updatedMeals.splice(index, 1);
    setDietPlanFormData(prev => ({ ...prev, meals: updatedMeals }));
  };
  
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
  
  // Reset form
  const resetForm = () => {
    setDietPlanFormData({
      name: '',
      goalType: 'general',
      totalCalories: '',
      description: '',
      meals: [
        { type: 'Breakfast', time: '08:00', items: '', calories: '' },
        { type: 'Lunch', time: '13:00', items: '', calories: '' },
        { type: 'Dinner', time: '19:00', items: '', calories: '' }
      ]
    });
    setIsEditing(false);
    setEditDietPlanId(null);
  };
  
  // Handle form submission
  const handleSubmitDietPlan = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!dietPlanFormData.name || !dietPlanFormData.totalCalories || dietPlanFormData.meals.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate meals
    for (const meal of dietPlanFormData.meals) {
      if (!meal.type || !meal.items || !meal.calories) {
        toast.error('Please fill in all meal details');
        return;
      }
    }
    
    setFormSubmitting(true);
    
    try {
      // Prepare diet plan data
      const dietPlanData = {
        ...dietPlanFormData,
        trainer: user._id,
        trainerName: user.name,
      };
      
      // Submitting diet plan data
      
      let response;
      
      if (isEditing && editDietPlanId) {
        // Update existing diet plan
        response = await authFetch(`/diet-plans/${editDietPlanId}`, {
          method: 'PUT',
          body: JSON.stringify(dietPlanData),
        });
      } else {
        // Create new diet plan
        response = await authFetch('/diet-plans', {
          method: 'POST',
          body: JSON.stringify(dietPlanData),
        });
      }
      
      // Diet plan submission completed
      
      if (response.success || response.status === 'success') {
        toast.success(isEditing ? 'Diet plan updated successfully' : 'Diet plan created successfully');
        
        // Refresh diet plans list
        const updatedDietPlans = await authFetch(`/diet-plans/trainer/${user._id}`);
        // Diet plans updated
        
        if (updatedDietPlans.success || updatedDietPlans.status === 'success') {
          setDietPlans(updatedDietPlans.data?.dietPlans || []);
        }
        
        // Close form and reset
        setShowDietPlanForm(false);
        resetForm();
        
        // Navigate to dashboard to refresh the stats
        navigate('/');
      } else {
        toast.error(response.message || 'Failed to save diet plan');
      }
    } catch (error) {
      // Error submitting diet plan
      toast.error('An error occurred while saving the diet plan');
    } finally {
      setFormSubmitting(false);
    }
  };
  
  // Handle edit diet plan
  const handleEditDietPlan = (plan) => {
    setDietPlanFormData({
      name: plan.name,
      goalType: plan.goalType,
      totalCalories: plan.totalCalories.toString(),
      description: plan.description || '',
      meals: plan.meals || []
    });
    setIsEditing(true);
    setEditDietPlanId(plan._id);
    setShowDietPlanForm(true);
  };
  
  // Handle delete diet plan
  const handleDeleteDietPlan = async (dietPlanId) => {
    if (!dietPlanId) return;
    
    if (!confirm('Are you sure you want to delete this diet plan?')) return;
    
    try {
      const response = await authFetch(`/diet-plans/${dietPlanId}`, {
        method: 'DELETE',
      });
      
      // Diet plan deletion completed
      
      if (response.success || response.status === 'success') {
        toast.success('Diet plan deleted successfully');
        
        // Update diet plans list
        setDietPlans(prev => prev.filter(p => p._id !== dietPlanId));
      } else {
        toast.error(response.message || 'Failed to delete diet plan');
      }
    } catch (error) {
      // Error deleting diet plan
      toast.error('An error occurred while deleting the diet plan');
    }
  };
  
  // Format date
  // const formatDate = (dateString) => {
  //   if (!dateString) return 'N/A';
  //   const date = new Date(dateString);
  //   return date.toLocaleDateString();
  // };
  
  // Filter diet plans using useMemo
  const filteredPlans = useMemo(() => {
    return dietPlans.filter(plan => {
      const matchesSearch = plan.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             plan.trainerName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGoal = filterGoal === "all" || plan.goalType === filterGoal;
      const matchesTrainer = filterTrainer === "all" || 
        (plan.trainer && plan.trainer.toString() === filterTrainer) ||
        (plan.trainerName && plan.trainerName === filterTrainer);
        return matchesSearch && matchesGoal && matchesTrainer;
      });
  }, [dietPlans, searchTerm, filterGoal, filterTrainer]);

  // Get goal badge
  // const getGoalBadge = (goalType) => {
  //   const goalConfig = {
  //     'weight-loss': { variant: 'destructive', label: 'Weight Loss' },
  //     'weight-gain': { variant: 'default', label: 'Weight Gain' },
  //     'general': { variant: 'secondary', label: 'General Fitness' }
  //   };
  //   const config = goalConfig[goalType] || { variant: 'outline', label: goalType };
  //   return <Badge variant={config.variant}>{config.label}</Badge>;
  // };

  // Calculate plan stats
  const planStats = {
    total: dietPlans.length,
    totalMembers: dietPlans.reduce((sum, plan) => sum + (plan.assignedMembers || 0), 0),
    avgCalories: dietPlans.length > 0 ? 
      Math.round(dietPlans.reduce((sum, plan) => sum + (plan.totalCalories || 0), 0) / dietPlans.length) : 0,
    weightLoss: dietPlans.filter(p => p.goalType === 'weight-loss').length
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {isMember ? "My Diet Plans" : "Diet Plans Management"}
              </h1>
              {isGymOwner ? (
                <p className="text-gray-400">View all diet plans created by your trainers</p>
              ) : isMember ? (
                <p className="text-gray-400">View diet plans assigned to you by your trainer</p>
              ) : (
                <p className="text-gray-400">Create and manage meal plans for different fitness goals</p>
              )}
            </div>
            {isTrainer && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  resetForm();
                  setShowDietPlanForm(true);
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Diet Plan
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Plans</p>
                    <p className="text-2xl font-bold text-white">{planStats.total}</p>
                  </div>
                  <div className="bg-blue-900/30 p-3 rounded-full">
                    <UtensilsCrossed className="h-6 w-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Assigned Members</p>
                    <p className="text-2xl font-bold text-white">{planStats.totalMembers}</p>
                  </div>
                  <div className="bg-green-900/30 p-3 rounded-full">
                    <Users className="h-6 w-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Avg Calories</p>
                    <p className="text-2xl font-bold text-white">{planStats.avgCalories}</p>
                  </div>
                  <div className="bg-purple-900/30 p-3 rounded-full">
                    <Target className="h-6 w-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gray-800/50 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Weight Loss Plans</p>
                    <p className="text-2xl font-bold text-white">{planStats.weightLoss}</p>
                  </div>
                  <div className="bg-red-900/30 p-3 rounded-full">
                    <Target className="h-6 w-6 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Diet Plan Form Dialog */}
          <Dialog open={showDietPlanForm} onOpenChange={setShowDietPlanForm}>
            <DialogContent className="bg-gray-800 text-white border-gray-700 max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Diet Plan' : 'Create New Diet Plan'}</DialogTitle>
                <DialogDescription className="text-gray-400">
                  {isEditing ? 'Update the details of this diet plan' : 'Fill in the details to create a new diet plan'}
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmitDietPlan}>
                <div className="grid gap-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-gray-300">Diet Plan Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={dietPlanFormData.name}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="e.g., 7-Day Weight Loss Plan"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="goalType" className="text-gray-300">Goal Type</Label>
                      <Select 
                        value={dietPlanFormData.goalType} 
                        onValueChange={(value) => handleSelectChange('goalType', value)}
                      >
                        <SelectTrigger id="goalType" className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select goal type" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-800 border-gray-700 text-white">
                          <SelectItem value="weight-loss">Weight Loss</SelectItem>
                          <SelectItem value="weight-gain">Weight Gain</SelectItem>
                          <SelectItem value="general">General Fitness</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalCalories" className="text-gray-300">Total Calories</Label>
                      <Input
                        id="totalCalories"
                        name="totalCalories"
                        type="number"
                        value={dietPlanFormData.totalCalories}
                        onChange={handleInputChange}
                        className="bg-gray-700 border-gray-600 text-white"
                        placeholder="e.g., 2000"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300">Description</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={dietPlanFormData.description}
                      onChange={handleInputChange}
                      className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
                      placeholder="Describe the diet plan and its benefits..."
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-gray-300 text-lg">Meals</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={addMeal}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Meal
                      </Button>
                    </div>
                    
                    {dietPlanFormData.meals.map((meal, index) => (
                      <div key={index} className="bg-gray-700/50 p-4 rounded-md border border-gray-600">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-medium text-white">Meal {index + 1}</h4>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="sm" 
                            className="text-gray-400 hover:text-red-400 hover:bg-transparent"
                            onClick={() => removeMeal(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-2">
                            <Label htmlFor={`meal-type-${index}`} className="text-gray-300">Type</Label>
                            <Input
                              id={`meal-type-${index}`}
                              value={meal.type}
                              onChange={(e) => handleMealChange(index, 'type', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="e.g., Breakfast, Lunch, Dinner"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`meal-time-${index}`} className="text-gray-300">Time</Label>
                            <Input
                              id={`meal-time-${index}`}
                              value={meal.time}
                              onChange={(e) => handleMealChange(index, 'time', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="e.g., 08:00"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor={`meal-items-${index}`} className="text-gray-300">Items</Label>
                            <Input
                              id={`meal-items-${index}`}
                              value={meal.items}
                              onChange={(e) => handleMealChange(index, 'items', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="e.g., Oatmeal with berries"
                              required
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor={`meal-calories-${index}`} className="text-gray-300">Calories</Label>
                            <Input
                              id={`meal-calories-${index}`}
                              type="number"
                              value={meal.calories}
                              onChange={(e) => handleMealChange(index, 'calories', e.target.value)}
                              className="bg-gray-700 border-gray-600 text-white"
                              placeholder="e.g., 350"
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <DialogFooter className="mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    onClick={() => {
                      resetForm();
                      setShowDietPlanForm(false);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEditing ? 'Update Diet Plan' : 'Create Diet Plan'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Search and Filters */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Diet Plans Library</CardTitle>
              <CardDescription className="text-gray-400">
                Search and manage diet plans by goal and trainer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search diet plans or trainers..."
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
                  <option value="general">General Fitness</option>
                </select>
                {(isGymOwner || isSuperAdmin) && (
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadDietPlans(true)}
                  disabled={isLoading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-600 whitespace-nowrap"
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </div>

              {isLoading ? (
                <div className="text-center py-10">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-400">Loading diet plans...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                  <p className="text-red-400">{error}</p>
                </div>
              ) : filteredPlans.length === 0 ? (
                <div className="text-center py-10 bg-gray-800/30 rounded-lg border border-gray-700">
                  <UtensilsCrossed className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Diet Plans Found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    {isTrainer ? 
                      "You haven't created any diet plans yet. Click the 'Create New Diet Plan' button to get started." : 
                      "No diet plans match your search criteria. Try adjusting your filters."}
                  </p>
                </div>
              ) : (
                /* Diet Plans Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 content-grid">
                  {filteredPlans.map((plan) => (
                    <Card key={plan._id} className="bg-gray-700/50 border-gray-600">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-lg mb-2">{plan.name}</CardTitle>
                            <div className="flex flex-wrap gap-2 mb-2">
                              {getGoalBadge(plan.goalType)}
                              <Badge variant="outline">{plan.totalCalories} cal/day</Badge>
                            </div>
                          </div>
                          <UtensilsCrossed className="h-8 w-8 text-green-400 ml-2" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between text-gray-400">
                            <span>Trainer:</span>
                            <span className="text-white">{plan.trainerName}</span>
                          </div>
                          <div className="flex justify-between text-gray-400">
                            <span>Meals per day:</span>
                            <span className="text-white">{plan.meals?.length || 0}</span>
                          </div>
                          {plan.description && (
                            <div className="text-gray-300 mt-2">
                              <p className="text-sm">{plan.description}</p>
                            </div>
                          )}
                          <div className="flex justify-between text-gray-400">
                            <span>Created:</span>
                            <span className="text-white">{formatDate(plan.createdAt)}</span>
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <h4 className="text-white font-medium mb-2">Meals:</h4>
                          <div className="space-y-1">
                            {plan.meals?.slice(0, 3).map((meal, index) => (
                              <div key={index} className="text-sm text-gray-300">
                                <span className="font-medium">{meal.type}:</span> {meal.items} ({meal.calories} cal)
                              </div>
                            ))}
                            {plan.meals?.length > 3 && (
                              <div className="text-sm text-gray-400">
                                +{plan.meals.length - 3} more meals...
                              </div>
                            )}
                          </div>
                        </div>

                        {(isTrainer && plan.trainer === user._id) && (
                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-600"
                              onClick={() => handleEditDietPlan(plan)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="border-gray-600 text-gray-300 hover:bg-gray-600"
                              onClick={() => handleDeleteDietPlan(plan._id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DietPlans;