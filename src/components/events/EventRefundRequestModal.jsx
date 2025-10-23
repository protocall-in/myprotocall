
import React, { useState } from 'react';
import { RefundRequest, Notification } from '@/api/entities';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EventRefundRequestModal({ 
  open, 
  onClose, 
  ticket, 
  event, 
  user,
  onRefundRequested
}) {
  const [reasonCategory, setReasonCategory] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasonCategories = [
    { value: 'unable_to_attend', label: 'Unable to Attend Event' },
    { value: 'schedule_conflict', label: 'Schedule Conflict' },
    { value: 'personal_emergency', label: 'Personal Emergency' },
    { value: 'changed_mind', label: 'Changed My Mind' },
    { value: 'duplicate_payment', label: 'Duplicate Payment' },
    { value: 'other', label: 'Other Reason' }
  ];

  const handleSubmit = async () => {
    if (!reasonCategory) {
      toast.error('Please select a reason category');
      return;
    }

    if (!reason.trim()) {
      toast.error('Please provide detailed reason for the refund request');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create refund request
      await RefundRequest.create({
        user_id: user.id,
        user_name: user.display_name || user.full_name,
        user_email: user.email,
        transaction_type: 'event_ticket',
        related_entity_id: ticket.id,
        related_entity_name: event.title,
        original_transaction_id: ticket.payment_id,
        original_amount: ticket.ticket_price,
        refund_amount: ticket.ticket_price,
        refund_type: 'full',
        currency: 'INR',
        request_reason: reason,
        reason_category: reasonCategory,
        status: 'pending',
        priority: 'medium',
        payment_gateway: ticket.payment_method || 'razorpay',
        requested_by: user.id,
        requested_by_role: 'user',
        auto_triggered: false,
        notification_sent: false
      });

      // Notify user
      await Notification.create({
        user_id: user.id,
        title: 'Refund Request Submitted',
        message: `Your refund request for "${event.title}" has been submitted. The event organizer will review it shortly.`,
        type: 'info',
        page: 'general'
      });

      // Notify organizer
      await Notification.create({
        user_id: event.organizer_id,
        title: 'New Refund Request',
        message: `${user.display_name || user.full_name} has requested a refund for "${event.title}". Please review the request.`,
        type: 'warning',
        page: 'general'
      });

      toast.success('Refund request submitted successfully!');
      
      // Call the callback to refresh parent data
      if (onRefundRequested) {
        onRefundRequested();
      }
      
      onClose();
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast.error('Failed to submit refund request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Request Ticket Refund</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-sm text-yellow-800">
              Your refund request will be reviewed by the event organizer first, then by our admin team. This process may take 3-5 business days.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-2"><strong>Event:</strong> {event.title}</p>
            <p className="text-sm text-slate-600 mb-2"><strong>Ticket Price:</strong> ₹{ticket.ticket_price.toLocaleString()}</p>
            <p className="text-sm text-slate-600"><strong>Payment ID:</strong> {ticket.payment_id}</p>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Select Reason Category *</Label>
            <RadioGroup value={reasonCategory} onValueChange={setReasonCategory}>
              <div className="space-y-2">
                {reasonCategories.map((category) => (
                  <div key={category.value} className="flex items-center space-x-2 p-2 hover:bg-slate-50 rounded-lg">
                    <RadioGroupItem value={category.value} id={category.value} />
                    <Label htmlFor={category.value} className="cursor-pointer flex-1 font-normal">
                      {category.label}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="reason">Detailed Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain in detail why you're requesting a refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-2 h-32"
              maxLength={500}
            />
            <p className="text-xs text-slate-500 mt-1">{reason.length}/500 characters</p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Refund Policy:</strong> Refunds are processed at the discretion of the event organizer and admin. Processing time may vary based on your payment method.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reasonCategory || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Refund Request'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
