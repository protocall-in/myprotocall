import React, { useState, useEffect } from 'react';
import { RefundRequest } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import EventRefundRequestModal from './EventRefundRequestModal';

export default function RefundRequestSection({ ticket, event, user, onRefundRequested }) {
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [existingRefund, setExistingRefund] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkExistingRefund();
  }, [ticket.id]);

  const checkExistingRefund = async () => {
    try {
      const refunds = await RefundRequest.filter({
        user_id: user.id,
        related_entity_id: ticket.id,
        transaction_type: 'event_ticket'
      });

      // Get the most recent refund request
      if (refunds.length > 0) {
        const sortedRefunds = refunds.sort((a, b) => 
          new Date(b.created_date) - new Date(a.created_date)
        );
        setExistingRefund(sortedRefunds[0]);
      }
    } catch (error) {
      console.error('Error checking existing refund:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRefundStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Organizer Review
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-orange-100 text-orange-800 border-orange-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending Admin Approval
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="w-3 h-3 mr-1" />
            Processing Refund
          </Badge>
        );
      case 'processed':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Refund Processed
          </Badge>
        );
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Refund Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return null;
  }

  // If refund already requested and not rejected/cancelled
  if (existingRefund && !['rejected', 'cancelled', 'failed'].includes(existingRefund.status)) {
    return (
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Refund Request Submitted</span>
            </div>
            <p className="text-xs text-yellow-700 mb-2">
              Your refund request is being reviewed. We'll notify you of any updates.
            </p>
            {getRefundStatusBadge(existingRefund.status)}
          </div>
        </div>
        {existingRefund.rejection_reason && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            <strong>Reason:</strong> {existingRefund.rejection_reason}
          </div>
        )}
      </div>
    );
  }

  // Show refund button only if no pending refund
  return (
    <>
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-800 mb-2">
              Since you've updated your RSVP to <strong>"No"</strong>, you can request a refund for your ticket.
            </p>
            <Button
              size="sm"
              onClick={() => setShowRefundModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              Request Refund
            </Button>
          </div>
        </div>
      </div>

      {showRefundModal && (
        <EventRefundRequestModal
          open={showRefundModal}
          onClose={() => {
            setShowRefundModal(false);
            checkExistingRefund();
            onRefundRequested();
          }}
          ticket={ticket}
          event={event}
          user={user}
        />
      )}
    </>
  );
}