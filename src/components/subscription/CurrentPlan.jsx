
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Calendar, CreditCard, ArrowUp, XCircle, Loader2, RotateCcw, CheckCircle, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { usePlatformSettings } from "../hooks/usePlatformSettings";
import SubscriptionRefundModal from "./SubscriptionRefundModal";

export default function CurrentPlan({ subscription, onUpgrade, onCancelSubscription, isCancelling }) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const { settings, refreshSettings } = usePlatformSettings();

  // Refresh settings every 3 seconds to catch admin changes immediately
  useEffect(() => {
    const interval = setInterval(() => {
      refreshSettings();
    }, 3000);

    return () => clearInterval(interval);
  }, [refreshSettings]);

  const getPlanGradient = (planType) => {
    switch (planType) {
      case 'vip': return 'from-yellow-400 via-orange-400 to-red-500';
      case 'premium': return 'from-purple-500 via-pink-500 to-rose-500';
      default: return 'from-blue-500 via-indigo-500 to-purple-600';
    }
  };

  const getPlanIcon = (planType) => {
    switch (planType) {
      case 'vip': return Crown;
      case 'premium': return Sparkles;
      default: return CheckCircle;
    }
  };

  const showCancelButton = subscription.status === 'active' && !subscription.cancelAtPeriodEnd && subscription.plan_type !== 'basic';
  
  // UPDATED: More explicit type checking and logging
  const refundSettingValue = settings.subscription_refund_enabled;
  const subscriptionRefundsEnabled = 
    refundSettingValue === undefined || refundSettingValue === null
      ? true // Default to enabled if not set
      : refundSettingValue === 'true' || refundSettingValue === true;
  
  const showRefundButton = subscriptionRefundsEnabled && subscription.status === 'active' && subscription.plan_type !== 'basic';

  // Debug logging (remove after testing)
  console.log('Refund Setting Debug:', {
    rawValue: refundSettingValue,
    isEnabled: subscriptionRefundsEnabled,
    willShowButton: showRefundButton,
    planType: subscription.plan_type,
    status: subscription.status
  });

  const PlanIcon = getPlanIcon(subscription.plan_type);

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-xl">
        {/* Gradient Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${getPlanGradient(subscription.plan_type)} opacity-10`}></div>
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24"></div>

        <CardHeader className="relative pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanGradient(subscription.plan_type)} flex items-center justify-center shadow-lg`}>
                <PlanIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-900">
                  {subscription.plan_type.charAt(0).toUpperCase() + subscription.plan_type.slice(1)} Plan
                </CardTitle>
                <p className="text-sm text-slate-500 mt-0.5">Your active subscription</p>
              </div>
            </div>
            
            <Badge className={`px-3 py-1.5 text-xs font-semibold ${
              subscription.cancelAtPeriodEnd 
                ? 'bg-orange-100 text-orange-700 border border-orange-300' 
                : 'bg-green-100 text-green-700 border border-green-300'
            }`}>
              {subscription.cancelAtPeriodEnd ? (
                <div className="flex items-center gap-1.5">
                  <XCircle className="w-3.5 h-3.5" />
                  Cancelling
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Active
                </div>
              )}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="relative">
          {/* Cancellation Notice */}
          {subscription.cancelAtPeriodEnd && (
            <div className="mb-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-orange-900">Subscription Ending Soon</p>
                  <p className="text-xs text-orange-700 mt-1">
                    Your subscription will end on <span className="font-semibold">{format(new Date(subscription.end_date), 'MMMM d, yyyy')}</span>. You'll retain access until then.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Plan Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Price Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-slate-600" />
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Monthly Price</p>
              </div>
              <p className="text-3xl font-bold text-slate-900">₹{subscription.price.toLocaleString()}</p>
              <p className="text-xs text-slate-500 mt-1">Billed monthly</p>
            </div>

            {/* Billing Date Card */}
            <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">
                  {subscription.cancelAtPeriodEnd ? 'Access Until' : 'Next Billing'}
                </p>
              </div>
              <p className="text-3xl font-bold text-slate-900">
                {format(new Date(subscription.end_date), 'd')}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {format(new Date(subscription.end_date), 'MMMM yyyy')}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Upgrade Button */}
            {subscription.plan_type !== 'vip' && subscription.status === 'active' && !subscription.cancelAtPeriodEnd && (
              <Button 
                onClick={onUpgrade} 
                className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-700 hover:via-pink-700 hover:to-rose-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Upgrade to {subscription.plan_type === 'basic' ? 'Premium' : 'VIP'}
              </Button>
            )}

            {/* Cancel Button - Full Width */}
            {showCancelButton && (
              <Button 
                onClick={onCancelSubscription}
                disabled={isCancelling}
                variant="outline" 
                className="w-full h-11 border-2 border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 font-medium transition-all duration-200"
              >
                {isCancelling ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </>
                )}
              </Button>
            )}

            {/* Refund Button - Small, Right Aligned */}
            {showRefundButton && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setShowRefundModal(true)}
                  variant="outline" 
                  size="sm"
                  className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300 font-medium transition-all duration-200"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                  Request Refund
                </Button>
              </div>
            )}

            {/* Reactivation Link */}
            {subscription.cancelAtPeriodEnd && (
              <div className="text-center pt-2">
                <p className="text-sm text-slate-600">
                  Changed your mind?{' '}
                  <Link 
                    to={createPageUrl('Subscription')} 
                    className="text-purple-600 hover:text-purple-700 font-semibold hover:underline transition-colors"
                  >
                    Reactivate your subscription →
                  </Link>
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Refund Modal */}
      {showRefundModal && (
        <SubscriptionRefundModal
          subscription={subscription}
          onClose={() => setShowRefundModal(false)}
          onSuccess={() => {
            setShowRefundModal(false);
            toast.success('Refund request submitted successfully');
          }}
        />
      )}
    </>
  );
}
