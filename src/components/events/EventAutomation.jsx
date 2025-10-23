import { useEffect, useCallback } from 'react';
import { Event, EventTicket, EventAttendee, PayoutRequest, Notification, EventCommissionTracking } from '@/api/entities';
import { toast } from 'sonner';

/**
 * Event Automation Hook - Handles automated workflows for events
 * - Auto-update status when event ends
 * - Auto-create payout requests after event completion
 * - Send reminder notifications
 */
export const useEventAutomation = () => {
  
  // Check and update event statuses
  const checkEventStatuses = useCallback(async () => {
    try {
      const now = new Date();
      
      // Get all scheduled/approved events
      const events = await Event.filter({ 
        status: { $in: ['scheduled', 'approved'] } 
      });
      
      for (const event of events) {
        const eventDate = new Date(event.event_date);
        
        // If event has passed, mark as completed
        if (eventDate < now && event.status !== 'completed') {
          await Event.update(event.id, { status: 'completed' });
          
          // Trigger payout creation after completion
          await createOrganizerPayout(event);
          
          // Notify organizer
          await Notification.create({
            user_id: event.organizer_id,
            title: 'Event Completed',
            message: `Your event "${event.title}" has been marked as completed. Payout request has been created.`,
            type: 'info',
            page: 'general'
          });
        }
      }
    } catch (error) {
      console.error('Error checking event statuses:', error);
    }
  }, []);
  
  // Create payout request for event organizer
  const createOrganizerPayout = async (event) => {
    try {
      // Check if commission tracking exists
      const commissionRecords = await EventCommissionTracking.filter({ event_id: event.id });
      
      if (commissionRecords.length === 0) {
        // Create commission tracking if doesn't exist
        const tickets = await EventTicket.filter({ event_id: event.id, status: 'active' });
        const grossRevenue = tickets.reduce((sum, t) => sum + (t.ticket_price || 0), 0);
        
        if (grossRevenue > 0) {
          const platformCommissionRate = 20; // Default 20%
          const platformCommission = grossRevenue * (platformCommissionRate / 100);
          const organizerPayout = grossRevenue - platformCommission;
          
          await EventCommissionTracking.create({
            event_id: event.id,
            organizer_id: event.organizer_id,
            organizer_role: 'finfluencer', // Default, should be determined from user
            gross_revenue: grossRevenue,
            platform_commission_rate: platformCommissionRate,
            platform_commission: platformCommission,
            organizer_payout: organizerPayout,
            payout_status: 'pending',
            total_tickets_sold: tickets.length
          });
        }
      }
      
      // Check if payout request already exists
      const existingPayouts = await PayoutRequest.filter({ 
        entity_type: 'event',
        entity_id: event.id 
      });
      
      if (existingPayouts.length === 0) {
        const commissionRecord = commissionRecords[0] || await EventCommissionTracking.filter({ event_id: event.id });
        
        if (commissionRecord && commissionRecord[0] && commissionRecord[0].organizer_payout > 0) {
          await PayoutRequest.create({
            user_id: event.organizer_id,
            entity_type: 'event',
            entity_id: event.id,
            requested_amount: commissionRecord[0].organizer_payout,
            available_balance: commissionRecord[0].organizer_payout,
            payout_method: 'bank_transfer',
            status: 'pending'
          });
        }
      }
    } catch (error) {
      console.error('Error creating organizer payout:', error);
    }
  };
  
  // Send event reminders (24 hours before)
  const sendEventReminders = useCallback(async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Get events happening in next 24 hours
      const upcomingEvents = await Event.filter({ 
        status: { $in: ['scheduled', 'approved'] } 
      });
      
      for (const event of upcomingEvents) {
        const eventDate = new Date(event.event_date);
        
        // Check if event is within 24 hours
        if (eventDate > now && eventDate <= tomorrow) {
          // Get all attendees who RSVP'd yes
          const attendees = await EventAttendee.filter({ 
            event_id: event.id,
            rsvp_status: 'yes'
          });
          
          // Send reminder to each attendee
          for (const attendee of attendees) {
            await Notification.create({
              user_id: attendee.user_id,
              title: 'Event Reminder',
              message: `Reminder: "${event.title}" is happening tomorrow at ${new Date(event.event_date).toLocaleString('en-IN')}`,
              type: 'info',
              page: 'general'
            });
          }
        }
      }
    } catch (error) {
      console.error('Error sending event reminders:', error);
    }
  }, []);
  
  // Run automation checks every 5 minutes
  useEffect(() => {
    checkEventStatuses();
    sendEventReminders();
    
    const interval = setInterval(() => {
      checkEventStatuses();
      sendEventReminders();
    }, 5 * 60 * 1000); // 5 minutes
    
    return () => clearInterval(interval);
  }, [checkEventStatuses, sendEventReminders]);
  
  return {
    checkEventStatuses,
    sendEventReminders,
    createOrganizerPayout
  };
};

export default useEventAutomation;