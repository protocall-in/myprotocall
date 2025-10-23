import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefundRequest } from '@/api/entities';
import { AlertCircle, DollarSign, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function RefundRequestModal({ ticket, event, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('cant_attend');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund request');
      return;
    }

    setIsSubmitting(true);

    try {
      await RefundRequest.create({
        ticket_id: ticket.id,
        event_id: event.id,
        user_id: ticket.user_id,
        payment_id: ticket.payment_id,
        refund_amount: ticket.ticket_price,
        refund_type: 'full',
        reason: reason.trim(),
        refund_reason_category: reasonCategory,
        status: 'pending',
        payment_gateway: ticket.payment_method || 'razorpay',
        auto_triggered: false
      });

      toast.success('Refund request submitted successfully. You will be notified once processed.');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast.error('Failed to submit refund request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Refund Amount Display */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-800 font-medium">Refund Amount</p>
                <p className="text-2xl font-bold text-blue-900">₹{ticket.ticket_price.toLocaleString()}</p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Event: {event.title}</p>
            <p className="text-sm text-slate-600">
              Ticket ID: {ticket.id.slice(-8).toUpperCase()}
            </p>
          </div>

          {/* Refund Policy Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Refund Policy:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Refunds are processed within 5-7 business days</li>
                <li>Amount will be credited to your original payment method</li>
                <li>Processing fees may apply based on the refund reason</li>
              </ul>
            </AlertDescription>
          </Alert>

          {/* Reason Category */}
          <div className="space-y-3">
            <Label>Reason for Refund *</Label>
            <RadioGroup value={reasonCategory} onValueChange={setReasonCategory}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cant_attend" id="cant_attend" />
                <Label htmlFor="cant_attend" className="font-normal cursor-pointer">
                  I can't attend the event
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="event_cancelled" id="event_cancelled" />
                <Label htmlFor="event_cancelled" className="font-normal cursor-pointer">
                  Event was cancelled
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor_quality" id="poor_quality" />
                <Label htmlFor="poor_quality" className="font-normal cursor-pointer">
                  Event quality didn't match description
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="technical_issues" id="technical_issues" />
                <Label htmlFor="technical_issues" className="font-normal cursor-pointer">
                  Technical issues prevented attendance
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">
                  Other reason
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Detailed Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Please provide more details *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why you're requesting a refund..."
              className="h-24"
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}