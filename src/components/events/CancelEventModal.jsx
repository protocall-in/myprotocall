
import React, { useState } from 'react';
import { Event, EventTicket, RefundRequest } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertTriangle, X } from 'lucide-react';
import { toast } from 'sonner';

export default function CancelEventModal({ event, onClose, onSuccess, currentUser }) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for cancelling the event');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Update event status and cancellation reason
      await Event.update(event.id, {
        status: 'cancelled',
        cancellation_reason: reason.trim(), // Using existing 'reason' state
        admin_notes: reason.trim(), // Assuming cancellation_reason will also serve as admin_notes
        cancelled_date: new Date().toISOString()
      });

      // Auto-create refund requests for all active tickets
      const tickets = await EventTicket.filter({ event_id: event.id, status: 'active' });
      
      for (const ticket of tickets) {
        // Ensure currentUser is available and has an id
        if (!currentUser || !currentUser.id) {
            console.warn("currentUser or currentUser.id is missing. Cannot link refund request to a user.");
            // Decide how to handle this case: skip refund, or create with generic user, etc.
            // For now, we'll continue but log a warning.
        }

        await RefundRequest.create({
          user_id: ticket.user_id,
          user_name: ticket.user_name || 'Unknown',
          user_email: ticket.user_email || 'user@example.com', // Attempt to use ticket email, fallback to placeholder
          transaction_type: 'event_ticket',
          related_entity_id: ticket.id,
          related_entity_name: event.title,
          original_transaction_id: ticket.payment_id,
          original_amount: ticket.ticket_price,
          refund_amount: ticket.ticket_price,
          refund_type: 'full',
          request_reason: `Event "${event.title}" was cancelled by organizer`,
          reason_category: 'cancelled_service',
          status: 'pending',
          priority: 'high',
          payment_gateway: ticket.payment_method === 'razorpay' ? 'razorpay' : 'stripe', // Assuming these are the main gateways
          requested_by: currentUser?.id, // Use optional chaining for currentUser
          requested_by_role: 'admin',
          auto_triggered: true
        });
      }
      
      toast.success('Event cancelled successfully. All attendees will be notified and refund requests have been created.');
      onSuccess(); // Call onSuccess prop
      onClose(); // Close the modal
      
    } catch (error) {
      console.error("Error cancelling event:", error);
      toast.error('Failed to cancel event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Cancel Event
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-medium text-red-800 mb-2">Event: {event.title}</h4>
            <p className="text-sm text-red-700">
              This action cannot be undone. All attendees who have RSVP'd will be notified of the cancellation and full refunds will be initiated.
            </p>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Cancellation *</Label>
            <Textarea 
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you're cancelling this event (e.g., unexpected venue issue, low registration)..."
              className="h-24 mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Keep Event
          </Button>
          <Button 
            onClick={handleCancel} // Calls the updated handleCancel function
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <X className="w-4 h-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Cancel Event
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
