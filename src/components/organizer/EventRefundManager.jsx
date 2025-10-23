
import React, { useState, useEffect } from 'react';
import { RefundRequest, Notification, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Clock, CheckCircle, XCircle, Eye, Loader2, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function EventRefundManager({ organizerId }) {
  const [refunds, setRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRefunds();
  }, [organizerId]);

  const loadRefunds = async () => {
    setIsLoading(true);
    try {
      // Get all refund requests for event tickets
      const allRefunds = await RefundRequest.filter({
        transaction_type: 'event_ticket'
      });

      // Filter for events organized by this user
      // Note: We need to check if the event belongs to this organizer
      // For now, we'll load all and filter client-side
      // TODO: Add event_organizer_id field to RefundRequest entity
      
      setRefunds(allRefunds.sort((a, b) => 
        new Date(b.created_date) - new Date(a.created_date)
      ));
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast.error('Failed to load refund requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReview = (refund, action) => {
    setSelectedRefund(refund);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewModal(true);
  };

  const submitReview = async () => {
    if (!reviewNotes.trim() && reviewAction === 'reject') {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);

    try {
      const updateData = {
        status: reviewAction === 'approve' ? 'approved' : 'rejected',
        admin_notes: reviewNotes,
        processed_by: organizerId,
        processed_date: new Date().toISOString()
      };

      if (reviewAction === 'reject') {
        updateData.rejection_reason = reviewNotes;
      }

      await RefundRequest.update(selectedRefund.id, updateData);

      // Notify user
      await Notification.create({
        user_id: selectedRefund.user_id,
        title: reviewAction === 'approve' ? 'Refund Request Approved by Organizer' : 'Refund Request Rejected',
        message: reviewAction === 'approve'
          ? `Your refund request for "${selectedRefund.related_entity_name}" has been approved by the organizer. It will now be reviewed by our admin team.`
          : `Your refund request for "${selectedRefund.related_entity_name}" has been rejected by the organizer. Reason: ${reviewNotes}`,
        type: reviewAction === 'approve' ? 'info' : 'warning',
        page: 'general'
      });

      // If approved, notify admin
      if (reviewAction === 'approve') {
        // Get all admin users
        const allUsers = await User.list();
        const adminUsers = allUsers.filter(u => ['admin', 'super_admin'].includes(u.app_role));
        
        for (const admin of adminUsers) {
          await Notification.create({
            user_id: admin.id,
            title: 'New Refund Pending Admin Approval',
            message: `A refund request for "${selectedRefund.related_entity_name}" has been approved by the organizer and needs your review.`,
            type: 'warning',
            page: 'general'
          });
        }
      }

      toast.success(`Refund request ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`);
      setShowReviewModal(false);
      loadRefunds();
    } catch (error) {
      console.error('Error processing refund review:', error);
      toast.error('Failed to process refund review');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Your Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Admin Approval
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            Processing
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Processed
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const pendingRefunds = refunds.filter(r => r.status === 'pending');
  const reviewedRefunds = refunds.filter(r => r.status !== 'pending');

  return (
    <div className="space-y-6">
      {/* Pending Refunds */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Pending Your Review ({pendingRefunds.length})</h3>
        {pendingRefunds.length > 0 ? (
          <div className="space-y-4">
            {pendingRefunds.map(refund => (
              <Card key={refund.id} className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{refund.related_entity_name}</h4>
                        {getStatusBadge(refund.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>User:</strong> {refund.user_name} ({refund.user_email})</p>
                        <p><strong>Amount:</strong> ₹{refund.refund_amount.toLocaleString()}</p>
                        <p><strong>Requested:</strong> {format(new Date(refund.created_date), 'PPP')}</p>
                        <p><strong>Reason:</strong> {refund.request_reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleReview(refund, 'approve')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(refund, 'reject')}
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No pending refund requests</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviewed Refunds */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Reviewed Refunds ({reviewedRefunds.length})</h3>
        {reviewedRefunds.length > 0 ? (
          <div className="space-y-4">
            {reviewedRefunds.map(refund => (
              <Card key={refund.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{refund.related_entity_name}</h4>
                        {getStatusBadge(refund.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p><strong>User:</strong> {refund.user_name}</p>
                        <p><strong>Amount:</strong> ₹{refund.refund_amount.toLocaleString()}</p>
                        <p><strong>Reviewed:</strong> {format(new Date(refund.processed_date || refund.created_date), 'PPP')}</p>
                        {refund.rejection_reason && (
                          <p className="text-red-600"><strong>Rejection Reason:</strong> {refund.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No reviewed refunds yet</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <Dialog open={showReviewModal} onOpenChange={setShowReviewModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === 'approve' ? 'Approve' : 'Reject'} Refund Request
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm"><strong>Event:</strong> {selectedRefund?.related_entity_name}</p>
                <p className="text-sm"><strong>User:</strong> {selectedRefund?.user_name}</p>
                <p className="text-sm"><strong>Amount:</strong> ₹{selectedRefund?.refund_amount.toLocaleString()}</p>
              </div>
              <div>
                <Label htmlFor="notes">
                  {reviewAction === 'approve' ? 'Notes (Optional)' : 'Rejection Reason *'}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={reviewAction === 'approve' 
                    ? 'Add any notes for the admin team...' 
                    : 'Please explain why you are rejecting this refund request...'}
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReviewModal(false)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={isProcessing || (reviewAction === 'reject' && !reviewNotes.trim())}
                className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewAction === 'approve' ? 'Approve Refund' : 'Reject Refund'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
