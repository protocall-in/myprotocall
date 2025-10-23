
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Event,
  EventAttendee,
  EventTicket,
  EventCommissionTracking,
  User,
  PlatformSetting
} from '@/api/entities';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Download } from 'lucide-react'; // Added Download import
import { toast } from 'sonner';

import EventsOverview from './events/EventsOverview';
import EventApprovalQueue from './events/EventApprovalQueue';
import EventAnalytics from './events/EventAnalytics';
import EventPricingCommission from './events/EventPricingCommission';
import EventRSVPAnalytics from './events/EventRSVPAnalytics';
import EventDetailsModal from './events/EventDetailsModal';
import EventBulkActions from './events/EventBulkActions';
import EventCancellationModal from './events/EventCancellationModal';
import FeaturedEventsManager from './events/FeaturedEventsManager';
import ExportManager from './events/ExportManager'; // Added ExportManager import
import AdvancedSearchFilter from './events/AdvancedSearchFilter'; // Added AdvancedSearchFilter import

export default function EventsManagement({ user }) {
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [commissionTracking, setCommissionTracking] = useState([]);
  const [attendees, setAttendees] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});

  // NEW: Active Tab State - ADDED TO FIX THE BUG
  const [activeTab, setActiveTab] = useState('overview');

  // Event Details Modal State
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Bulk Operations State
  const [selectedEventIds, setSelectedEventIds] = useState([]);

  // Event Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [eventToCancel, setEventToCancel] = useState(null);

  // NEW: Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);

  // NEW: Filter handler
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleFilterChange = (filters) => {
    setAppliedFilters(prevFilters => ({ ...prevFilters, ...filters }));
  };

  const handleResetFilters = () => {
    setAppliedFilters({});
  };

  const permissions = useMemo(() => ({
    isSuperAdmin: user?.app_role === 'super_admin',
    isAdmin: ['super_admin', 'admin'].includes(user?.app_role),
    canManageEvents: ['super_admin', 'admin', 'events_manager'].includes(user?.app_role),
    canViewAnalytics: ['super_admin', 'admin', 'events_manager'].includes(user?.app_role),
    canManagePricing: ['super_admin', 'admin'].includes(user?.app_role),
    canApproveEvents: ['super_admin', 'admin', 'events_manager'].includes(user?.app_role),
    canManageRefunds: ['super_admin', 'admin', 'finance_manager'].includes(user?.app_role)
  }), [user]);

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        allEvents,
        allTickets,
        allCommissionTracking,
        allAttendees,
        userData,
        settings
      ] = await Promise.all([
        Event.list('-created_date'),
        EventTicket.list().catch(() => []),
        EventCommissionTracking.list().catch(() => []),
        EventAttendee.list().catch(() => []),
        User.me(),
        PlatformSetting.list().catch(() => [])
      ]);

      setEvents(allEvents);
      setTickets(allTickets);
      setCommissionTracking(allCommissionTracking);
      setAttendees(allAttendees);
      setCurrentUser(userData);

      const settingsMap = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});
      setPlatformSettings(settingsMap);

    } catch (error) {
      console.error("Error loading events data:", error);
      toast.error("Failed to load events data.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Event Details Handler
  const handleViewEventDetails = (event) => {
    setSelectedEvent(event);
    setShowDetailsModal(true);
  };

  // Event Cancellation Handler
  const handleCancelEvent = (event) => {
    setEventToCancel(event);
    setShowCancelModal(true);
  };

  const handleCancelSuccess = async () => {
    setShowCancelModal(false);
    setEventToCancel(null);
    await loadAllData();
  };

  // Bulk Selection Handlers
  const handleSelectEvent = (eventId) => {
    setSelectedEventIds(prev =>
      prev.includes(eventId)
        ? prev.filter(id => id !== eventId)
        : [...prev, eventId]
    );
  };

  const handleSelectAll = (eventsList) => {
    if (selectedEventIds.length === eventsList.length) {
      setSelectedEventIds([]);
    } else {
      setSelectedEventIds(eventsList.map(e => e.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedEventIds([]);
  };

  // Bulk Operations Handlers
  const handleBulkApprove = async (selectedEvents, notes) => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          Event.update(event.id, {
            status: 'approved',
            admin_notes: notes
          })
        )
      );
      await loadAllData();
    } catch (error) {
      throw error;
    }
  };

  const handleBulkReject = async (selectedEvents, notes) => {
    try {
      await Promise.all(
        selectedEvents.map(event =>
          Event.update(event.id, {
            status: 'rejected',
            admin_notes: notes
          })
        )
      );
      await loadAllData();
    } catch (error) {
      throw error;
    }
  };

  const handleBulkDelete = async (selectedEvents) => {
    try {
      await Promise.all(
        selectedEvents.map(event => Event.delete(event.id))
      );
      await loadAllData();
    } catch (error) {
      throw error;
    }
  };

  const handleBulkExport = (selectedEvents) => {
    const csvContent = [
      ['Title', 'Organizer', 'Date', 'Status', 'Capacity', 'Ticket Price', 'Location'].join(','),
      ...selectedEvents.map(e => [
        e.title,
        e.organizer_name || 'N/A',
        new Date(e.event_date).toLocaleDateString(),
        e.status,
        e.capacity || 'Unlimited',
        e.ticket_price || 0,
        e.location || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Filter events based on applied filters
  const filteredEvents = useMemo(() => {
    let filtered = [...events];

    // Search term filter
    if (appliedFilters.searchTerm) {
      const term = appliedFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(event =>
        event.title?.toLowerCase().includes(term) ||
        event.description?.toLowerCase().includes(term) ||
        event.organizer_name?.toLowerCase().includes(term) ||
        event.location?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (appliedFilters.status && appliedFilters.status !== 'all') {
      filtered = filtered.filter(e => e.status === appliedFilters.status);
    }

    // Premium filter
    if (appliedFilters.isPremium && appliedFilters.isPremium !== 'all') {
      filtered = filtered.filter(e => e.is_premium === (appliedFilters.isPremium === 'true'));
    }

    // Featured filter
    if (appliedFilters.isFeatured && appliedFilters.isFeatured !== 'all') {
      filtered = filtered.filter(e => e.is_featured === (appliedFilters.isFeatured === 'true'));
    }

    // Organizer filter
    if (appliedFilters.organizer) {
      const org = appliedFilters.organizer.toLowerCase();
      filtered = filtered.filter(e => e.organizer_name?.toLowerCase().includes(org));
    }

    // Location filter
    if (appliedFilters.location) {
      const loc = appliedFilters.location.toLowerCase();
      filtered = filtered.filter(e => e.location?.toLowerCase().includes(loc));
    }

    // Price range filter
    if (appliedFilters.minPrice || appliedFilters.maxPrice) {
      filtered = filtered.filter(e => {
        const price = e.ticket_price || 0;
        if (appliedFilters.minPrice !== undefined && appliedFilters.minPrice !== null && price < parseFloat(appliedFilters.minPrice)) return false;
        if (appliedFilters.maxPrice !== undefined && appliedFilters.maxPrice !== null && price > parseFloat(appliedFilters.maxPrice)) return false;
        return true;
      });
    }

    // Capacity range filter
    if (appliedFilters.minCapacity || appliedFilters.maxCapacity) {
      filtered = filtered.filter(e => {
        const capacity = e.capacity || 0;
        if (appliedFilters.minCapacity !== undefined && appliedFilters.minCapacity !== null && capacity < parseInt(appliedFilters.minCapacity, 10)) return false;
        if (appliedFilters.maxCapacity !== undefined && appliedFilters.maxCapacity !== null && capacity > parseInt(appliedFilters.maxCapacity, 10)) return false;
        return true;
      });
    }

    // Attendee range filter
    if (appliedFilters.attendeeMin || appliedFilters.attendeeMax) {
      filtered = filtered.filter(e => {
        const eventAttendees = attendees.filter(a => a.event_id === e.id && a.rsvp_status === 'yes');
        const count = eventAttendees.length;
        if (appliedFilters.attendeeMin !== undefined && appliedFilters.attendeeMin !== null && count < parseInt(appliedFilters.attendeeMin, 10)) return false;
        if (appliedFilters.attendeeMax !== undefined && appliedFilters.attendeeMax !== null && count > parseInt(appliedFilters.attendeeMax, 10)) return false;
        return true;
      });
    }

    // Date range filter
    if (appliedFilters.dateFrom || appliedFilters.dateTo) {
      filtered = filtered.filter(e => {
        const eventDate = new Date(e.event_date);
        if (appliedFilters.dateFrom && eventDate < appliedFilters.dateFrom) return false;
        if (appliedFilters.dateTo && eventDate > appliedFilters.dateTo) return false;
        return true;
      });
    }

    return filtered;
  }, [events, appliedFilters, attendees]);

  const selectedEvents = events.filter(e => selectedEventIds.includes(e.id));

  // Common props to pass to all sub-components
  const commonProps = {
    events, // This will be overridden by filteredEvents in TabsContent
    tickets,
    commissionTracking,
    attendees,
    platformSettings,
    permissions,
    onUpdate: loadAllData,
    currentUser,
    isLoading,
    onViewDetails: handleViewEventDetails,
    onCancelEvent: handleCancelEvent,
    selectedEventIds,
    onSelectEvent: handleSelectEvent,
    // onSelectAll for commonProps might be problematic if not explicitly handled per tab
    // For now, we'll override it where needed, like in EventsOverview
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 text-gray-500">
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading Events Management...
      </div>
    );
  }

  if (!permissions.canManageEvents && !permissions.canManageRefunds) {
    return <div className="text-center p-12 text-red-500">You do not have permission to access this section.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-50 via-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
                  Events Management Hub
                </CardTitle>
                <CardDescription className="mt-1">
                  Comprehensive event oversight with approval workflows, analytics, and commission tracking
                </CardDescription>
              </div>
            </div>

            {/* ADDED: Export Button */}
            <Button
              onClick={() => setShowExportModal(true)}
              variant="outline"
              className="gap-2 border-2 border-blue-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-400 transition-all duration-300"
            >
              <Download className="w-4 h-4" />
              Export Data
            </Button>
          </div>

          <div className="border-b mt-6"></div>

        </CardHeader>
      </Card>

      {/* ADDED: Advanced Search & Filter */}
      <AdvancedSearchFilter
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        totalEvents={events.length} // Pass the total number of unfiltered events
      />

      {/* Update Stats Cards to show filtered count */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Only the 'Total Events' card was shown in the outline, update it */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Events</p>
                <p className="text-3xl font-bold mt-1">
                  {filteredEvents.length}
                  {filteredEvents.length !== events.length && (
                    <span className="text-sm font-normal ml-2 opacity-75">
                      / {events.length}
                    </span>
                  )}
                </p>
              </div>
              <Calendar className="w-10 h-10 opacity-80" />
            </div>
          </CardContent>
        </Card>
        {/* If there were other stat cards, they would be here and their counts updated similarly */}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="approval"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold"
          >
            Approval Queue
          </TabsTrigger>
          <TabsTrigger
            value="featured"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-yellow-500 data-[state=active]:to-orange-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 hover:from-yellow-100 hover:to-orange-100 font-semibold"
          >
            ⭐ Featured
          </TabsTrigger>
          <TabsTrigger
            value="rsvp"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold"
          >
            RSVP Tracking
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold"
          >
            Reports
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-100 hover:to-purple-100 font-semibold"
          >
            Pricing & Commission
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="overview">
            <EventsOverview
              {...commonProps}
              events={filteredEvents} // Explicitly pass filteredEvents
              onSelectAll={() => handleSelectAll(filteredEvents)} // Ensure bulk select operates on filtered events
            />
          </TabsContent>
          <TabsContent value="approval">
            <EventApprovalQueue {...commonProps} events={filteredEvents} />
          </TabsContent>
          <TabsContent value="featured">
            <FeaturedEventsManager {...commonProps} events={filteredEvents} />
          </TabsContent>
          <TabsContent value="rsvp">
            <EventRSVPAnalytics {...commonProps} events={filteredEvents} />
          </TabsContent>
          <TabsContent value="analytics">
            <EventAnalytics {...commonProps} events={filteredEvents} />
          </TabsContent>
          <TabsContent value="pricing">
            <EventPricingCommission {...commonProps} events={filteredEvents} />
          </TabsContent>
        </div>
      </Tabs>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        open={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedEvent(null);
        }}
        onUpdate={loadAllData}
      />

      {/* Bulk Actions Toolbar */}
      <EventBulkActions
        selectedEvents={selectedEvents}
        onClearSelection={handleClearSelection}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />

      {/* Event Cancellation Modal */}
      <EventCancellationModal
        event={eventToCancel}
        tickets={tickets.filter(t => t.event_id === eventToCancel?.id)}
        open={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setEventToCancel(null);
        }}
        onSuccess={handleCancelSuccess}
      />

      {/* ADDED: Export Modal */}
      <ExportManager
        events={events} // Export manager needs all events, not filtered ones, typically
        attendees={attendees}
        tickets={tickets}
        commissionTracking={commissionTracking}
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
      />
    </div>
  );
}
