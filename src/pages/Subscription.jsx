
import React, { useState, useEffect } from "react";
import { User, Subscription as SubEntity, SubscriptionPlan } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  Star, 
  Check, 
  Shield, 
  TrendingUp, 
  MessageSquare,
  BarChart3,
  Users,
  Target,
  Zap,
  AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import PlanCard from "../components/subscription/PlanCard";
import CurrentPlan from "../components/subscription/CurrentPlan";
import PaymentModal from "../components/subscription/PaymentModal";
import { FeatureConfigProvider } from "../components/context/FeatureConfigProvider";

export default function Subscription() {
  const [user, setUser] = useState(null);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [plans, setPlans] = useState([]); // Changed from hardcoded to state
  const [isLoading, setIsLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Default plans to create if none exist (fallback only)
  const defaultPlans = [
    {
      name: 'Basic',
      description: 'Perfect for getting started with retail trading community',
      price_monthly: 0,
      price_annually: 0,
      is_active: true,
      is_system_plan: true,
      features: [
        'general_chat_access',
        'basic_stock_discussions',
        'community_polls_participation',
        'market_overview_access',
        'basic_trading_tips'
      ]
    },
    {
      name: 'Premium',
      description: 'Advanced features for serious retail traders',
      price_monthly: 999,
      price_annually: 9999,
      is_active: true,
      is_system_plan: true,
      inherits_from_plan_id: null, // Will be set after Basic is created
      features: [
        'premium_chat_rooms',
        'premium_polls',
        'premium_events',
        'admin_recommendations',
        'advisor_subscriptions',
        'exclusive_finfluencer_content',
        'pledge_participation',
        'advanced_analytics',
        'priority_support',
        'webinar_access',
        'portfolio_tools'
      ]
    },
    {
      name: 'VIP Elite',
      description: 'Ultimate package for professional retail traders',
      price_monthly: 2499,
      price_annually: 24999,
      is_active: true,
      is_system_plan: true,
      inherits_from_plan_id: null, // Will be set after Premium is created
      features: [
        'one_on_one_consultation',
        'personalized_stock_picks',
        'advanced_pledge_analytics',
        'risk_management_tools',
        'market_insider_insights',
        'one_on_one_trading_sessions',
        'custom_alerts',
        'research_reports',
        'whatsapp_support'
      ]
    }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user and subscription
      const currentUser = await User.me();
      const userSubs = await SubEntity.filter({ user_id: currentUser.id, status: 'active' }, '-created_date', 1);
      
      // Fetch subscription plans from database
      let fetchedPlans = await SubscriptionPlan.list();
      
      // If no plans exist, create default ones (first-time setup)
      if (fetchedPlans.length === 0) {
        console.log('No subscription plans found, creating default plans...');
        
        // Create Basic first
        const basicPlan = await SubscriptionPlan.create(defaultPlans[0]);
        
        // Create Premium with inheritance from Basic
        const premiumPlanData = { ...defaultPlans[1], inherits_from_plan_id: basicPlan.id };
        const premiumPlan = await SubscriptionPlan.create(premiumPlanData);
        
        // Create VIP with inheritance from Premium
        const vipPlanData = { ...defaultPlans[2], inherits_from_plan_id: premiumPlan.id };
        await SubscriptionPlan.create(vipPlanData);
        
        fetchedPlans = await SubscriptionPlan.list();
      }
      
      // Filter only active plans and sort by price
      const activePlans = fetchedPlans
        .filter(plan => plan.is_active)
        .sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0));
      
      setUser(currentUser);
      setCurrentSubscription(userSubs[0] || null);
      setPlans(activePlans);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      toast.error('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    // For free plans (price 0), directly subscribe
    if ((plan.price_monthly || 0) === 0) {
      handleSubscribe(plan);
    } else {
      setSelectedPlan(plan);
      setShowPaymentModal(true);
    }
  };

  const handleSubscribe = async (plan, paymentData = null) => {
    try {
      // Determine plan_type based on plan name (for backward compatibility)
      let planType = 'basic';
      if (plan.name.toLowerCase().includes('vip') || plan.name.toLowerCase().includes('elite')) {
        planType = 'vip';
      } else if (plan.name.toLowerCase().includes('premium')) {
        planType = 'premium';
      }

      const subscriptionData = {
        user_id: user.id,
        plan_type: planType,
        price: plan.price_monthly || 0,
        features: plan.features || [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'active',
        payment_id: paymentData?.payment_id || null,
        cancelAtPeriodEnd: false // Always reset for new/upgraded subscriptions
      };

      // Cancel existing subscription if exists
      if (currentSubscription) {
        await SubEntity.update(currentSubscription.id, { status: 'cancelled' });
      }

      const newSub = await SubEntity.create(subscriptionData);
      setCurrentSubscription(newSub);
      setShowPaymentModal(false);
      setSelectedPlan(null);
      toast.success('Subscription activated successfully!');
      
      // Reload data to refresh the UI
      await loadData();
    } catch (error) {
      console.error("Error creating subscription:", error);
      toast.error('Failed to activate subscription');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    // Confirm cancellation
    const confirmed = window.confirm(
      `Are you sure you want to cancel your ${currentSubscription.plan_type} subscription?\n\nYou will continue to have access until ${new Date(currentSubscription.end_date).toLocaleDateString()}.`
    );

    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await SubEntity.update(currentSubscription.id, {
        cancelAtPeriodEnd: true,
        auto_renew: false
      });

      // Reload subscription data
      const updatedSubs = await SubEntity.filter({ user_id: user.id, status: 'active' }, '-created_date', 1);
      setCurrentSubscription(updatedSubs[0] || null);

      toast.success('Subscription cancelled successfully. You will retain access until the end of your billing period.');
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error('Failed to cancel subscription. Please try again.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Helper function to get icon for plan based on price
  const getPlanIcon = (plan) => {
    if ((plan.price_monthly || 0) === 0) return Users;
    if ((plan.price_monthly || 0) >= 2000) return Star;
    return Crown;
  };

  // Helper function to get color for plan
  const getPlanColor = (plan) => {
    if ((plan.price_monthly || 0) === 0) return 'bg-blue-500';
    if ((plan.price_monthly || 0) >= 2000) return 'bg-gradient-to-r from-yellow-400 to-orange-500';
    return 'bg-purple-500';
  };

  // Check if plan is popular (middle-tier or specific flag)
  const isPlanPopular = (plan, allPlans) => {
    if (allPlans.length <= 2) return false;
    const sortedByPrice = [...allPlans].sort((a, b) => (a.price_monthly || 0) - (b.price_monthly || 0));
    const middleIndex = Math.floor(sortedByPrice.length / 2);
    return sortedByPrice[middleIndex].name === plan.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <FeatureConfigProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Shield className="w-8 h-8 text-purple-600" />
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Premium Membership
              </h1>
            </div>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Unlock exclusive admin recommendations, pledge systems, and advanced trading insights to maximize your retail trading potential
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>94% Success Rate</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <span>10,000+ Active Members</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-purple-500" />
                <span>₹2.5Cr+ Pledged</span>
              </div>
            </div>
          </div>

          {/* Current Plan Status */}
          {currentSubscription && (
            <CurrentPlan 
              subscription={currentSubscription}
              onUpgrade={() => setShowPaymentModal(true)}
              onCancelSubscription={handleCancelSubscription}
              isCancelling={isCancelling}
            />
          )}

          {/* Features Comparison */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-center mb-8">Why Choose Premium?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="font-semibold mb-2">Expert Recommendations</h3>
                <p className="text-sm text-slate-600">Get stock picks from verified admins with proven track records</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">Pledge System</h3>
                <p className="text-sm text-slate-600">Make commitments with fellow traders and track performance</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">Advanced Analytics</h3>
                <p className="text-sm text-slate-600">Deep insights into market trends and portfolio performance</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">Priority Support</h3>
                <p className="text-sm text-slate-600">Get instant help and priority access to new features</p>
              </div>
            </div>
          </div>

          {/* Pricing Plans - Now with Database-Driven Features */}
          {plans.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Plans Available</h3>
                <p className="text-slate-600">Please check back later for subscription plans</p>
              </CardContent>
            </Card>
          ) : (
            <div className={`grid grid-cols-1 ${plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-8`}>
              {plans.map((plan) => {
                // Transform database plan to PlanCard format
                const transformedPlan = {
                  id: plan.name.toLowerCase().replace(/\s+/g, '_'),
                  name: plan.name,
                  price: plan.price_monthly || 0,
                  period: plan.price_monthly === 0 ? 'Forever Free' : 'per month',
                  description: plan.description || '',
                  features: plan.features || [],
                  inherits_from_plan_id: plan.inherits_from_plan_id,
                  icon: getPlanIcon(plan),
                  color: getPlanColor(plan),
                  popular: isPlanPopular(plan, plans)
                };

                return (
                  <PlanCard 
                    key={plan.id}
                    plan={transformedPlan}
                    currentPlan={currentSubscription?.plan_type}
                    onSelect={handlePlanSelect}
                    allPlans={plans}
                  />
                );
              })}
            </div>
          )}

          {/* Trust Indicators */}
          <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Trusted by Thousands of Retail Traders</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl font-bold">₹25,00,000+</div>
                <div className="text-green-100">Total Pledged Amount</div>
              </div>
              <div>
                <div className="text-3xl font-bold">94%</div>
                <div className="text-green-100">Recommendation Success Rate</div>
              </div>
              <div>
                <div className="text-3xl font-bold">10,000+</div>
                <div className="text-green-100">Active Premium Members</div>
              </div>
            </div>
          </div>

          {/* Payment Modal */}
          <PaymentModal
            open={showPaymentModal}
            onClose={() => {
              setShowPaymentModal(false);
              setSelectedPlan(null);
            }}
            plan={selectedPlan}
            onPaymentSuccess={handleSubscribe}
          />
        </div>
      </div>
    </FeatureConfigProvider>
  );
}
