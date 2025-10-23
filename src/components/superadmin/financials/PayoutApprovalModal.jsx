import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { format } from 'date-fns';

export default function PayoutApprovalModal({ 
  open, 
  onClose, 
  payout, 
  entityName,
  onApprove, 
  onReject, 
  canApprove 
}) {
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onApprove(adminNotes);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onReject(adminNotes);
    } finally {
      setIsProcessing(false);
    }
  };

  const getPayoutMethodIcon = (method) => {
    switch (method) {
      case 'bank_transfer': return CreditCard;
      case 'upi': return Smartphone;
      case 'paypal': return Wallet;
      default: return CreditCard;
    }
  };

  const PayoutMethodIcon = getPayoutMethodIcon(payout.payout_method);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Payout Request Review</DialogTitle>
          <DialogDescription>
            Review and process the payout request from {entityName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payout Details */}
          <div className="bg-slate-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3">Payout Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Entity Name</p>
                <p className="font-medium">{entityName}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Entity Type</p>
                <p className="font-medium capitalize">{payout.entity_type}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Requested Amount</p>
                <p className="font-bold text-green-600 text-lg">₹{payout.requested_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Available Balance</p>
                <p className="font-medium">₹{payout.available_balance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Request Date</p>
                <p className="font-medium">{format(new Date(payout.created_date), 'MMM dd, yyyy HH:mm')}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Status</p>
                <Badge className={
                  payout.status === 'processed' ? 'bg-green-100 text-green-700' :
                  payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                  payout.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }>
                  {payout.status}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payout Method Details */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <PayoutMethodIcon className="w-5 h-5 text-blue-600" />
              Payout Method: {payout.payout_method.replace('_', ' ').toUpperCase()}
            </h3>
            
            {payout.payout_method === 'bank_transfer' && payout.bank_details && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-blue-700">Account Holder</p>
                  <p className="font-medium">{payout.bank_details.account_holder_name}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">Account Number</p>
                  <p className="font-medium font-mono">
                    {payout.bank_details.account_number.replace(/.(?=.{4})/g, '*')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-blue-700">IFSC Code</p>
                  <p className="font-medium font-mono">{payout.bank_details.ifsc_code}</p>
                </div>
              </div>
            )}

            {payout.payout_method === 'upi' && payout.upi_id && (
              <div>
                <p className="text-sm text-blue-700">UPI ID</p>
                <p className="font-medium font-mono">{payout.upi_id}</p>
              </div>
            )}

            {payout.payout_method === 'paypal' && payout.paypal_email && (
              <div>
                <p className="text-sm text-blue-700">PayPal Email</p>
                <p className="font-medium">{payout.paypal_email}</p>
              </div>
            )}
          </div>

          {/* Admin Notes */}
          {payout.status !== 'pending' && payout.admin_notes && (
            <div className="bg-slate-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Admin Notes</h4>
              <p className="text-sm text-slate-700">{payout.admin_notes}</p>
              {payout.processed_date && (
                <p className="text-xs text-slate-500 mt-2">
                  Processed on {format(new Date(payout.processed_date), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
          )}

          {/* Action Section for Pending Requests */}
          {payout.status === 'pending' && canApprove && (
            <div>
              <Label htmlFor="admin_notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this payout decision..."
                className="mt-2"
              />
            </div>
          )}

          {/* Processing Guidelines */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Processing Guidelines</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Verify that the requested amount doesn't exceed available balance</li>
              <li>• Ensure payout method details are complete and accurate</li>
              <li>• Bank transfers typically take 3-5 business days</li>
              <li>• UPI payments are processed within 24 hours</li>
              <li>• Always provide clear reasons for rejections</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {payout.status === 'pending' && canApprove && (
              <>
                <Button
                  onClick={handleReject}
                  disabled={isProcessing}
                  variant="ghost"
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </Button>
                <Button
                  onClick={handleApprove}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Approve Payout'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}