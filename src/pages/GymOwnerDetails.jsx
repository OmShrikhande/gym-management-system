import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { extractId } from "@/utils/idUtils";
import { 
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail, 
  Calendar, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft,
  Clock
} from "lucide-react";
import GymEntryButton from "@/components/shared/GymEntryButton";

const GymOwnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authFetch, isSuperAdmin } = useAuth();
  const [gymOwner, setGymOwner] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGymOwnerDetails = async () => {
      setLoading(true);
      try {
        // Debug: Log the id parameter to see what's being passed
        console.log('GymOwnerDetails - ID parameter:', id, 'Type:', typeof id);
        
        // Ensure id is a string and not an object
        const userId = extractId(id);
        console.log('GymOwnerDetails - Processed userId:', userId);
        
        // Fetch gym owner details
        const userResponse = await authFetch(`/users/${userId}`);
        if (userResponse.success || userResponse.status === 'success') {
          setGymOwner(userResponse.data.user);
        } else {
          throw new Error(userResponse.message || 'Failed to fetch gym owner details');
        }
        
        // Fetch subscription details
        try {
          const subscriptionResponse = await authFetch(`/subscriptions/gym-owner/${userId}`);
          if (subscriptionResponse.success || subscriptionResponse.status === 'success') {
            setSubscription(subscriptionResponse.data.subscription);
          }
        } catch (subError) {
          console.log('No subscription found for this gym owner');
        }
        
        // Fetch members associated with this gym owner
        try {
          const membersResponse = await authFetch(`/users/gym-owner/${userId}/members`);
          if (membersResponse.success || membersResponse.status === 'success') {
            setMembers(membersResponse.data.users);
          }
        } catch (membersError) {
          console.log('Error fetching members');
        }
      } catch (err) {
        console.error('Error fetching gym owner details:', err);
        setError('Failed to load gym owner details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchGymOwnerDetails();
    }
  }, [id, authFetch]);

  const handleGoBack = () => {
    navigate('/gym-management');
  };

  // Calculate subscription status and days remaining
  const getSubscriptionStatus = () => {
    if (!subscription) return { status: 'No Subscription', daysRemaining: 0, isActive: false };
    
    const today = new Date();
    const endDate = new Date(subscription.endDate);
    const daysRemaining = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      status: subscription.paymentStatus,
      daysRemaining: Math.max(0, daysRemaining),
      isActive: subscription.isActive && daysRemaining > 0
    };
  };

  const subscriptionInfo = getSubscriptionStatus();

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading gym owner details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !gymOwner) {
    return (
      <DashboardLayout>
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-400 mb-4">{error || 'Gym owner not found'}</p>
          <Button onClick={handleGoBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Gym Management
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGoBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <GymEntryButton 
                size="sm" 
                variant="outline"
                className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
              />
            </div>
            <h1 className="text-3xl font-bold text-white">{gymOwner.gymName || `${gymOwner.name}'s Gym`}</h1>
            <p className="text-gray-400 mt-1">Gym Owner Details</p>
          </div>
          
          {/* Subscription Status Badge */}
          <div className={`px-4 py-2 rounded-lg ${
            subscriptionInfo.isActive 
              ? 'bg-green-900/30 border border-green-800' 
              : 'bg-red-900/30 border border-red-800'
          }`}>
            <div className="flex items-center">
              {subscriptionInfo.isActive 
                ? <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" /> 
                : <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              }
              <div>
                <p className="font-medium text-white">
                  {subscriptionInfo.isActive ? 'Active Subscription' : 'Inactive Subscription'}
                </p>
                {subscription && (
                  <p className="text-sm text-gray-400">
                    {subscriptionInfo.isActive 
                      ? `${subscriptionInfo.daysRemaining} days remaining` 
                      : 'Subscription expired'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Gym Owner Info */}
          <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Owner Information</CardTitle>
              <CardDescription className="text-gray-400">Personal and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-gray-300">
                <Building2 className="mr-3 h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Gym Name</p>
                  <p>{gymOwner.gymName || `${gymOwner.name}'s Gym`}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-300">
                <Users className="mr-3 h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Owner Name</p>
                  <p>{gymOwner.name}</p>
                </div>
              </div>
              
              <div className="flex items-center text-gray-300">
                <Mail className="mr-3 h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p>{gymOwner.email}</p>
                </div>
              </div>
              
              {gymOwner.phone && (
                <div className="flex items-center text-gray-300">
                  <Phone className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p>{gymOwner.phone}</p>
                  </div>
                </div>
              )}
              
              {gymOwner.whatsapp && (
                <div className="flex items-center text-gray-300">
                  <MessageSquare className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">WhatsApp</p>
                    <p>{gymOwner.whatsapp}</p>
                  </div>
                </div>
              )}
              
              {gymOwner.address && (
                <div className="flex items-center text-gray-300">
                  <MapPin className="mr-3 h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Address</p>
                    <p>{gymOwner.address}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-gray-300">
                <Calendar className="mr-3 h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm text-gray-500">Joined On</p>
                  <p>{formatDate(gymOwner.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Middle column - Subscription Details */}
          <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Subscription Details</CardTitle>
              <CardDescription className="text-gray-400">Current plan and payment status</CardDescription>
            </CardHeader>
            <CardContent>
              {subscription ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600">
                    <h3 className="font-bold text-lg text-white mb-1">{subscription.plan} Plan</h3>
                    <p className="text-2xl font-bold text-blue-400">${subscription.price}<span className="text-sm text-gray-400 font-normal">/month</span></p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-gray-300">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Start Date</span>
                      </div>
                      <span>{formatDate(subscription.startDate)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-gray-300">
                      <div className="flex items-center">
                        <Clock className="mr-2 h-4 w-4 text-gray-500" />
                        <span>End Date</span>
                      </div>
                      <span>{formatDate(subscription.endDate)}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-gray-300">
                      <div className="flex items-center">
                        <CreditCard className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Payment Status</span>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        subscription.paymentStatus === 'Paid' 
                          ? 'bg-green-900/50 text-green-400 border border-green-800' 
                          : subscription.paymentStatus === 'Pending'
                            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-800'
                            : 'bg-red-900/50 text-red-400 border border-red-800'
                      }`}>
                        {subscription.paymentStatus}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-gray-300">
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-2 h-4 w-4 text-gray-500" />
                        <span>Auto Renew</span>
                      </div>
                      <span>{subscription.autoRenew ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 bg-gray-700/30 rounded-lg border border-gray-700">
                  <AlertCircle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-medium text-white mb-1">No Active Subscription</h3>
                  <p className="text-gray-400 text-sm">This gym owner doesn't have an active subscription plan.</p>
                </div>
              )}
            </CardContent>
            {subscription && subscription.paymentHistory && subscription.paymentHistory.length > 0 && (
              <CardFooter className="border-t border-gray-700 pt-4 flex flex-col items-start">
                <h4 className="font-medium text-white mb-2">Recent Payments</h4>
                <div className="w-full space-y-2">
                  {subscription.paymentHistory.slice(0, 3).map((payment, index) => (
                    <div key={index} className="flex justify-between items-center text-sm p-2 rounded bg-gray-700/30">
                      <span className="text-gray-400">{formatDate(payment.date)}</span>
                      <div className="flex items-center">
                        <span className="text-white font-medium mr-2">${payment.amount}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs ${
                          payment.status === 'Success' 
                            ? 'bg-green-900/50 text-green-400 border border-green-800' 
                            : 'bg-red-900/50 text-red-400 border border-red-800'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardFooter>
            )}
          </Card>

          {/* Right column - Member Stats */}
          <Card className="lg:col-span-1 bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Member Statistics</CardTitle>
              <CardDescription className="text-gray-400">Overview of gym members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-gray-700/50 border border-gray-600 text-center">
                  <h3 className="text-sm font-medium text-gray-400 mb-1">Total Members</h3>
                  <p className="text-3xl font-bold text-white">{members.length}</p>
                </div>
                
                {members.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-white">Recent Members</h4>
                    {members.slice(0, 5).map(member => (
                      <div key={member._id} className="flex items-center justify-between p-2 rounded bg-gray-700/30">
                        <div>
                          <p className="font-medium text-white">{member.name}</p>
                          <p className="text-xs text-gray-400">{member.email}</p>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-4 bg-gray-700/30 rounded-lg">
                    <p className="text-gray-400">No members found for this gym.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t border-gray-700 pt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(`/gym-owner/${id}/members`)}
                disabled={members.length === 0}
              >
                View All Members
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GymOwnerDetails;