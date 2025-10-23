
import React, { useState, useEffect } from 'react';
import { User, Advisor, AdvisorPost, AdvisorSubscription, AdvisorPlan, CommissionTracking, AdvisorReview, PayoutRequest } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ShieldCheck,
  Users,
  DollarSign,
  Star,
  PlusCircle,
  TrendingUp,
  Eye,
  Edit,
  FileText,
  CreditCard,
  Wallet,
  Clock,
  Calendar as CalendarIcon // Added CalendarIcon import
} from 'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import CreatePostModal from '../components/entity/CreatePostModal';
import PayoutRequestModal from '../components/entity/PayoutRequestModal';
import FinancialStatement from '../components/entity/FinancialStatement';
import CreateEventModal from '../components/events/CreateEventModal'; // Added CreateEventModal import

export default function AdvisorDashboard({ user: initialUser }) {
  const [user, setUser] = useState(null);
  const [advisor, setAdvisor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showPayoutRequest, setShowPayoutRequest] = useState(false);
  const [showCreateEvent, setShowCreateEvent] = useState(false); // Added state for CreateEventModal
  const [editingPost, setEditingPost] = useState(null); // Added state for editing post

  const [stats, setStats] = useState({
    totalSubscribers: 0,
    activeSubscribers: 0,
    totalEarnings: 0,
    availableBalance: 0,
    pendingPayouts: 0,
    avgRating: 0
  });

  // Helper function to generate page URLs - kept as it might be used elsewhere or planned for future.
  const createPageUrl = (pageName) => {
    switch (pageName) {
      case 'BecomeOrganizer':
        return '/become-organizer'; // Assuming this is the path for becoming an event organizer
      // Add other cases as needed for different page names
      default:
        // Default to a kebab-case version of the page name
        return `/${pageName.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()}`;
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);
      let advisorProfile;

      if (currentUser.app_role === 'super_admin' || currentUser.app_role === 'admin') {
        // ADMIN VIEW: Load the first available Advisor for testing.
        const profiles = await Advisor.list('', 1); // Fetch a single advisor
        advisorProfile = profiles[0];
        if(advisorProfile) {
          toast.info("Viewing as Admin: Displaying first available Advisor.", { duration: 5000 });
        } else {
          // If no advisors exist, show an empty dashboard for the admin to see the layout.
          // Set a dummy advisor profile for display purposes only.
          setAdvisor({ id: 'admin-preview', display_name: "Admin Preview", sebi_registration_number: "PREVIEW-000" });
          setIsLoading(false);
          toast.info("Viewing as Admin: No Advisors found to display.", { duration: 5000 });
          return; // Exit early as no actual advisor data to fetch
        }
      } else {
        // REGULAR USER VIEW: Load their own profile.
        const advisorProfiles = await Advisor.filter({ user_id: currentUser.id });
        advisorProfile = advisorProfiles[0];
      }

      if (!advisorProfile) {
        setAdvisor(null); // Triggers the 'Profile Required' message for non-admins (or if no advisors found even for admin in previous block)
        setIsLoading(false);
        return;
      }

      setAdvisor(advisorProfile);

      // Load all advisor data
      const [postsData, subscriptionsData, plansData, commissionsData, reviewsData, payoutRequestsData] = await Promise.all([
        AdvisorPost.filter({ advisor_id: advisorProfile.id }).catch(() => []),
        AdvisorSubscription.filter({ advisor_id: advisorProfile.id }).catch(() => []),
        AdvisorPlan.filter({ advisor_id: advisorProfile.id }).catch(() => []),
        CommissionTracking.filter({ advisor_id: advisorProfile.id }).catch(() => []),
        AdvisorReview.filter({ advisor_id: advisorProfile.id }).catch(() => []),
        PayoutRequest.filter({ entity_id: advisorProfile.id, entity_type: 'advisor' }).catch(() => [])
      ]);

      setPosts(postsData);
      setSubscriptions(subscriptionsData);
      setPlans(plansData); // Keep plans data if needed elsewhere, even if tab is removed
      setCommissions(commissionsData);
      setReviews(reviewsData);
      setPayoutRequests(payoutRequestsData);

      // Calculate stats
      const totalEarnings = commissionsData.reduce((sum, c) => sum + (c.advisor_payout || 0), 0);
      const totalPaidOut = payoutRequestsData
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + p.requested_amount, 0);
      const pendingPayouts = payoutRequestsData
        .filter(p => p.status === 'pending' || p.status === 'approved')
        .reduce((sum, p) => sum + p.requested_amount, 0);
      const availableBalance = totalEarnings - totalPaidOut - pendingPayouts;
      
      const activeSubscribers = subscriptionsData.filter(s => s.status === 'active').length;
      const ratingsSum = reviewsData.reduce((sum, r) => sum + r.rating, 0);
      const avgRating = ratingsSum > 0 ? ratingsSum / reviewsData.length : 0;

      setStats({
        totalSubscribers: subscriptionsData.length,
        activeSubscribers,
        totalEarnings,
        availableBalance: Math.max(0, availableBalance),
        pendingPayouts,
        avgRating: Math.round(avgRating * 10) / 10
      });

    } catch (error) {
      console.error('Error loading advisor dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEventCreated = () => {
    setShowCreateEvent(false);
    toast.success('Event created successfully! It will be reviewed by admins.');
    // Optionally refresh dashboard data if event creation affects any dashboard metrics
    // loadDashboard(); 
  };

  const getStatusBadge = (status) => {
    const config = {
      published: { color: 'bg-green-100 text-green-800', label: 'Published' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      processed: { color: 'bg-green-100 text-green-800', label: 'Processed' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' }
    };
    const { color, label } = config[status] || config.draft;
    return <Badge className={`${color} border-0`}>{label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!advisor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldCheck className="w-16 h-16 text-indigo-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">SEBI Advisor Registration Required</h2>
            <p className="text-slate-600 mb-6">
              Complete your SEBI advisor registration to access this dashboard.
            </p>
            <Button onClick={() => window.location.href = '/AdvisorRegistration'}>
              Register Now
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">SEBI Advisor Dashboard</h1>
            <p className="text-slate-600">Welcome back, {advisor.display_name}!</p>
            <div className="flex items-center gap-2 mt-2">
              <Badge className="bg-green-100 text-green-800 border-0">SEBI Registered</Badge>
              <span className="text-sm text-slate-500">#{advisor.sebi_registration_number}</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={() => setShowCreateEvent(true)} // Changed to open modal directly
              variant="outline"
              className="text-slate-900 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-slate-900 hover:border-blue-200 transition-all duration-300"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Organize Events
            </Button>
            <Button onClick={() => setShowCreatePost(true)}>
              <PlusCircle className="w-4 h-4 mr-2" />
              Create Advisory
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Active Subscribers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.activeSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CreditCard className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Subscribers</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalSubscribers}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-slate-900">₹{stats.totalEarnings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Wallet className="w-8 h-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Available Balance</p>
                  <p className="text-2xl font-bold text-slate-900">₹{stats.availableBalance.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Star className="w-8 h-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.avgRating}/5</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-transparent p-1 rounded-xl gap-2">
            <TabsTrigger 
              value="posts"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
            >
              My Posts
            </TabsTrigger>
            
            <TabsTrigger 
              value="plans"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
            >
              Subscription Plans
            </TabsTrigger>
            
            <TabsTrigger 
              value="subscribers"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
            >
              Subscribers
            </TabsTrigger>
            
            <TabsTrigger 
              value="financials"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
            >
              Financials
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
            >
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">My Advisories</h3>
              {/* Removed the redundant "Create Advisory" button here as it's available in the header */}
            </div>
            
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <Card key={post.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-semibold text-slate-800">{post.title}</h4>
                            {getStatusBadge(post.status)}
                            {post.recommendation_type && (
                              <Badge variant="outline" className={
                                post.recommendation_type === 'buy' ? 'text-green-600' :
                                post.recommendation_type === 'sell' ? 'text-red-600' : 'text-yellow-600'
                              }>
                                {post.recommendation_type?.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-600 text-sm mb-3">{post.content?.substring(0, 150)}...</p>
                          <div className="flex items-center text-xs text-slate-500">
                            {post.stock_symbol && (
                              <>
                                <span className="font-semibold">{post.stock_symbol}</span>
                                <span className="mx-2">•</span>
                              </>
                            )}
                            {post.target_price && (
                              <>
                                <span>Target: ₹{post.target_price}</span>
                                <span className="mx-2">•</span>
                              </>
                            )}
                            <span>{format(new Date(post.created_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => { setEditingPost(post); setShowCreatePost(true); }}>
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No advisories published yet.</p>
                    <Button onClick={() => setShowCreatePost(true)} className="mt-4">
                      Create Your First Advisory
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <h3 className="text-lg font-semibold">My Subscription Plans</h3>
            <div className="space-y-4">
              {plans.length > 0 ? (
                plans.map(plan => (
                  <Card key={plan.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-800">{plan.name}</h4>
                          <p className="text-sm text-slate-600">₹{plan.price?.toLocaleString() || 0} / {plan.billing_cycle}</p>
                          <p className="text-xs text-slate-500">{plan.description}</p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button size="sm" variant="outline">
                            <Edit className="w-3 h-3" />
                          </Button>
                          {/* Add logic for view/manage plan if available */}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <CreditCard className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No subscription plans created yet.</p>
                    <Button onClick={() => { /* Implement Create Plan Modal */ }} className="mt-4">
                      Create Your First Plan
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <h3 className="text-lg font-semibold">My Subscribers</h3>
            <div className="space-y-4">
              {subscriptions.length > 0 ? (
                subscriptions.map(sub => (
                  <Card key={sub.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-slate-800">Subscriber ID: {sub.user_id}</h4> {/* Ideally, fetch user display name */}
                          <p className="text-sm text-slate-600">Plan: {sub.plan_id}</p> {/* Ideally, fetch plan name */}
                          <p className="text-xs text-slate-500">Subscribed on: {format(new Date(sub.start_date), 'MMM d, yyyy')}</p>
                          {sub.end_date && <p className="text-xs text-slate-500">Ends on: {format(new Date(sub.end_date), 'MMM d, yyyy')}</p>}
                        </div>
                        {getStatusBadge(sub.status)}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No subscribers yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="financials" className="space-y-4">
            <FinancialStatement 
              entityType="advisor"
              entityId={advisor?.id}
              entityName={advisor?.display_name || 'Advisor'}
            />

            <div className="flex justify-between items-center mt-8">
              <h3 className="text-lg font-semibold">Payout Requests History</h3>
              <Button 
                onClick={() => setShowPayoutRequest(true)} 
                disabled={stats.availableBalance <= 0}
              >
                <Wallet className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Wallet className="w-8 h-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Available Balance</p>
                      <p className="text-2xl font-bold text-slate-900">₹{stats.availableBalance.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Pending Payouts</p>
                      <p className="text-2xl font-bold text-slate-900">₹{stats.pendingPayouts.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <TrendingUp className="w-8 h-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-slate-600">Total Earned</p>
                      <p className="text-2xl font-bold text-slate-900">₹{stats.totalEarnings.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payout Requests List */}
            <div className="space-y-4">
              {payoutRequests.length > 0 ? (
                payoutRequests.map(payout => (
                  <Card key={payout.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">₹{payout.requested_amount.toLocaleString()}</p>
                          <p className="text-sm text-slate-600">{format(new Date(payout.created_date), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-slate-500">{payout.payout_method}</p>
                        </div>
                        {getStatusBadge(payout.status)}
                      </div>
                      {payout.admin_notes && (
                        <p className="text-sm text-slate-600 mt-2">Admin Notes: {payout.admin_notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No payout requests yet.</p>
                    {stats.availableBalance > 0 && (
                      <Button onClick={() => setShowPayoutRequest(true)} className="mt-4">
                        Request Your First Payout
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {commissions.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={commissions.slice(-6)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="transaction_date" tickFormatter={(date) => format(new Date(date), 'MMM')} />
                      <YAxis />
                      <Tooltip formatter={(value) => [`₹${value}`, 'Earnings']} />
                      <Line type="monotone" dataKey="advisor_payout" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center p-8">
                    <TrendingUp className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-600">No revenue data available yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Create Event Modal */}
        {showCreateEvent && (
          <CreateEventModal
            open={showCreateEvent}
            onClose={() => setShowCreateEvent(false)}
            onEventCreated={handleEventCreated}
          />
        )}

        {/* Create/Edit Post Modal */}
        {showCreatePost && (
          <CreatePostModal
            open={showCreatePost}
            onClose={() => {
              setShowCreatePost(false);
              setEditingPost(null);
            }}
            onPostCreated={() => { // This will be called on both create and edit success
              setShowCreatePost(false);
              setEditingPost(null);
              loadDashboard(); // Refresh dashboard data after post is created/updated
            }}
            entityType="advisor"
            entityId={advisor.id}
            editingPost={editingPost}
          />
        )}

        {/* Payout Request Modal */}
        {showPayoutRequest && (
          <PayoutRequestModal
            open={showPayoutRequest}
            onClose={() => setShowPayoutRequest(false)}
            entityType="advisor"
            entityId={advisor.id}
            availableBalance={stats.availableBalance} // Pass availableBalance from stats
            onSuccess={loadDashboard} // Refresh dashboard data after successful payout request
          />
        )}
      </div>
    </div>
  );
}
