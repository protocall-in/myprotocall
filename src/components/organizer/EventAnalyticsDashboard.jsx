import React, { useState, useEffect, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Trophy, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import TicketCheckIn from '../events/TicketCheckIn';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

export default function EventAnalyticsDashboard({ events, commissionTracking }) {
  const [attendeeData, setAttendeeData] = useState({});
  const [ticketData, setTicketData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    loadAnalyticsData();
  }, [events]);

  const loadAnalyticsData = async () => {
    try {
      setIsLoading(true);
      const attendeePromises = events.map(event =>
        base44.entities.EventAttendee.filter({ event_id: event.id })
      );
      const ticketPromises = events.map(event =>
        base44.entities.EventTicket.filter({ event_id: event.id })
      );

      const [attendeesResults, ticketsResults] = await Promise.all([
        Promise.all(attendeePromises),
        Promise.all(ticketPromises)
      ]);

      const attendeeMap = {};
      const ticketMap = {};

      events.forEach((event, index) => {
        attendeeMap[event.id] = attendeesResults[index] || [];
        ticketMap[event.id] = ticketsResults[index] || [];
      });

      setAttendeeData(attendeeMap);
      setTicketData(ticketMap);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Ticket Sales Per Event Data
  const ticketSalesData = useMemo(() => {
    return events
      .filter(e => e.is_premium && e.ticket_price > 0)
      .map(event => ({
        name: event.title.length > 20 ? event.title.substring(0, 20) + '...' : event.title,
        tickets: ticketData[event.id]?.length || 0,
        revenue: (ticketData[event.id]?.length || 0) * (event.ticket_price || 0)
      }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5);
  }, [events, ticketData]);

  // Attendance Rate Data
  const attendanceData = useMemo(() => {
    const totalRSVPs = Object.values(attendeeData).flat().length;
    const totalCheckedIn = Object.values(attendeeData).flat().filter(a => a.confirmed).length;
    const totalNoShow = totalRSVPs - totalCheckedIn;

    return [
      { name: 'Checked In', value: totalCheckedIn, color: '#10b981' },
      { name: 'No Show', value: totalNoShow, color: '#ef4444' }
    ];
  }, [attendeeData]);

  // Most Popular Events
  const popularEvents = useMemo(() => {
    return events
      .map(event => {
        const attendees = attendeeData[event.id] || [];
        const yesRSVPs = attendees.filter(a => a.rsvp_status === 'yes').length;
        const checkedIn = attendees.filter(a => a.confirmed).length;
        const commission = commissionTracking.find(c => c.event_id === event.id);
        
        return {
          ...event,
          totalAttendees: attendees.length,
          yesRSVPs,
          checkedIn,
          revenue: commission?.organizer_payout || 0,
          attendanceRate: attendees.length > 0 ? (checkedIn / attendees.length * 100).toFixed(1) : 0
        };
      })
      .sort((a, b) => b.totalAttendees - a.totalAttendees)
      .slice(0, 5);
  }, [events, attendeeData, commissionTracking]);

  // Revenue Per Event Data
  const revenueData = useMemo(() => {
    return events
      .map(event => {
        const commission = commissionTracking.find(c => c.event_id === event.id);
        return {
          name: event.title.length > 15 ? event.title.substring(0, 15) + '...' : event.title,
          revenue: commission?.organizer_payout || 0,
          gross: commission?.gross_revenue || 0
        };
      })
      .filter(e => e.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [events, commissionTracking]);

  const handleCheckIn = (event) => {
    setSelectedEvent(event);
    setShowCheckIn(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total RSVPs</p>
                <p className="text-3xl font-bold text-slate-900">
                  {Object.values(attendeeData).flat().length}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Checked In</p>
                <p className="text-3xl font-bold text-green-600">
                  {Object.values(attendeeData).flat().filter(a => a.confirmed).length}
                </p>
              </div>
              <Trophy className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Avg Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {Object.values(attendeeData).flat().length > 0
                    ? ((Object.values(attendeeData).flat().filter(a => a.confirmed).length / Object.values(attendeeData).flat().length) * 100).toFixed(1)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Tickets Sold</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Object.values(ticketData).flat().length}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ticket Sales Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Sales Per Event</CardTitle>
          </CardHeader>
          <CardContent>
            {ticketSalesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ticketSalesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tickets" fill="#3b82f6" name="Tickets Sold" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No ticket sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Rate Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Attendance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {attendanceData[0].value + attendanceData[1].value > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={attendanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No attendance data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Per Event Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Per Event (Top 5)</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="gross" fill="#f59e0b" name="Gross Revenue (₹)" />
                <Bar dataKey="revenue" fill="#10b981" name="Your Payout (₹)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              No revenue data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Popular Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Most Popular Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {popularEvents.length > 0 ? (
            <div className="space-y-4">
              {popularEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{event.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(event.event_date), 'MMM dd, yyyy')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {event.totalAttendees} RSVPs
                        </span>
                        <span>✓ {event.checkedIn} checked in</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge className="bg-green-100 text-green-700">
                        {event.attendanceRate}% Attendance
                      </Badge>
                      {event.revenue > 0 && (
                        <p className="text-sm font-semibold text-slate-900 mt-1">
                          ₹{event.revenue.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleCheckIn(event)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Check-In
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              No events to display
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-In Modal */}
      {showCheckIn && selectedEvent && (
        <TicketCheckIn
          event={selectedEvent}
          open={showCheckIn}
          onClose={() => {
            setShowCheckIn(false);
            setSelectedEvent(null);
          }}
          onUpdate={loadAnalyticsData}
        />
      )}
    </div>
  );
}