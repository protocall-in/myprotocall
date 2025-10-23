
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  TrendingUp,
  DollarSign,
  Eye, // Keep existing Eye import
  MapPin,
  Crown,
  AlertTriangle // Add AlertTriangle import
} from 'lucide-react';
import { format } from 'date-fns';
import EventFilters from './EventFilters';
import EventCapacityManager from './EventCapacityManager'; // Added import

export default function EventsOverview({ 
  events, 
  tickets, 
  commissionTracking, 
  attendees,
  onViewDetails,
  selectedEventIds,
  onSelectEvent,
  onSelectAll,
  onCancelEvent, // Add onCancelEvent to props
  selectedEvent, // Added selectedEvent to props
  onUpdate // Added onUpdate to props
}) {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    organizer: 'all',
    dateFrom: null,
    dateTo: null,
    isPremium: 'all', // Represents is_featured. Renamed in filter to avoid confusion with actual "premium" concept
    priceMin: '',
    priceMax: '',
    capacity: 'all'
  });

  // Extract unique organizers
  const organizers = useMemo(() => {
    const uniqueOrganizers = new Map();
    events.forEach(event => {
      if (event.organizer_id && event.organizer_name) {
        uniqueOrganizers.set(event.organizer_id, {
          id: event.organizer_id,
          name: event.organizer_name
        });
      }
    });
    return Array.from(uniqueOrganizers.values());
  }, [events]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          event.title?.toLowerCase().includes(searchLower) ||
          event.organizer_name?.toLowerCase().includes(searchLower) ||
          event.location?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Status filter
      if (filters.status !== 'all' && event.status !== filters.status) {
        return false;
      }

      // Organizer filter
      if (filters.organizer !== 'all' && event.organizer_id !== filters.organizer) {
        return false;
      }

      // Date range filter
      if (filters.dateFrom) {
        const eventDate = new Date(event.event_date);
        const fromDate = new Date(filters.dateFrom);
        if (eventDate < fromDate) return false;
      }
      if (filters.dateTo) {
        const eventDate = new Date(event.event_date);
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // Include the entire end date
        if (eventDate > toDate) return false;
      }

      // Premium (is_featured) filter
      if (filters.isPremium !== 'all') {
        const isPremium = filters.isPremium === 'true'; // 'true' or 'false' from select option
        if (event.is_featured !== isPremium) return false;
      }

      // Price range filter
      const eventTicketPrice = event.ticket_price || 0; // Assume 0 if price not defined
      if (filters.priceMin && eventTicketPrice < parseFloat(filters.priceMin)) {
        return false;
      }
      if (filters.priceMax && eventTicketPrice > parseFloat(filters.priceMax)) {
        return false;
      }

      // Capacity filter
      if (filters.capacity !== 'all') {
        const capacity = event.capacity; // null/undefined for 'Unlimited'
        if (filters.capacity === 'unlimited' && (capacity !== null && capacity !== undefined && capacity !== 0)) return false; // If filter is 'unlimited', exclude events with defined capacity
        if (filters.capacity === 'small' && (capacity === null || capacity === undefined || capacity === 0 || capacity > 50)) return false;
        if (filters.capacity === 'medium' && (capacity === null || capacity === undefined || capacity === 0 || capacity <= 50 || capacity > 200)) return false;
        if (filters.capacity === 'large' && (capacity === null || capacity === undefined || capacity === 0 || capacity <= 200 || capacity > 500)) return false;
        if (filters.capacity === 'xlarge' && (capacity === null || capacity === undefined || capacity === 0 || capacity <= 500)) return false;
      }

      return true;
    });
  }, [events, filters]);

  const stats = {
    total: filteredEvents.length,
    pending: filteredEvents.filter(e => e.status === 'pending_approval').length,
    approved: filteredEvents.filter(e => e.status === 'approved').length,
    scheduled: filteredEvents.filter(e => e.status === 'scheduled').length,
    completed: filteredEvents.filter(e => e.status === 'completed').length,
    cancelled: filteredEvents.filter(e => e.status === 'cancelled').length,
    rejected: filteredEvents.filter(e => e.status === 'rejected').length,
    totalRevenue: commissionTracking
      .filter(ct => filteredEvents.some(e => e.id === ct.event_id))
      .reduce((sum, ct) => sum + (ct.gross_revenue || 0), 0),
    totalTickets: tickets.filter(t => filteredEvents.some(e => e.id === t.event_id)).length,
    totalAttendees: attendees.filter(a => filteredEvents.some(e => e.id === a.event_id)).length
  };

  const upcomingEvents = filteredEvents
    .filter(e => e.status === 'scheduled' && new Date(e.event_date) > new Date())
    .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
    .slice(0, 5);

  // Recent events should also come from filteredEvents
  const recentEvents = filteredEvents
    .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
    .slice(0, 10);

  const statusConfig = {
    pending_approval: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
    approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Approved' },
    scheduled: { color: 'bg-green-100 text-green-800', icon: Calendar, label: 'Scheduled' },
    completed: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Completed' },
    cancelled: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Cancelled' },
    rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' }
  };

  const allSelected = recentEvents.length > 0 && recentEvents.every(e => selectedEventIds.includes(e.id));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <EventFilters onFilterChange={setFilters} organizers={organizers} currentFilters={filters} />

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Events</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-200 rounded-xl">
                <Calendar className="w-6 h-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending}</p>
              </div>
              <div className="p-3 bg-yellow-200 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Scheduled</p>
                <p className="text-3xl font-bold text-green-900">{stats.scheduled}</p>
              </div>
              <div className="p-3 bg-green-200 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow duration-300 border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Total Revenue</p>
                <p className="text-3xl font-bold text-purple-900">₹{(stats.totalRevenue/1000).toFixed(1)}k</p>
              </div>
              <div className="p-3 bg-purple-200 rounded-xl">
                <DollarSign className="w-6 h-6 text-purple-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Events */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingEvents.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No upcoming events scheduled</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map(event => {
                const config = statusConfig[event.status];
                const Icon = config?.icon || Calendar;
                
                return (
                  <div 
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{event.title}</h4>
                          {event.is_featured && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(event.event_date), 'MMM dd, yyyy HH:mm')}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.location?.substring(0, 30)}...
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.capacity || 'Unlimited'} capacity
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={`${config.color} border-0`}>
                        <Icon className="w-3 h-3 mr-1" />
                        {config.label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(event)}
                        className="bg-transparent border-2 border-slate-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-400 transition-all duration-300"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add this section before the events table */}
      {selectedEvent && (
        <div className="mb-6">
          <EventCapacityManager
            event={selectedEvent}
            attendees={attendees.filter(a => a.event_id === selectedEvent.id)}
            onUpdate={onUpdate}
          />
        </div>
      )}

      {/* Recent Events Table */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              {filters.search || filters.status !== 'all' || filters.organizer !== 'all' || filters.dateFrom || filters.dateTo || filters.isPremium !== 'all' || filters.priceMin || filters.priceMax || filters.capacity !== 'all' ? 'Filtered Events' : 'Recent Events'}
              <Badge className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800">
                {recentEvents.length}
              </Badge>
            </CardTitle>
            {recentEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => onSelectAll(recentEvents)}
                />
                <span className="text-sm text-gray-600">Select All</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {recentEvents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-semibold">No events found</p>
              <p className="text-sm mt-2">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Select</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Event</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Organizer</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Capacity</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {recentEvents.map(event => {
                    const config = statusConfig[event.status];
                    const Icon = config?.icon || Calendar;
                    const isSelected = selectedEventIds.includes(event.id);
                    
                    return (
                      <tr 
                        key={event.id}
                        className={`border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 ${isSelected ? 'bg-blue-50' : ''}`}
                      >
                        <td className="py-3 px-4">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onSelectEvent(event.id)}
                          />
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{event.title}</span>
                            {event.is_featured && (
                              <Crown className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{event.organizer_name}</td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {format(new Date(event.event_date), 'MMM dd, yyyy')}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${config.color} border-0 text-xs`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {event.capacity || 'Unlimited'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onViewDetails(event)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-300"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            
                            {['approved', 'scheduled'].includes(event.status) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onCancelEvent(event)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-300"
                              >
                                <AlertTriangle className="w-4 h-4 mr-1" />
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
