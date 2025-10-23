import React, { useState, useEffect, useCallback } from 'react';
import { EventAttendee, EventTicket } from '@/api/entities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Users, 
  Clock,
  Crown,
  Ticket,
  Eye,
  Check,
  X,
  Clock as ClockIcon
} from 'lucide-react';
import { toast } from 'sonner';
import CapacityChecker, { canRegisterForEvent } from './CapacityChecker';

export default function EventCard({ 
  event, 
  user, 
  userAccess,
  userTickets = [], // NEW: Receive from parent
  onViewDetails, 
  onTicketPurchase, 
  onUpgradePremium,
  onUpdate 
}) {
  const [userRSVP, setUserRSVP] = useState(null);
  const [totalAttendees, setTotalAttendees] = useState({
    yes: 0,
    maybe: 0,
    no: 0,
    total: 0
  });
  const [isRSVPing, setIsRSVPing] = useState(false);

  // UPDATED: Calculate userHasTicket from prop instead of loading internally
  const userHasTicket = React.useMemo(() => {
    if (!user?.id || !event.is_premium || (event.ticket_price || 0) === 0) {
      return false;
    }
    return userTickets.some(ticket => 
      ticket.event_id === event.id && 
      ticket.user_id === user.id && 
      ticket.status === 'active'
    );
  }, [userTickets, event.id, user?.id, event.is_premium, event.ticket_price]);

  const loadRSVPData = useCallback(async () => {
    try {
      const allAttendees = await EventAttendee.filter({ event_id: event.id });
      
      const rsvpCounts = {
        yes: allAttendees.filter(a => a.rsvp_status === 'yes').length,
        maybe: allAttendees.filter(a => a.rsvp_status === 'maybe').length,
        no: allAttendees.filter(a => a.rsvp_status === 'no').length,
        total: allAttendees.length
      };
      setTotalAttendees(rsvpCounts);

      if (user?.id) {
        const currentUserRSVP = allAttendees.find(attendee => attendee.user_id === user.id);
        setUserRSVP(currentUserRSVP);
      }
    } catch (error) {
      console.error('Error loading RSVP data:', error);
    }
  }, [event.id, user?.id]);

  useEffect(() => {
    loadRSVPData();
  }, [loadRSVPData]);

  // UPDATED: Reload when userTickets changes (after payment)
  useEffect(() => {
    loadRSVPData();
  }, [userTickets, loadRSVPData]);

  const handleRSVP = async (status) => {
    if (!user) {
      toast.error('Please login to RSVP');
      return;
    }

    // CRITICAL: Check if payment is required and completed
    if (event.is_premium && (event.ticket_price || 0) > 0 && !userHasTicket) {
      toast.error('Please purchase a ticket first to RSVP');
      onTicketPurchase(event);
      return;
    }

    // Check access for premium events without price
    if (event.is_premium && (event.ticket_price || 0) === 0 && !userAccess.canAccess) {
      if (userAccess.reason === 'needs_premium') {
        onUpgradePremium();
        return;
      }
    }

    // Check capacity before allowing RSVP
    const capacityCheck = canRegisterForEvent(event, totalAttendees.yes);
    if (!capacityCheck.canRegister && status === 'yes') {
      toast.error('Event is at full capacity');
      return;
    }

    setIsRSVPing(true);
    try {
      if (userRSVP) {
        await EventAttendee.update(userRSVP.id, { 
          rsvp_status: status,
          user_name: user.display_name || user.full_name,
          confirmed: false
        });
      } else {
        await EventAttendee.create({
          event_id: event.id,
          user_id: user.id,
          user_name: user.display_name || user.full_name,
          rsvp_status: status,
          confirmed: false
        });
      }
      
      toast.success(`RSVP updated to "${status.toUpperCase()}"`);
      loadRSVPData();
      onUpdate();
    } catch (error) {
      console.error('Error updating RSVP:', error);
      toast.error('Failed to update RSVP');
    } finally {
      setIsRSVPing(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-IN', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
      });
    }
  };

  const isPastEvent = new Date(event.event_date) < new Date();

  // UPDATED: Check if user can RSVP (must have ticket for paid events)
  const canUserRSVP = () => {
    if (!user) return false;
    if (isPastEvent) return false;
    
    // For premium events with price, user must have ticket
    if (event.is_premium && (event.ticket_price || 0) > 0) {
      return userHasTicket;
    }
    
    // For premium events without price, check subscription
    if (event.is_premium && (event.ticket_price || 0) === 0) {
      return userAccess.canAccess;
    }
    
    // Free events - anyone can RSVP
    return true;
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-md flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2">
            {/* Premium Badge - ALWAYS SHOW FOR PREMIUM EVENTS */}
            {event.is_premium && (
              <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-md">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}

            {/* Price Badge - SEPARATE FROM PREMIUM BADGE */}
            {event.is_premium && (event.ticket_price || 0) > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <Ticket className="w-3 h-3 mr-1" />
                ₹{event.ticket_price}
              </Badge>
            )}

            {/* Free Event Badge */}
            {!event.is_premium && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Free Event
              </Badge>
            )}

            {/* Ticket Purchased Badge */}
            {userHasTicket && (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <Ticket className="w-3 h-3 mr-1" />
                Ticket Purchased
              </Badge>
            )}

            {/* RSVP Status Badge */}
            {userRSVP && (
              <Badge variant="outline" className="text-blue-600">
                <Check className="w-3 h-3 mr-1" />
                RSVP: {userRSVP.rsvp_status.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
      </CardHeader>
      
      <CardContent className="space-y-4 flex-grow flex flex-col">
        {/* Event Details */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{formatDate(event.event_date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>{totalAttendees.yes} attending{totalAttendees.maybe > 0 ? `, ${totalAttendees.maybe} maybe` : ''}</span>
          </div>
          
          {event.capacity && (
            <CapacityChecker event={event} attendeeCount={totalAttendees.yes} />
          )}
        </div>

        <div className="flex-grow"></div>

        {/* RSVP Section */}
        <div className="space-y-3">
          {isPastEvent ? (
            <div className="text-sm text-gray-500 text-center py-2">Event has ended</div>
          ) : !user ? (
            <div className="text-sm text-blue-600 text-center py-2">Login to RSVP</div>
          ) : !canUserRSVP() ? (
            // UPDATED: Show payment/upgrade button if user can't RSVP
            event.is_premium && (event.ticket_price || 0) > 0 ? (
              <Button 
                onClick={() => onTicketPurchase(event)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-full"
              >
                <Ticket className="w-4 h-4 mr-2" />
                Buy Ticket to RSVP (₹{event.ticket_price || 0})
              </Button>
            ) : (
              <Button 
                onClick={onUpgradePremium}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 rounded-full"
              >
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            )
          ) : (
            <>
              {userRSVP && (
                <div className={`p-3 rounded-full text-center text-sm font-medium ${
                  userRSVP.rsvp_status === 'yes' ? 'bg-green-100 text-green-800' :
                  userRSVP.rsvp_status === 'maybe' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  Your RSVP: {userRSVP.rsvp_status.toUpperCase()}
                </div>
              )}
              
              {/* RSVP Buttons - Only shown after payment for paid events */}
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 rounded-full font-semibold"
                  onClick={() => handleRSVP('yes')}
                  disabled={isRSVPing}
                >
                  Yes
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100 rounded-full font-semibold"
                  onClick={() => handleRSVP('maybe')}
                  disabled={isRSVPing}
                >
                  Maybe
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100 rounded-full font-semibold"
                  onClick={() => handleRSVP('no')}
                  disabled={isRSVPing}
                >
                  No
                </Button>
              </div>
            </>
          )}
          
          <Button 
            variant="link" 
            size="sm" 
            className="w-full text-blue-600 p-0 h-auto justify-center rounded-full"
            onClick={() => onViewDetails(event)}
          >
            View Details & Attendees
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}