import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Calendar, 
  User, 
  CreditCard, 
  FileText, 
  CheckCircle, 
  XCircle,
  Clock,
  IndianRupee
} from 'lucide-react';
import { format } from 'date-fns';

export default function RefundDetailsModal({ refund, onClose, onProcess }) {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-blue-100 text-blue-800 border-blue-200',
      processing: 'bg-blue-100 text-blue-800 border-blue-200',
      processed: 'bg-green-100 text-green-800 border-green-200',
      failed: 'bg-red-100 text-red-800 border-red-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-600" />
            Refund Request Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Status Banner */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
            <div>
              <p className="text-sm text-slate-600 mb-1">Current Status</p>
              <Badge className={`${getStatusColor(refund.status)} border text-base px-3 py-1`}>
                {refund.status.toUpperCase()}
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Request Date</p>
              <p className="font-semibold">{format(new Date(refund.created_date), 'PPP')}</p>
            </div>
          </div>

          {/* User Information */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              User Information
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="font-medium">{refund.user_name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="font-medium">{refund.user_email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Transaction Details
            </h3>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500">Transaction ID</p>
                <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                  {refund.original_transaction_id}
                </code>
              </div>
              <div>
                <p className="text-xs text-slate-500">Transaction Type</p>
                <p className="font-medium capitalize">{refund.transaction_type?.replace('_', ' ')}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment Gateway</p>
                <p className="font-medium capitalize">{refund.payment_gateway || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Payment Method</p>
                <p className="font-medium capitalize">{refund.payment_method || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Refund Amount */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Refund Amount
            </h3>
            <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg">
              <div>
                <p className="text-xs text-slate-500">Original Amount</p>
                <p className="text-xl font-bold text-slate-900">
                  ₹{(refund.original_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Refund Amount</p>
                <p className="text-xl font-bold text-blue-600">
                  ₹{(refund.refund_amount || 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Refund Type</p>
                <Badge variant="outline">
                  {refund.refund_type === 'full' ? 'Full Refund' : 'Partial Refund'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Reason */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">User's Refund Reason</h3>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-sm text-slate-700">{refund.request_reason || 'No reason provided'}</p>
              {refund.reason_category && (
                <Badge variant="outline" className="mt-2">
                  {refund.reason_category.replace('_', ' ')}
                </Badge>
              )}
            </div>
          </div>

          {/* Admin Notes (if exists) */}
          {refund.admin_notes && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">Admin Notes</h3>
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <p className="text-sm text-slate-700">{refund.admin_notes}</p>
              </div>
            </div>
          )}

          {/* Rejection Reason (if rejected) */}
          {refund.rejection_reason && (
            <div>
              <h3 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Rejection Reason
              </h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-sm text-red-900">{refund.rejection_reason}</p>
              </div>
            </div>
          )}

          {/* Processing Info (if processed) */}
          {refund.status === 'processed' && (
            <div>
              <h3 className="text-sm font-semibold text-green-600 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Processing Information
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-green-50 border border-green-200 p-4 rounded-lg">
                <div>
                  <p className="text-xs text-green-700">Processed By</p>
                  <p className="font-medium text-green-900">{refund.processed_by_name || 'System'}</p>
                </div>
                <div>
                  <p className="text-xs text-green-700">Processed Date</p>
                  <p className="font-medium text-green-900">
                    {refund.processed_date ? format(new Date(refund.processed_date), 'PPP') : 'N/A'}
                  </p>
                </div>
                {refund.gateway_refund_id && (
                  <div>
                    <p className="text-xs text-green-700">Gateway Refund ID</p>
                    <code className="text-sm font-mono bg-white px-2 py-1 rounded">
                      {refund.gateway_refund_id}
                    </code>
                  </div>
                )}
                {refund.expected_completion_date && (
                  <div>
                    <p className="text-xs text-green-700">Expected Completion</p>
                    <p className="font-medium text-green-900">
                      {format(new Date(refund.expected_completion_date), 'PPP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline/Audit (if available) */}
          {refund.refund_timeline && refund.refund_timeline.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Timeline
              </h3>
              <div className="space-y-2">
                {refund.refund_timeline.map((event, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-2"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.action}</p>
                      <p className="text-xs text-slate-500">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {refund.status === 'pending' && (
            <Button onClick={onProcess} className="bg-blue-600 hover:bg-blue-700">
              Process Refund
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}