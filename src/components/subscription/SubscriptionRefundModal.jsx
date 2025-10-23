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
import { RefundRequest, User } from '@/api/entities';
import { AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export default function SubscriptionRefundModal({ subscription, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [reasonCategory, setReasonCategory] = useState('not_satisfied');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setIsSubmitting(true);
    try {
      const currentUser = await User.me();

      await RefundRequest.create({
        user_id: currentUser.id,
        user_name: currentUser.display_name,
        user_email: currentUser.email,
        transaction_type: 'subscription',
        related_entity_id: subscription.id,
        related_entity_name: `${subscription.plan_type} Subscription`,
        original_transaction_id: subscription.payment_id || 'N/A',
        original_amount: subscription.price,
        refund_amount: subscription.price,
        refund_type: 'full',
        request_reason: reason,
        reason_category: reasonCategory,
        status: 'pending',
        priority: 'medium',
        payment_gateway: 'razorpay',
        requested_by: currentUser.id,
        requested_by_role: 'user',
        auto_triggered: false
      });

      onSuccess();
    } catch (error) {
      console.error('Error submitting refund request:', error);
      toast.error('Failed to submit refund request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Request Subscription Refund
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Refund requests are reviewed within 3-5 business days. Approved refunds are processed within 7-10 business days.
            </AlertDescription>
          </Alert>

          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Subscription Plan:</span>
              <span className="font-semibold capitalize">{subscription.plan_type}</span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-sm text-slate-600">Refund Amount:</span>
              <span className="font-semibold text-green-600">₹{subscription.price.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <Label>Reason Category</Label>
            <RadioGroup value={reasonCategory} onValueChange={setReasonCategory} className="mt-2 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="not_satisfied" id="not_satisfied" />
                <Label htmlFor="not_satisfied" className="font-normal cursor-pointer">Not satisfied with service</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="technical_issue" id="technical_issue" />
                <Label htmlFor="technical_issue" className="font-normal cursor-pointer">Technical issues</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor_quality" id="poor_quality" />
                <Label htmlFor="poor_quality" className="font-normal cursor-pointer">Poor quality content</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other" className="font-normal cursor-pointer">Other reason</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="reason">Detailed Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you're requesting a refund..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}