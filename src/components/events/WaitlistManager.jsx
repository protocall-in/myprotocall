import React, { useState, useEffect } from 'react';
import { EventAttendee, Notification } from '@/api/entities';
import { toast } from 'sonner';

/**
 * Waitlist Management Hook
 * Automatically promotes users from waitlist when spots become available
 */
export const useWaitlistManager = (event) => {
  const [waitlistCount, setWaitlistCount] = useState(0);
  
  useEffect(() => {
    if (!event) return;
    
    const checkWaitlist = async () => {
      try {
        // Get current attendees and waitlist
        const allAttendees = await EventAttendee.filter({ event_id: event.id });
        const confirmedAttendees = allAttendees.filter(a => a.rsvp_status === 'yes');
        const waitlistAttendees = allAttendees.filter(a => a.rsvp_status === 'waitlist')
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date)); // FIFO
        
        setWaitlistCount(waitlistAttendees.length);
        
        // If there's capacity and people on waitlist, promote them
        if (event.capacity && waitlistAttendees.length > 0) {
          const spotsAvailable = event.capacity - confirmedAttendees.length;
          
          if (spotsAvailable > 0) {
            // Promote from waitlist
            const toPromote = waitlistAttendees.slice(0, spotsAvailable);
            
            for (const attendee of toPromote) {
              await EventAttendee.update(attendee.id, { rsvp_status: 'yes' });
              
              // Notify user
              await Notification.create({
                user_id: attendee.user_id,
                title: 'You\'re Off the Waitlist!',
                message: `Great news! A spot opened up for "${event.title}". Your registration is now confirmed.`,
                type: 'info',
                page: 'general'
              });
            }
            
            if (toPromote.length > 0) {
              toast.success(`Promoted ${toPromote.length} user(s) from waitlist`);
            }
          }
        }
      } catch (error) {
        console.error('Error checking waitlist:', error);
      }
    };
    
    checkWaitlist();
    
    // Check every 2 minutes
    const interval = setInterval(checkWaitlist, 2 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [event]);
  
  return { waitlistCount };
};

/**
 * Add user to waitlist
 */
export const addToWaitlist = async (event, user) => {
  try {
    // Check if already on waitlist
    const existing = await EventAttendee.filter({ 
      event_id: event.id, 
      user_id: user.id 
    });
    
    if (existing.length > 0) {
      await EventAttendee.update(existing[0].id, { rsvp_status: 'waitlist' });
    } else {
      await EventAttendee.create({
        event_id: event.id,
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        rsvp_status: 'waitlist',
        confirmed: false
      });
    }
    
    // Notify user
    await Notification.create({
      user_id: user.id,
      title: 'Added to Waitlist',
      message: `You've been added to the waitlist for "${event.title}". We'll notify you if a spot opens up.`,
      type: 'info',
      page: 'general'
    });
    
    toast.success('Added to waitlist');
    return true;
  } catch (error) {
    console.error('Error adding to waitlist:', error);
    toast.error('Failed to add to waitlist');
    return false;
  }
};