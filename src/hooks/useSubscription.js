import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authFetch, user } = useAuth();

  const fetchSubscription = async (userId = null) => {
    try {
      setLoading(true);
      setError(null);
      
      const targetUserId = userId || user?._id;
      if (!targetUserId) {
        throw new Error('User ID not found');
      }

      const response = await authFetch(`/api/subscriptions/user/${targetUserId}`);
      
      if (response.success || response.status === 'success') {
        setSubscription(response.data);
      } else if (response.status === 'error' && response.message === 'No subscription found') {
        setSubscription(null);
      } else {
        throw new Error(response.message || 'Failed to fetch subscription');
      }
    } catch (err) {
      setError(err.message);
      console.error('Failed to fetch subscription:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const createSubscription = async (subscriptionData) => {
    try {
      const response = await authFetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (response.success || response.status === 'success') {
        const newSubscription = response.data.subscription;
        setSubscription(newSubscription);
        toast.success('Subscription created successfully!');
        return newSubscription;
      } else {
        throw new Error(response.message || 'Failed to create subscription');
      }
    } catch (err) {
      toast.error(`Failed to create subscription: ${err.message}`);
      throw err;
    }
  };

  const renewSubscription = async (subscriptionId, renewalData) => {
    try {
      const response = await authFetch(`/api/subscriptions/${subscriptionId}/renew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(renewalData),
      });

      if (response.success || response.status === 'success') {
        const renewedSubscription = response.data;
        setSubscription(renewedSubscription);
        toast.success('Subscription renewed successfully!');
        return renewedSubscription;
      } else {
        throw new Error(response.message || 'Failed to renew subscription');
      }
    } catch (err) {
      toast.error(`Failed to renew subscription: ${err.message}`);
      throw err;
    }
  };

  const cancelSubscription = async (subscriptionId) => {
    try {
      const response = await authFetch(`/api/subscriptions/${subscriptionId}/cancel`, {
        method: 'PUT',
      });

      if (response.success || response.status === 'success') {
        const cancelledSubscription = response.data;
        setSubscription(cancelledSubscription);
        toast.success('Subscription cancelled successfully!');
        return cancelledSubscription;
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (err) {
      toast.error(`Failed to cancel subscription: ${err.message}`);
      throw err;
    }
  };

  const checkSubscriptionStatus = (userId = null, forceRefresh = false) => {
    if (forceRefresh || !subscription) {
      fetchSubscription(userId);
    }
    return subscription;
  };

  const isSubscriptionActive = () => {
    if (!subscription) return false;
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    return subscription.isActive && 
           subscription.paymentStatus === 'Paid' && 
           endDate > now;
  };

  const getSubscriptionDaysRemaining = () => {
    if (!subscription || !isSubscriptionActive()) return 0;
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'none';
    
    if (!subscription.isActive) return 'cancelled';
    if (subscription.paymentStatus !== 'Paid') return 'payment_pending';
    
    const daysRemaining = getSubscriptionDaysRemaining();
    if (daysRemaining <= 0) return 'expired';
    if (daysRemaining <= 7) return 'expiring_soon';
    
    return 'active';
  };

  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user]);

  return {
    subscription,
    loading,
    error,
    fetchSubscription,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    checkSubscriptionStatus,
    isSubscriptionActive,
    getSubscriptionDaysRemaining,
    getSubscriptionStatus,
    refetch: fetchSubscription
  };
};