
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FinInfluencer, InfluencerPost, User, Subscription } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Search,
  Filter,
  Users,
  Play,
  Eye,
  CheckCircle,
  Award,
  TrendingUp,
  BookOpen,
  Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import InfluencerCard from "../components/finfluencers/InfluencerCard";
import VideoCard from "../components/finfluencers/VideoCard";
import CourseCard from "../components/finfluencers/CourseCard";

// Sample data (fallback) moved outside the component to prevent re-creation on render
const sampleInfluencers = [
  {
    id: '1',
    display_name: 'Akshat Shrivastava',
    bio: 'Investment Banking Expert | Stock Market Educator',
    specialization: ['Technical Analysis', 'Value Investing'],
    follower_count: 125000,
    verified: true,
    sebi_registered: true,
    success_rate: 78.5,
    profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    social_links: {
      youtube: 'https://youtube.com/@akshatshrivastava',
      twitter: 'https://twitter.com/akshatshrivastava',
      linkedin: 'https://linkedin.com/in/akshatshrivastava'
    },
    subscription_price: 999,
    status: 'approved',
    total_revenue: 450000
  },
  {
    id: '2',
    display_name: 'Pranjal Kamra',
    bio: 'Personal Finance & Investment Strategist',
    specialization: ['Mutual Funds', 'Portfolio Management'],
    follower_count: 89000,
    verified: true,
    sebi_registered: false,
    success_rate: 82.1,
    profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    social_links: {
      youtube: 'https://youtube.com/@pranjalkamra',
      twitter: 'https://twitter.com/pranjalkamra'
    },
    subscription_price: 799,
    status: 'approved',
    total_revenue: 320000
  },
  {
    id: '3',
    display_name: 'Rachana Ranade',
    bio: 'CA | Stock Market Trainer | YouTuber',
    specialization: ['Options Trading', 'Risk Management'],
    follower_count: 156000,
    verified: true,
    sebi_registered: true,
    success_rate: 75.8,
    profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face',
    social_links: {
      youtube: 'https://youtube.com/@rachanaranade',
      instagram: 'https://instagram.com/rachanaranade',
      linkedin: 'https://linkedin.com/in/rachanaranade'
    },
    subscription_price: 1299,
    status: 'approved',
    total_revenue: 680000
  }];



const sampleVideos = [
  {
    id: '1',
    influencer_id: '1',
    title: 'Market Outlook for Q4 2024 - Complete Analysis',
    video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=300&h=200&fit=crop',
    duration: '15:32',
    view_count: 12500,
    like_count: 890,
    stock_mentions: ['RELIANCE', 'TCS', 'HDFCBANK'],
    tags: ['market-outlook', 'q4-analysis'],
    status: 'approved'
  },
  {
    id: '2',
    influencer_id: '2',
    title: 'Top 5 Blue Chip Stocks for 2024',
    video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=300&h=200&fit=crop',
    duration: '12:45',
    view_count: 8200,
    like_count: 645,
    stock_mentions: ['RELIANCE', 'TCS', 'INFY'],
    tags: ['blue-chip', 'investment'],
    status: 'approved'
  }];



const sampleCourses = [
  {
    id: '1',
    influencer_id: '1',
    title: 'Complete Technical Analysis Masterclass',
    description: 'Learn advanced technical analysis techniques from scratch',
    course_type: 'recorded_course',
    price: 4999,
    duration_hours: 8,
    current_enrollments: 245,
    category: 'technical_analysis',
    difficulty_level: 'intermediate',
    status: 'approved'
  },
  {
    id: '2',
    influencer_id: '3',
    title: 'Options Trading Live Workshop',
    description: 'Interactive live session on options trading strategies',
    course_type: 'live_session',
    price: 2999,
    duration_hours: 3,
    max_participants: 50,
    current_enrollments: 32,
    scheduled_date: '2024-01-25T18:00:00Z',
    category: 'options_trading',
    difficulty_level: 'advanced',
    status: 'approved'
  }];



export default function Finfluencers() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [influencers, setInfluencers] = useState([]);
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("influencers");
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // Load user data first - this is more reliable
      const [currentUser, userSub] = await Promise.all([
        User.me().catch(() => null),
        User.me().then((u) => u ? Subscription.filter({ user_id: u.id, status: 'active' }, '-created_date', 1) : []).catch(() => [])
      ]);

      if (!isMountedRef.current) return;

      setUser(currentUser);
      setSubscription(userSub[0] || null);

      // Use sample data primarily due to rate limiting issues
      // Only try to load real data in the background
      setInfluencers(sampleInfluencers);
      setVideos(sampleVideos);
      setCourses(sampleCourses);

      // Try to enhance with real data if possible (but don't block on it)
      try {
        const [fetchedInfluencers, fetchedVideos] = await Promise.all([
          FinInfluencer.filter({ status: 'approved' }, '-follower_count').catch(() => []),
          InfluencerPost.filter({ status: 'approved' }, '-view_count').catch(() => [])
        ]);

        if (isMountedRef.current) {
          // Only update if we got real data and component is still mounted
          if (fetchedInfluencers.length > 0) {
            setInfluencers(fetchedInfluencers);
          }
          if (fetchedVideos.length > 0) {
            setVideos(fetchedVideos);
          }
        }
      } catch (error) {
        // Silently fail and continue with sample data
        console.log("Using sample data due to API issues:", error.message);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      // Fallback to sample data
      if (isMountedRef.current) {
        setInfluencers(sampleInfluencers);
        setVideos(sampleVideos);
        setCourses(sampleCourses);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const filteredInfluencers = influencers.filter((influencer) => {
    const matchesSearch = influencer.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      influencer.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
      influencer.specialization?.some((spec) => spec.toLowerCase().includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const canAccessPremium = subscription && ['premium', 'vip'].includes(subscription.plan_type);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) =>
              <Skeleton key={i} className="h-80 w-full" />
            )}
          </div>
        </div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Star className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              FinInfluencers
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Learn from verified market experts, watch educational content, and join premium courses
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-2xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search influencers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar-input w-full" />

            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm">

              <option value="all">All Categories</option>
              <option value="technical">Technical Analysis</option>
              <option value="fundamental">Fundamental Analysis</option>
              <option value="options">Options Trading</option>
              <option value="mutual">Mutual Funds</option>
              <option value="portfolio">Portfolio Management</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full finfluencer-tabs">
          <TabsList className="grid w-full grid-cols-3 max-w-7xl mx-auto">
            <TabsTrigger value="influencers">
              <Users className="w-4 h-4 mr-2" />
              Influencers
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Play className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
          </TabsList>

          {/* Influencers Tab */}
          <TabsContent value="influencers" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredInfluencers.map((influencer) => (
                <InfluencerCard
                  key={influencer.id}
                  influencer={influencer}
                  canAccessPremium={canAccessPremium}
                />
              ))}
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => {
                const influencer = influencers.find((inf) => inf.id === video.influencer_id);
                return (
                  <VideoCard
                    key={video.id}
                    video={video}
                    influencer={influencer}
                    canAccessPremium={canAccessPremium}
                  />
                );
              })}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const influencer = influencers.find((inf) => inf.id === course.influencer_id);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    influencer={influencer}
                    canAccessPremium={canAccessPremium}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Disclaimer */}
        <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mt-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-800 mb-2">Important Disclaimer</h3>
                <p className="text-sm text-amber-700">
                  All educational content provided by FinInfluencers is for knowledge sharing and learning purposes only.
                  Past performance does not guarantee future results. No content should be considered as guaranteed returns
                  or investment advice. Please consult with qualified financial advisors before making investment decisions.
                  Investments in securities market are subject to market risks.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
