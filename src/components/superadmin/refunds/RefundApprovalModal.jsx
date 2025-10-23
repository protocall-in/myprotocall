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
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  DollarSign,
  Calendar,
  User,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';

export default function RefundApprovalModal({ request, onClose, onApprove, onReject }) {
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState(null); // 'approve' or 'reject'

  const handleSubmit = async () => {
    if (!notes.trim() && action === 'reject') {
      alert('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      if (action === 'approve') {
        await onApprove(notes);
      } else if (action === 'reject') {
        await onReject(notes);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Review Refund Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Request Summary */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Refund Amount</p>
                <p className="text-lg font-bold">₹{request.refund_amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Request Date</p>
                <p className="text-sm font-medium">
                  {format(new Date(request.created_date), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">User ID</p>
                <p className="text-sm font-medium">{request.user_id.slice(0, 12)}...</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600" />
              <div>
                <p className="text-sm text-slate-600">Ticket ID</p>
                <p className="text-sm font-medium">{request.ticket_id.slice(-12)}</p>
              </div>
            </div>
          </div>

          {/* Refund Details */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Reason Category</Label>
              <Badge className="mt-2">{request.refund_reason_category}</Badge>
            </div>

            <div>
              <Label className="text-sm font-semibold">Detailed Reason</Label>
              <p className="mt-2 text-sm text-slate-700 p-3 bg-slate-50 rounded-lg">
                {request.reason}
              </p>
            </div>

            <div>
              <Label className="text-sm font-semibold">Payment Details</Label>
              <div className="mt-2 text-sm text-slate-700">
                <p><strong>Payment ID:</strong> {request.payment_id}</p>
                <p><strong>Gateway:</strong> {request.payment_gateway}</p>
              </div>
            </div>

            {request.auto_triggered && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  This refund was automatically triggered due to event cancellation.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Admin Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Admin Notes {action === 'reject' && <span className="text-red-600">*</span>}
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                action === 'approve' 
                  ? 'Optional: Add any notes about this refund approval...'
                  : action === 'reject'
                  ? 'Required: Explain why this refund is being rejected...'
                  : 'Add notes or select an action below...'
              }
              className="h-24"
              required={action === 'reject'}
            />
          </div>

          {/* Warning for Approval */}
          {action === 'approve' && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Processing Refund:</strong> The refund will be processed through {request.payment_gateway} 
                and the amount will be credited to the user's original payment method within 5-7 business days.
              </AlertDescription>
            </Alert>
          )}

          {/* Warning for Rejection */}
          {action === 'reject' && (
            <Alert className="bg-red-50 border-red-200">
              <XCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <strong>Rejecting Request:</strong> The user will be notified of the rejection. 
                Please ensure you provide a clear reason above.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setAction('reject');
              setTimeout(handleSubmit, 100);
            }}
            disabled={isProcessing || action === 'approve'}
          >
            {isProcessing && action === 'reject' ? 'Rejecting...' : 'Reject Request'}
          </Button>
          <Button
            onClick={() => {
              setAction('approve');
              setTimeout(handleSubmit, 100);
            }}
            disabled={isProcessing || action === 'reject'}
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing && action === 'approve' ? 'Processing...' : 'Approve & Process Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}