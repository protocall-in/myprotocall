import React, { useState, useEffect } from 'react';
import { User, Event, EventAttendee, EventTicket, EventOrganizer } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Calendar as CalendarIcon,
  Users,
  Eye,
  Edit,
  XCircle,
  Plus,
  CheckCircle,
  Clock,
  Crown,
  ArrowRight,
  Ticket
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { createPageUrl } from '@/utils';
import CreateEventModal from '../components/events/CreateEventModal';
import EditEventModal from '../components/events/EditEventModal';
import EventAttendeesModal from '../components/events/EventAttendeesModal';
import RefundRequestModal from '../components/events/RefundRequestModal';

export default function MyEventsPage() {
  const [user, setUser] = useState(null);
  const [myEvents, setMyEvents] = useState([]);
  const [organizerProfile, setOrganizerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAttendeesModal, setShowAttendeesModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await User.me();
      setUser(currentUser);

      // Check if user has an organizer profile
      const organizerProfiles = await EventOrganizer.filter({ user_id: currentUser.id });
      if (organizerProfiles.length > 0) {
        setOrganizerProfile(organizerProfiles[0]);
        
        // If user is an approved organizer, redirect to full OrganizerDashboard
        if (organizerProfiles[0].status === 'approved') {
          window.location.href = createPageUrl('OrganizerDashboard');
          return;
        }
      }

      // Load all events created by this user
      const events = await Event.filter({ organizer_id: currentUser.id }, '-created_date');
      setMyEvents(events);

    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load your events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestRefund = async (event) => {
    try {
      // Get user's ticket for this event
      const tickets = await EventTicket.filter({ 
        event_id: event.id, 
        user_id: user.id,
        status: 'active' 
      });
      
      if (tickets.length === 0) {
        toast.error('No active ticket found for this event');
        return;
      }

      setSelectedTicket(tickets[0]);
      setSelectedEvent(event);
      setShowRefundModal(true);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket information');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Rejected' },
      scheduled: { color: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Scheduled' },
      completed: { color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Completed' },
      cancelled: { color: 'bg-red-100 text-red-800 border-red-200', label: 'Cancelled' }
    };
    const config = statusConfig[status] || statusConfig.pending_approval;
    return <Badge className={`${config.color} border`}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const upcomingEvents = myEvents.filter(e => 
    new Date(e.event_date) > new Date() && ['approved', 'scheduled'].includes(e.status)
  );
  const pastEvents = myEvents.filter(e => 
    new Date(e.event_date) < new Date() || e.status === 'completed'
  );
  const pendingEvents = myEvents.filter(e => e.status === 'pending_approval');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">My Events</h1>
              <p className="text-slate-600">Manage your events and track attendance</p>
            </div>
            <div className="flex gap-3 mt-4 md:mt-0">
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Event
              </Button>
            </div>
          </div>

          {/* Upgrade to Professional Organizer Banner */}
          {!organizerProfile && (
            <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <Crown className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1">Become a Professional Organizer</h3>
                      <p className="text-purple-100">
                        Get verified status, dedicated dashboard, analytics, and earn 80% revenue from ticket sales
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.location.href = createPageUrl('BecomeOrganizer')}
                    className="bg-white text-purple-600 hover:bg-purple-50"
                  >
                    Apply Now
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Organizer Application Status */}
          {organizerProfile && organizerProfile.status !== 'approved' && (
            <Card className={
              organizerProfile.status === 'pending_approval' ? 'bg-yellow-50 border-yellow-200' :
              organizerProfile.status === 'rejected' ? 'bg-red-50 border-red-200' : 'bg-gray-50'
            }>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  {organizerProfile.status === 'pending_approval' && <Clock className="w-6 h-6 text-yellow-600" />}
                  {organizerProfile.status === 'rejected' && <XCircle className="w-6 h-6 text-red-600" />}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {organizerProfile.status === 'pending_approval' && 'Organizer Application Under Review'}
                      {organizerProfile.status === 'rejected' && 'Organizer Application Rejected'}
                    </h3>
                    <p className="text-sm text-slate-600">
                      {organizerProfile.status === 'pending_approval' && 'Your application is being reviewed by our team. You\'ll be notified once approved.'}
                      {organizerProfile.status === 'rejected' && organizerProfile.rejection_reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Events</p>
                  <p className="text-3xl font-bold text-slate-900">{myEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CalendarIcon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Upcoming</p>
                  <p className="text-3xl font-bold text-slate-900">{upcomingEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-slate-900">{pastEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Ticket className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Review</p>
                  <p className="text-3xl font-bold text-slate-900">{pendingEvents.length}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Events List */}
        <Tabs defaultValue="upcoming" className="mt-8">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcomingEvents.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastEvents.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending Approval ({pendingEvents.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcomingEvents.map(event => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col h-full">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
                            {getStatusBadge(event.status)}
                            {event.is_premium && (
                              <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                          </div>
                          
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <div className="flex items-center gap-2">
                              <CalendarIcon className="w-4 h-4" />
                              <span>{format(new Date(event.event_date), 'PPP p')}</span>
                            </div>
                            {event.capacity && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4" />
                                <span>Capacity: {event.capacity}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-auto flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowAttendeesModal(true);
                            }}
                            className="flex-1"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Attendees
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedEvent(event);
                              setShowEditModal(true);
                            }}
                            className="flex-1"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                          {event.ticket_price > 0 && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRequestRefund(event)}
                            >
                              Request Refund
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarIcon}
                title="No upcoming events"
                description="Create your first event to get started"
                actionLabel="Create Event"
                onAction={() => setShowCreateModal(true)}
              />
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {pendingEvents.length > 0 ? (
              <div className="space-y-4">
                {pendingEvents.map(event => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    onEdit={() => {
                      setSelectedEvent(event);
                      setShowEditModal(true);
                    }}
                    onViewAttendees={() => {
                      setSelectedEvent(event);
                      setShowAttendeesModal(true);
                    }}
                    getStatusBadge={getStatusBadge}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Clock}
                title="No pending events"
                description="All your events are approved or completed"
              />
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastEvents.length > 0 ? (
              <div className="space-y-4">
                {pastEvents.map(event => (
                  <EventListItem
                    key={event.id}
                    event={event}
                    onViewAttendees={() => {
                      setSelectedEvent(event);
                      setShowAttendeesModal(true);
                    }}
                    getStatusBadge={getStatusBadge}
                    isPast
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CheckCircle}
                title="No past events"
                description="Your completed events will appear here"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateEventModal
          user={user}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {showEditModal && selectedEvent && (
        <EditEventModal
          event={selectedEvent}
          onClose={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            setShowEditModal(false);
            setSelectedEvent(null);
            loadData();
          }}
        />
      )}

      {showAttendeesModal && selectedEvent && (
        <EventAttendeesModal
          event={selectedEvent}
          onClose={() => {
            setShowAttendeesModal(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {showRefundModal && selectedEvent && selectedTicket && (
        <RefundRequestModal
          ticket={selectedTicket}
          event={selectedEvent}
          onClose={() => {
            setShowRefundModal(false);
            setSelectedTicket(null);
            setSelectedEvent(null);
          }}
          onSuccess={() => {
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Event List Item Component
function EventListItem({ event, onEdit, onViewAttendees, getStatusBadge, isPast }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-slate-900">{event.title}</h3>
              {getStatusBadge(event.status)}
              {event.is_premium && (
                <Badge className="bg-purple-100 text-purple-800 border border-purple-200">
                  <Crown className="w-3 h-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
            
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <span>{format(new Date(event.event_date), 'PPP p')}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Capacity: {event.capacity}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewAttendees}
            >
              <Eye className="w-4 h-4 mr-2" />
              Attendees
            </Button>
            {!isPast && onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Empty State Component
function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </Button>
      )}
    </div>
  );
}