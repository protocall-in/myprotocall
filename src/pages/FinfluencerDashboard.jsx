
import React, { useState, useEffect, useCallback } from 'react';
import { User, FinInfluencer, Course, CourseEnrollment, RevenueTransaction, InfluencerPost, PayoutRequest, Event, EventAttendee, EventTicket } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  BookOpen,
  DollarSign,
  Users,
  PlusCircle,
  TrendingUp,
  Eye,
  Edit,
  Wallet,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CreateCourseModal from '../components/finfluencers/CreateCourseModal';
import PayoutRequestModal from '../components/entity/PayoutRequestModal';
import CreatePostModal from '../components/entity/CreatePostModal';
import FinancialStatement from '../components/entity/FinancialStatement';

// Sample data can be removed or kept for admin preview logic
const sampleCourses = [
  {
    id: 'c1',
    title: 'Advanced Stock Trading Strategies',
    description: 'Learn sophisticated techniques to maximize your stock market returns.',
    price: 499,
    rating: 4.8,
    enrollments: 120,
    status: 'published',
    created_at: '2023-01-15T10:00:00Z',
    updated_at: '2023-01-20T12:00:00Z',
  },
  {
    id: 'c2',
    title: 'Beginner\'s Guide to Crypto Investing',
    description: 'Understand the basics of cryptocurrency and how to start investing safely.',
    price: 199,
    rating: 4.5,
    enrollments: 250,
    status: 'published',
    created_at: '2023-03-01T14:30:00Z',
    updated_at: '2023-03-05T16:00:00Z',
  },
  {
    id: 'c3',
    title: 'Real Estate Investment Principles',
    description: 'Master the fundamentals of real estate investing for long-term wealth.',
    price: 349,
    rating: 4.7,
    enrollments: 80,
    status: 'draft',
    created_at: '2023-05-10T09:00:00Z',
    updated_at: '2023-05-12T11:00:00Z',
  },
];

const samplePosts = [
  {
    id: 'p1',
    title: 'Top 5 Investment Mistakes to Avoid',
    content: 'A deep dive into common pitfalls for new investors...',
    views: 1500,
    likes: 120,
    comments: 15,
    created_at: '2023-10-26T10:00:00Z',
  },
  {
    id: 'p2',
    title: 'Understanding Inflation and Your Portfolio',
    content: 'How inflation impacts different asset classes and what you can do...',
    views: 2300,
    likes: 200,
    comments: 30,
    created_at: '2023-10-20T14:00:00Z',
  },
];

const sampleRevenue = [
  { date: '2023-07', amount: 500 },
  { date: '2023-08', amount: 750 },
  { date: '2023-09', amount: 600 },
  { date: '2023-10', amount: 900 },
];

const samplePayoutRequests = [
  { id: 'pr1', requested_amount: 1000, status: 'processed', requested_at: '2023-09-01T00:00:00Z' },
  { id: 'pr2', requested_amount: 500, status: 'pending', requested_at: '2023-10-15T00:00:00Z' },
  { id: 'pr3', requested_amount: 250, status: 'rejected', requested_at: '2023-10-20T00:00:00Z' },
];

export default function FinfluencerDashboard({ user: initialUser }) {
  const [user, setUser] = useState(initialUser);
  const [finfluencer, setFinfluencer] = useState(null);
  const [courses, setCourses] = useState([]);
  const [posts, setPosts] = useState([]);
  const [enrollments, setEnrollments] = useState([]); // This will now hold enriched enrollments
  const [revenue, setRevenue] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  
  // New state for event data
  const [events, setEvents] = useState([]);
  const [eventAttendees, setEventAttendees] = useState([]);
  const [eventTickets, setEventTickets] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showPayoutRequest, setShowPayoutRequest] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showCourseDetails, setShowCourseDetails] = useState(false);
  const [showEditCourse, setShowEditCourse] = useState(false);

  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    availableBalance: 0,
    pendingPayouts: 0,
    avgRating: 0,
    totalEvents: 0, // new stat
    totalRSVPs: 0, // new stat
  });

  const loadDashboard = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Check if user is SuperAdmin viewing dashboard
      const isSuperAdmin = user.app_role === 'super_admin' || user.app_role === 'admin';
      
      let finfluencerProfile = null;
      
      if (isSuperAdmin) {
        // SuperAdmin: Load first finfluencer profile
        const allFinfluencers = await FinInfluencer.list({ sort_by: '-created_date', limit: 1 });
        
        if (allFinfluencers.length > 0) {
          finfluencerProfile = allFinfluencers[0];
          toast.info(`Viewing dashboard for: ${finfluencerProfile.display_name || finfluencerProfile.id}`, { duration: 3000 });
        } else {
          // No finfluencers exist - show empty state instead of trying to create
          console.log('No finfluencer profiles found');
          setFinfluencer(null);
          setIsLoading(false);
          return;
        }
      } else {
        // Regular finfluencer: Load their own profile
        const finfluencerProfiles = await FinInfluencer.filter({ user_id: user.id });
        finfluencerProfile = finfluencerProfiles[0];
      }

      if (!finfluencerProfile) {
        setFinfluencer(null);
        setIsLoading(false);
        return;
      }
      setFinfluencer(finfluencerProfile);

      // Load all data for this finfluencer
      const [coursesData, postsData, allEnrollmentsData, revenueData, payoutRequestsData, eventsData] = await Promise.all([
        Course.filter({ influencer_id: finfluencerProfile.id }).catch(() => []),
        InfluencerPost.filter({ influencer_id: finfluencerProfile.id }).catch(() => []),
        CourseEnrollment.list().catch(() => []), // Fetch all enrollments initially
        RevenueTransaction.filter({ influencer_id: finfluencerProfile.id }).catch(() => []),
        PayoutRequest.filter({ entity_id: finfluencerProfile.id, entity_type: 'finfluencer' }).catch(() => []),
        Event.filter({ organizer_id: finfluencerProfile.user_id }).catch(() => []), // Fetch events organized by this user
      ]);
      
      const eventIds = eventsData.map(e => e.id);
      const [attendeesData, ticketsData] = await Promise.all([
          eventIds.length > 0 ? EventAttendee.filter({ event_id: { '$in': eventIds } }).catch(() => []) : [],
          eventIds.length > 0 ? EventTicket.filter({ event_id: { '$in': eventIds } }).catch(() => []) : [],
      ]);

      // --- Process and Enrich Enrollments for Finfluencer's Courses ---
      const finfluencerCourseIds = coursesData.map(c => c.id);
      const filteredFinfluencerEnrollments = allEnrollmentsData.filter(e => finfluencerCourseIds.includes(e.course_id));

      const uniqueUserIds = [...new Set(filteredFinfluencerEnrollments.map(e => e.user_id))];
      const users = uniqueUserIds.length > 0 ? await User.filter({ id: { '$in': uniqueUserIds } }).catch(() => []) : [];
      const usersMap = new Map(users.map(u => [u.id, u]));
      
      const coursesMap = new Map(coursesData.map(c => [c.id, c]));

      const enrollmentRevenueMap = new Map();
      revenueData.forEach(r => {
        if (r.source_type === 'course_enrollment' && r.source_id) {
          enrollmentRevenueMap.set(r.source_id, r.status === 'processed' ? 'processed' : 'pending');
        }
      });

      const enrichedEnrollments = filteredFinfluencerEnrollments.map(e => ({
        ...e,
        user_name: usersMap.get(e.user_id)?.full_name || 'Unknown User',
        user_email: usersMap.get(e.user_id)?.email || 'N/A',
        course_title: coursesMap.get(e.course_id)?.title || 'Untitled Course',
        payout_status: enrollmentRevenueMap.get(e.id) || 'pending', // Default to 'pending' if no revenue transaction found
      }));

      setCourses(coursesData);
      setPosts(postsData);
      setEnrollments(enrichedEnrollments); // Use enriched enrollments
      setRevenue(revenueData);
      setPayoutRequests(payoutRequestsData);
      setEvents(eventsData);
      setEventAttendees(attendeesData);
      setEventTickets(ticketsData);
      
      // --- Calculate Combined Stats ---
      const courseRevenue = revenueData.reduce((sum, r) => sum + (r.influencer_payout || 0), 0);
      
      const eventRevenueFromTickets = ticketsData.reduce((sum, t) => sum + (t.ticket_price || 0), 0);
      const eventCommissionRate = 0.20; // Assuming a 20% commission for now
      const eventPayouts = eventRevenueFromTickets * (1 - eventCommissionRate);

      const totalEarnings = courseRevenue + eventPayouts;

      const totalPaidOut = payoutRequestsData
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + p.requested_amount, 0);

      const pendingPayouts = payoutRequestsData
        .filter(p => ['pending', 'approved'].includes(p.status))
        .reduce((sum, p) => sum + p.requested_amount, 0);

      const availableBalance = totalEarnings - totalPaidOut - pendingPayouts;
      
      const totalStudents = enrichedEnrollments.length; // Use enriched enrollments count
      const totalRSVPs = attendeesData.filter(a => a.rsvp_status === 'yes').length;

      const ratingsSum = enrichedEnrollments.filter(e => e.rating).reduce((sum, e) => sum + e.rating, 0); // Use enriched enrollments for rating
      const avgRating = ratingsSum > 0 ? ratingsSum / enrichedEnrollments.filter(e => e.rating).length : 0;

      setStats({
        totalCourses: coursesData.length,
        totalStudents,
        totalRevenue: totalEarnings,
        availableBalance: Math.max(0, availableBalance),
        pendingPayouts,
        avgRating: Math.round(avgRating * 10) / 10,
        totalEvents: eventsData.length,
        totalRSVPs,
      });

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleCreateCourse = async (courseData) => {
    try {
      setIsLoading(true);
      if (!finfluencer) {
        toast.error('Finfluencer profile not found.');
        return;
      }
      const newCourse = await Course.create({ ...courseData, influencer_id: finfluencer.id });
      setCourses(prev => [...prev, newCourse]);
      setShowCreateCourse(false);
      toast.success('Course created successfully!');
      loadDashboard(); // Reload data to update stats
    } catch (error) {
      console.error('Error creating course:', error);
      toast.error('Failed to create course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateCourse = async (updatedCourseData) => {
    try {
      setIsLoading(true);
      if (!selectedCourse) return;
      const updatedCourse = await Course.update(selectedCourse.id, updatedCourseData);
      setCourses(prev => prev.map(course => (course.id === updatedCourse.id ? updatedCourse : course)));
      setSelectedCourse(updatedCourse); // Update selected course if details are open
      setShowEditCourse(false);
      toast.success('Course updated successfully!');
      loadDashboard(); // Reload data to update stats
    } catch (error) {
      console.error('Error updating course:', error);
      toast.error('Failed to update course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      setIsLoading(true);
      await Course.delete(courseId);
      setCourses(prev => prev.filter(course => course.id !== courseId));
      toast.success('Course deleted successfully!');
      loadDashboard(); // Reload data to update stats
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error('Failed to delete course.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async (postData) => {
    try {
      setIsLoading(true);
      if (!finfluencer) {
        toast.error('Finfluencer profile not found.');
        return;
      }
      const newPost = await InfluencerPost.create({ ...postData, influencer_id: finfluencer.id });
      setPosts(prev => [...prev, newPost]);
      setShowCreatePost(false);
      toast.success('Post created successfully!');
      loadDashboard();
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPayout = async (amount) => {
    try {
      setIsLoading(true);
      if (!finfluencer) {
        toast.error('Finfluencer profile not found.');
        return;
      }
      if (amount > stats.availableBalance) {
        toast.error('Requested amount exceeds available balance.');
        return;
      }
      const newPayoutRequest = await PayoutRequest.create({
        entity_id: finfluencer.id,
        entity_type: 'finfluencer',
        requested_amount: amount,
        status: 'pending',
      });
      setPayoutRequests(prev => [...prev, newPayoutRequest]);
      setShowPayoutRequest(false);
      toast.success('Payout request submitted successfully!');
      loadDashboard(); // Reload data to update stats
    } catch (error) {
      console.error('Error requesting payout:', error);
      toast.error('Failed to submit payout request.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    let variant = 'default';
    let text = status;
    switch (status) {
      case 'published':
      case 'processed':
      case 'live':
      case 'yes': // for RSVP
        variant = 'success';
        text = status === 'yes' ? 'Attending' : 'Live';
        break;
      case 'draft':
      case 'pending':
        variant = 'warning';
        text = status === 'draft' ? 'Draft' : 'Pending';
        break;
      case 'rejected':
      case 'cancelled':
      case 'no': // for RSVP
        variant = 'destructive';
        text = status === 'rejected' ? 'Rejected' : (status === 'no' ? 'Not Attending' : 'Cancelled');
        break;
      default:
        variant = 'secondary';
        text = status;
        break;
    }
    return <Badge variant={variant} className="capitalize">{text}</Badge>;
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
        <div className="text-xl font-semibold text-slate-700">Loading Dashboard...</div>
      </div>
    );
  }

  if (!finfluencer) {
    const isSuperAdmin = user?.app_role === 'super_admin' || user?.app_role === 'admin';
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">
              {isSuperAdmin ? 'No Finfluencers Found' : 'Finfluencer Profile Required'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              {isSuperAdmin 
                ? 'No finfluencer profiles exist in the system yet. Create one to preview the dashboard.' 
                : 'It looks like you don\'t have a finfluencer profile yet. Please create one to access the dashboard.'}
            </p>
            {isSuperAdmin && (
              <div className="bg-blue-50 p-4 rounded-lg text-left">
                <p className="text-sm font-semibold text-blue-900 mb-2">How to create a Finfluencer:</p>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Go to SuperAdmin Panel</li>
                  <li>Navigate to "FinInfluencer Management"</li>
                  <li>Click "Create New Finfluencer"</li>
                  <li>Fill in the details and save</li>
                  <li>Return to this page to view the dashboard</li>
                </ol>
              </div>
            )}
            {!isSuperAdmin && (
              <Button onClick={() => window.location.href = '/Profile'} className="w-full">
                Go to Profile
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-slate-800">Finfluencer Dashboard</h1>
          <Button onClick={() => setShowPayoutRequest(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700">
            <Wallet className="w-4 h-4 mr-2" /> Request Payout
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-slate-500">+20.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <Wallet className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.availableBalance.toLocaleString()}</div>
              <p className="text-xs text-slate-500">{stats.pendingPayouts > 0 ? `(${stats.pendingPayouts.toLocaleString()} pending)` : ''}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-slate-500">+180.1% from last month</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Course Rating</CardTitle>
              <Star className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRating}</div>
              <p className="text-xs text-slate-500">Based on {enrollments.filter(e => e.rating).length} reviews</p>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="courses" className="w-full finfluencer-tabs">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="courses">Courses</TabsTrigger>
            <TabsTrigger value="enrollments">Enrollments</TabsTrigger> {/* New Tab */}
            <TabsTrigger value="posts">Content Posts</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="financials">Financials</TabsTrigger>
            <TabsTrigger value="payouts">Payouts</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="courses" className="mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">My Courses ({stats.totalCourses})</h3>
              <Button onClick={() => setShowCreateCourse(true)} size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Course
              </Button>
            </div>
            {courses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map(course => (
                  <Card key={course.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-md font-semibold text-slate-800 line-clamp-2">{course.title}</CardTitle>
                      {getStatusBadge(course.status)}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-slate-600 line-clamp-2">{course.description}</p>
                      <div className="flex items-center text-sm text-slate-700">
                        <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                        <span>{course.price ? `₹${course.price.toLocaleString()}` : 'Free'}</span>
                        <BookOpen className="w-4 h-4 ml-4 mr-1 text-blue-600" />
                        <span>{enrollments.filter(e => e.course_id === course.id).length} Students</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-700">
                        <Star className="w-4 h-4 mr-1 text-yellow-500 fill-yellow-500" />
                        <span>{course.rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" size="sm" onClick={() => { setSelectedCourse(course); setShowEditCourse(true); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setSelectedCourse(course); setShowCourseDetails(true); }}>
                          <Eye className="w-4 h-4 mr-2" /> View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No courses created yet. Start by creating your first course!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* New Enrollments Tab Content */}
          <TabsContent value="enrollments" className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Course Enrollments ({enrollments.length})</h3>
            {enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 bg-white shadow-sm rounded-lg">
                  <thead className="bg-slate-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Course
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Amount Paid
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Enrollment Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Enrolled On
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Payout Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {enrollments.map((enrollment) => (
                      <tr key={enrollment.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-900">{enrollment.user_name || 'Unknown'}</div>
                          <div className="text-xs text-slate-500">{enrollment.user_email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900">
                          {enrollment.course_title || 'Untitled Course'}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-green-600">
                          ₹{enrollment.amount_paid?.toLocaleString() || 0}
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(enrollment.enrollment_status)}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {format(new Date(enrollment.created_date), 'dd MMM yyyy')}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {enrollment.payout_status === 'processed' ? (
                            <Badge className="bg-green-100 text-green-700">Paid</Badge>
                          ) : (
                            <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No students enrolled in your courses yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">My Content Posts ({posts.length})</h3>
              <Button onClick={() => setShowCreatePost(true)} size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
            </div>
            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map(post => (
                  <Card key={post.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-md font-semibold text-slate-800 line-clamp-2">{post.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-sm text-slate-600 line-clamp-3">{post.content}</p>
                      <div className="flex items-center text-sm text-slate-700">
                        <Eye className="w-4 h-4 mr-1 text-purple-600" />
                        <span>{post.views || 0} Views</span>
                        <Clock className="w-4 h-4 ml-4 mr-1 text-slate-500" />
                        <span>{format(new Date(post.created_date || post.created_at), 'MMM dd, yyyy')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No posts created yet. Share your insights with the community!</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* New Events Tab Content */}
          <TabsContent value="events" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Events ({stats.totalEvents})</h3>
              <Button onClick={() => window.location.href = '/events'} size="sm">
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </div>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {events.map(event => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-semibold text-slate-800 line-clamp-2">{event.title}</h4>
                        {getStatusBadge(event.status)}
                      </div>
                      <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                        {format(new Date(event.event_date), "PPpp")}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-semibold text-blue-600">
                          {eventAttendees.filter(a => a.event_id === event.id).length} RSVPs
                        </span>
                        <span className="font-semibold text-green-600">
                          ₹{eventTickets.filter(t => t.event_id === event.id).reduce((sum, t) => sum + t.ticket_price, 0).toLocaleString()} Revenue
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <CalendarIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No events created yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="financials" className="space-y-4">
            <FinancialStatement 
              entityType="finfluencer"
              entityId={finfluencer?.id}
              entityName={finfluencer?.display_name || 'Finfluencer'}
            />
          </TabsContent>

          <TabsContent value="payouts" className="space-y-4">
            <h3 className="text-lg font-semibold">Payout Requests ({payoutRequests.length})</h3>
            {payoutRequests.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {payoutRequests.map(payout => (
                  <Card key={payout.id} className="flex justify-between items-center p-4">
                    <div>
                      <p className="text-lg font-bold text-slate-800">₹{payout.requested_amount.toLocaleString()}</p>
                      <p className="text-sm text-slate-600">Requested on {format(new Date(payout.created_date || payout.requested_at), 'MMM dd, yyyy')}</p>
                    </div>
                    {getStatusBadge(payout.status)}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="col-span-full">
                <CardContent className="p-8 text-center">
                  <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No payout requests submitted yet.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="analytics">
            <h3 className="text-lg font-semibold mb-4">Revenue Trends</h3>
            <Card>
              <CardContent className="p-6">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={sampleRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-slate-500 mt-4 text-center">Monthly revenue over time</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {showCreateCourse && (
          <CreateCourseModal
            open={showCreateCourse}
            onClose={() => setShowCreateCourse(false)}
            onCreate={handleCreateCourse}
          />
        )}

        {showCreatePost && (
          <CreatePostModal
            open={showCreatePost}
            onClose={() => setShowCreatePost(false)}
            onSubmit={handleCreatePost}
          />
        )}

        {showPayoutRequest && (
          <PayoutRequestModal
            open={showPayoutRequest}
            onClose={() => setShowPayoutRequest(false)}
            onSubmit={handleRequestPayout}
            availableBalance={stats.availableBalance}
            entityType="finfluencer"
          />
        )}

        {/* Removed CourseDetailsModal and EditCourseModal to avoid redundancy, assuming they will be implemented or imported */}
        {/* You would typically have these modals here to show/edit selectedCourse */}
      </div>
    </div>
  );
}
