
import React, { useState, useEffect } from "react";
import { User, Referral, ReferralBadge, Subscription } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Award,
  Crown,
  Shield,
  TrendingUp,
  Users,
  Star,
  Copy,
  Share2 } from
"lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import ProfileGeneralSettings from "../components/profile/ProfileGeneralSettings";
import ProfileReferralSection from "../components/profile/ProfileReferralSection";
import ProfileSubscriptionSection from "../components/profile/ProfileSubscriptionSection";
import ProfileTrustScore from "../components/profile/ProfileTrustScore";
import ProfileCreditsSection from "../components/profile/ProfileCreditsSection";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [badges, setBadges] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Flag to track if the component is mounted

    const loadProfileData = async () => {
      try {
        const currentUser = await User.me();
        if (!isMounted) return; // Prevent state update if component unmounted
        setUser(currentUser);

        const [userReferrals, userBadges, userSubs] = await Promise.all([
          Referral.filter({ inviter_id: currentUser.id }, '-created_date').catch(() => []),
          ReferralBadge.filter({ user_id: currentUser.id, is_active: true }, '-earned_date').catch(() => []),
          Subscription.filter({ user_id: currentUser.id, status: 'active' }, '-created_date', 1).catch(() => [])
        ]);

        if (!isMounted) return; // Prevent state update if component unmounted
        setReferrals(userReferrals);
        setBadges(userBadges);
        setSubscription(userSubs[0] || null);

      } catch (error) {
        if (isMounted) console.error("Error loading profile data:", error); // Log error only if mounted
      } finally {
        if (isMounted) setIsLoading(false); // Update loading state only if mounted
      }
    };

    loadProfileData();

    return () => {
      isMounted = false; // Set flag to false when component unmounts
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Profile Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {user.profile_image_url ?
            <img src={user.profile_image_url} alt={user.display_name} className="w-24 h-24 rounded-full object-cover" /> :

            user.display_name?.[0]
            }
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.display_name}</h1>
            <p className="text-slate-600">{user.email}</p>
          </div>
        </div>

        {/* Profile Tabs */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <Tabs defaultValue="general" className="space-y-6 finfluencer-tabs">
              <TabsList className="grid w-full grid-cols-5 max-w-4xl mx-auto">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">General</span>
                </TabsTrigger>
                <TabsTrigger value="referrals" className="flex items-center gap-2">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Referrals</span>
                </TabsTrigger>
                <TabsTrigger value="subscription" className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span className="hidden sm:inline">Subscription</span>
                </TabsTrigger>
                <TabsTrigger value="trust-score" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">Trust Score</span>
                </TabsTrigger>
                <TabsTrigger value="credits" className="flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Credits</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="mt-6">
                <ProfileGeneralSettings user={user} onUserUpdate={setUser} />
              </TabsContent>

              <TabsContent value="referrals" className="mt-6">
                <ProfileReferralSection
                  user={user}
                  referrals={referrals}
                  badges={badges} />
              </TabsContent>

              <TabsContent value="subscription" className="mt-6">
                <ProfileSubscriptionSection subscription={subscription} />
              </TabsContent>

              <TabsContent value="trust-score" className="mt-6">
                <ProfileTrustScore user={user} />
              </TabsContent>

              <TabsContent value="credits" className="mt-6">
                <ProfileCreditsSection user={user} referrals={referrals} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
