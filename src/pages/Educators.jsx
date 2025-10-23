
import React, { useState, useEffect, useCallback, useRef } from "react";
import { Educator, User, Subscription } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GraduationCap,
  Search,
  Filter,
  Users,
  BookOpen,
  Eye,
  CheckCircle,
  Award,
  Calendar,
  Star,
  Globe
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import EducatorCard from "../components/educators/EducatorCard";
import CourseCard from "../components/educators/CourseCard";
import WorkshopCard from "../components/educators/WorkshopCard";

// Sample educators data (fallback)
const sampleEducators = [
  {
    id: '1',
    display_name: 'Dr. Priya Sharma',
    bio: 'Financial Planning Expert | CFA Charterholder | 15+ Years Teaching Experience',
    specialization: ['Financial Planning', 'Retirement Planning', 'Tax Planning'],
    experience_years: 15,
    student_count: 2500,
    verified: true,
    certification: ['CFA', 'CFP', 'MBA Finance'],
    success_rate: 92.3,
    profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face',
    social_links: {
      youtube: 'https://youtube.com/@drpriyasharma',
      linkedin: 'https://linkedin.com/in/priyasharma',
      website: 'https://priyasharmafinance.com'
    },
    course_price_range: { min: 1999, max: 7999 },
    status: 'approved',
    teaching_style: 'practical',
    languages: ['English', 'Hindi'],
    rating: 4.8
  },
  {
    id: '2',
    display_name: 'Prof. Rajesh Kumar',
    bio: 'Investment Strategy Professor | Former Fund Manager | Equity Research Specialist',
    specialization: ['Investment Strategy', 'Equity Research', 'Portfolio Management'],
    experience_years: 20,
    student_count: 3200,
    verified: true,
    certification: ['CFA', 'FRM', 'PhD Finance'],
    success_rate: 89.7,
    profile_image_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    social_links: {
      linkedin: 'https://linkedin.com/in/rajeshkumar',
      website: 'https://rajeshkumarinvesting.com'
    },
    course_price_range: { min: 2999, max: 12999 },
    status: 'approved',
    teaching_style: 'mixed',
    languages: ['English', 'Hindi'],
    rating: 4.6
  },
  {
    id: '3',
    display_name: 'CA Meera Patel',
    bio: 'Chartered Accountant | Tax Planning Expert | Corporate Finance Trainer',
    specialization: ['Tax Planning', 'Corporate Finance', 'Accounting'],
    experience_years: 12,
    student_count: 1800,
    verified: true,
    certification: ['CA', 'CS', 'CMA'],
    success_rate: 94.1,
    profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    social_links: {
      youtube: 'https://youtube.com/@cameerepatel',
      linkedin: 'https://linkedin.com/in/meerapatel'
    },
    course_price_range: { min: 1499, max: 5999 },
    status: 'approved',
    teaching_style: 'theoretical',
    languages: ['English', 'Hindi', 'Gujarati'],
    rating: 4.9
  }
];

const sampleCourses = [
  {
    id: '1',
    educator_id: '1',
    title: 'Complete Financial Planning Masterclass',
    description: 'Learn comprehensive financial planning from goal setting to retirement',
    course_type: 'recorded_course',
    price: 4999,
    duration_hours: 12,
    current_enrollments: 450,
    category: 'financial_planning',
    difficulty_level: 'intermediate',
    status: 'approved',
    rating: 4.8,
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=300&h=200&fit=crop'
  },
  {
    id: '2',
    educator_id: '2',
    title: 'Advanced Investment Strategy Workshop',
    description: 'Interactive workshop on building winning investment strategies',
    course_type: 'live_workshop',
    price: 3999,
    duration_hours: 4,
    max_participants: 30,
    current_enrollments: 18,
    scheduled_date: '2024-01-30T15:00:00Z',
    category: 'investment_strategy',
    difficulty_level: 'advanced',
    status: 'approved',
    rating: 4.7,
    thumbnail_url: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop'
  }
];

export default function Educators() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [educators, setEducators] = useState([]);
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("educators");
  const isMountedRef = useRef(true);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      // Load user data first
      const [currentUser, userSub] = await Promise.all([
        User.me().catch(() => null),
        User.me().then((u) => u ? Subscription.filter({ user_id: u.id, status: 'active' }, '-created_date', 1) : []).catch(() => [])
      ]);

      if (!isMountedRef.current) return;

      setUser(currentUser);
      setSubscription(userSub[0] || null);

      // Use sample data primarily
      setEducators(sampleEducators);
      setCourses(sampleCourses);
      setWorkshops(sampleCourses.filter(c => c.course_type === 'live_workshop'));

      // Try to enhance with real data if possible
      try {
        const fetchedEducators = await Educator.filter({ status: 'approved' }, '-student_count').catch(() => []);

        if (isMountedRef.current && fetchedEducators.length > 0) {
          setEducators(fetchedEducators);
        }
      } catch (error) {
        console.log("Using sample data due to API issues:", error.message);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      if (isMountedRef.current) {
        setEducators(sampleEducators);
        setCourses(sampleCourses);
        setWorkshops(sampleCourses.filter(c => c.course_type === 'live_workshop'));
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

  const filteredEducators = educators.filter((educator) => {
    const matchesSearch = educator.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      educator.bio?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" ||
      educator.specialization?.some((spec) => spec.toLowerCase().includes(selectedCategory));
    return matchesSearch && matchesCategory;
  });

  const canAccessPremium = subscription && ['premium', 'vip'].includes(subscription.plan_type);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) =>
              <Skeleton key={i} className="h-80 w-full" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-8 h-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
              Financial Educators
            </h1>
          </div>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Learn from certified financial educators, join structured courses, and master financial planning
          </p>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center max-w-2xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search educators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-bar-input w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="all">All Specializations</option>
              <option value="financial">Financial Planning</option>
              <option value="investment">Investment Strategy</option>
              <option value="tax">Tax Planning</option>
              <option value="retirement">Retirement Planning</option>
              <option value="corporate">Corporate Finance</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full finfluencer-tabs">
          <TabsList className="grid w-full grid-cols-3 max-w-7xl mx-auto">
            <TabsTrigger value="educators">
              <GraduationCap className="w-4 h-4 mr-2" />
              Educators
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="w-4 h-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="workshops">
              <Calendar className="w-4 h-4 mr-2" />
              Workshops
            </TabsTrigger>
          </TabsList>

          {/* Educators Tab */}
          <TabsContent value="educators" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEducators.map((educator) =>
                <EducatorCard
                  key={educator.id}
                  educator={educator}
                  canAccessPremium={canAccessPremium}
                />
              )}
            </div>
          </TabsContent>

          {/* Courses Tab */}
          <TabsContent value="courses" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => {
                const educator = educators.find((ed) => ed.id === course.educator_id);
                return (
                  <CourseCard
                    key={course.id}
                    course={course}
                    educator={educator}
                    canAccessPremium={canAccessPremium}
                  />
                );
              })}
            </div>
          </TabsContent>

          {/* Workshops Tab */}
          <TabsContent value="workshops" className="mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workshops.map((workshop) => {
                const educator = educators.find((ed) => ed.id === workshop.educator_id);
                return (
                  <WorkshopCard
                    key={workshop.id}
                    workshop={workshop}
                    educator={educator}
                    canAccessPremium={canAccessPremium}
                  />
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Educational Disclaimer */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 mt-12">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800 mb-2">Educational Excellence</h3>
                <p className="text-sm text-blue-700">
                  All educators are verified professionals with relevant certifications and teaching experience.
                  Courses are designed for educational purposes and skill development. Please verify credentials
                  and choose courses that match your learning objectives and experience level.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
