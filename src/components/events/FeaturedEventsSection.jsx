import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, MapPin, Users, Clock, Ticket, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function FeaturedEventsSection({ 
  featuredEvents, 
  user,
  userAttendance = [],
  userTickets = [],
  onViewDetails, 
  onTicketPurchase, 
  onUpgradePremium 
}) {
  if (!featuredEvents || featuredEvents.length === 0) {
    return null;
  }

  const getEventAccess = (event) => {
    if (!event.is_premium || (event.ticket_price || 0) === 0) {
      return { canAccess: true, reason: 'free' };
    }
    return { canAccess: false, reason: 'needs_ticket' };
  };

  const getUserRSVP = (eventId) => {
    if (!user || !userAttendance) return null;
    return userAttendance.find(attendance => attendance.event_id === eventId);
  };

  const hasUserPurchasedTicket = (eventId) => {
    if (!user?.id || !userTickets) return false;
    return userTickets.some(ticket => 
      ticket.event_id === eventId && 
      ticket.user_id === user.id && 
      ticket.status === 'active'
    );
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg">
          <Crown className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Events</h2>
          <p className="text-gray-600">Don't miss these handpicked events from our community</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredEvents.map(event => {
          const isPastEvent = new Date(event.event_date) < new Date();
          const userAccess = getEventAccess(event);
          const userRSVP = getUserRSVP(event.id);
          const userHasTicket = hasUserPurchasedTicket(event.id);

          return (
            <Card key={event.id} className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-md">
                  <Crown className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>

              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-indigo-500 opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>

              <CardHeader className="pb-3 relative z-10">
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-gray-900 line-clamp-2 mb-2">{event.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.is_premium && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-md">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}

                    {event.is_premium && (event.ticket_price || 0) > 0 && (
                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                        <Ticket className="w-3 h-3 mr-1" />
                        ₹{event.ticket_price}
                      </Badge>
                    )}

                    {!event.is_premium && (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Free Event
                      </Badge>
                    )}

                    {userHasTicket && (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Ticket className="w-3 h-3 mr-1" />
                        Ticket Purchased
                      </Badge>
                    )}
                    
                    {userRSVP && (
                      <Badge className={`${
                        userRSVP.rsvp_status === 'yes' ? 'bg-green-100 text-green-800 border-green-200' :
                        userRSVP.rsvp_status === 'maybe' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        RSVP: {userRSVP.rsvp_status.toUpperCase()}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-gray-600 text-sm line-clamp-2 mb-4">{event.description}</p>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="font-medium">
                      {format(new Date(event.event_date), 'PPP')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-4 h-4 text-purple-500" />
                    <span>{format(new Date(event.event_date), 'p')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-purple-500" />
                    <span className="line-clamp-1">
                      {event.location?.includes('http') ? 'Online Event' : event.location}
                    </span>
                  </div>
                  {event.organizer_name && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="w-4 h-4 text-purple-500" />
                      <span>by {event.organizer_name}</span>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0 relative z-10">
                {isPastEvent ? (
                  <Button disabled className="w-full" variant="outline">
                    Event Ended
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onViewDetails(event)}
                      variant="outline" 
                      className="flex-1 hover:bg-purple-50 hover:border-purple-200"
                    >
                      View Details
                    </Button>
                    
                    {!userRSVP && !userHasTicket && (
                      <>
                        {!userAccess.canAccess ? (
                          userAccess.reason === 'needs_ticket' ? (
                            <Button 
                              onClick={() => onTicketPurchase(event)}
                              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                            >
                              <Ticket className="w-4 h-4 mr-1" />
                              Buy Ticket
                            </Button>
                          ) : (
                            <Button 
                              onClick={onUpgradePremium}
                              className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                            >
                              <Crown className="w-4 h-4 mr-1" />
                              Upgrade
                            </Button>
                          )
                        ) : (
                          <Button 
                            onClick={() => onViewDetails(event)}
                            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white"
                          >
                            <Star className="w-4 h-4 mr-1" />
                            RSVP Now
                          </Button>
                        )}
                      </>
                    )}

                    {userHasTicket && !userRSVP && (
                      <Button 
                        onClick={() => onViewDetails(event)}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        RSVP Now
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}