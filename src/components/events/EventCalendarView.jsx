import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, Users, Crown, Ticket } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';

export default function EventCalendarView({ 
  events, 
  user, 
  onViewDetails, 
  onTicketPurchase, 
  onUpgradePremium 
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Get calendar days for the current month
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // Filter events for the current month
  const monthEvents = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return events.filter(event => {
      const eventDate = new Date(event.event_date);
      return eventDate >= start && eventDate <= end;
    });
  }, [events, currentDate]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped = {};
    monthEvents.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [monthEvents]);

  const getEventsForDay = (day) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return eventsByDate[dateKey] || [];
  };

  const navigateMonth = (direction) => {
    if (direction === 'prev') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const isToday = (day) => isSameDay(day, new Date());
  const isCurrentMonth = (day) => isSameMonth(day, currentDate);

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Events Calendar
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h3 className="text-lg font-semibold min-w-[200px] text-center">
              {format(currentDate, 'MMMM yyyy')}
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {/* Day Headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 border-b">
              {day}
            </div>
          ))}

          {/* Calendar Days */}
          {calendarDays.map(day => {
            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            
            return (
              <div
                key={day.toString()}
                className={`
                  min-h-[120px] p-2 border border-gray-100 relative
                  ${isCurrentMonth(day) ? 'bg-white' : 'bg-gray-50'}
                  ${isToday(day) ? 'bg-blue-50 border-blue-200' : ''}
                  ${hasEvents ? 'cursor-pointer hover:bg-gray-50' : ''}
                `}
              >
                {/* Day Number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${isCurrentMonth(day) ? 'text-gray-900' : 'text-gray-400'}
                  ${isToday(day) ? 'text-blue-600 font-bold' : ''}
                `}>
                  {format(day, 'd')}
                </div>

                {/* Events for this day */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => onViewDetails(event)}
                      className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                      style={{
                        backgroundColor: event.is_featured ? '#7c3aed20' : 
                                       event.is_premium ? '#f59e0b20' : '#3b82f620',
                        borderLeft: `3px solid ${event.is_featured ? '#7c3aed' : 
                                                event.is_premium ? '#f59e0b' : '#3b82f6'}`
                      }}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {format(new Date(event.event_date), 'HH:mm')}
                      </div>
                    </div>
                  ))}
                  
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayEvents.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Event Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#7c3aed' }}></div>
            <span>Featured Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>Premium Events</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#3b82f6' }}></div>
            <span>Free Events</span>
          </div>
        </div>

        {/* Today's Events Detail */}
        {(() => {
          const today = new Date();
          const todayEvents = getEventsForDay(today);
          if (todayEvents.length === 0) return null;

          return (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today's Events ({todayEvents.length})
              </h4>
              <div className="grid gap-3">
                {todayEvents.map(event => (
                  <Card key={event.id} className="border border-gray-200 hover:shadow-md transition-shadow cursor-pointer" onClick={() => onViewDetails(event)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium text-gray-900">{event.title}</h5>
                            {event.is_featured && (
                              <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                <Crown className="w-3 h-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {event.is_premium && (
                              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                <Ticket className="w-3 h-3 mr-1" />
                                {event.ticket_price > 0 ? `₹${event.ticket_price}` : 'Premium'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {format(new Date(event.event_date), 'h:mm a')}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">
                                {event.location?.includes('http') ? 'Online Event' : event.location}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })()}
      </CardContent>
    </Card>
  );
}