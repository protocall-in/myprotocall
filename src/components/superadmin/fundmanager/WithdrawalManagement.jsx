
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FundWithdrawalRequest, FundAllocation, FundWallet, FundPlan, Investor, FundTransaction, FundNotification } from '@/api/entities';
import { toast } from 'sonner';
import { Clock, CheckCircle, XCircle, DollarSign, AlertTriangle, Loader2, Send } from 'lucide-react';
import { SendEmail } from '@/api/integrations';

export default function WithdrawalManagement({ onUpdate }) {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [fundPlans, setFundPlans] = useState({});
  const [allocations, setAllocations] = useState({});
  const [investors, setInvestors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requests, plans, allocs, invs] = await Promise.all([
        FundWithdrawalRequest.list('-created_date'),
        FundPlan.list(),
        FundAllocation.list(),
        Investor.list()
      ]);

      const plansMap = plans.reduce((acc, plan) => {
        acc[plan.id] = plan;
        return acc;
      }, {});

      const allocsMap = allocs.reduce((acc, alloc) => {
        acc[alloc.id] = alloc;
        return acc;
      }, {});

      const invsMap = invs.reduce((acc, inv) => {
        acc[inv.id] = inv;
        return acc;
      }, {});

      setWithdrawalRequests(requests);
      setFundPlans(plansMap);
      setAllocations(allocsMap);
      setInvestors(invsMap);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleProcessPayout = (request) => {
    setSelectedRequest(request);
    setShowProcessModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      });

      const investor = investors[selectedRequest.investor_id];
      
      // Send email notification
      try {
        await SendEmail({
          to: investor?.email,
          subject: 'Withdrawal Request Approved - Protocol',
          body: `Dear ${investor?.full_name},\n\nYour withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} has been approved by the Fund Manager.\n\nExpected Processing Date: ${new Date(selectedRequest.expected_processing_date).toLocaleDateString('en-IN')}\n\nAdmin Notes: ${adminNotes || 'N/A'}\n\nBest Regards,\nProtocol Team`
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      // Create in-app notification
      try {
        await FundNotification.create({
          investor_id: selectedRequest.investor_id,
          notification_type: 'alert',
          title: 'Withdrawal Request Approved',
          message: `Your withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} has been approved. Expected processing date: ${new Date(selectedRequest.expected_processing_date).toLocaleDateString('en-IN')}.`,
          status: 'unread',
          related_entity_type: 'withdrawal_request',
          related_entity_id: selectedRequest.id
        });
      } catch (notifError) {
        console.warn('Notification creation failed:', notifError);
      }

      toast.success('Withdrawal request approved');
      setShowApproveModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      });

      const investor = investors[selectedRequest.investor_id];
      
      // Send email notification
      try {
        await SendEmail({
          to: investor?.email,
          subject: 'Withdrawal Request Rejected - Protocol',
          body: `Dear ${investor?.full_name},\n\nYour withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} has been rejected.\n\nReason: ${rejectionReason}\n\nIf you have any questions, please contact our support team.\n\nBest Regards,\nProtocol Team`
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      // Create in-app notification
      try {
        await FundNotification.create({
          investor_id: selectedRequest.investor_id,
          notification_type: 'alert',
          title: 'Withdrawal Request Rejected',
          message: `Your withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} has been rejected. Reason: ${rejectionReason}`,
          status: 'unread',
          related_entity_type: 'withdrawal_request',
          related_entity_id: selectedRequest.id
        });
      } catch (notifError) {
        console.warn('Notification creation failed:', notifError);
      }

      toast.success('Withdrawal request rejected');
      setShowRejectModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  // PHASE 1: Process Payout - Deduct from allocation, credit to wallet
  const confirmProcessPayout = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      const allocation = allocations[selectedRequest.allocation_id];
      const investor = investors[selectedRequest.investor_id];
      const withdrawalAmount = selectedRequest.withdrawal_amount;

      if (!allocation || !investor) {
        toast.error('Allocation or investor not found');
        setIsProcessing(false); // Ensure processing state is reset
        return;
      }

      // Get investor's wallet
      const wallets = await FundWallet.filter({ investor_id: investor.id });
      const wallet = wallets[0];

      if (!wallet) {
        toast.error('Investor wallet not found');
        setIsProcessing(false); // Ensure processing state is reset
        return;
      }

      // Determine if it's a full or partial withdrawal based on amount comparison as well
      const isFullWithdrawal = selectedRequest.withdrawal_type === 'full' || withdrawalAmount >= (allocation.total_invested || 0);

      // 1. Deduct from allocation
      const newCurrentValue = (allocation.current_value || 0) - withdrawalAmount;
      const newTotalInvested = isFullWithdrawal ? 0 : (allocation.total_invested || 0) - withdrawalAmount;
      const newAllocationStatus = isFullWithdrawal ? 'redeemed' : 'active';

      await FundAllocation.update(allocation.id, {
        ...allocation,
        current_value: newCurrentValue,
        total_invested: newTotalInvested,
        status: newAllocationStatus
      });

      // 2. Credit to wallet
      await FundWallet.update(wallet.id, {
        investor_id: investor.id,
        available_balance: (wallet.available_balance || 0) + withdrawalAmount,
        locked_balance: Math.max(0, (wallet.locked_balance || 0) - withdrawalAmount), // Ensure locked balance doesn't go negative
        total_deposited: wallet.total_deposited || 0,
        total_withdrawn: (wallet.total_withdrawn || 0) + withdrawalAmount,
        last_transaction_date: new Date().toISOString()
      });

      // 3. Create transaction log
      await FundTransaction.create({
        investor_id: investor.id,
        fund_plan_id: selectedRequest.fund_plan_id,
        allocation_id: allocation.id,
        transaction_type: 'redemption',
        amount: withdrawalAmount,
        payment_method: 'wallet',
        payment_reference: `WITHDRAWAL_${selectedRequest.id}`,
        status: 'completed',
        transaction_date: new Date().toISOString(),
        notes: `Withdrawal processed from ${selectedRequest.withdrawal_type} withdrawal request`
      });

      // 4. Update withdrawal request status
      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'processed',
        processed_date: new Date().toISOString()
      });

      // 5. Send email notification
      try {
        await SendEmail({
          to: investor.email,
          subject: 'Withdrawal Processed - Funds Credited to Wallet',
          body: `Dear ${investor.full_name},\n\nYour withdrawal request of ₹${withdrawalAmount.toLocaleString('en-IN')} has been processed successfully.\n\nThe funds have been credited to your wallet and are now available for use.\n\nUpdated Wallet Balance: ₹${((wallet.available_balance || 0) + withdrawalAmount).toLocaleString('en-IN')}\n\nBest Regards,\nProtocol Team`
        });
      } catch (emailError) {
        console.warn('Email sending failed:', emailError);
      }

      // 6. Create in-app notification
      try {
        await FundNotification.create({
          investor_id: investor.id,
          notification_type: 'transaction',
          title: 'Withdrawal Processed',
          message: `Your withdrawal of ₹${withdrawalAmount.toLocaleString('en-IN')} has been processed and credited to your wallet.`,
          status: 'unread',
          related_entity_type: 'withdrawal_request',
          related_entity_id: selectedRequest.id
        });
      } catch (notifError) {
        console.warn('Notification creation failed:', notifError);
      }

      toast.success('Payout processed successfully! Funds credited to investor wallet.');
      setShowProcessModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to process payout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold mb-1">Withdrawal Processing Flow:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li><strong>Pending</strong> → Click "Approve" to approve the request</li>
              <li><strong>Approved</strong> → Click "Process Payout" to credit funds to investor wallet</li>
              <li><strong>Processed</strong> → Withdrawal completed (funds in investor wallet)</li>
            </ol>
          </div>
        </div>
      </div>

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Withdrawal Requests Management</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Investor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Fund Plan</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Type</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Request Date</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => {
                    const investor = investors[request.investor_id];
                    const fundPlan = fundPlans[request.fund_plan_id];
                    
                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{investor?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{investor?.investor_code || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-sm">{fundPlan?.plan_name || 'N/A'}</p>
                          <p className="text-xs text-slate-500">{fundPlan?.plan_code || 'Unknown'}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-sm">₹{(request.withdrawal_amount || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="capitalize text-xs">
                            {request.withdrawal_type || 'N/A'}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1 justify-center w-fit mx-auto text-xs`}>
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <p className="text-xs text-slate-600">
                            {new Date(request.created_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {/* STEP 1: Pending Status - Show Approve/Reject */}
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(request)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {/* STEP 2: Approved Status - Show Process Payout Button */}
                            {request.status === 'approved' && (
                              <div className="flex flex-col gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessPayout(request)}
                                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg animate-pulse"
                                >
                                  <Send className="w-4 h-4 mr-1" />
                                  Process Payout
                                </Button>
                                <p className="text-xs text-center text-blue-600 font-medium">
                                  Click to credit wallet
                                </p>
                              </div>
                            )}
                            
                            {/* STEP 3: Processed Status - Show Completed */}
                            {request.status === 'processed' && (
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-green-100 text-green-800 border border-green-300">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Completed
                                </Badge>
                                <p className="text-xs text-slate-500">
                                  {request.processed_date && new Date(request.processed_date).toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short'
                                  })}
                                </p>
                              </div>
                            )}
                            
                            {/* Rejected Status */}
                            {request.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal Request</DialogTitle>
            <DialogDescription>
              Approve this withdrawal request of ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes for the investor..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              Reject this withdrawal request of ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmReject} disabled={isProcessing || !rejectionReason.trim()} variant="destructive">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PHASE 1: Process Payout Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              This will credit ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')} to the investor's wallet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedRequest && allocations[selectedRequest.allocation_id] && (
              <>
                {/* Current Investment Info */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="font-semibold text-slate-900 mb-2">Current Investment</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-slate-600">Total Invested:</p>
                      <p className="font-bold text-slate-900">₹{(allocations[selectedRequest.allocation_id].total_invested || 0).toLocaleString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-slate-600">Withdrawal Amount:</p>
                      <p className="font-bold text-red-600">-₹{selectedRequest.withdrawal_amount.toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* What Will Happen */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-semibold text-blue-900 mb-2">What will happen:</h4>
                  {selectedRequest.withdrawal_type === 'full' || 
                   selectedRequest.withdrawal_amount >= (allocations[selectedRequest.allocation_id].total_invested || 0) ? (
                    <>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Full withdrawal - Investment plan will be <strong>CLOSED</strong></li>
                        <li>• Credit ₹{selectedRequest.withdrawal_amount.toLocaleString('en-IN')} to investor's wallet</li>
                        <li>• Final investment amount: ₹0</li>
                        <li>• Create transaction record</li>
                        <li>• Update withdrawal request status to "Processed"</li>
                        <li>• Notify investor via email and in-app notification</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Partial withdrawal - Investment plan remains <strong>ACTIVE</strong></li>
                        <li>• Credit ₹{selectedRequest.withdrawal_amount.toLocaleString('en-IN')} to investor's wallet</li>
                        <li>• New investment amount: <strong>₹{(allocations[selectedRequest.allocation_id].total_invested - selectedRequest.withdrawal_amount).toLocaleString('en-IN')}</strong></li>
                        <li>• Create transaction record</li>
                        <li>• Update withdrawal request status to "Processed"</li>
                        <li>• Notify investor via email and in-app notification</li>
                      </ul>
                    </>
                  )}
                </div>

                {/* Warning */}
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    This action cannot be undone. Make sure you have verified the withdrawal request.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmProcessPayout} disabled={isProcessing} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Process Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
