
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Sparkles, CheckCircle, Shield } from "lucide-react";
import { useFeatureConfig } from '../hooks/useFeatureConfig';

export default function PlanCard({ plan, currentPlan, onSelect, isLoading, allPlans = [] }) {
  const { getFeatureName, getFeatureStatus, shouldShowFeatureForPlan } = useFeatureConfig();
  
  const isCurrentPlan = currentPlan === plan.id;
  const isDowngrade = currentPlan && getPlanLevel(currentPlan) > getPlanLevel(plan.id);
  
  function getPlanLevel(planId) {
    const levels = { 'basic': 1, 'premium': 2, 'vip': 3, 'vip_elite': 3 };
    return levels[planId] || 0;
  }

  const getCardStyle = () => {
    if (plan.name.toLowerCase().includes('vip') || plan.name.toLowerCase().includes('elite')) {
      return "border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50 relative overflow-hidden";
    }
    if (plan.name.toLowerCase().includes('premium')) {
      return "border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-blue-50";
    }
    return "border border-gray-200 bg-white";
  };

  const getIcon = () => {
    if (plan.name.toLowerCase().includes('vip') || plan.name.toLowerCase().includes('elite')) {
      return <Crown className="w-6 h-6 text-yellow-600" />;
    }
    if (plan.name.toLowerCase().includes('premium')) {
      return <Sparkles className="w-6 h-6 text-purple-600" />;
    }
    return <CheckCircle className="w-6 h-6 text-blue-600" />;
  };

  const getButtonStyle = () => {
    if (isCurrentPlan) return "bg-gray-300 text-gray-500 cursor-not-allowed";
    if (plan.name.toLowerCase().includes('vip') || plan.name.toLowerCase().includes('elite')) {
      return "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600";
    }
    if (plan.name.toLowerCase().includes('premium')) {
      return "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600";
    }
    return "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600";
  };

  // Get parent plan name for inheritance display
  const getParentPlanName = (inheritsFromId) => {
    if (!inheritsFromId || !allPlans.length) return null;
    const parentPlan = allPlans.find(p => p.id === inheritsFromId);
    return parentPlan ? parentPlan.name : null;
  };

  // Determine the plan's tier based on its name
  const getPlanTier = () => {
    const planName = plan.name.toLowerCase();
    if (planName.includes('vip') || planName.includes('elite')) return 'vip';
    if (planName.includes('premium')) return 'premium';
    return 'basic';
  };

  // Get feature label from database
  const getFeatureLabel = (featureKey) => {
    return getFeatureName(featureKey);
  };

  // Get feature status badge from database
  const getFeatureStatusBadge = (featureKey) => {
    const statusInfo = getFeatureStatus(featureKey);
    if (!statusInfo) return null;
    
    if (statusInfo.type === 'coming_soon') {
      return <Badge className="bg-purple-100 text-purple-800 text-[10px] ml-2">{statusInfo.label}</Badge>;
    }
    if (statusInfo.type === 'partial') {
      return <Badge className="bg-yellow-100 text-yellow-800 text-[10px] ml-2">{statusInfo.label}</Badge>;
    }
    return null;
  };

  // Filter features to only show visible ones that belong to this plan's tier (or lower due to inheritance)
  const planTier = getPlanTier();
  
  // Debug logging
  console.log('PlanCard Debug:', {
    planName: plan.name,
    planTier,
    rawFeatures: plan.features,
    featuresLength: plan.features?.length || 0
  });

  const visibleFeatures = plan.features ? plan.features.filter(feature => {
    const shouldShow = typeof feature === 'string' ? shouldShowFeatureForPlan(feature, planTier) : true;
    
    // Debug each feature
    if (typeof feature === 'string') {
      console.log(`Feature: ${feature}, PlanTier: ${planTier}, ShouldShow: ${shouldShow}`);
    }
    
    return shouldShow;
  }) : [];

  console.log('Visible Features Count:', visibleFeatures.length);

  const parentPlanName = getParentPlanName(plan.inherits_from_plan_id);

  return (
    <Card className={`${getCardStyle()} transition-all duration-300 hover:shadow-xl transform hover:scale-105`}>
      {plan.popular && (
        <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
          MOST POPULAR
        </div>
      )}
      
      <CardHeader className="text-center pb-4">
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <div className="text-4xl font-bold text-gray-900">
          ₹{plan.price.toLocaleString()}
          <span className="text-lg text-gray-500 font-normal">/{plan.period.includes('Free') ? 'Forever' : 'month'}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-3">
          {/* Show Inheritance Summary First */}
          {parentPlanName && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center mt-0.5">
                <Shield className="w-3 h-3 text-white" />
              </div>
              <span className="text-sm text-blue-900 font-semibold leading-relaxed">
                Includes All {parentPlanName} Features
              </span>
            </div>
          )}

          {/* Show Only Unique Visible Features for This Tier */}
          {visibleFeatures && visibleFeatures.length > 0 ? (
            visibleFeatures.map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-sm text-gray-700 leading-relaxed flex items-center flex-wrap">
                  {typeof feature === 'string' ? getFeatureLabel(feature) : feature}
                  {typeof feature === 'string' && getFeatureStatusBadge(feature)}
                </span>
              </div>
            ))
          ) : parentPlanName ? (
            <div className="text-sm text-gray-500 italic text-center py-2">
              No additional unique features
            </div>
          ) : (
            <div className="text-sm text-gray-500 italic text-center py-2">
              No features specified
            </div>
          )}
        </div>

        <div className="pt-4">
          <Button
            onClick={() => onSelect(plan)}
            disabled={isCurrentPlan || isLoading}
            className={`w-full text-white font-semibold py-3 rounded-xl transition-all duration-300 ${getButtonStyle()}`}
          >
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </div>
            ) : isCurrentPlan ? (
              "Current Plan"
            ) : isDowngrade ? (
              "Downgrade"
            ) : (
              `Upgrade to ${plan.name}`
            )}
          </Button>
        </div>

        {isCurrentPlan && (
          <Badge className="w-full justify-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 shadow-lg border-2 border-purple-700 font-semibold hover:from-blue-700 hover:to-purple-700 transition-all">
            <Check className="w-4 h-4 mr-2" />
            You're currently on this plan
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
