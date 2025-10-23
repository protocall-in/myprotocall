
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SubscriptionPlan, PromoCode } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Ticket, BarChart3, PlusCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import PlanManager from './subscriptions/PlanManager';
import PromoCodeManager from './subscriptions/PromoCodeManager';
import SubscriptionAnalytics from './subscriptions/SubscriptionAnalytics';
import SubscriptionUserManagement from './subscriptions/SubscriptionUserManagement';

const defaultPlans = [
  { name: 'Free', description: 'Basic access for all users.', price_monthly: 0, price_annually: 0, is_active: true, is_system_plan: true, features: [] },
  { name: 'Premium', description: 'Access to premium features and content.', price_monthly: 499, price_annually: 4999, is_active: true, is_system_plan: true, features: ['premium_chat_rooms', 'premium_polls', 'premium_events'] },
  { name: 'VIP', description: 'All-access pass to the entire platform.', price_monthly: 999, price_annually: 9999, is_active: true, is_system_plan: true, features: ['premium_chat_rooms', 'premium_polls', 'premium_events', 'advisor_subscriptions', 'exclusive_finfluencer_content', 'admin_recommendations'] }
];


export default function SubscriptionManagement({ user }) {
  const [plans, setPlans] = useState([]);
  const [promoCodes, setPromoCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const permissions = useMemo(() => ({
    isSuperAdmin: user?.app_role === 'super_admin',
    isAdmin: ['super_admin', 'admin'].includes(user?.app_role),
    canEdit: ['super_admin', 'admin'].includes(user?.app_role),
    canView: ['super_admin', 'admin', 'sub_admin'].includes(user?.app_role)
  }), [user]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [planData, promoCodeData] = await Promise.all([
        SubscriptionPlan.list(),
        PromoCode.list()
      ]);

      // Ensure default plans exist
      if (planData.length === 0) {
        const createdPlans = await SubscriptionPlan.bulkCreate(defaultPlans);
        setPlans(createdPlans);
      } else {
        setPlans(planData.sort((a, b) => a.price_monthly - b.price_monthly));
      }

      setPromoCodes(promoCodeData);
    } catch (error) {
      console.error("Error loading subscription data:", error);
      toast.error("Failed to load subscription data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPlan = async () => {
    if (!permissions.isSuperAdmin) {
      toast.error("Only Super Admins can create new plans.");
      return;
    }

    const customPlanCount = plans.filter((p) => !p.is_system_plan).length;
    const newPlanName = `Custom Plan ${customPlanCount + 1}`;

    try {
      const newPlan = await SubscriptionPlan.create({
        name: newPlanName,
        description: "A new custom subscription plan. Edit to customize.",
        price_monthly: 299,
        price_annually: 2999,
        is_active: false, // Start inactive so admin can configure first
        is_system_plan: false, // This makes it deletable
        features: []
      });

      setPlans([...plans, newPlan]);
      toast.success(`"${newPlanName}" created successfully! You can now customize it.`);
    } catch (error) {
      console.error("Error creating new plan:", error);
      toast.error("Failed to create new plan.");
    }
  };

  if (isLoading) return <div>Loading Subscription Management...</div>;
  if (!permissions.canView) return <div>You do not have permission to view this page.</div>;

  return (
    <div className="space-y-6">
      {/* Header Card with Add Plan Button */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Gem className="w-6 h-6 text-purple-600" />
                Subscription & Monetization
              </CardTitle>
              <CardDescription className="mt-1">Manage subscription plans, features, pricing, and promotional codes.</CardDescription>
            </div>

            {/* Prominent Add New Plan Button */}
            {permissions.isSuperAdmin &&
              <div className="flex flex-col items-end gap-2">
                <Button
                  onClick={handleAddPlan}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold">

                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Custom Plan
                </Button>
                <p className="text-xs text-gray-500">Add new subscription tiers</p>
              </div>
            }
          </div>
        </CardHeader>
      </Card>

      <SubscriptionAnalytics plans={plans} promoCodes={promoCodes} />

      <Tabs defaultValue="plans">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger value="plans" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
            <Gem className="w-4 h-4 mr-2" />Plan Management
          </TabsTrigger>
          <TabsTrigger value="promos" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
            <Ticket className="w-4 h-4 mr-2" />Promo Codes
          </TabsTrigger>
          <TabsTrigger value="users" className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
            <Users className="w-4 h-4 mr-2" />User Subscriptions
          </TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-6">
          <PlanManager plans={plans} setPlans={setPlans} permissions={permissions} />
        </TabsContent>
        <TabsContent value="promos" className="mt-6">
          <PromoCodeManager promoCodes={promoCodes} setPromoCodes={setPromoCodes} permissions={permissions} />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <SubscriptionUserManagement permissions={permissions} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
