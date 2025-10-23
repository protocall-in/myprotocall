import React, { createContext, useState, useEffect, useCallback } from 'react';
import { User, Subscription, AdvisorSubscription, SubscriptionPlan } from '@/api/entities';

export const SubscriptionContext = createContext(null);

export function SubscriptionProvider({ children }) {
  const [subscription, setSubscription] = useState(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  const loadSubscription = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      
      // Check if already aborted
      if (signal?.aborted) {
        return;
      }

      const currentUser = await User.me().catch(() => null);
      
      // Check again after async operation
      if (signal?.aborted) {
        return;
      }
      
      setUser(currentUser);

      // Load all plans first
      const plans = await SubscriptionPlan.list().catch(() => []);
      
      if (signal?.aborted) {
        return;
      }
      
      setAllPlans(plans);

      if (!currentUser) {
        setSubscription(null);
        setSubscriptionPlan(null);
        setIsLoading(false);
        return;
      }

      // Admins and Super Admins bypass subscription checks
      if (['admin', 'super_admin'].includes(currentUser.app_role)) {
        console.log('🔓 Admin user detected - access control handled by individual functions.');
      }

      const userSubs = await Subscription.filter(
        { user_id: currentUser.id, status: 'active' },
        '-created_date',
        1
      ).catch(() => []);

      if (signal?.aborted) {
        return;
      }

      if (userSubs.length > 0) {
        const activeSub = userSubs[0];
        setSubscription(activeSub);

        // Find the subscription plan
        const plan = plans.find(p =>
          p.name.toLowerCase() === activeSub.plan_type.toLowerCase() ||
          p.name.toLowerCase().replace(/\s+/g, '_') === activeSub.plan_type.toLowerCase()
        );

        setSubscriptionPlan(plan || null);
      } else {
        setSubscription(null);
        setSubscriptionPlan(null);
      }
    } catch (error) {
      // Only log if it's not an abort error
      if (error.name !== 'AbortError' && !error.message?.includes('aborted') && !signal?.aborted) {
        console.error('Error loading subscription:', error);
      }
      
      // Don't update state if aborted
      if (!signal?.aborted) {
        setSubscription(null);
        setSubscriptionPlan(null);
        setAllPlans([]);
        setUser(null);
      }
    } finally {
      // Only update loading state if not aborted
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    loadSubscription(abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [loadSubscription]);

  // Helper function to get all features including inherited ones
  const getAllFeatures = useCallback((plan) => {
    if (!plan) return [];

    const features = [...(plan.features || [])];

    // If plan inherits from another, recursively get parent features
    if (plan.inherits_from_plan_id) {
      const parentPlan = allPlans.find(p => p.id === plan.inherits_from_plan_id);
      if (parentPlan) {
        const parentFeatures = getAllFeatures(parentPlan);
        features.push(...parentFeatures);
      }
    }

    // Remove duplicates
    return [...new Set(features)];
  }, [allPlans]);

  const hasAccess = useCallback((requiredFeature) => {
    // Admins and super_admins have full access
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      return true;
    }

    if (isLoading || !subscription || !subscriptionPlan) return false;

    // Get all features including inherited ones
    const allFeatures = getAllFeatures(subscriptionPlan);

    return allFeatures.includes(requiredFeature);
  }, [isLoading, subscription, subscriptionPlan, user, getAllFeatures]);

  const hasPremiumAccess = useCallback(() => {
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      return true;
    }
    return subscription?.plan_type === 'premium' || subscription?.plan_type === 'vip';
  }, [subscription, user]);

  const hasVipAccess = useCallback(() => {
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      return true;
    }
    return subscription?.plan_type === 'vip';
  }, [subscription, user]);

  const hasAdvisorSubscription = useCallback((advisorId) => {
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      return true;
    }
    return hasAccess('advisor_subscriptions');
  }, [hasAccess, user]);

  const checkAccess = useCallback((requiredFeature) => {
    if (user && ['admin', 'super_admin'].includes(user.app_role)) {
      return true;
    }

    if (isLoading || !subscription || !subscriptionPlan) return false;

    const allFeatures = getAllFeatures(subscriptionPlan);

    return allFeatures.includes(requiredFeature);
  }, [isLoading, subscription, subscriptionPlan, user, getAllFeatures]);

  const refreshSubscription = useCallback(() => {
    const abortController = new AbortController();
    loadSubscription(abortController.signal);
    
    // Return cleanup function
    return () => abortController.abort();
  }, [loadSubscription]);

  const value = {
    subscription,
    subscriptionPlan,
    isLoading,
    hasAccess,
    hasPremiumAccess,
    hasVipAccess,
    hasAdvisorSubscription,
    checkAccess,
    refreshSubscription,
    isSubscribed: !!subscription,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}