import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Investor, Notification } from '@/api/entities';
import { CheckCircle, XCircle, FileText, User, Mail, Phone, Wallet, Download, Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function KYCApprovalModal({ investor, wallet, isOpen, onClose, onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  if (!investor || !isOpen) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await Investor.update(investor.id, {
        kyc_status: 'verified'
      });

      await Notification.create({
        user_id: investor.user_id,
        title: 'KYC Verified ✅',
        message: 'Your KYC has been verified successfully. You can now request payouts and access all features.',
        type: 'info',
        page: 'general'
      });

      toast.success('✅ KYC approved successfully!');
      setShowApproveConfirm(false);
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving KYC:', error);
      toast.error('Failed to approve KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await Investor.update(investor.id, {
        kyc_status: 'failed',
        kyc_rejection_reason: rejectionReason
      });

      await Notification.create({
        user_id: investor.user_id,
        title: 'KYC Rejected ❌',
        message: `Your KYC verification has been rejected. Reason: ${rejectionReason}. Please re-upload correct documents.`,
        type: 'alert',
        page: 'general'
      });

      toast.success('KYC rejected');
      setShowRejectConfirm(false);
      setRejectionReason('');
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error('Failed to reject KYC');
    } finally {
      setIsProcessing(false);
    }
  };

  const getKYCStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200 text-base px-3 py-1">
            <CheckCircle className="w-4 h-4 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 text-base px-3 py-1">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Pending Verification
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-base px-3 py-1">
            <XCircle className="w-4 h-4 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200 text-base px-3 py-1">
            <AlertTriangle className="w-4 h-4 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  return (
    <>
      {/* Main KYC Review Modal */}
      <Dialog open={isOpen && !showApproveConfirm && !showRejectConfirm} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileText className="w-6 h-6 text-purple-600" />
              KYC Verification Review
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Status */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Current KYC Status:</span>
                {getKYCStatusBadge(investor.kyc_status)}
              </div>
            </div>

            {/* Investor Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-slate-700">
                  <User className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-xs text-slate-500">Full Name</p>
                    <p className="font-semibold">{investor.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Mail className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="font-medium">{investor.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-slate-700">
                  <Phone className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-xs text-slate-500">Mobile</p>
                    <p className="font-medium">{investor.mobile_number}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 mb-1">Investor Code</p>
                  <p className="font-bold text-blue-900 font-mono">{investor.investor_code}</p>
                </div>

                {wallet && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-xs text-green-600 mb-1 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      Wallet Balance
                    </p>
                    <p className="font-bold text-green-900">
                      ₹{(wallet.available_balance || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-purple-600 mb-1">Total Invested</p>
                  <p className="font-bold text-purple-900">
                    ₹{(investor.total_invested || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
            </div>

            {/* KYC Documents Section */}
            <div className="border-t pt-4">
              <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                KYC Documents
              </h3>

              <div className="space-y-3">
                {/* PAN Card */}
                {investor.pan_number && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">PAN Card</p>
                        <p className="text-xs text-slate-500 mt-1">
                          PAN Number: <span className="font-mono font-semibold">{investor.pan_number}</span>
                        </p>
                      </div>
                      {investor.pan_document_url && (
                        <a
                          href={investor.pan_document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Document
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Bank Details */}
                {investor.bank_account_number && (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <p className="text-sm font-semibold text-slate-700 mb-2">Bank Details</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-slate-500">Account Number</p>
                        <p className="font-mono font-semibold">{investor.bank_account_number}</p>
                      </div>
                      <div>
                        <p className="text-slate-500">IFSC Code</p>
                        <p className="font-mono font-semibold">{investor.bank_ifsc_code}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-slate-500">Bank Name</p>
                        <p className="font-semibold">{investor.bank_name}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* No Documents Warning */}
                {!investor.pan_number && !investor.bank_account_number && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">Incomplete KYC</p>
                      <p className="text-sm text-yellow-800 mt-1">
                        This investor has not uploaded complete KYC documents yet.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Previous Rejection Reason (if any) */}
            {investor.kyc_status === 'failed' && investor.kyc_rejection_reason && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="font-semibold text-red-900 mb-2">Previous Rejection Reason:</p>
                <p className="text-sm text-red-800">{investor.kyc_rejection_reason}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Close
            </Button>
            {investor.kyc_status !== 'verified' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectConfirm(true)}
                  disabled={isProcessing}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject KYC
                </Button>
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve KYC
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Modal */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Approve KYC Verification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Are you sure you want to approve KYC for this investor?</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="font-semibold text-green-900">{investor.full_name}</p>
              <p className="text-sm text-green-700">{investor.email}</p>
              <p className="text-xs text-green-600 mt-1">Code: {investor.investor_code}</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-semibold mb-1">After approval:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Investor can request wallet payouts</li>
                <li>All features will be unlocked</li>
                <li>Investor will receive a notification</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveConfirm(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm Approval
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Modal */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-6 h-6 text-red-600" />
              Reject KYC Verification
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p>Please provide a reason for rejecting this KYC:</p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="font-semibold text-red-900">{investor.full_name}</p>
              <p className="text-sm text-red-700">{investor.email}</p>
            </div>
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason *</Label>
              <Textarea
                id="rejection_reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., PAN card image is unclear, bank details don't match, etc."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectConfirm(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject} 
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirm Rejection
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}