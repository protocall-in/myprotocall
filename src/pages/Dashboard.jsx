
import React, { useState, useEffect, useCallback } from "react";
import { User, Stock, ChatRoom, Poll, AdvisorRecommendation, Subscription, Referral } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  TrendingUp,
  TrendingDown,
  Users,
  MessageSquare,
  BarChart3,
  Bell,
  ArrowRight,
  Shield,
  Target,
  Activity } from
"lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

import MarketOverview from "../components/dashboard/MarketOverview";
import QuickActions from "../components/dashboard/QuickActions";
import TrendingStocks from "../components/dashboard/TrendingStocks";
import StockHeatmap from "../components/dashboard/StockHeatmap";
import FinInfluencers from "../components/dashboard/FinInfluencers";
import LatestNews from "../components/dashboard/LatestNews";
import ActivePolls from "../components/dashboard/ActivePolls";
import RecentActivity from "../components/dashboard/RecentActivity";
import AdvisorRecommendations from "../components/dashboard/AdvisorRecommendations";
import LiveStockTicker from "../components/stocks/LiveStockTicker";
import NotificationPanel from "../components/notifications/NotificationPanel";
import PageFooter from "../components/footer/PageFooter";
import AdDisplay from "../components/dashboard/AdDisplay";
import ReviewScroller from "../components/dashboard/ReviewScroller";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [referrals, setReferrals] = useState([]);

  const loadDashboardData = useCallback(async (currentUser, isMounted, abortController) => {
    // Helper function to add delay between API calls
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Helper function for API calls with retry logic and abort handling
    const fetchWithRetry = async (fetchFn, retries = 2, delayMs = 1000) => {
      for (let i = 0; i <= retries; i++) {
        try {
          // Check if aborted before making request
          if (abortController.signal.aborted) {
            return null;
          }
          return await fetchFn();
        } catch (error) {
          // Check if request was aborted (either via signal or error message)
          if (error?.message?.includes('aborted') || error?.message?.includes('canceled') || abortController.signal.aborted) {
            console.log('Request was aborted, skipping retry');
            return null;
          }

          const isRateLimit = error?.message?.includes('Rate limit') || error?.message?.includes('429') || error?.message?.includes('Network Error');
          const isLastAttempt = i === retries;

          if (isRateLimit && !isLastAttempt) {
            // Wait with exponential backoff before retrying
            const waitTime = delayMs * Math.pow(2, i);
            console.log(`Rate limit hit, retrying in ${waitTime}ms... (attempt ${i + 1}/${retries + 1})`);
            await delay(waitTime);
            continue;
          }

          // If it's the last attempt or not a rate limit error, throw
          if (isLastAttempt || !isRateLimit) {
            throw error;
          }
        }
      }
    };

    if (!isMounted || abortController.signal.aborted) return;

    const fallbackStats = {
      totalTraders: 1247,
      activeRooms: 6,
      activePolls: 4,
      trendingStocks: 6,
      stocks: [],
      chatRooms: [],
      polls: [],
      recommendations: [],
    };

    try {
      if (currentUser) setUser(currentUser);

      // Phase 1: Critical data (stocks, chat rooms) - Load sequentially with delays
      let stocks = [];
      try {
        const stocksResult = await fetchWithRetry(() => Stock.list('-change_percent', 10), 2, 1000);
        if (!isMounted || abortController.signal.aborted || !stocksResult) return;
        stocks = stocksResult;
        await delay(1000); // Increased delay
      } catch (error) {
        if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
          console.warn("Error fetching stocks:", error.message);
        }
      }

      let chatRooms = [];
      try {
        const chatRoomsResult = await fetchWithRetry(() => ChatRoom.list('-participant_count', 5), 2, 1000);
        if (!isMounted || abortController.signal.aborted || !chatRoomsResult) return;
        chatRooms = chatRoomsResult;
        await delay(1000); // Increased delay
      } catch (error) {
        if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
          console.warn("Error fetching chat rooms:", error.message);
        }
      }

      // Phase 2: Secondary data (polls, recommendations) - Load with increased delays
      let polls = [];
      try {
        const pollsResult = await fetchWithRetry(() => Poll.filter({ is_active: true }, '-created_date', 5), 2, 1000);
        if (!isMounted || abortController.signal.aborted || !pollsResult) return;
        polls = pollsResult;
        await delay(1000); // Increased delay
      } catch (error) {
        if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
          console.warn("Error fetching polls:", error.message);
        }
      }

      let recommendations = [];
      try {
        const recommendationsResult = await fetchWithRetry(() => AdvisorRecommendation.list('-created_date', 3), 2, 1000);
        if (!isMounted || abortController.signal.aborted || !recommendationsResult) return;
        recommendations = recommendationsResult;
      } catch (error) {
        if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
          console.warn("Error fetching recommendations:", error.message);
        }
      }

      if (isMounted && !abortController.signal.aborted) {
        setStats({
          totalTraders: fallbackStats.totalTraders,
          activeRooms: chatRooms.length || fallbackStats.activeRooms,
          activePolls: polls.filter(p => p && p.is_active).length || fallbackStats.activePolls,
          trendingStocks: stocks.length || fallbackStats.trendingStocks,
          stocks: stocks || [],
          chatRooms: chatRooms || [],
          polls: polls || [],
          recommendations: recommendations || [],
        });

        // Mark initial loading as complete
        setIsLoading(false);
      }

      // Phase 3: Background data (subscriptions, referrals) - Load after delay with retry
      if (currentUser && !abortController.signal.aborted && isMounted) {
        setTimeout(async () => {
          if (!isMounted || abortController.signal.aborted) return;

          try {
            await delay(2000); // Increased delay before background loading

            // Load subscriptions with retry
            try {
              const userSubs = await fetchWithRetry(
                () => Subscription.filter({ user_id: currentUser.id, status: 'active' }, '-created_date', 1),
                2,
                1500
              );
              if (isMounted && !abortController.signal.aborted && userSubs) {
                setSubscription(userSubs[0] || null);
              }
              await delay(1200);
            } catch (error) {
              if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
                console.warn("Error fetching subscriptions:", error.message);
              }
            }

            // Load referrals with retry
            if (!isMounted || abortController.signal.aborted) return;
            try {
              const userReferrals = await fetchWithRetry(
                () => Referral.filter({ inviter_id: currentUser.id }, '-created_date'),
                2,
                1500
              );
              if (isMounted && !abortController.signal.aborted && userReferrals) {
                setReferrals(userReferrals);
              }
            } catch (error) {
              if (!abortController.signal.aborted && !error?.message?.includes('aborted')) {
                console.warn("Error fetching referrals:", error.message);
              }
            }
          } catch (error) {
            if (!error?.message?.includes('aborted') && isMounted && !abortController.signal.aborted) {
              console.log("Background data load skipped:", error.message);
            }
          }
        }, 3000); // Increased delay before background loading
      }
    } catch (apiError) {
      if (!isMounted || abortController.signal.aborted || apiError?.message?.includes('aborted') || apiError?.message?.includes('canceled')) {
        return;
      }
      console.warn("Using fallback data for dashboard due to API error:", apiError.message);
      setStats(fallbackStats);
      setSubscription(null);
      setReferrals([]);
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    const checkUserRoleAndRedirect = async () => {
        try {
            const currentUser = await User.me().catch(() => null);
            if (!isMounted || abortController.signal.aborted) return;

            if(currentUser?.app_role === 'finfluencer') {
                window.location.href = createPageUrl("FinfluencerDashboard");
                return;
            }
            if(currentUser?.app_role === 'vendor') {
                window.location.href = createPageUrl("VendorDashboard");
                return;
            }
            if(currentUser?.app_role === 'advisor' || currentUser?.app_role === 'educator') {
                 window.location.href = createPageUrl("EntityDashboard");
                return;
            }

            // For traders, admins and super_admins, load the dashboard
            loadDashboardData(currentUser, isMounted, abortController);
        } catch (error) {
            if (isMounted && !abortController.signal.aborted && !error.message?.includes('aborted')) {
                console.error("Error checking user role:", error);
                setIsLoading(false);
            }
        }
    };

    checkUserRoleAndRedirect();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [loadDashboardData]);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) =>
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  const trendingStocksCount = stats.trendingStocks;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Gradient Welcome Banner */}
        <div className="flex flex-col gap-4">
          <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 rounded-2xl p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="relative z-10">
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {user?.display_name || 'Trader'}!
              </h1>
              <p className="text-blue-100 text-lg">Here's what's happening in your investment community today.</p>
            </div>
            <div className="absolute bottom-4 right-8 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
              <Activity className="w-6 h-6 text-yellow-900" />
            </div>
          </div>
        </div>

        {/* Live Stock Ticker */}
        <LiveStockTicker />

        {/* Quick Stats with Categorical Colors */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-green-500 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Traders</p>
                  <p className="text-2xl font-bold mt-1">1,247</p>
                  <p className="text-green-200 text-xs">+47 this week</p>
                </div>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-500 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Live Chat Rooms</p>
                  <p className="text-2xl font-bold mt-1">{stats.activeRooms}</p>
                  <p className="text-blue-200 text-xs">{stats.chatRooms.length > 0 ? `${stats.chatRooms.length} active discussions` : 'No active discussions'}</p>
                </div>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-500 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Active Polls</p>
                  <p className="text-2xl font-bold mt-1">{stats.activePolls}</p>
                  <p className="text-purple-200 text-xs">{stats.activePolls > 0 ? `${stats.activePolls} polls active` : 'No polls active'}</p>
                </div>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-500 text-white border-0 shadow-lg overflow-hidden relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-8 -translate-y-8"></div>
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Trending Stocks</p>
                  <p className="text-2xl font-bold mt-1">{trendingStocksCount}</p>
                  <p className="text-orange-200 text-xs">10 stocks trending</p>
                </div>
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout - 3 Column Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6">
          {/* Left Column - Full width sections */}
          <div className="lg:col-span-2 space-y-6">
            <MarketOverview stocks={stats.stocks || []} />
            <QuickActions />
            <StockHeatmap polls={stats.polls || []} recommendations={stats.recommendations || []} />
            <TrendingStocks stocks={stats.stocks || []} />
            <FinInfluencers />
          </div>

          {/* Right Column - Sidebar sections */}
          <div className="space-y-6">
            <AdDisplay placement="dashboard" className="w-full" />
            <AdvisorRecommendations recommendations={stats.recommendations || []} />
            <ActivePolls polls={stats.polls || []} />
            <RecentActivity />
            <LatestNews />
          </div>
        </div>

        {/* Mobile/Tablet Layout - Single Column */}
        <div className="lg:hidden space-y-6">
          <AdDisplay placement="dashboard" className="w-full" />
          <MarketOverview stocks={stats.stocks || []} />
          <QuickActions />
          <StockHeatmap polls={stats.polls || []} recommendations={stats.recommendations || []} />
          <AdvisorRecommendations recommendations={stats.recommendations || []} />
          <TrendingStocks stocks={stats.stocks || []} />
          <FinInfluencers />
          <ActivePolls polls={stats.polls || []} />
          <LatestNews />
          <RecentActivity />
        </div>

        {/* Review Scroller - NEW SECTION */}
        <ReviewScroller />
      </div>

      {/* Page Footer */}
      <PageFooter />
    </div>
  );
}
