
import React, { useState, useEffect, useCallback } from 'react';
import { User, EventOrganizer, Event, EventAttendee, EventTicket, EventCommissionTracking, PayoutRequest, Advisor, FinInfluencer, Educator } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar as CalendarIcon,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  Eye,
  Edit,
  Wallet,
  CheckCircle,
  Clock,
  Star,
  Award,
  Crown } from
'lucide-react';
import { toast } from "sonner";
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';

import CreateEventModal from '../components/events/CreateEventModal';
import EditEventModal from '../components/events/EditEventModal';
import TicketCheckIn from '../components/events/TicketCheckIn';
import PayoutRequestModal from '../components/entity/PayoutRequestModal';
import EventRefundManager from '../components/organizer/EventRefundManager';
// The import for EventDetailsModal has been removed as per the outline.
import EventRSVPModal from '../components/events/EventRSVPModal'; // New import
import EventAnalyticsDashboard from '../components/organizer/EventAnalyticsDashboard'; // New import for analytics

export default function OrganizerDashboard() {
  const [user, setUser] = useState(null);
  const [organizer, setOrganizer] = useState(null);
  const [entityProfile, setEntityProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [commissionTracking, setCommissionTracking] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateEvent, setShowCreateEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [showRSVPModal, setShowRSVPModal] = useState(false); // New state variable
  // The state variable showEventDetails has been removed as per the outline.
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      const allowedRoles = ['advisor', 'finfluencer', 'educator', 'admin', 'super_admin'];
      const hasRoleAccess = allowedRoles.includes(currentUser.app_role);

      let organizerProfile = null;
      try {
        const organizerRecords = await EventOrganizer.filter({
          user_id: currentUser.id,
          status: 'approved'
        });
        organizerProfile = organizerRecords[0] || null;
      } catch (error) {
        console.log('No EventOrganizer profile found, checking role-based access');
      }

      if (!organizerProfile && hasRoleAccess) {
        organizerProfile = await fetchEntityProfile(currentUser);
      }

      if (!hasRoleAccess && !organizerProfile) {
        toast.error('You need to be an approved organizer to access this page');
        window.location.href = createPageUrl('BecomeOrganizer');
        return;
      }

      setOrganizer(organizerProfile);
      setEntityProfile(organizerProfile);

      const userEvents = await Event.filter({ organizer_id: currentUser.id });
      setEvents(userEvents);

      const commissions = await EventCommissionTracking.filter({ organizer_id: currentUser.id });
      setCommissionTracking(commissions);

      const payouts = await PayoutRequest.filter({
        user_id: currentUser.id,
        entity_type: 'event'
      });
      setPayoutRequests(payouts);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEntityProfile = async (user) => {
    try {
      let profile = null;

      switch (user.app_role) {
        case 'advisor':
          const advisors = await Advisor.filter({ user_id: user.id, status: 'approved' });
          profile = advisors[0];
          break;
        case 'finfluencer':
          const finfluencers = await FinInfluencer.filter({ user_id: user.id, status: 'approved' });
          profile = finfluencers[0];
          break;
        case 'educator':
          const educators = await Educator.filter({ user_id: user.id, status: 'approved' });
          profile = educators[0];
          break;
        case 'admin':
        case 'super_admin':
          profile = {
            display_name: user.display_name || user.full_name,
            bio: 'Platform Administrator',
            profile_image_url: user.profile_image_url,
            events_organized: 0,
            total_attendees: 0,
            rating: 5,
            verified: true
          };
          break;
      }

      if (!profile && ['advisor', 'finfluencer', 'educator'].includes(user.app_role)) {
        profile = {
          display_name: user.display_name || user.full_name,
          bio: `${user.app_role.charAt(0).toUpperCase() + user.app_role.slice(1)} Profile`,
          profile_image_url: user.profile_image_url,
          events_organized: 0,
          total_attendees: 0,
          verified: true
        };
      }

      return profile;
    } catch (error) {
      console.error('Error fetching entity profile:', error);
      return null;
    }
  };

  const getCommissionRate = () => {
    if (organizer?.commission_rate) return organizer.commission_rate;
    if (organizer?.commission_override_rate) return organizer.commission_override_rate;
    return 20;
  };

  const stats = {
    totalEvents: events.length,
    upcomingEvents: events.filter((e) => new Date(e.event_date) > new Date() && e.status === 'approved').length,
    completedEvents: events.filter((e) => e.status === 'completed').length,
    totalRevenue: commissionTracking.reduce((sum, c) => sum + (c.organizer_payout || 0), 0),
    pendingPayouts: payoutRequests.filter((p) => p.status === 'pending').length,
    totalAttendees: events.reduce((sum, e) => {
      const eventCommission = commissionTracking.find((c) => c.event_id === e.id);
      return sum + (eventCommission?.total_tickets_sold || 0);
    }, 0)
  };

  // This function replaces the old handleViewEventDetails, now specifically for RSVP modal
  const handleViewRSVPDetails = (event) => {
    setSelectedEvent(event);
    setShowRSVPModal(true);
  };

  const handleEditEvent = (event) => {
    setSelectedEvent(event);
    setShowEditEvent(true);
  };

  const handlePayoutSubmit = async (payoutData) => {
    try {
      await PayoutRequest.create({
        user_id: user.id,
        entity_type: 'event',
        entity_id: user.id,
        requested_amount: payoutData.requested_amount,
        available_balance: stats.totalRevenue,
        payout_method: payoutData.payout_method,
        bank_details: payoutData.bank_details,
        upi_id: payoutData.upi_id,
        paypal_email: payoutData.paypal_email,
        status: 'pending'
      });

      toast.success('Payout request submitted successfully!');
      setShowPayoutModal(false);
      loadDashboardData();
    } catch (error) {
      console.error('Error submitting payout request:', error);
      toast.error('Failed to submit payout request');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>);

  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Organizer Dashboard</h1>
            <p className="text-slate-600">Manage your events and track performance</p>
          </div>
          <Button
            onClick={() => setShowCreateEvent(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">

            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </div>

        <Card className="mb-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white/25 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {entityProfile?.profile_image_url ?
                <img src={entityProfile.profile_image_url} alt={entityProfile.display_name} className="w-20 h-20 rounded-full object-cover" /> :

                entityProfile?.display_name?.charAt(0)?.toUpperCase() || user?.display_name?.charAt(0) || 'O'
                }
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold">{entityProfile?.display_name || user?.display_name || 'Organizer'}</h2>
                  {entityProfile?.verified &&
                  <Badge className="bg-green-500 text-white">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  }
                </div>
                <p className="text-blue-100 mt-1">{entityProfile?.bio || 'Event Organizer'}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                  <span className="text-xl font-bold">{entityProfile?.rating?.toFixed(1) || 'N/A'}</span>
                </div>
                <p className="text-blue-100 text-sm">Organizer Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Events</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalEvents}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Attendees</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.totalAttendees}</p>
                </div>
                <Users className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-slate-900">{stats.pendingPayouts}</p>
                </div>
                <Wallet className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-semibold text-slate-900">Your Commission Rate</p>
                  <p className="text-sm text-slate-600">
                    Platform: {getCommissionRate()}% | You earn: {100 - getCommissionRate()}% of ticket sales
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPayoutModal(true)}
                disabled={stats.totalRevenue <= 0}
                className="bg-white hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300">

                <Wallet className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 gap-3 bg-transparent p-0">
            <TabsTrigger value="events" className="data-[state=active]:bg-background data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
              My Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-background data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="revenue" className="data-[state=active]:bg-background data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
              Revenue
            </TabsTrigger>
            <TabsTrigger value="payouts" className="data-[state=active]:bg-background data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
              Payouts
            </TabsTrigger>
            <TabsTrigger value="refunds" className="data-[state=active]:bg-background data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
              Refunds
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            {events.length === 0 ?
            <Card>
                <CardContent className="p-12 text-center">
                  <CalendarIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Events Yet</h3>
                  <p className="text-slate-600 mb-6">Create your first event to get started</p>
                  <Button
                  onClick={() => setShowCreateEvent(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">

                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                  </Button>
                </CardContent>
              </Card> :

            <div className="grid gap-4">
                {events.map((event) =>
              <Card key={event.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                            <Badge variant="outline" className={
                        event.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                        event.status === 'pending_approval' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        event.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        event.status === 'completed' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-slate-50 text-slate-700 border-slate-200'
                        }>
                              {event.status.replace('_', ' ').toUpperCase()}
                            </Badge>
                            {event.is_premium &&
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium - ₹{event.ticket_price}
                              </Badge>
                        }
                          </div>
                          <div className="flex items-center gap-6 text-sm text-slate-600">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              {format(new Date(event.event_date), 'PPP p')}
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {commissionTracking.find((c) => c.event_id === event.id)?.total_tickets_sold || 0} attendees
                            </div>
                            {event.is_premium &&
                        <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                ₹{commissionTracking.find((c) => c.event_id === event.id)?.organizer_payout?.toLocaleString() || 0} revenue
                              </div>
                        }
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewRSVPDetails(event)}
                            className="bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-400 hover:text-blue-700 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            disabled={event.status === 'completed'}
                            className="bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:border-purple-400 hover:text-purple-700 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:border-slate-300"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              )}
              </div>
            }
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <EventAnalyticsDashboard
              events={events}
              commissionTracking={commissionTracking}
            />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Revenue Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-900">Total Revenue</p>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      ₹{stats.totalRevenue.toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">All-time earnings</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-900">Average per Event</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      ₹{commissionTracking.length > 0 ? Math.round(stats.totalRevenue / commissionTracking.length).toLocaleString() : 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Per event revenue</p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <p className="text-sm font-medium text-purple-900">Total Tickets Sold</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-700">
                      {commissionTracking.reduce((sum, c) => sum + (c.total_tickets_sold || 0), 0)}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">Across all events</p>
                  </div>
                </div>

                {/* Revenue by Event Table */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Revenue by Event</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="text-left p-4 font-semibold text-slate-700">Event</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Date</th>
                          <th className="text-center p-4 font-semibold text-slate-700">Tickets Sold</th>
                          <th className="text-center p-4 font-semibold text-slate-700">Gross Revenue</th>
                          <th className="text-center p-4 font-semibold text-slate-700">Platform Fee</th>
                          <th className="text-right p-4 font-semibold text-slate-700">Your Payout</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commissionTracking.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-500">
                              No revenue data available yet
                            </td>
                          </tr>
                        ) : (
                          commissionTracking.map((commission) => {
                            const event = events.find((e) => e.id === commission.event_id);
                            return (
                              <tr key={commission.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                  <div>
                                    <p className="font-medium text-slate-900">{event?.title || 'Unknown Event'}</p>
                                    {event?.is_premium && (
                                      <Badge className="mt-1 bg-purple-100 text-purple-700 text-xs">Premium</Badge>
                                    )}
                                  </div>
                                </td>
                                <td className="p-4 text-slate-600">
                                  {event?.event_date ? format(new Date(event.event_date), 'MMM dd, yyyy') : 'N/A'}
                                </td>
                                <td className="p-4 text-center font-medium text-slate-900">
                                  {commission.total_tickets_sold || 0}
                                </td>
                                <td className="p-4 text-center font-medium text-slate-900">
                                  ₹{(commission.gross_revenue || 0).toLocaleString()}
                                </td>
                                <td className="p-4 text-center text-slate-600">
                                  ₹{(commission.platform_commission || 0).toLocaleString()}
                                  <span className="text-xs text-slate-500 ml-1">
                                    ({commission.platform_commission_rate || 0}%)
                                  </span>
                                </td>
                                <td className="p-4 text-right">
                                  <span className="font-bold text-green-600">
                                    ₹{(commission.organizer_payout || 0).toLocaleString()}
                                  </span>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                      {commissionTracking.length > 0 && (
                        <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                          <tr>
                            <td colSpan="2" className="p-4 font-bold text-slate-900">Total</td>
                            <td className="p-4 text-center font-bold text-slate-900">
                              {commissionTracking.reduce((sum, c) => sum + (c.total_tickets_sold || 0), 0)}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-900">
                              ₹{commissionTracking.reduce((sum, c) => sum + (c.gross_revenue || 0), 0).toLocaleString()}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-900">
                              ₹{commissionTracking.reduce((sum, c) => sum + (c.platform_commission || 0), 0).toLocaleString()}
                            </td>
                            <td className="p-4 text-right font-bold text-green-600">
                              ₹{stats.totalRevenue.toLocaleString()}
                            </td>
                          </tr>
                        </tfoot>
                      )}
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payouts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Payout History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-6 rounded-xl border border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Clock className="w-5 h-5 text-yellow-600" />
                      </div>
                      <p className="text-sm font-medium text-yellow-900">Pending Payouts</p>
                    </div>
                    <p className="text-3xl font-bold text-yellow-700">
                      {stats.pendingPayouts}
                    </p>
                    <p className="text-xs text-yellow-600 mt-1">Awaiting approval</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-green-900">Total Paid Out</p>
                    </div>
                    <p className="text-3xl font-bold text-green-700">
                      ₹{payoutRequests.filter((p) => p.status === 'processed').reduce((sum, p) => sum + (p.requested_amount || 0), 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600 mt-1">Successfully processed</p>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-sm font-medium text-blue-900">Available Balance</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-700">
                      ₹{(stats.totalRevenue - payoutRequests.filter((p) => p.status === 'processed' || p.status === 'pending').reduce((sum, p) => sum + (p.requested_amount || 0), 0)).toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">Ready to withdraw</p>
                  </div>
                </div>

                {/* Payout Requests Table */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900">Payout Requests</h3>
                    <Button
                      size="sm"
                      onClick={() => setShowPayoutModal(true)}
                      disabled={stats.totalRevenue <= 0}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Request Payout
                    </Button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 border-b-2 border-slate-200">
                        <tr>
                          <th className="text-left p-4 font-semibold text-slate-700">Request Date</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Amount</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Status</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Payment Method</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Processed Date</th>
                          <th className="text-left p-4 font-semibold text-slate-700">Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payoutRequests.length === 0 ? (
                          <tr>
                            <td colSpan="6" className="text-center py-8 text-slate-500">
                              No payout requests yet
                            </td>
                          </tr>
                        ) : (
                          payoutRequests
                            .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                            .map((payout) => (
                              <tr key={payout.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                <td className="p-4 text-slate-600">
                                  {format(new Date(payout.created_date), 'MMM dd, yyyy')}
                                </td>
                                <td className="p-4">
                                  <span className="font-bold text-slate-900">
                                    ₹{(payout.requested_amount || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="p-4">
                                  <Badge
                                    variant="outline"
                                    className={
                                      payout.status === 'processed'
                                        ? 'bg-green-50 text-green-700 border-green-200'
                                        : payout.status === 'pending'
                                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        : payout.status === 'approved'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                    }
                                  >
                                    {payout.status.toUpperCase()}
                                  </Badge>
                                </td>
                                <td className="p-4 text-slate-600">
                                  {payout.payout_method || 'Bank Transfer'}
                                </td>
                                <td className="p-4 text-slate-600">
                                  {payout.processed_date
                                    ? format(new Date(payout.processed_date), 'MMM dd, yyyy')
                                    : '-'}
                                </td>
                                <td className="p-4 text-slate-600 max-w-xs truncate">
                                  {payout.admin_notes || payout.rejection_reason || '-'}
                                </td>
                              </tr>
                            ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="refunds">
            <EventRefundManager organizerId={user?.id} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showCreateEvent &&
      <CreateEventModal
        user={user}
        onClose={() => setShowCreateEvent(false)}
        onSuccess={loadDashboardData} />

      }

      {showEditEvent && selectedEvent &&
      <EditEventModal
        event={selectedEvent}
        onClose={() => {
          setShowEditEvent(false);
          setSelectedEvent(null);
        }}
        onSuccess={loadDashboardData} />

      }

      {/* EventRSVPModal for viewing event details/RSVPs */}
      {showRSVPModal && selectedEvent && (
        <EventRSVPModal
          event={selectedEvent}
          open={showRSVPModal}
          onClose={() => {
            setShowRSVPModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {showPayoutModal &&
      <PayoutRequestModal
        open={showPayoutModal}
        onClose={() => setShowPayoutModal(false)}
        onSubmit={handlePayoutSubmit}
        availableBalance={stats.totalRevenue}
        entityType="event" />

      }
    </div>);

}
