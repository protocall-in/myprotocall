import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefundRequest, Notification } from '@/api/entities';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import paymentService from '../../payment/PaymentService';

export default function ProcessRefundModal({ refund, currentUser, onClose, onSuccess }) {
  const [refundAmount, setRefundAmount] = useState(refund.refund_amount);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState(null); // 'approve', 'reject'

  const handleApprove = async () => {
    setAction('approve');
    setIsProcessing(true);

    try {
      // Update refund status to processing
      await RefundRequest.update(refund.id, {
        status: 'processing',
        processed_by: currentUser.id,
        processed_by_name: currentUser.display_name || currentUser.full_name,
        admin_notes: adminNotes,
        refund_amount: parseFloat(refundAmount)
      });

      // Process actual refund through payment gateway
      try {
        const refundResult = await paymentService.refund({
          paymentId: refund.original_transaction_id,
          amount: parseFloat(refundAmount),
          reason: adminNotes || refund.request_reason,
          gateway: refund.payment_gateway
        });

        // Update to processed status
        await RefundRequest.update(refund.id, {
          status: 'processed',
          processed_date: new Date().toISOString(),
          gateway_refund_id: refundResult.refundId,
          gateway_response: JSON.stringify(refundResult),
          expected_completion_date: refundResult.expectedCompletionDate
        });

        // Notify user
        await Notification.create({
          user_id: refund.user_id,
          title: 'Refund Processed Successfully',
          message: `Your refund of ₹${refundAmount} has been processed and will be credited to your account within 5-7 business days.`,
          type: 'info',
          page: 'general'
        });

        toast.success('Refund processed successfully!');
        onSuccess();
        onClose();

      } catch (paymentError) {
        console.error('Payment gateway error:', paymentError);
        
        // Update to failed status
        await RefundRequest.update(refund.id, {
          status: 'failed',
          admin_notes: `${adminNotes}\n\nGateway Error: ${paymentError.message}`,
          gateway_response: JSON.stringify({ error: paymentError.message })
        });

        toast.error('Refund processing failed. Please try again or process manually.');
      }

    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setAction('reject');
    setIsProcessing(true);

    try {
      await RefundRequest.update(refund.id, {
        status: 'rejected',
        rejection_reason: adminNotes,
        processed_by: currentUser.id,
        processed_by_name: currentUser.display_name || currentUser.full_name,
        processed_date: new Date().toISOString()
      });

      // Notify user
      await Notification.create({
        user_id: refund.user_id,
        title: 'Refund Request Rejected',
        message: `Your refund request has been reviewed and rejected. Reason: ${adminNotes}`,
        type: 'warning',
        page: 'general'
      });

      toast.success('Refund request rejected');
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error('Failed to reject refund request');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Refund Request</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* User Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-500">User Name</Label>
              <Input value={refund.user_name || 'N/A'} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-slate-500">Email</Label>
              <Input value={refund.user_email || 'N/A'} readOnly className="mt-1" />
            </div>
          </div>

          {/* Transaction Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-500">Transaction ID</Label>
              <Input value={refund.original_transaction_id} readOnly className="mt-1" />
            </div>
            <div>
              <Label className="text-sm text-slate-500">Transaction Type</Label>
              <Input value={refund.transaction_type} readOnly className="mt-1" />
            </div>
          </div>

          {/* Amount Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-slate-500">Original Amount</Label>
              <Input 
                value={`₹${(refund.original_amount || 0).toLocaleString('en-IN')}`} 
                readOnly 
                className="mt-1" 
              />
            </div>
            <div>
              <Label className="text-sm text-slate-500">Refund Amount *</Label>
              <Input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={refund.original_amount}
                className="mt-1"
              />
              {parseFloat(refundAmount) > refund.original_amount && (
                <p className="text-xs text-red-600 mt-1">
                  Cannot exceed original amount
                </p>
              )}
            </div>
          </div>

          {/* User's Request Reason */}
          <div>
            <Label className="text-sm text-slate-500">User's Reason</Label>
            <Textarea 
              value={refund.request_reason || 'No reason provided'} 
              readOnly 
              className="mt-1 h-20" 
            />
          </div>

          {/* Admin Notes */}
          <div>
            <Label className="text-sm text-slate-500">Admin Notes / Processing Reason *</Label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Enter notes about this refund (required for rejection)..."
              className="mt-1 h-24"
            />
          </div>

          {/* Payment Gateway Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Payment Gateway:</strong> {refund.payment_gateway || 'Unknown'}<br />
              <strong>Original Method:</strong> {refund.payment_method || 'Unknown'}<br />
              Refund will be processed through the original payment gateway and credited to the user's original payment method.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleReject}
            disabled={isProcessing || !adminNotes.trim()}
          >
            {isProcessing && action === 'reject' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Rejecting...
              </>
            ) : (
              'Reject Request'
            )}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={
              isProcessing || 
              !refundAmount || 
              parseFloat(refundAmount) <= 0 || 
              parseFloat(refundAmount) > refund.original_amount
            }
            className="bg-green-600 hover:bg-green-700"
          >
            {isProcessing && action === 'approve' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Refund
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}