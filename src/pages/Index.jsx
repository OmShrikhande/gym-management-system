import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Dumbbell, UtensilsCrossed, MessageSquare, CreditCard, BarChart3, Settings, Plus, Calendar, Target, TrendingUp, Loader2 } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm.jsx";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";

// Loading indicator component
const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    <span className="text-gray-400 text-sm">Loading...</span>
  </div>
);

const Index = () => {
  const { user, userRole, users, fetchUsers, authFetch, subscription, checkSubscriptionStatus } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [gymOwnerCount, setGymOwnerCount] = useState(0);
  const [memberCount, setMemberCount] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(null);
  const [newGymOwnersCount, setNewGymOwnersCount] = useState(null);
  const [growthPercentage, setGrowthPercentage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrowthLoading, setIsGrowthLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  
  // Trainer dashboard stats
  const [assignedMembersCount, setAssignedMembersCount] = useState(0);
  const [workoutPlansCount, setWorkoutPlansCount] = useState(0);
  const [dietPlansCount, setDietPlansCount] = useState(0);
  const [messagesSentCount, setMessagesSentCount] = useState(0);
  const [isTrainerStatsLoading, setIsTrainerStatsLoading] = useState(true);

  // Fetch total revenue for super admin
  const fetchTotalRevenue = async () => {
    if (userRole !== 'super-admin') {
      setIsLoading(false);
      return;
    }
    
    try {
      const API_URL = 'http://localhost:8081/api';
      const response = await authFetch(`${API_URL}/subscriptions/revenue/total`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      
      const data = await response.json();
      setTotalRevenue(data.data.totalRevenue);
    } catch (error) {
      console.error('Error fetching revenue:', error);
      // Don't show toast to avoid UI disruption
      // Just set a default value instead
      setTotalRevenue(0);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch new gym owners count for super admin
  const fetchNewGymOwnersCount = async () => {
    if (userRole !== 'super-admin') {
      setIsGrowthLoading(false);
      return;
    }
    
    try {
      const API_URL = 'http://localhost:8081/api';
      const response = await authFetch(`${API_URL}/users/stats/new-gym-owners`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch new gym owners data');
      }
      
      const data = await response.json();
      setNewGymOwnersCount(data.data.newGymOwnersCount);
      setGrowthPercentage(data.data.growthPercentage);
    } catch (error) {
      console.error('Error fetching new gym owners count:', error);
      // Set default values
      setNewGymOwnersCount(0);
      setGrowthPercentage(0);
    } finally {
      setIsGrowthLoading(false);
    }
  };

  useEffect(() => {
    // Fetch users when component mounts
    if (user) {
      fetchUsers();
    }
  }, [fetchUsers, user]);
  
  // Check subscription status for gym owners
  useEffect(() => {
    if (userRole === 'gym-owner' && user && checkSubscriptionStatus) {
      checkSubscriptionStatus(user._id);
    }
  }, [userRole, user, checkSubscriptionStatus]);
  
  // Separate effect for revenue to avoid unnecessary re-renders
  // Fetch recent activities
  const fetchRecentActivities = async () => {
    setIsActivitiesLoading(true);
    
    try {
      // In a real application, you would fetch this from an API
      // For now, we'll generate some mock data based on the user role
      
      const currentDate = new Date();
      
      // Generate activities based on user role
      let activities = [];
      
      if (userRole === 'super-admin') {
        activities = [
          {
            id: 1,
            type: 'new_gym_owner',
            icon: <Users className="h-4 w-4 text-white" />,
            iconBg: 'bg-green-500',
            message: 'New gym owner registered: FitZone Gym',
            timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: 2,
            type: 'payment',
            icon: <CreditCard className="h-4 w-4 text-white" />,
            iconBg: 'bg-blue-500',
            message: 'Subscription payment received: $199 from PowerFit Gym',
            timestamp: new Date(currentDate.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
          },
          {
            id: 3,
            type: 'system',
            icon: <Settings className="h-4 w-4 text-white" />,
            iconBg: 'bg-yellow-500',
            message: 'System update completed: v2.3.1',
            timestamp: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: 4,
            type: 'report',
            icon: <BarChart3 className="h-4 w-4 text-white" />,
            iconBg: 'bg-purple-500',
            message: 'Monthly revenue report generated',
            timestamp: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ];
      } else if (userRole === 'gym-owner') {
        activities = [
          {
            id: 1,
            type: 'new_member',
            icon: <Users className="h-4 w-4 text-white" />,
            iconBg: 'bg-green-500',
            message: 'New member joined: Sarah Johnson',
            timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: 2,
            type: 'workout',
            icon: <Dumbbell className="h-4 w-4 text-white" />,
            iconBg: 'bg-blue-500',
            message: 'Workout plan created for John Doe',
            timestamp: new Date(currentDate.getTime() - 4 * 60 * 60 * 1000) // 4 hours ago
          },
          {
            id: 3,
            type: 'message',
            icon: <MessageSquare className="h-4 w-4 text-white" />,
            iconBg: 'bg-purple-500',
            message: 'Birthday message sent to 5 members',
            timestamp: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: 4,
            type: 'diet',
            icon: <UtensilsCrossed className="h-4 w-4 text-white" />,
            iconBg: 'bg-orange-500',
            message: 'New diet plan assigned to 3 members',
            timestamp: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          }
        ];
      } else if (userRole === 'trainer') {
        activities = [
          {
            id: 1,
            type: 'workout',
            icon: <Dumbbell className="h-4 w-4 text-white" />,
            iconBg: 'bg-blue-500',
            message: 'Workout plan created for John Doe',
            timestamp: new Date(currentDate.getTime() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: 2,
            type: 'diet',
            icon: <UtensilsCrossed className="h-4 w-4 text-white" />,
            iconBg: 'bg-orange-500',
            message: 'Diet plan updated for Emily Parker',
            timestamp: new Date(currentDate.getTime() - 5 * 60 * 60 * 1000) // 5 hours ago
          },
          {
            id: 3,
            type: 'schedule',
            icon: <Calendar className="h-4 w-4 text-white" />,
            iconBg: 'bg-green-500',
            message: 'New training session scheduled with Mike Wilson',
            timestamp: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: 4,
            type: 'goal',
            icon: <Target className="h-4 w-4 text-white" />,
            iconBg: 'bg-purple-500',
            message: 'Fitness goal achieved by Lisa Thompson',
            timestamp: new Date(currentDate.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
          }
        ];
      } else if (userRole === 'member') {
        activities = [
          {
            id: 1,
            type: 'workout',
            icon: <Dumbbell className="h-4 w-4 text-white" />,
            iconBg: 'bg-blue-500',
            message: 'New workout plan assigned to you',
            timestamp: new Date(currentDate.getTime() - 3 * 60 * 60 * 1000) // 3 hours ago
          },
          {
            id: 2,
            type: 'diet',
            icon: <UtensilsCrossed className="h-4 w-4 text-white" />,
            iconBg: 'bg-orange-500',
            message: 'Diet plan updated by your trainer',
            timestamp: new Date(currentDate.getTime() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: 3,
            type: 'schedule',
            icon: <Calendar className="h-4 w-4 text-white" />,
            iconBg: 'bg-green-500',
            message: 'Training session scheduled for tomorrow at 10:00 AM',
            timestamp: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
          },
          {
            id: 4,
            type: 'progress',
            icon: <TrendingUp className="h-4 w-4 text-white" />,
            iconBg: 'bg-purple-500',
            message: 'Weight loss goal: 2kg progress recorded',
            timestamp: new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
          }
        ];
      }
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error generating recent activities:', error);
    } finally {
      setIsActivitiesLoading(false);
    }
  };

  // Fetch trainer dashboard stats
  const fetchTrainerStats = async () => {
    if (!user || userRole !== 'trainer') {
      setIsTrainerStatsLoading(false);
      return;
    }
    
    setIsTrainerStatsLoading(true);
    
    try {
      // Fetch assigned members count
      const membersResponse = await authFetch(`/users/trainer/${user._id}/members`);
      if (membersResponse.success || membersResponse.status === 'success') {
        setAssignedMembersCount(membersResponse.data?.members?.length || 0);
      }
      
      // Fetch workout plans count
      const workoutsResponse = await authFetch(`/workouts/trainer/${user._id}`);
      if (workoutsResponse.success || workoutsResponse.status === 'success') {
        setWorkoutPlansCount(workoutsResponse.data?.workouts?.length || 0);
      }
      
      // Fetch diet plans count
      const dietPlansResponse = await authFetch(`/diet-plans/trainer/${user._id}`);
      console.log('Diet plans response in dashboard:', dietPlansResponse);
      
      if (dietPlansResponse.success || dietPlansResponse.status === 'success') {
        const count = dietPlansResponse.data?.dietPlans?.length || 0;
        console.log('Setting diet plans count to:', count);
        setDietPlansCount(count);
      }
      
      // For messages, we'll use placeholder values for now
      setMessagesSentCount(0); // Replace with actual API call when available
      
    } catch (error) {
      console.error('Error fetching trainer stats:', error);
    } finally {
      setIsTrainerStatsLoading(false);
    }
  };

  useEffect(() => {
    if (user && userRole === 'super-admin') {
      fetchTotalRevenue();
      fetchNewGymOwnersCount();
    } else if (user && userRole === 'trainer') {
      fetchTrainerStats();
    }
    
    if (user) {
      fetchRecentActivities();
    }
  }, [user, userRole, location.pathname]);

  useEffect(() => {
    // Count users based on role
    if (users.length > 0) {
      if (userRole === 'super-admin') {
        const gymOwners = users.filter(user => user.role === 'gym-owner');
        setGymOwnerCount(gymOwners.length);
      } else if (userRole === 'gym-owner') {
        const members = users.filter(user => user.role === 'member');
        setMemberCount(members.length);
      }
    }
  }, [users, userRole]);

  if (!user) {
    return <LoginForm />;
  }

  // Memoize dashboard stats to prevent unnecessary re-renders
  const getDashboardStats = () => {
    // Use a stable reference for the loading indicators
    const revenueLoadingIndicator = isLoading ? <LoadingIndicator /> : null;
    const growthLoadingIndicator = isGrowthLoading ? <LoadingIndicator /> : null;
    
    // Format growth percentage with + or - sign
    const formatGrowthPercentage = (percentage) => {
      if (percentage === null) return "0%";
      return percentage >= 0 ? `+${percentage}%` : `${percentage}%`;
    };
    
    switch (userRole) {
      case 'super-admin':
        return [
          { label: "Total Gyms", value: gymOwnerCount.toString(), icon: Users, color: "bg-blue-500" },
          { label: "Active Users", value: users.length.toString(), icon: Users, color: "bg-green-500" },
          { 
            label: "Total Revenue", 
            value: isLoading ? revenueLoadingIndicator : (totalRevenue !== null ? `₹${totalRevenue.toLocaleString()}` : "₹0"), 
            icon: CreditCard, 
            color: "bg-purple-500" 
          },
          { 
            label: "New Gym Owners (This Month)", 
            value: isGrowthLoading ? 
              growthLoadingIndicator : 
              <div className="flex flex-col">
                <span>{newGymOwnersCount !== null ? newGymOwnersCount : "0"}</span>
                <span className={`text-xs ${growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatGrowthPercentage(growthPercentage)}
                </span>
              </div>, 
            icon: TrendingUp, 
            color: "bg-orange-500" 
          }
        ];
      case 'gym-owner':
        {
          // Calculate member capacity based on subscription
          const maxMembers = subscription?.subscription?.plan === 'Premium' ? 500 : 
                            subscription?.subscription?.plan === 'Enterprise' ? 1000 : 200;
          const memberCapacity = memberCount > 0 ? Math.round((memberCount / maxMembers) * 100) : 0;
          const hasActiveSubscription = subscription?.hasActiveSubscription || false;
          const daysRemaining = subscription?.daysRemaining || 0;
          
          return [
            { 
              label: "Total Members", 
              value: (
                <div className="flex flex-col">
                  <span>{memberCount.toString()}</span>
                  <span className="text-xs text-gray-400">{memberCapacity}% of capacity</span>
                </div>
              ), 
              icon: Users, 
              color: "bg-blue-500" 
            },
            { label: "Active Trainers", value: users.filter(u => u.role === 'trainer').length.toString(), icon: Dumbbell, color: "bg-green-500" },
            { 
              label: "Subscription Status", 
              value: (
                <div className="flex flex-col">
                  <span className={hasActiveSubscription ? "text-green-400" : "text-red-400"}>
                    {hasActiveSubscription ? "Active" : "Inactive"}
                  </span>
                  {hasActiveSubscription && (
                    <span className="text-xs text-gray-400">{daysRemaining} days left</span>
                  )}
                </div>
              ), 
              icon: CreditCard, 
              color: "bg-purple-500" 
            },
            { 
              label: "Member Capacity", 
              value: (
                <div className="flex flex-col">
                  <span>{maxMembers - memberCount}</span>
                  <span className="text-xs text-gray-400">slots available</span>
                </div>
              ), 
              icon: Plus, 
              color: "bg-orange-500" 
            }
          ];
        }
      case 'trainer':
        return [
          { 
            label: "Assigned Members", 
            value: isTrainerStatsLoading ? <LoadingIndicator /> : assignedMembersCount.toString(), 
            icon: Users, 
            color: "bg-blue-500" 
          },
          { 
            label: "Workout Plans", 
            value: isTrainerStatsLoading ? <LoadingIndicator /> : workoutPlansCount.toString(), 
            icon: Dumbbell, 
            color: "bg-green-500" 
          },
          { 
            label: "Diet Plans", 
            value: isTrainerStatsLoading ? <LoadingIndicator /> : dietPlansCount.toString(), 
            icon: UtensilsCrossed, 
            color: "bg-purple-500" 
          },
          { 
            label: "Messages Sent", 
            value: isTrainerStatsLoading ? <LoadingIndicator /> : messagesSentCount.toString(), 
            icon: MessageSquare, 
            color: "bg-orange-500" 
          }
        ];
      case 'member':
        return [
          { label: "Days Active", value: "45", icon: Calendar, color: "bg-blue-500" },
          { label: "Workouts Done", value: "32", icon: Dumbbell, color: "bg-green-500" },
          { label: "Weight Progress", value: "-5kg", icon: Target, color: "bg-purple-500" },
          { label: "Streak", value: "7 days", icon: TrendingUp, color: "bg-orange-500" }
        ];
      default:
        return [];
    }
  };

  const handleQuickAction = (actionLabel) => {
    if (actionLabel === "Add New Gym") {
      navigate("/users"); // Redirect to User Management page
    } else if (actionLabel === "View Reports") {
      navigate("/reports");
    } else if (actionLabel === "Manage Billing") {
      navigate("/billing");
    } else if (actionLabel === "System Settings") {
      navigate("/settings");
    }
  };

  const getQuickActions = () => {
    switch (userRole) {
      case 'super-admin':
        return [
          { label: "Add New Gym", icon: Plus, action: () => navigate("/users") },
          { label: "View Reports", icon: BarChart3, action: () => navigate("/reports") },
          { label: "Manage Billing", icon: CreditCard, action: () => navigate("/billing") },
          { label: "System Settings", icon: Settings, action: () => navigate("/settings") }
        ];
      case 'gym-owner':
        {
          // Check if subscription is active and member limit not reached
          const maxMembers = subscription?.subscription?.plan === 'Premium' ? 500 : 
                            subscription?.subscription?.plan === 'Enterprise' ? 1000 : 200;
          const hasActiveSubscription = subscription?.hasActiveSubscription || false;
          const memberLimitReached = memberCount >= maxMembers;
          
          return [
            { 
              label: hasActiveSubscription && !memberLimitReached ? "Add Member" : "Manage Members", 
              icon: Plus, 
              action: () => navigate("/members") 
            },
            { label: "View Reports", icon: BarChart3, action: () => navigate("/reports") },
            { label: "Manage Trainers", icon: Users, action: () => navigate("/trainers") },
            { 
              label: hasActiveSubscription ? "Subscription" : "Renew Subscription", 
              icon: CreditCard, 
              action: () => navigate("/billing") 
            }
          ];
        }
      case 'trainer':
        return [
          { label: "Create Workout", icon: Dumbbell, action: () => navigate("/workouts") },
          { label: "Create Diet Plan", icon: UtensilsCrossed, action: () => navigate("/diet-plans") },
          { label: "Send Message", icon: MessageSquare, action: () => navigate("/messages") },
          { label: "View Members", icon: Users, action: () => navigate("/my-members") }
        ];
      case 'member':
        return [
          { label: "Today's Workout", icon: Dumbbell, action: () => navigate("/workouts") },
          { label: "Diet Plan", icon: UtensilsCrossed, action: () => navigate("/diet-plans") },
          { label: "Progress", icon: Target, action: () => navigate("/profile") },
          { label: "Messages", icon: MessageSquare, action: () => navigate("/messages") }
        ];
      default:
        return [];
    }
  };

  const stats = getDashboardStats();
  const quickActions = getQuickActions();

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-white">
              Welcome back, {user.name}!
            </h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {userRole.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.label}</p>
                      <p className="text-2xl font-bold text-white min-h-[32px]">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.color}`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Common tasks for your role
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="h-20 flex-col space-y-2 border-gray-600 hover:bg-gray-700 text-white hover:text-white"
                    onClick={action.action}
                  >
                    <action.icon className="h-6 w-6" />
                    <span className="text-sm">{action.label}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-gray-800/50 border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-white">Recent Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Latest updates and notifications
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                onClick={fetchRecentActivities}
              >
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {isActivitiesLoading ? (
                <div className="flex justify-center py-8">
                  <LoadingIndicator />
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map(activity => {
                    // Format the timestamp
                    const now = new Date();
                    const activityTime = activity.timestamp;
                    const diffMs = now - activityTime;
                    const diffMins = Math.floor(diffMs / (1000 * 60));
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                    
                    let timeAgo;
                    if (diffMins < 60) {
                      timeAgo = `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
                    } else if (diffHours < 24) {
                      timeAgo = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
                    } else {
                      timeAgo = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
                    }
                    
                    return (
                      <div key={activity.id} className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                        <div className={`p-2 ${activity.iconBg} rounded-full`}>
                          {activity.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-white text-sm">{activity.message}</p>
                          <p className="text-gray-400 text-xs">{timeAgo}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>No recent activities found</p>
                </div>
              )}
              
              {recentActivities.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <Button 
                    variant="ghost" 
                    className="w-full text-blue-400 hover:text-blue-300 hover:bg-gray-700/50"
                    onClick={() => toast.info("View all activities feature coming soon!")}
                  >
                    View All Activities
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Index;