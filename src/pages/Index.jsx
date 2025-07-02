import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Dumbbell, UtensilsCrossed, MessageSquare, CreditCard, BarChart3, Settings, Plus, Calendar, Target, TrendingUp, Loader2, AlertCircle, User, Scan } from "lucide-react";
import LoginForm from "@/components/auth/LoginForm.jsx";
import DashboardLayout from "@/components/layout/DashboardLayout";
import QRCodeGenerator from "@/components/qr/QRCodeGenerator";
import QRCodeScanner from "@/components/qr/QRCodeScanner";
import { useAuth } from "@/contexts/AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { extractId } from "@/utils/idUtils";

// Loading indicator component
const LoadingIndicator = () => (
  <div className="flex items-center space-x-2">
    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
    <span className="text-gray-400 text-sm">Loading...</span>
  </div>
);

const Index = () => {
  const { user, userRole, users, fetchUsers, authFetch, subscription, checkSubscriptionStatus, updateCurrentUser } = useAuth();
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
  const [trainerGymName, setTrainerGymName] = useState('');
  const [trainerWorkoutPlans, setTrainerWorkoutPlans] = useState([]);
  const [trainerDietPlans, setTrainerDietPlans] = useState([]);
  
  // QR Scanner state for members
  const [showQRScanner, setShowQRScanner] = useState(false);
  
  // We don't need these state variables anymore as we're using dedicated pages

  // Fetch total revenue for super admin
  const fetchTotalRevenue = async () => {
    if (userRole !== 'super-admin') {
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await authFetch(`/subscriptions/revenue/total`);
      
      if (response.success || response.status === 'success') {
        setTotalRevenue(response.data.totalRevenue);
      } else {
        throw new Error(response.message || 'Failed to fetch revenue data');
      }
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
      const response = await authFetch(`/users/stats/new-gym-owners`);
      
      if (response.success || response.status === 'success') {
        setNewGymOwnersCount(response.data.newGymOwnersCount);
        setGrowthPercentage(response.data.growthPercentage);
      } else {
        throw new Error(response.message || 'Failed to fetch new gym owners data');
      }
    } catch (error) {
      console.error('Error fetching new gym owners count:', error);
      // Set default values
      setNewGymOwnersCount(0);
      setGrowthPercentage(0);
    } finally {
      setIsGrowthLoading(false);
    }
  };

  // We'll only fetch users when needed in specific components
  // Removing this effect to prevent unnecessary API calls that might result in 403 errors
  
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
      let activities = [];
      const currentDate = new Date();
      
      // Calculate date 30 days ago for filtering recent items
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Different API calls based on user role
      if (userRole === 'super-admin') {
        // 1. Get all users and filter for recent gym owners
        const usersResponse = await authFetch('/users');
        if (usersResponse.success || usersResponse.status === 'success') {
          const allUsers = usersResponse.data?.users || [];
          
          // Filter for gym owners created in the last 30 days
          const recentGymOwners = allUsers
            .filter(user => 
              user.role === 'gym-owner' && 
              new Date(user.createdAt) > thirtyDaysAgo
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          
          // Add each gym owner as an activity
          recentGymOwners.forEach((gymOwner) => {
            activities.push({
              id: `gym-owner-${gymOwner._id}`,
              type: 'new_gym_owner',
              icon: <Users className="h-4 w-4 text-white" />,
              iconBg: 'bg-green-500',
              message: `New gym owner registered: ${gymOwner.gymName || gymOwner.name}`,
              timestamp: new Date(gymOwner.createdAt)
            });
          });
        }
        
        // 2. Get all subscriptions and filter for recent ones
        const subscriptionsResponse = await authFetch('/subscriptions');
        if (subscriptionsResponse.success || subscriptionsResponse.status === 'success') {
          const allSubscriptions = subscriptionsResponse.data?.subscriptions || [];
          
          // Filter for subscriptions with recent payments
          const recentSubscriptions = allSubscriptions
            .filter(sub => {
              if (!sub.paymentHistory || sub.paymentHistory.length === 0) return false;
              const latestPayment = sub.paymentHistory[sub.paymentHistory.length - 1];
              return new Date(latestPayment.date) > thirtyDaysAgo;
            })
            .sort((a, b) => {
              const aLatestPayment = a.paymentHistory[a.paymentHistory.length - 1];
              const bLatestPayment = b.paymentHistory[b.paymentHistory.length - 1];
              return new Date(bLatestPayment.date) - new Date(aLatestPayment.date);
            })
            .slice(0, 5);
          
          // Add each subscription payment as an activity
          for (const sub of recentSubscriptions) {
            const latestPayment = sub.paymentHistory[sub.paymentHistory.length - 1];
            
            // Get gym owner details
            // Handle case where gymOwner might be an object or a string ID
            const gymOwnerId = extractId(sub.gymOwner);
            console.log('fetchRecentActivities - gymOwner:', sub.gymOwner, 'gymOwnerId:', gymOwnerId);
            
            // Skip if gymOwnerId is null or invalid
            if (!gymOwnerId) {
              console.warn('Invalid or missing gymOwner ID for subscription:', sub._id);
              continue;
            }
            
            const gymOwnerResponse = await authFetch(`/users/${gymOwnerId}`);
            const gymOwnerName = gymOwnerResponse.success ? 
              (gymOwnerResponse.data.user.gymName || gymOwnerResponse.data.user.name) : 
              'a gym owner';
            
            activities.push({
              id: `payment-${sub._id}-${latestPayment.date}`,
              type: 'payment',
              icon: <CreditCard className="h-4 w-4 text-white" />,
              iconBg: 'bg-blue-500',
              message: `Subscription payment received: ₹${latestPayment.amount} from ${gymOwnerName}`,
              timestamp: new Date(latestPayment.date)
            });
          }
        }
        
        // 3. Get expiring subscriptions
        const allSubscriptionsResponse = await authFetch('/subscriptions');
        if (allSubscriptionsResponse.success || allSubscriptionsResponse.status === 'success') {
          const allSubscriptions = allSubscriptionsResponse.data?.subscriptions || [];
          
          // Filter for subscriptions expiring in the next 7 days
          const expiringSubscriptions = allSubscriptions
            .filter(sub => {
              const endDate = new Date(sub.endDate);
              const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
              return daysRemaining <= 7 && daysRemaining > 0 && sub.isActive;
            })
            .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
            .slice(0, 3);
          
          // Add each expiring subscription as an activity
          for (const sub of expiringSubscriptions) {
            const endDate = new Date(sub.endDate);
            const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
            
            // Get gym owner details
            // Handle case where gymOwner might be an object or a string ID
            const gymOwnerId = extractId(sub.gymOwner);
            console.log('fetchRecentActivities - expiring gymOwner:', sub.gymOwner, 'gymOwnerId:', gymOwnerId);
            
            // Skip if gymOwnerId is null or invalid
            if (!gymOwnerId) {
              console.warn('Invalid or missing gymOwner ID for expiring subscription:', sub._id);
              continue;
            }
            
            const gymOwnerResponse = await authFetch(`/users/${gymOwnerId}`);
            const gymOwnerName = gymOwnerResponse.success ? 
              (gymOwnerResponse.data.user.gymName || gymOwnerResponse.data.user.name) : 
              'A gym';
            
            activities.push({
              id: `expiring-${sub._id}`,
              type: 'subscription',
              icon: <AlertCircle className="h-4 w-4 text-white" />,
              iconBg: 'bg-yellow-500',
              message: `${gymOwnerName}'s subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
              timestamp: endDate
            });
          }
        }
        
      } else if (userRole === 'gym-owner') {
        // 1. Get all members for this gym owner
        const membersResponse = await authFetch(`/users/gym-owner/${user._id}/members`);
        if (membersResponse.success || membersResponse.status === 'success') {
          const allMembers = membersResponse.data?.users || [];
          
          // Filter for members created in the last 30 days
          const recentMembers = allMembers
            .filter(member => new Date(member.createdAt) > thirtyDaysAgo)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 5);
          
          // Add each member as an activity
          recentMembers.forEach((member) => {
            activities.push({
              id: `member-${member._id}`,
              type: 'new_member',
              icon: <Users className="h-4 w-4 text-white" />,
              iconBg: 'bg-green-500',
              message: `New member joined: ${member.name}`,
              timestamp: new Date(member.createdAt)
            });
          });
        }
        
        // 2. Get all workout plans for this gym
        const workoutsResponse = await authFetch(`/workouts`);
        if (workoutsResponse.success || workoutsResponse.status === 'success') {
          const allWorkouts = workoutsResponse.data?.workouts || [];
          
          // Filter for workouts created in the last 30 days for this gym
          const recentWorkouts = allWorkouts
            .filter(workout => 
              workout.gym === user._id && 
              new Date(workout.createdAt) > thirtyDaysAgo
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          // Add each workout as an activity
          recentWorkouts.forEach((workout) => {
            activities.push({
              id: `workout-${workout._id}`,
              type: 'workout',
              icon: <Dumbbell className="h-4 w-4 text-white" />,
              iconBg: 'bg-blue-500',
              message: `New workout plan created: ${workout.title}`,
              timestamp: new Date(workout.createdAt)
            });
          });
        }
        
        // 3. Get subscription status
        if (subscription) {
          const endDate = new Date(subscription.endDate);
          const daysRemaining = Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24));
          
          if (daysRemaining <= 7 && daysRemaining > 0) {
            activities.push({
              id: 'subscription-expiring',
              type: 'subscription',
              icon: <AlertCircle className="h-4 w-4 text-white" />,
              iconBg: 'bg-yellow-500',
              message: `Your subscription expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`,
              timestamp: endDate
            });
          } else if (daysRemaining <= 0) {
            activities.push({
              id: 'subscription-expired',
              type: 'subscription',
              icon: <AlertCircle className="h-4 w-4 text-white" />,
              iconBg: 'bg-red-500',
              message: 'Your subscription has expired',
              timestamp: endDate
            });
          }
        }
        
      } else if (userRole === 'trainer') {
        // 1. Get assigned members
        const assignedMembersResponse = await authFetch(`/users/trainer/${user._id}/members`);
        if (assignedMembersResponse.success || assignedMembersResponse.status === 'success') {
          const assignedMembers = assignedMembersResponse.data?.members || [];
          
          // Filter for members created in the last 30 days
          const recentAssignedMembers = assignedMembers
            .filter(member => new Date(member.createdAt) > thirtyDaysAgo)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          recentAssignedMembers.forEach((member) => {
            activities.push({
              id: `assigned-member-${member._id}`,
              type: 'new_member',
              icon: <Users className="h-4 w-4 text-white" />,
              iconBg: 'bg-green-500',
              message: `New member assigned to you: ${member.name}`,
              timestamp: new Date(member.createdAt)
            });
          });
        }
        
        // 2. Get workout plans created by this trainer
        const workoutsResponse = await authFetch(`/workouts`);
        if (workoutsResponse.success || workoutsResponse.status === 'success') {
          const allWorkouts = workoutsResponse.data?.workouts || [];
          
          // Filter for workouts created by this trainer in the last 30 days
          const recentWorkouts = allWorkouts
            .filter(workout => 
              workout.trainer === user._id && 
              new Date(workout.createdAt) > thirtyDaysAgo
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          recentWorkouts.forEach((workout) => {
            activities.push({
              id: `workout-${workout._id}`,
              type: 'workout',
              icon: <Dumbbell className="h-4 w-4 text-white" />,
              iconBg: 'bg-blue-500',
              message: `You created workout plan: ${workout.title}`,
              timestamp: new Date(workout.createdAt)
            });
          });
        }
        
        // 3. Get diet plans created by this trainer
        const dietPlansResponse = await authFetch(`/diet-plans`);
        if (dietPlansResponse.success || dietPlansResponse.status === 'success') {
          const allDietPlans = dietPlansResponse.data?.dietPlans || [];
          
          // Filter for diet plans created by this trainer in the last 30 days
          const recentDietPlans = allDietPlans
            .filter(plan => 
              plan.trainer === user._id && 
              new Date(plan.createdAt) > thirtyDaysAgo
            )
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          recentDietPlans.forEach((plan) => {
            activities.push({
              id: `diet-${plan._id}`,
              type: 'diet',
              icon: <UtensilsCrossed className="h-4 w-4 text-white" />,
              iconBg: 'bg-orange-500',
              message: `You created diet plan: ${plan.title}`,
              timestamp: new Date(plan.createdAt)
            });
          });
        }
        
      } else if (userRole === 'member') {
        // 1. Get workout plans assigned to this member
        const workoutsResponse = await authFetch(`/workouts/member/${user._id}`);
        if (workoutsResponse.success || workoutsResponse.status === 'success') {
          const assignedWorkouts = workoutsResponse.data?.workouts || [];
          
          // Get the latest 3 workouts
          const recentWorkouts = assignedWorkouts
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          // Add trainer info to workout activities
          for (const workout of recentWorkouts) {
            let trainerName = 'Unknown Trainer';
            if (workout.createdBy) {
              try {
                // Handle case where createdBy might be an object or a string ID
                const createdById = extractId(workout.createdBy);
                
                // Skip if createdById is null or invalid
                if (!createdById) {
                  console.warn('Invalid or missing createdBy ID for workout:', workout._id);
                } else {
                  const trainerResponse = await authFetch(`/users/${createdById}`);
                  if (trainerResponse.success || trainerResponse.status === 'success') {
                    trainerName = trainerResponse.data?.user?.name || 'Unknown Trainer';
                  }
                }
              } catch (error) {
                console.log('Error fetching trainer info:', error);
              }
            }
            
            activities.push({
              id: `workout-${workout._id}`,
              type: 'workout',
              icon: <Dumbbell className="h-4 w-4 text-white" />,
              iconBg: 'bg-blue-500',
              message: `Workout plan "${workout.title}" assigned by trainer ${trainerName}`,
              timestamp: new Date(workout.createdAt)
            });
          }
        }
        
        // 2. Get diet plans assigned to this member
        const dietPlansResponse = await authFetch(`/diet-plans/member/${user._id}`);
        if (dietPlansResponse.success || dietPlansResponse.status === 'success') {
          const assignedDietPlans = dietPlansResponse.data?.dietPlans || [];
          
          // Get the latest 3 diet plans
          const recentDietPlans = assignedDietPlans
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          // Add trainer info to diet plan activities
          for (const plan of recentDietPlans) {
            let trainerName = 'Unknown Trainer';
            if (plan.createdBy) {
              try {
                // Handle case where createdBy might be an object or a string ID
                const createdById = extractId(plan.createdBy);
                
                // Skip if createdById is null or invalid
                if (!createdById) {
                  console.warn('Invalid or missing createdBy ID for diet plan:', plan._id);
                } else {
                  const trainerResponse = await authFetch(`/users/${createdById}`);
                  if (trainerResponse.success || trainerResponse.status === 'success') {
                    trainerName = trainerResponse.data?.user?.name || 'Unknown Trainer';
                  }
                }
              } catch (error) {
                console.log('Error fetching trainer info:', error);
              }
            }
            
            activities.push({
              id: `diet-${plan._id}`,
              type: 'diet',
              icon: <UtensilsCrossed className="h-4 w-4 text-white" />,
              iconBg: 'bg-orange-500',
              message: `Diet plan "${plan.title}" assigned by trainer ${trainerName}`,
              timestamp: new Date(plan.createdAt)
            });
          }
        }
        
        // 3. Get notifications for this member
        const notificationsResponse = await authFetch(`/notifications/user/${user._id}`);
        if (notificationsResponse.success || notificationsResponse.status === 'success') {
          const notifications = notificationsResponse.data?.notifications || [];
          
          // Get recent notifications
          const recentNotifications = notifications
            .filter(notification => new Date(notification.createdAt) > thirtyDaysAgo)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 3);
          
          recentNotifications.forEach((notification) => {
            activities.push({
              id: `notification-${notification._id}`,
              type: 'notification',
              icon: <MessageSquare className="h-4 w-4 text-white" />,
              iconBg: 'bg-purple-500',
              message: notification.message,
              timestamp: new Date(notification.createdAt)
            });
          });
        }
      }
      
      // Add user's own creation as an activity
      if (user && user.createdAt) {
        activities.push({
          id: `user-created-${user._id}`,
          type: 'account',
          icon: <User className="h-4 w-4 text-white" />,
          iconBg: 'bg-blue-500',
          message: `Your account was created`,
          timestamp: new Date(user.createdAt)
        });
      }
      
      // If no activities were found from API calls, add a fallback activity
      if (activities.length === 0) {
        activities.push({
          id: 'welcome',
          type: 'system',
          icon: <Settings className="h-4 w-4 text-white" />,
          iconBg: 'bg-blue-500',
          message: `Welcome to your dashboard, ${user.name}!`,
          timestamp: new Date()
        });
      }
      
      // Sort activities by timestamp (most recent first)
      activities.sort((a, b) => b.timestamp - a.timestamp);
      
      // Limit to 5 activities
      activities = activities.slice(0, 5);
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching recent activities:', error);
      
      // Fallback to a welcome message if there's an error
      const fallbackActivity = [{
        id: 'welcome',
        type: 'system',
        icon: <Settings className="h-4 w-4 text-white" />,
        iconBg: 'bg-blue-500',
        message: `Welcome to your dashboard, ${user?.name || 'User'}!`,
        timestamp: new Date()
      }];
      
      setRecentActivities(fallbackActivity);
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
      // Fetch trainer details to get gym name
      const trainerResponse = await authFetch(`/users/${user._id}`);
      if (trainerResponse.success || trainerResponse.status === 'success') {
        const trainerData = trainerResponse.data?.user;
        if (trainerData && trainerData.assignedGym) {
          // Fetch gym details to get the gym name
          const gymResponse = await authFetch(`/gyms/${trainerData.assignedGym}`);
          if (gymResponse.success || gymResponse.status === 'success') {
            setTrainerGymName(gymResponse.data?.gym?.name || 'Your Gym');
            // Removed console.log to reduce console clutter
          }
        }
      }
      
      // Fetch assigned members count
      console.log('Fetching assigned members for trainer:', user._id);
      const membersResponse = await authFetch(`/users/trainer/${user._id}/members`);
      console.log('Trainer members response:', membersResponse);
      if (membersResponse.success || membersResponse.status === 'success') {
        const count = membersResponse.data?.members?.length || 0;
        console.log('Assigned members count:', count);
        setAssignedMembersCount(count);
      }
      
      // Fetch workout plans count and data
      const workoutsResponse = await authFetch(`/workouts/trainer/${user._id}`);
      if (workoutsResponse.success || workoutsResponse.status === 'success') {
        const workouts = workoutsResponse.data?.workouts || [];
        setWorkoutPlansCount(workouts.length);
        setTrainerWorkoutPlans(workouts);
        
        // We've removed the excessive console logging to reduce console clutter
      }
      
      // Fetch diet plans count and data
      const dietPlansResponse = await authFetch(`/diet-plans/trainer/${user._id}`);
      if (dietPlansResponse.success || dietPlansResponse.status === 'success') {
        const dietPlans = dietPlansResponse.data?.dietPlans || [];
        setDietPlansCount(dietPlans.length);
        setTrainerDietPlans(dietPlans);
        
        // We've removed the excessive console logging to reduce console clutter
      }
      
      // For messages, we'll use placeholder values for now
      setMessagesSentCount(0); // Replace with actual API call when available
      
    } catch (error) {
      console.error('Error fetching trainer stats:', error);
    } finally {
      setIsTrainerStatsLoading(false);
    }
  };

  // We've removed the fetch functions for workout and diet plans as we're using dedicated pages

  // Fetch member-specific data
  const fetchMemberStats = async () => {
    if (!user || userRole !== 'member') {
      return;
    }
    
    try {
      // Fetch member details including health metrics and membership info
      const response = await authFetch(`/users/${user._id}/details`);
      
      if (response.success || response.status === 'success') {
        const memberData = response.data?.user || {};
        
        // Update user context with membership and health data
        const updatedUserData = { ...user };
        
        // Add membership data if available
        if (memberData.membership) {
          updatedUserData.membershipStatus = memberData.membership.status || 'Active';
          updatedUserData.membershipEndDate = memberData.membership.endDate;
          updatedUserData.membershipType = memberData.membership.type || 'Standard';
          
          // Calculate days remaining if end date exists
          if (memberData.membership.endDate) {
            const endDate = new Date(memberData.membership.endDate);
            const today = new Date();
            const diffTime = endDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Set days remaining (minimum 0)
            updatedUserData.membershipDaysRemaining = Math.max(0, diffDays);
            
            // Update status based on days remaining
            if (diffDays <= 0) {
              updatedUserData.membershipStatus = 'Expired';
            } else {
              updatedUserData.membershipStatus = 'Active';
            }
            
            console.log('Member stats updated:', {
              endDate: endDate.toLocaleDateString(),
              daysRemaining: updatedUserData.membershipDaysRemaining,
              status: updatedUserData.membershipStatus
            });
          } else {
            // Default values if no end date
            updatedUserData.membershipDaysRemaining = 0;
            updatedUserData.membershipStatus = 'Unknown';
          }
        }
        
        // Add health metrics if available
        if (memberData.healthMetrics) {
          updatedUserData.height = memberData.healthMetrics.height;
          updatedUserData.weight = memberData.healthMetrics.weight;
          updatedUserData.initialWeight = memberData.healthMetrics.initialWeight;
          updatedUserData.targetWeight = memberData.healthMetrics.targetWeight;
          updatedUserData.fitnessGoal = memberData.healthMetrics.fitnessGoal;
        }
        
        // If there's an assigned trainer, fetch trainer details
        if (user.assignedTrainer) {
          // Handle case where assignedTrainer might be an object or a string ID
          const trainerId = extractId(user.assignedTrainer);
          
          // Skip if trainerId is null or invalid
          if (!trainerId) {
            console.warn('Invalid or missing assignedTrainer ID for user:', user._id);
          } else {
            const trainerResponse = await authFetch(`/users/${trainerId}`);
            if (trainerResponse.success || trainerResponse.status === 'success') {
              updatedUserData.trainerName = trainerResponse.data?.user?.name || 'Unknown Trainer';
            }
          }
        }
      }
     } catch (error) {
        console.error('Error fetching member stats:', error);
      };

  // Add an event listener to refresh trainer stats when a member is assigned to a trainer
  useEffect(() => {
    // Only add the event listener if the user is a trainer
    if (user && userRole === 'trainer') {
      // Function to handle the event
      const handleMemberAssigned = () => {
        console.log('Member assignment changed, refreshing trainer stats');
        fetchTrainerStats();
      };
      
      // Add event listener for member assignment changes
      window.addEventListener('memberAssignmentChanged', handleMemberAssigned);
      
      // Clean up the event listener when the component unmounts
      return () => {
        window.removeEventListener('memberAssignmentChanged', handleMemberAssigned);
      };
    }
  }, [user, userRole]);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user) return;
      
      try {
        if (userRole === 'super-admin') {
          await fetchTotalRevenue();
          await fetchNewGymOwnersCount();
        } else if (userRole === 'trainer') {
          await fetchTrainerStats();
        } else if (userRole === 'member') {
          // For members, calculate membership data directly
          // This ensures we have accurate information even if API calls fail
          if (user.membershipEndDate) {
            const endDate = new Date(user.membershipEndDate);
            const today = new Date();
            const diffTime = endDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            // Update user with calculated values if they're different
            if (!user.membershipDaysRemaining || user.membershipDaysRemaining !== Math.max(0, diffDays)) {
              const updatedUser = {
                ...user,
                membershipDaysRemaining: Math.max(0, diffDays),
                membershipStatus: diffDays > 0 ? 'Active' : 'Expired'
              };
              
              // Update user in context
              updateCurrentUser(updatedUser);
            }
          }
          
          // Try to fetch additional member data, but don't fail if it doesn't work
          try {
            await fetchMemberStats();
          } catch (error) {
            console.log('Could not fetch member stats, using calculated data instead');
          }
        }
        
        // Try to fetch activities, but don't fail if it doesn't work
        try {
          await fetchRecentActivities();
        } catch (error) {
          console.log('Could not fetch recent activities');
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };
    
    loadDashboardData();
  }, [user, userRole, location.pathname, updateCurrentUser]);

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
              color: "bg-purple-500",
              onClick: () => navigate("/gym-owner-plans")
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
            label: "Attendance", 
            value: isTrainerStatsLoading ? <LoadingIndicator /> : messagesSentCount.toString(), 
            icon: MessageSquare, 
            color: "bg-orange-500" 
          }
        ];
      case 'member':
        // Calculate days active based on user creation date
        const creationDate = user?.createdAt ? new Date(user.createdAt) : new Date();
        const currentDate = new Date();
        const daysActive = Math.floor((currentDate - creationDate) / (1000 * 60 * 60 * 24));
        
        // Get subscription data if available
        const membershipStatus = user?.membershipStatus || 'Active';
        const membershipEndDate = user?.membershipEndDate ? new Date(user?.membershipEndDate) : null;
        const daysRemaining = membershipEndDate ? 
          Math.max(0, Math.floor((membershipEndDate - currentDate) / (1000 * 60 * 60 * 24))) : 
          null;
        
        // Calculate weight progress if available
        let weightProgress = null;
        if (user?.weight && user?.initialWeight) {
          const weightDiff = parseFloat(user.weight) - parseFloat(user.initialWeight);
          weightProgress = `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)}kg`;
        }
        
        return [
          { 
            label: "Days Active", 
            value: daysActive.toString(), 
            icon: Calendar, 
            color: "bg-blue-500" 
          },
          { 
            label: "Membership Status", 
            value: (
              <div className="flex flex-col">
                <span className={membershipStatus === 'Active' ? "text-green-400" : "text-red-400"}>
                  {membershipStatus}
                </span>
                {daysRemaining !== null && (
                  <span className="text-xs text-gray-400">
                    {daysRemaining} days left
                  </span>
                )}
              </div>
            ), 
            icon: CreditCard, 
            color: "bg-green-500" 
          },
          { 
            label: "Weight Progress", 
            value: weightProgress || "Not set", 
            icon: Target, 
            color: "bg-purple-500",
            onClick: () => navigate("/profile")
          },
          { 
            label: "Fitness Goal", 
            value: user?.fitnessGoal || "General Fitness", 
            icon: TrendingUp, 
            color: "bg-orange-500",
            onClick: () => navigate("/profile")
          }
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
      navigate("/billing-plans");
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
          { label: "Manage Billing", icon: CreditCard, action: () => navigate("/billing-plans") },
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
              action: () => navigate("/gym-owner-plans") 
            }
          ];
        }
      case 'trainer':
        return [
          { label: "Create Workout", icon: Dumbbell, action: () => navigate("/workouts") },
          { label: "Create Diet Plan", icon: UtensilsCrossed, action: () => navigate("/diet-plans") },
                    { label: "View Members", icon: Users, action: () => navigate("/my-members") }
        ];
      case 'member':
        return [
          { label: "Today's Workout", icon: Dumbbell, action: () => navigate("/workouts") },
          { label: "Diet Plan", icon: UtensilsCrossed, action: () => navigate("/diet-plans") },
          { label: "My Profile", icon: User, action: () => navigate("/profile") },
          { label: "Track Progress", icon: Target, action: () => navigate("/profile") }
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
            <div className="flex flex-col items-center gap-2">
              <Badge variant="secondary" className="text-lg px-4 py-2">
                {userRole.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Badge>
              
              {/* Display gym name for trainers */}
              {userRole === 'trainer' && trainerGymName && (
                <div className="text-blue-400 font-medium">
                  <span className="text-gray-400">Gym:</span> {trainerGymName}
                </div>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card 
                key={index} 
                className={`bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 hover:scale-105 ${stat.onClick ? 'cursor-pointer' : ''}`}
                onClick={stat.onClick}
              >
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

          {/* Workout Plans Section for Trainers */}
          {userRole === 'trainer' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">My Workout Plans</CardTitle>
                  <CardDescription className="text-gray-400">
                    Workout plans you've created
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={fetchTrainerStats}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isTrainerStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingIndicator />
                  </div>
                ) : trainerWorkoutPlans.length > 0 ? (
                  <div className="space-y-4">
                    {trainerWorkoutPlans.slice(0, 3).map(workout => (
                      <div key={workout._id} className="flex items-start space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                        <div className="p-2 bg-blue-500 rounded-full">
                          <Dumbbell className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-white font-medium">{workout.name}</p>
                            <Badge variant="outline" className="ml-2">
                              {workout.level || 'All Levels'}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            {workout.exercises?.length || 0} exercises
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Created: {new Date(workout.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No workout plans found</p>
                  </div>
                )}
                
                {trainerWorkoutPlans.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button 
                      variant="ghost" 
                      className="w-full text-blue-400 hover:text-blue-300 hover:bg-gray-700/50"
                      onClick={() => navigate('/workouts')}
                    >
                      View All Workout Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Diet Plans Section for Trainers */}
          {userRole === 'trainer' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">My Diet Plans</CardTitle>
                  <CardDescription className="text-gray-400">
                    Diet plans you've created
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={fetchTrainerStats}
                >
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {isTrainerStatsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingIndicator />
                  </div>
                ) : trainerDietPlans.length > 0 ? (
                  <div className="space-y-4">
                    {trainerDietPlans.slice(0, 3).map(plan => (
                      <div key={plan._id} className="flex items-start space-x-4 p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition-colors">
                        <div className="p-2 bg-orange-500 rounded-full">
                          <UtensilsCrossed className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <p className="text-white font-medium">{plan.name}</p>
                            <Badge variant="outline" className="ml-2">
                              {plan.goalType || 'General'}
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-xs mt-1">
                            {plan.totalCalories} calories | {plan.meals?.length || 0} meals
                          </p>
                          <p className="text-gray-400 text-xs mt-1">
                            Created: {new Date(plan.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <p>No diet plans found</p>
                  </div>
                )}
                
                {trainerDietPlans.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-700">
                    <Button 
                      variant="ghost" 
                      className="w-full text-blue-400 hover:text-blue-300 hover:bg-gray-700/50"
                      onClick={() => navigate('/diet-plans')}
                    >
                      View All Diet Plans
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Links to Workout and Diet Plans for Gym Owners */}
          {userRole === 'gym-owner' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Trainer Resources</CardTitle>
                <CardDescription className="text-gray-400">
                  View workout and diet plans created by your trainers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 border-gray-600 hover:bg-gray-700 text-white hover:text-white"
                    onClick={() => navigate('/workouts')}
                  >
                    <Dumbbell className="h-6 w-6 text-blue-400" />
                    <span className="text-sm">View Workout Plans</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="h-20 flex-col space-y-2 border-gray-600 hover:bg-gray-700 text-white hover:text-white"
                    onClick={() => navigate('/diet-plans')}
                  >
                    <UtensilsCrossed className="h-6 w-6 text-orange-400" />
                    <span className="text-sm">View Diet Plans</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Generator for Gym Owners */}
          {userRole === 'gym-owner' && user && (
            <QRCodeGenerator 
              gymOwnerId={user._id} 
              gymName={user.gymName || user.name + "'s Gym"} 
            />
          )}
          
          {/* Member Membership Status - Only shown for members */}
          {userRole === 'member' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">My Membership</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your current membership status
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  className="text-gray-300 hover:text-white hover:bg-gray-700"
                  onClick={() => navigate('/profile')}
                >
                  <User className="h-4 w-4 mr-2" />
                  View Profile
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Membership Status */}
                  <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">Membership Status</h3>
                      <Badge 
                        className={
                          user?.membershipStatus === 'Active' 
                            ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50" 
                            : "bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50"
                        }
                      >
                        {user?.membershipStatus || 'Unknown'}
                      </Badge>
                    </div>
                    
                    {/* Membership End Date */}
                    <div className="flex justify-between items-center text-sm mb-3">
                      <span className="text-gray-400">End Date:</span>
                      <span className="text-white">
                        {user?.membershipEndDate 
                          ? new Date(user.membershipEndDate).toLocaleDateString() 
                          : 'Not specified'}
                      </span>
                    </div>
                    
                    {/* Days Remaining */}
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-gray-300">Days Remaining</span>
                        <span className={
                          (user?.membershipDaysRemaining > 0 || 
                           (user?.membershipEndDate && new Date(user.membershipEndDate) > new Date())) 
                            ? "text-green-400" 
                            : "text-red-400"
                        }>
                          {(() => {
                            // Calculate days remaining if not already set
                            if (user?.membershipDaysRemaining !== undefined) {
                              return `${user.membershipDaysRemaining} days`;
                            } else if (user?.membershipEndDate) {
                              const endDate = new Date(user.membershipEndDate);
                              const today = new Date();
                              const diffTime = endDate - today;
                              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                              return `${Math.max(0, diffDays)} days`;
                            } else {
                              return 'Unknown';
                            }
                          })()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2.5">
                        <div 
                          className={(() => {
                            const daysRemaining = user?.membershipDaysRemaining !== undefined 
                              ? user.membershipDaysRemaining 
                              : user?.membershipEndDate 
                                ? Math.max(0, Math.ceil((new Date(user.membershipEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
                                : 0;
                                
                            if (daysRemaining > 30) return "bg-green-500 h-2.5 rounded-full";
                            if (daysRemaining > 7) return "bg-yellow-500 h-2.5 rounded-full";
                            return "bg-red-500 h-2.5 rounded-full";
                          })()}
                          style={{ 
                            width: `${(() => {
                              const daysRemaining = user?.membershipDaysRemaining !== undefined 
                                ? user.membershipDaysRemaining 
                                : user?.membershipEndDate 
                                  ? Math.max(0, Math.ceil((new Date(user.membershipEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
                                  : 0;
                              return Math.min(100, (daysRemaining / 90) * 100);
                            })()}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Renew Button */}
                    {(() => {
                      // Calculate days remaining if not already set
                      const daysRemaining = user?.membershipDaysRemaining !== undefined 
                        ? user.membershipDaysRemaining 
                        : user?.membershipEndDate 
                          ? Math.max(0, Math.ceil((new Date(user.membershipEndDate) - new Date()) / (1000 * 60 * 60 * 24)))
                          : 0;
                          
                      if (daysRemaining < 30) {
                        return (
                          <Button 
                            className="w-full mt-4 bg-blue-600 hover:bg-blue-700"
                            onClick={() => navigate('/billing-plans')}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Renew Membership
                          </Button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* QR Code Scanner for Members */}
          {userRole === 'member' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Scan className="h-5 w-5 mr-2" />
                  Join a Gym
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Scan a gym's QR code to join their membership
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showQRScanner ? (
                  <div className="text-center py-6">
                    <Scan className="h-12 w-12 text-blue-400 mx-auto mb-4" />
                    <p className="text-gray-300 mb-4">
                      Use your camera to scan a gym's QR code and join their membership program.
                    </p>
                    <Button
                      onClick={() => setShowQRScanner(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Start QR Scanner
                    </Button>
                  </div>
                ) : (
                  <QRCodeScanner
                    onScanSuccess={(data) => {
                      console.log('QR Code scanned:', data);
                      toast.success(`Scanned gym: ${data.gymName}`);
                      // Handle the scanned data here
                    }}
                    onClose={() => setShowQRScanner(false)}
                  />
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Member Workout Progress - Only shown for members */}
          {userRole === 'member' && (
            <Card className="bg-gray-800/50 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white">My Fitness Progress</CardTitle>
                  <CardDescription className="text-gray-400">
                    Track your fitness journey
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  onClick={() => navigate('/profile')}
                >
                  Update Metrics
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-medium">Current Weight</h3>
                        <Target className="h-5 w-5 text-blue-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {user?.weight ? `${user.weight} kg` : 'Not set'}
                      </p>
                      {user?.initialWeight && user?.weight && (
                        <p className="text-sm text-gray-400 mt-1">
                          Initial: {user.initialWeight} kg
                          <span className={parseFloat(user.weight) < parseFloat(user.initialWeight) ? 'text-green-400 ml-2' : 'text-red-400 ml-2'}>
                            {parseFloat(user.weight) < parseFloat(user.initialWeight) ? '↓' : '↑'} 
                            {Math.abs(parseFloat(user.weight) - parseFloat(user.initialWeight)).toFixed(1)} kg
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-medium">Target Weight</h3>
                        <TrendingUp className="h-5 w-5 text-green-400" />
                      </div>
                      <p className="text-2xl font-bold text-white">
                        {user?.targetWeight ? `${user.targetWeight} kg` : 'Not set'}
                      </p>
                      {user?.weight && user?.targetWeight && (
                        <p className="text-sm text-gray-400 mt-1">
                          Remaining: 
                          <span className="text-blue-400 ml-2">
                            {Math.abs(parseFloat(user.weight) - parseFloat(user.targetWeight)).toFixed(1)} kg
                          </span>
                        </p>
                      )}
                    </div>
                    
                    <div className="bg-gray-700/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-white font-medium">Fitness Goal</h3>
                        <Dumbbell className="h-5 w-5 text-purple-400" />
                      </div>
                      <p className="text-xl font-bold text-white">
                        {user?.fitnessGoal || 'General Fitness'}
                      </p>
                      <Button 
                        variant="link" 
                        className="text-blue-400 p-0 h-auto mt-1"
                        onClick={() => navigate('/profile')}
                      >
                        Update Goal
                      </Button>
                    </div>
                  </div>
                  
                  {/* Membership Status */}
                  <div className="bg-gray-700/30 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-white font-medium mb-1">Membership Status</h3>
                        <p className={`text-sm ${user?.membershipStatus === 'Active' ? 'text-green-400' : 'text-red-400'}`}>
                          {user?.membershipStatus || 'Active'}
                        </p>
                      </div>
                      
                      {user?.membershipEndDate && (
                        <div className="text-right">
                          <p className="text-white font-medium mb-1">Expires On</p>
                          <p className="text-sm text-gray-300">
                            {new Date(user.membershipEndDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Assigned Trainer */}
                  {user?.assignedTrainer && (
                    <div className="bg-gray-700/30 p-4 rounded-lg">
                      <h3 className="text-white font-medium mb-2">Your Trainer</h3>
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarFallback className="bg-blue-600">
                            {user?.trainerName?.charAt(0) || 'T'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-white">{user?.trainerName || 'Assigned Trainer'}</p>
                          <p className="text-sm text-gray-400">Personal Trainer</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

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
}
};

export default Index;