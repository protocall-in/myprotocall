
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EventAttendee, EventTicket, EventCommissionTracking } from '@/api/entities';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Download,
  Star,
  Crown,
  AlertTriangle // Added for Cancel Event button
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import EventCancellationModal from './EventCancellationModal';
import EventRefundPanel from './EventRefundPanel'; // New import for refund panel

export default function EventDetailsModal({ event, open, onClose, onUpdate }) {
  const [attendees, setAttendees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [commission, setCommission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false); // New state for button loading
  const [showCancelModal, setShowCancelModal] = useState(false); // New state to control cancellation modal visibility

  useEffect(() => {
    if (open && event) {
      loadEventDetails();
    }
  }, [open, event]);

  const loadEventDetails = async () => {
    setIsLoading(true);
    try {
      const [attendeesData, ticketsData, commissionData] = await Promise.all([
        EventAttendee.filter({ event_id: event.id }),
        EventTicket.filter({ event_id: event.id }),
        EventCommissionTracking.filter({ event_id: event.id }).then(data => data[0] || null)
      ]);

      setAttendees(attendeesData);
      setTickets(ticketsData);
      setCommission(commissionData);
    } catch (error) {
      console.error('Error loading event details:', error);
      toast.error('Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportAttendees = () => {
    const csvContent = [
      ['Name', 'Email', 'RSVP Status', 'Confirmed', 'Date'].join(','),
      ...attendees.map(a => [
        a.user_name || 'N/A',
        a.user_id || 'N/A', // Assuming user_id can be used as email for export, or adjust if actual email is available
        a.rsvp_status,
        a.confirmed ? 'Yes' : 'No',
        format(new Date(a.created_date), 'dd/MM/yyyy')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}-attendees.csv`;
    a.click();
    toast.success('Attendee list exported successfully');
  };

  // Placeholder handlers for event actions to make the code compile
  const handleApprove = async () => {
    setIsUpdating(true);
    try {
      // Simulate API call to update event status
      // await Event.update(event.id, { status: 'approved' });
      toast.success('Event approved (action simulated)');
      await loadEventDetails(); // Reload data after update
      if (onUpdate) onUpdate(); // Notify parent of update
    } catch (error) {
      console.error('Error approving event:', error);
      toast.error('Failed to approve event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    setIsUpdating(true);
    try {
      // Simulate API call to update event status
      // await Event.update(event.id, { status: 'rejected' });
      toast.success('Event rejected (action simulated)');
      await loadEventDetails(); // Reload data after update
      if (onUpdate) onUpdate(); // Notify parent of update
    } catch (error) {
      console.error('Error rejecting event:', error);
      toast.error('Failed to reject event');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleToggleFeatured = async () => {
    setIsUpdating(true);
    try {
      // Simulate API call to update featured status
      // await Event.update(event.id, { is_featured: !event.is_featured });
      toast.success(`Event ${event.is_featured ? 'removed from' : 'marked as'} featured (action simulated)`);
      await loadEventDetails(); // Reload data after update
      if (onUpdate) onUpdate(); // Notify parent of update
    } catch (error) {
      console.error('Error toggling featured status:', error);
      toast.error('Failed to update featured status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEvent = () => {
    setShowCancelModal(true);
  };

  const handleCancelSuccess = async () => {
    setShowCancelModal(false);
    await loadEventDetails(); // Reload event details to reflect cancellation
    if (onUpdate) {
      onUpdate(); // Notify parent component of the change
    }
    toast.success('Event cancelled successfully');
  };

  const rsvpStats = {
    yes: attendees.filter(a => a.rsvp_status === 'yes').length,
    no: attendees.filter(a => a.rsvp_status === 'no').length,
    maybe: attendees.filter(a => a.rsvp_status === 'maybe').length,
    confirmed: attendees.filter(a => a.confirmed).length
  };

  const ticketStats = {
    total: tickets.length,
    active: tickets.filter(t => t.status === 'active').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
    refunded: tickets.filter(t => t.status === 'refunded').length
  };

  const statusConfig = {
    pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Approval' },
    approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
    scheduled: { color: 'bg-green-100 text-green-800', icon: Calendar, label: 'Scheduled' },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Cancelled' },
    completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Completed' }
  };

  const currentStatus = statusConfig[event?.status] || statusConfig.pending_approval;
  const StatusIcon = currentStatus.icon;

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">{event.title}</DialogTitle>
            <Badge className={`${currentStatus.color} border-0 flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {currentStatus.label}
            </Badge>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-2 bg-transparent p-0"> {/* Updated to grid-cols-5 */}
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-semibold shadow-md py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="attendees"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-semibold shadow-md py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
              >
                Attendees ({attendees.length})
              </TabsTrigger>
              <TabsTrigger
                value="tickets"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-semibold shadow-md py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
              >
                Tickets ({tickets.length})
              </TabsTrigger>
              <TabsTrigger
                value="revenue"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-semibold shadow-md py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
              >
                Revenue
              </TabsTrigger>
              <TabsTrigger
                value="refunds"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl font-semibold shadow-md py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
              >
                Refunds
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Event Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Event Date</p>
                          <p className="font-semibold text-slate-900">
                            {format(new Date(event.event_date), 'PPP p')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Location</p>
                          <p className="font-semibold text-slate-900">{event.location}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Capacity</p>
                          <p className="font-semibold text-slate-900">
                            {attendees.length} / {event.capacity || 'Unlimited'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <DollarSign className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Ticket Price</p>
                          <p className="font-semibold text-slate-900">
                            {event.is_premium ? `₹${event.ticket_price?.toLocaleString()}` : 'Free'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 text-slate-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-600">Organizer</p>
                          <p className="font-semibold text-slate-900">{event.organizer_name}</p>
                        </div>
                      </div>

                      {event.is_featured && (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                          <Star className="w-5 h-5 text-yellow-600 fill-yellow-600" />
                          <span className="text-sm font-semibold text-yellow-800">Featured Event</span>
                        </div>
                      )}

                      {event.is_premium && (
                        <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                          <Crown className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-semibold text-purple-800">Premium Event</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-slate-600 mb-2">Description</p>
                    <p className="text-slate-700 leading-relaxed">{event.description}</p>
                  </div>

                  {event.admin_notes && (
                    <div className="pt-4 border-t">
                      <p className="text-sm text-slate-600 mb-2">Admin Notes</p>
                      <p className="text-slate-700 bg-slate-50 p-3 rounded-lg">{event.admin_notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {event.status === 'pending_approval' && (
                      <>
                        <Button
                          onClick={handleApprove}
                          disabled={isUpdating}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve Event
                        </Button>
                        <Button
                          onClick={handleReject}
                          disabled={isUpdating}
                          variant="outline"
                          className="border-2 border-red-300 text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject Event
                        </Button>
                      </>
                    )}

                    {['approved', 'scheduled'].includes(event.status) && (
                      <>
                        <Button
                          onClick={handleToggleFeatured}
                          disabled={isUpdating}
                          variant="outline"
                          className="border-2 border-yellow-300 text-yellow-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-amber-50 hover:border-yellow-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          {event.is_featured ? 'Remove Featured' : 'Mark as Featured'}
                        </Button>
                        <Button
                          onClick={handleCancelEvent}
                          disabled={isUpdating}
                          variant="outline"
                          className="border-2 border-red-300 text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          Cancel Event
                        </Button>
                      </>
                    )}

                    <Button
                      onClick={handleExportAttendees}
                      variant="outline"
                      className="border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-400 rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export Attendees
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Total RSVPs</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{attendees.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Confirmed</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">{rsvpStats.confirmed}</p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Tickets Sold</p>
                        <p className="text-2xl font-bold text-purple-700 mt-1">{ticketStats.active}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600">Revenue</p>
                        <p className="text-2xl font-bold text-green-700 mt-1">
                          ₹{(commission?.gross_revenue || 0).toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Attendees Tab */}
            <TabsContent value="attendees" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      Attendee List
                    </CardTitle>
                    <Button
                      onClick={handleExportAttendees}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* RSVP Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600">Yes</p>
                      <p className="text-2xl font-bold text-green-700">{rsvpStats.yes}</p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-600">Maybe</p>
                      <p className="text-2xl font-bold text-yellow-700">{rsvpStats.maybe}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">No</p>
                      <p className="text-2xl font-bold text-red-700">{rsvpStats.no}</p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">Confirmed</p>
                      <p className="text-2xl font-bold text-blue-700">{rsvpStats.confirmed}</p>
                    </div>
                  </div>

                  {/* Attendees Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">RSVP Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Confirmed</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {attendees.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                              No attendees yet
                            </td>
                          </tr>
                        ) : (
                          attendees.map((attendee) => (
                            <tr key={attendee.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-900">{attendee.user_name || 'Unknown'}</p>
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={
                                  attendee.rsvp_status === 'yes' ? 'bg-green-100 text-green-800' :
                                  attendee.rsvp_status === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {attendee.rsvp_status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {attendee.confirmed ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-gray-400" />
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {format(new Date(attendee.created_date), 'dd MMM yyyy')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tickets Tab */}
            <TabsContent value="tickets" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    Ticket Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Ticket Stats */}
                  <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">Total</p>
                      <p className="text-2xl font-bold text-blue-700">{ticketStats.total}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                      <p className="text-sm text-green-600">Active</p>
                      <p className="text-2xl font-bold text-green-700">{ticketStats.active}</p>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                      <p className="text-sm text-orange-600">Cancelled</p>
                      <p className="text-2xl font-bold text-orange-700">{ticketStats.cancelled}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">Refunded</p>
                      <p className="text-2xl font-bold text-red-700">{ticketStats.refunded}</p>
                    </div>
                  </div>

                  {/* Tickets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Ticket ID</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Payment Method</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {tickets.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                              No tickets sold yet
                            </td>
                          </tr>
                        ) : (
                          tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                                  {ticket.id.substring(0, 8)}
                                </code>
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900">
                                ₹{ticket.ticket_price?.toLocaleString()}
                              </td>
                              <td className="px-4 py-3">
                                <Badge className={
                                  ticket.status === 'active' ? 'bg-green-100 text-green-800' :
                                  ticket.status === 'cancelled' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }>
                                  {ticket.status}
                                </Badge>
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {ticket.payment_method || 'N/A'}
                              </td>
                              <td className="px-4 py-3 text-sm text-slate-600">
                                {format(new Date(ticket.purchased_date), 'dd MMM yyyy')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Revenue Tab */}
            <TabsContent value="revenue" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Revenue & Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {commission ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                          <p className="text-sm text-green-600 mb-2">Gross Revenue</p>
                          <p className="text-3xl font-bold text-green-700">
                            ₹{commission.gross_revenue?.toLocaleString()}
                          </p>
                          <p className="text-xs text-green-600 mt-1">Total ticket sales</p>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200">
                          <p className="text-sm text-blue-600 mb-2">Platform Commission</p>
                          <p className="text-3xl font-bold text-blue-700">
                            ₹{commission.platform_commission?.toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            {commission.platform_commission_rate}% commission
                          </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
                          <p className="text-sm text-purple-600 mb-2">Organizer Payout</p>
                          <p className="text-3xl font-bold text-purple-700">
                            ₹{commission.organizer_payout?.toLocaleString()}
                          </p>
                          <p className="text-xs text-purple-600 mt-1">After commission</p>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="font-semibold text-slate-900 mb-4">Commission Details</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-slate-600">Total Tickets Sold</p>
                            <p className="font-semibold text-slate-900">{commission.total_tickets_sold || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Commission Rate</p>
                            <p className="font-semibold text-slate-900">{commission.platform_commission_rate}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-slate-600">Payout Status</p>
                            <Badge className={
                              commission.payout_status === 'processed' ? 'bg-green-100 text-green-800' :
                              commission.payout_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }>
                              {commission.payout_status}
                            </Badge>
                          </div>
                          {commission.payout_date && (
                            <div>
                              <p className="text-sm text-slate-600">Payout Date</p>
                              <p className="font-semibold text-slate-900">
                                {format(new Date(commission.payout_date), 'dd MMM yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No revenue data available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Refund Tab */}
            <TabsContent value="refunds" className="space-y-6 mt-6">
              <EventRefundPanel
                event={event}
                onUpdate={async () => {
                  await loadEventDetails(); // Reload event details in this modal
                  if (onUpdate) {
                    onUpdate(); // Notify parent of update
                  }
                }}
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>

      {/* Cancellation Modal */}
      <EventCancellationModal
        event={event}
        tickets={tickets}
        open={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSuccess={handleCancelSuccess}
      />
    </Dialog>
  );
}
