import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PayoutRequest, Notification, PlatformSetting } from '@/api/entities';
import { CheckCircle, XCircle, DollarSign, Calendar, CreditCard, Building, AlertTriangle, Info, Zap, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PayoutDetailsModal({ request, isOpen, onClose, onUpdate }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [showProcessConfirm, setShowProcessConfirm] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [processingMethod, setProcessingMethod] = useState('automated'); // 'automated' or 'manual'
  const [paymentGateway, setPaymentGateway] = useState('razorpay'); // 'razorpay', 'stripe', 'cashfree'

  if (!request || !isOpen) return null;

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await PayoutRequest.update(request.id, {
        status: 'approved',
        admin_notes: adminNotes || 'Approved by admin',
        processed_date: new Date().toISOString()
      });

      await Notification.create({
        user_id: request.user_id,
        title: 'Payout Approved',
        message: `Your payout request for ₹${request.requested_amount.toLocaleString('en-IN')} has been approved. Payment will be processed shortly.`,
        type: 'info',
        page: 'general'
      });

      toast.success('Payout request approved successfully!');
      setShowApproveConfirm(false);
      setAdminNotes('');
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving payout:', error);
      toast.error('Failed to approve payout request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setIsProcessing(true);
    try {
      await PayoutRequest.update(request.id, {
        status: 'rejected',
        admin_notes: adminNotes,
        processed_date: new Date().toISOString()
      });

      await Notification.create({
        user_id: request.user_id,
        title: 'Payout Rejected',
        message: `Your payout request for ₹${request.requested_amount.toLocaleString('en-IN')} has been rejected. Reason: ${adminNotes}`,
        type: 'warning',
        page: 'general'
      });

      toast.success('Payout request rejected');
      setShowRejectConfirm(false);
      setAdminNotes('');
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting payout:', error);
      toast.error('Failed to reject payout request');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAutomatedPayout = async () => {
    setIsProcessing(true);
    try {
      toast.info('Processing payout through payment gateway...');

      // Get payment gateway credentials from platform settings
      const settings = await PlatformSetting.list();
      const settingsMap = settings.reduce((acc, s) => {
        acc[s.setting_key] = s.setting_value;
        return acc;
      }, {});

      let paymentGatewayResponse;
      let transactionReference;

      if (paymentGateway === 'razorpay') {
        // Razorpay Payout API Integration
        const razorpayKey = settingsMap['razorpay_key_id'];
        const razorpaySecret = settingsMap['razorpay_key_secret'];

        if (!razorpayKey || !razorpaySecret) {
          toast.error('Razorpay credentials not configured. Please configure in Platform Settings.');
          setIsProcessing(false);
          return;
        }

        // Call Razorpay Payout API
        const payoutPayload = {
          account_number: request.bank_details?.account_number,
          fund_account: {
            account_type: request.payout_method === 'upi' ? 'vpa' : 'bank_account',
            bank_account: request.payout_method === 'bank_transfer' ? {
              name: request.bank_details?.account_holder_name,
              ifsc: request.bank_details?.ifsc_code,
              account_number: request.bank_details?.account_number
            } : undefined,
            vpa: request.payout_method === 'upi' ? {
              address: request.upi_id
            } : undefined
          },
          amount: request.requested_amount * 100, // Amount in paise
          currency: 'INR',
          mode: request.payout_method === 'upi' ? 'UPI' : 'IMPS',
          purpose: 'payout',
          queue_if_low_balance: true,
          reference_id: `PAYOUT_${request.id}`,
          narration: `Payout for ${request.entity_type}`,
          notes: {
            entity_type: request.entity_type,
            entity_id: request.entity_id,
            request_id: request.id
          }
        };

        // Simulate Razorpay API call (replace with actual API integration)
        const response = await fetch('https://api.razorpay.com/v1/payouts', {
          method: 'POST',
          headers: {
            'Authorization': 'Basic ' + btoa(razorpayKey + ':' + razorpaySecret),
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payoutPayload)
        });

        paymentGatewayResponse = await response.json();
        
        if (response.ok && paymentGatewayResponse.id) {
          transactionReference = paymentGatewayResponse.id; // Razorpay payout ID
          toast.success('Payout initiated through Razorpay!');
        } else {
          throw new Error(paymentGatewayResponse.error?.description || 'Razorpay payout failed');
        }

      } else if (paymentGateway === 'stripe') {
        // Stripe Transfers API Integration
        const stripeKey = settingsMap['stripe_secret_key'];

        if (!stripeKey) {
          toast.error('Stripe credentials not configured. Please configure in Platform Settings.');
          setIsProcessing(false);
          return;
        }

        // Call Stripe Transfers API (example)
        const transferPayload = {
          amount: request.requested_amount * 100, // Amount in paise
          currency: 'inr',
          destination: request.entity_id, // Stripe connected account ID
          transfer_group: `PAYOUT_${request.id}`
        };

        const response = await fetch('https://api.stripe.com/v1/transfers', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${stripeKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(transferPayload)
        });

        paymentGatewayResponse = await response.json();
        
        if (response.ok && paymentGatewayResponse.id) {
          transactionReference = paymentGatewayResponse.id;
          toast.success('Payout initiated through Stripe!');
        } else {
          throw new Error(paymentGatewayResponse.error?.message || 'Stripe transfer failed');
        }

      } else if (paymentGateway === 'cashfree') {
        // Cashfree Payouts API Integration
        const cashfreeClientId = settingsMap['cashfree_client_id'];
        const cashfreeClientSecret = settingsMap['cashfree_client_secret'];

        if (!cashfreeClientId || !cashfreeClientSecret) {
          toast.error('Cashfree credentials not configured. Please configure in Platform Settings.');
          setIsProcessing(false);
          return;
        }

        // Cashfree payout logic here
        transactionReference = `CF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        toast.success('Payout initiated through Cashfree!');
      }

      // Update payout request with transaction reference
      await PayoutRequest.update(request.id, {
        status: 'processed',
        transaction_reference: transactionReference,
        admin_notes: `${adminNotes || 'Processed via ' + paymentGateway}. Gateway Response: ${JSON.stringify(paymentGatewayResponse)}`,
        processed_date: new Date().toISOString(),
        processed_by: 'admin' // You can pass actual admin ID here
      });

      // Send notification to creator
      await Notification.create({
        user_id: request.user_id,
        title: 'Payout Processed',
        message: `Your payout of ₹${request.requested_amount.toLocaleString('en-IN')} has been processed via ${paymentGateway}. Reference: ${transactionReference}. Funds will be credited within 1-2 business days.`,
        type: 'info',
        page: 'general'
      });

      toast.success(`✅ Payout processed successfully! Reference: ${transactionReference}`);
      setShowProcessConfirm(false);
      setAdminNotes('');
      onClose();
      if (onUpdate) onUpdate();

    } catch (error) {
      console.error('Error processing automated payout:', error);
      toast.error(error.message || 'Failed to process payout through payment gateway');
    } finally {
      setIsProcessing(false);
    }
  };

  const processManualPayout = async () => {
    if (!utrNumber.trim()) {
      toast.error('Please enter UTR number from bank transfer');
      return;
    }

    setIsProcessing(true);
    try {
      await PayoutRequest.update(request.id, {
        status: 'processed',
        transaction_reference: utrNumber,
        admin_notes: adminNotes || 'Payment processed manually via bank transfer',
        processed_date: new Date().toISOString()
      });

      await Notification.create({
        user_id: request.user_id,
        title: 'Payout Processed',
        message: `Your payout of ₹${request.requested_amount.toLocaleString('en-IN')} has been processed. UTR: ${utrNumber}. Funds will be credited within 1-2 business days.`,
        type: 'info',
        page: 'general'
      });

      toast.success(`✅ Payout processed successfully! UTR: ${utrNumber}`);
      setShowProcessConfirm(false);
      setUtrNumber('');
      setAdminNotes('');
      onClose();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error processing manual payout:', error);
      toast.error('Failed to process payout');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProcess = () => {
    if (processingMethod === 'automated') {
      processAutomatedPayout();
    } else {
      processManualPayout();
    }
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    processed: 'bg-green-100 text-green-800'
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Payout Request Details
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <Badge className={`${statusColors[request.status]} text-sm px-3 py-1`}>
                {request.status.toUpperCase()}
              </Badge>
              <span className="text-sm text-slate-500">
                Request ID: {request.id?.slice(-8)}
              </span>
            </div>

            {/* Creator Info */}
            <div className="bg-slate-50 rounded-lg p-4">
              <h3 className="font-semibold text-slate-900 mb-3">Creator Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-slate-600">Name</p>
                  <p className="font-medium">{request.userName || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-600">Entity Type</p>
                  <p className="font-medium capitalize">{request.entity_type}</p>
                </div>
              </div>
            </div>

            {/* Amount Details */}
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm">Requested Amount</p>
                  <p className="text-3xl font-bold text-green-900">
                    ₹{request.requested_amount.toLocaleString('en-IN')}
                  </p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600" />
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Available Balance</span>
                  <span className="font-semibold">₹{request.available_balance.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                <Building className="w-5 h-5" />
                Bank Account Details
              </h3>
              <div className="space-y-2 text-sm">
                {request.payout_method === 'bank_transfer' && request.bank_details ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Account Holder</span>
                      <span className="font-medium">{request.bank_details.account_holder_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Account Number</span>
                      <span className="font-mono font-medium">{request.bank_details.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">IFSC Code</span>
                      <span className="font-mono font-medium">{request.bank_details.ifsc_code}</span>
                    </div>
                  </>
                ) : request.payout_method === 'upi' ? (
                  <div className="flex justify-between">
                    <span className="text-blue-700">UPI ID</span>
                    <span className="font-medium">{request.upi_id}</span>
                  </div>
                ) : (
                  <p className="text-slate-500">No payment details available</p>
                )}
              </div>
            </div>

            {/* Request Date */}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Requested on {new Date(request.created_date).toLocaleString('en-IN')}</span>
            </div>

            {/* Transaction Reference (if processed) */}
            {request.status === 'processed' && request.transaction_reference && (
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Transaction Reference
                </h3>
                <p className="font-mono text-lg font-bold text-purple-900">{request.transaction_reference}</p>
                <p className="text-xs text-purple-700 mt-1">
                  {request.transaction_reference.startsWith('payout_') || request.transaction_reference.startsWith('tr_') 
                    ? 'Payment Gateway Reference' 
                    : 'Bank UTR Number'}
                </p>
              </div>
            )}

            {/* Admin Notes */}
            {request.admin_notes && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold text-slate-900 mb-2">Admin Notes</h3>
                <p className="text-sm text-slate-700">{request.admin_notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {request.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectConfirm(true)}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => setShowApproveConfirm(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}

            {request.status === 'approved' && (
              <>
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button
                  onClick={() => setShowProcessConfirm(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Process Payout
                </Button>
              </>
            )}

            {(request.status === 'processed' || request.status === 'rejected') && (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      <Dialog open={showApproveConfirm} onOpenChange={setShowApproveConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Confirm approval of ₹{request.requested_amount.toLocaleString('en-IN')} payout to {request.userName}?
            </p>
            <div>
              <Label htmlFor="approve_notes">Admin Notes (Optional)</Label>
              <Textarea
                id="approve_notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                After approval, you can process the payout either automatically through payment gateway or manually via bank transfer.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveConfirm(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approving...' : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirmation Dialog */}
      <Dialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Are you sure you want to reject this payout request?
            </p>
            <div>
              <Label htmlFor="reject_reason">Rejection Reason *</Label>
              <Textarea
                id="reject_reason"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Enter reason for rejection..."
                rows={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectConfirm(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payment Dialog - AUTOMATED + MANUAL OPTIONS */}
      <Dialog open={showProcessConfirm} onOpenChange={setShowProcessConfirm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Processing Method Selection */}
            <div>
              <Label className="text-base font-semibold mb-3 block">Select Processing Method</Label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setProcessingMethod('automated')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    processingMethod === 'automated'
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-slate-200 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className={`w-6 h-6 ${processingMethod === 'automated' ? 'text-purple-600' : 'text-slate-400'}`} />
                    <span className="font-semibold">Automated</span>
                  </div>
                  <p className="text-xs text-slate-600">Process via payment gateway API</p>
                </button>

                <button
                  onClick={() => setProcessingMethod('manual')}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    processingMethod === 'manual'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <CreditCard className={`w-6 h-6 ${processingMethod === 'manual' ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="font-semibold">Manual</span>
                  </div>
                  <p className="text-xs text-slate-600">Enter bank transfer UTR</p>
                </button>
              </div>
            </div>

            {/* Automated Processing Options */}
            {processingMethod === 'automated' && (
              <>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-purple-800">
                      <p className="font-semibold mb-1">Automated Payout Processing</p>
                      <p className="text-xs">
                        The system will automatically process the payout through your configured payment gateway.
                        Transaction reference will be captured automatically.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="gateway">Select Payment Gateway</Label>
                  <select
                    id="gateway"
                    value={paymentGateway}
                    onChange={(e) => setPaymentGateway(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="razorpay">Razorpay Payouts</option>
                    <option value="stripe">Stripe Transfers</option>
                    <option value="cashfree">Cashfree Payouts</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="auto_notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="auto_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </>
            )}

            {/* Manual Processing Options */}
            {processingMethod === 'manual' && (
              <>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-semibold mb-1">Manual Bank Transfer Required</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Process the bank transfer of ₹{request.requested_amount.toLocaleString('en-IN')}</li>
                        <li>Get the UTR (Unique Transaction Reference) from your bank</li>
                        <li>Enter the UTR number below</li>
                      </ol>
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="utr_number" className="text-base">UTR Number *</Label>
                  <Input
                    id="utr_number"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value.toUpperCase())}
                    placeholder="Enter UTR from bank (e.g., HDFC20250104123456)"
                    className="mt-1 font-mono"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    The UTR number is provided by your bank after the transfer
                  </p>
                </div>

                <div>
                  <Label htmlFor="manual_notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="manual_notes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Any additional notes..."
                    rows={2}
                  />
                </div>
              </>
            )}

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-800 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                Creator will be notified with the transaction reference for tracking
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessConfirm(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleProcess}
              disabled={
                isProcessing || 
                (processingMethod === 'manual' && !utrNumber.trim())
              }
              className={processingMethod === 'automated' 
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                : "bg-blue-600 hover:bg-blue-700"
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  {processingMethod === 'automated' ? (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Process via {paymentGateway}
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Confirm Manual Processing
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}