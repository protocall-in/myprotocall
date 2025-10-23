
import React, { useState } from 'react';
import { RefundRequest, Notification } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventRefundApproval({ refund, onUpdate }) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [action, setAction] = useState(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = (actionType) => {
    setAction(actionType);
    setNotes('');
    setShowApprovalModal(true);
  };

  const submitAction = async () => {
    if (action === 'reject' && !notes.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);

    try {
      const updateData = {
        status: action === 'process' ? 'processing' : 'rejected',
        admin_notes: notes,
        processed_by: 'admin', // TODO: Get actual admin ID
        processed_date: new Date().toISOString()
      };

      if (action === 'reject') {
        updateData.rejection_reason = notes;
      }

      await RefundRequest.update(refund.id, updateData);

      // Notify user
      await Notification.create({
        user_id: refund.user_id,
        title: action === 'process' ? 'Refund Being Processed' : 'Refund Request Rejected',
        message: action === 'process'
          ? `Your refund of ₹${refund.refund_amount} for "${refund.related_entity_name}" is being processed. You'll receive the amount in 3-5 business days.`
          : `Your refund request for "${refund.related_entity_name}" has been rejected by admin. Reason: ${notes}`,
        type: action === 'process' ? 'info' : 'warning',
        page: 'general'
      });

      toast.success(`Refund ${action === 'process' ? 'processing started' : 'rejected'} successfully`);
      setShowApprovalModal(false);
      onUpdate();
    } catch (error) {
      console.error('Error processing refund action:', error);
      toast.error('Failed to process refund action');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-gray-900">{refund.related_entity_name}</h4>
                <Badge className="bg-orange-100 text-orange-800">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Awaiting Admin Review
                </Badge>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <p><strong>User:</strong> {refund.user_name} ({refund.user_email})</p>
                <p><strong>Amount:</strong> ₹{refund.refund_amount.toLocaleString()}</p>
                <p><strong>Payment ID:</strong> {refund.original_transaction_id}</p>
                <p><strong>Requested:</strong> {format(new Date(refund.created_date), 'PPP')}</p>
                <p><strong>User Reason:</strong> {refund.request_reason}</p>
                {refund.admin_notes && (
                  <p className="text-blue-600"><strong>Organizer Notes:</strong> {refund.admin_notes}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAction('process')}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Refund
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleAction('reject')}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Modal */}
      {showApprovalModal && (
        <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {action === 'process' ? 'Process Refund' : 'Reject Refund Request'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm"><strong>Event:</strong> {refund.related_entity_name}</p>
                <p className="text-sm"><strong>User:</strong> {refund.user_name}</p>
                <p className="text-sm"><strong>Amount:</strong> ₹{refund.refund_amount.toLocaleString()}</p>
                <p className="text-sm"><strong>Payment ID:</strong> {refund.original_transaction_id}</p>
              </div>
              <div>
                <Label htmlFor="notes">
                  {action === 'process' ? 'Processing Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={action === 'process'
                    ? 'Add any notes about refund processing...'
                    : 'Please explain why you are rejecting this refund...'}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApprovalModal(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={submitAction}
                disabled={isProcessing || (action === 'reject' && !notes.trim())}
                className={action === 'process' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {action === 'process' ? 'Process Refund' : 'Reject Refund'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
