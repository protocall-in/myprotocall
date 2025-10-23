
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FinInfluencer, InfluencerPost, Course, User, Subscription } from "@/api/entities";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle,
  Shield,
  Users,
  Star,
  Award,
  Youtube,
  Twitter,
  Instagram,
  Linkedin,
  Play,
  BookOpen,
  AlertCircle } from
"lucide-react";

import VideoCard from "../components/finfluencers/VideoCard";
import CourseCard from "../components/finfluencers/CourseCard";

export default function InfluencerProfile() {
  const [influencer, setInfluencer] = useState(null);
  const [videos, setVideos] = useState([]);
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  const location = useLocation();
  const influencerId = new URLSearchParams(location.search).get("id");

  const socialIcons = {
    youtube: Youtube,
    twitter: Twitter,
    instagram: Instagram,
    linkedin: Linkedin
  };

  const loadData = useCallback(async () => {
    if (!influencerId) {
      setError("No influencer ID provided.");
      setIsLoading(false);
      return;
    }
    if (!isMountedRef.current) return;

    try {
      const [currentUser, userSub] = await Promise.all([
      User.me().catch(() => null),
      User.me().then((u) => u ? Subscription.filter({ user_id: u.id, status: 'active' }, '-created_date', 1) : []).catch(() => [])]
      );
      if (!isMountedRef.current) return;

      setUser(currentUser);
      setSubscription(userSub[0] || null);

      const [influencerData] = await FinInfluencer.filter({ id: influencerId }, '', 1).catch(() => []);
      if (!isMountedRef.current) return;

      if (!influencerData) {
        setError("Finfluencer not found.");
        setIsLoading(false);
        return;
      }
      setInfluencer(influencerData);

      const [influencerVideos, influencerCourses] = await Promise.all([
      InfluencerPost.filter({ influencer_id: influencerId, status: 'approved' }, '-created_date').catch(() => []),
      Course.filter({ influencer_id: influencerId, status: 'approved' }, '-created_date').catch(() => [])]
      );
      if (!isMountedRef.current) return;

      setVideos(influencerVideos);
      setCourses(influencerCourses);

    } catch (err) {
      if (!isMountedRef.current) return;
      console.error("Error loading profile data:", err);
      setError("Failed to load profile data.");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [influencerId]);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    return () => {
      isMountedRef.current = false;
    };
  }, [loadData]);

  const canAccessPremium = subscription && ['premium', 'vip'].includes(subscription.plan_type);

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>);

  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">{error}</h2>
        <p className="text-slate-600 mb-6">The finfluencer you are looking for might not exist or there was an error.</p>
        <Link to={createPageUrl("Finfluencers")}>
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Finfluencers
          </Button>
        </Link>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <Link to={createPageUrl("Finfluencers")}>
          <Button variant="outline" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 mb-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to All Finfluencers
          </Button>
        </Link>

        {/* Profile Header */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <div className="relative flex-shrink-0">
              <img src={influencer.profile_image_url} alt={influencer.display_name} className="w-32 h-32 rounded-full object-cover shadow-lg" />
              {influencer.verified && <CheckCircle className="w-8 h-8 text-blue-500 absolute bottom-1 right-1 bg-white rounded-full p-1" />}
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-slate-900">{influencer.display_name}</h1>
              <p className="text-slate-600 mt-1">{influencer.bio}</p>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-3">
                {influencer.sebi_registered &&
                <Badge className="bg-green-100 text-green-800"><Shield className="w-3 h-3 mr-1" />SEBI Registered</Badge>
                }
                {influencer.specialization?.map((spec) =>
                <Badge key={spec} variant="secondary">{spec}</Badge>
                )}
              </div>
              <div className="flex items-center justify-center md:justify-start gap-6 mt-4 text-slate-700">
                <div className="text-center">
                  <p className="font-bold text-lg">{(influencer.follower_count / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-slate-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{influencer.success_rate}%</p>
                  <p className="text-sm text-slate-500">Success Rate</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg">{courses.length}</p>
                  <p className="text-sm text-slate-500">Courses</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              <div className="flex gap-2">
                {Object.entries(influencer.social_links).map(([platform, url]) => {
                  if (!url) return null;
                  const Icon = socialIcons[platform];
                  return (
                    <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-slate-100 hover:bg-slate-200 rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </a>);

                })}
              </div>
              <Link to={createPageUrl("Subscription")}>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Star className="w-4 h-4 mr-2" />
                  Subscribe for Premium
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto profile-nav-tabs">
            <TabsTrigger value="videos" className="flex items-center gap-2"><Play className="w-4 h-4" />Videos ({videos.length})</TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2"><BookOpen className="w-4 h-4" />Courses ({courses.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="videos" className="mt-8">
            {videos.length > 0 ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) =>
              <VideoCard key={video.id} video={video} influencer={influencer} canAccessPremium={canAccessPremium} />
              )}
              </div> :

            <p className="text-center text-slate-500 py-12">This finfluencer hasn't posted any videos yet.</p>
            }
          </TabsContent>
          <TabsContent value="courses" className="mt-8">
            {courses.length > 0 ?
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) =>
              <CourseCard key={course.id} course={course} influencer={influencer} canAccessPremium={canAccessPremium} />
              )}
              </div> :

            <p className="text-center text-slate-500 py-12">This finfluencer hasn't created any courses yet.</p>
            }
          </TabsContent>
        </Tabs>
      </div>
    </div>);

}
