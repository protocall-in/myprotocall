import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  RefreshCw,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Users,
  TrendingDown,
  Eye,
  CheckSquare,
  Loader2
} from 'lucide-react';
import { RefundRequest, EventTicket, Notification } from '@/api/entities';
import { toast } from 'sonner';

export default function EventRefundPanel({ event, onUpdate }) {
  const [refundRequests, setRefundRequests] = useState([]);
  const [eventTickets, setEventTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadRefundData();
  }, [event.id]);

  const loadRefundData = async () => {
    setIsLoading(true);
    try {
      // Get all tickets for this event
      const tickets = await EventTicket.filter({ event_id: event.id });
      setEventTickets(tickets);

      // Get all refund requests for these tickets
      const ticketIds = tickets.map(t => t.id);
      const allRefunds = await RefundRequest.filter({
        transaction_type: 'event_ticket'
      });

      // Filter refunds that match our event's tickets
      const eventRefunds = allRefunds.filter(r => 
        ticketIds.includes(r.related_entity_id)
      );

      setRefundRequests(eventRefunds);
    } catch (error) {
      console.error('Error loading refund data:', error);
      toast.error('Failed to load refund data');
    } finally {
      setIsLoading(false);
    }
  };

  const refundStats = {
    total: refundRequests.length,
    pending: refundRequests.filter(r => r.status === 'pending').length,
    approved: refundRequests.filter(r => r.status === 'approved').length,
    processing: refundRequests.filter(r => r.status === 'processing').length,
    processed: refundRequests.filter(r => r.status === 'processed').length,
    rejected: refundRequests.filter(r => r.status === 'rejected').length,
    totalAmount: refundRequests
      .filter(r => ['approved', 'processing', 'processed'].includes(r.status))
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0)
  };

  const handleOrganizerApprove = async (request) => {
    setIsProcessing(true);
    try {
      await RefundRequest.update(request.id, {
        status: 'approved',
        admin_notes: adminNotes,
        processed_by: event.organizer_id,
        processed_by_name: event.organizer_name
      });

      // Notify user
      await Notification.create({
        user_id: request.user_id,
        title: '✅ Refund Request Approved by Organizer',
        message: `Your refund request for "${event.title}" has been approved by the organizer. It's now pending final admin processing.`,
        type: 'info',
        page: 'general'
      });

      toast.success('Refund request approved - now pending admin processing');
      setShowApprovalModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      await loadRefundData();
      await onUpdate();
    } catch (error) {
      console.error('Error approving refund:', error);
      toast.error('Failed to approve refund request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOrganizerReject = async (request) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await RefundRequest.update(request.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        admin_notes: adminNotes,
        processed_by: event.organizer_id,
        processed_by_name: event.organizer_name,
        processed_date: new Date().toISOString()
      });

      // Notify user
      await Notification.create({
        user_id: request.user_id,
        title: '❌ Refund Request Rejected',
        message: `Your refund request for "${event.title}" has been rejected by the organizer. Reason: ${rejectionReason}`,
        type: 'warning',
        page: 'general'
      });

      toast.success('Refund request rejected');
      setShowRejectModal(false);
      setSelectedRequest(null);
      setRejectionReason('');
      setAdminNotes('');
      await loadRefundData();
      await onUpdate();
    } catch (error) {
      console.error('Error rejecting refund:', error);
      toast.error('Failed to reject refund request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdminProcess = async (request) => {
    setIsProcessing(true);
    try {
      // Update refund status to processing
      await RefundRequest.update(request.id, {
        status: 'processing',
        admin_notes: adminNotes,
        processed_date: new Date().toISOString()
      });

      // Simulate payment gateway refund processing
      // In production, this would call actual payment gateway API
      setTimeout(async () => {
        try {
          await RefundRequest.update(request.id, {
            status: 'processed',
            gateway_refund_id: `RF${Date.now()}`,
            expected_completion_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          });

          // Update ticket status
          await EventTicket.update(request.related_entity_id, {
            status: 'refunded'
          });

          // Notify user
          await Notification.create({
            user_id: request.user_id,
            title: '💰 Refund Processed Successfully',
            message: `Your refund of ₹${request.refund_amount} for "${event.title}" has been processed. You should receive it within 5-7 business days.`,
            type: 'info',
            page: 'general'
          });

          toast.success('Refund processed successfully');
          await loadRefundData();
          await onUpdate();
        } catch (error) {
          console.error('Error completing refund:', error);
          toast.error('Failed to complete refund processing');
        }
      }, 2000);

      setShowProcessModal(false);
      setSelectedRequest(null);
      setAdminNotes('');
      toast.info('Refund processing initiated...');
      
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock, text: 'Pending Organizer' },
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle, text: 'Approved - Pending Admin' },
      processing: { color: 'bg-purple-100 text-purple-800 border-purple-300', icon: RefreshCw, text: 'Processing' },
      processed: { color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle, text: 'Processed' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle, text: 'Rejected' }
    };

    const config = configs[status] || configs.pending;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 border`}>
        <Icon className="w-3 h-3" />
        {config.text}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto mb-3" />
          <p className="text-slate-600">Loading refund data...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refund Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-200 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <p className="text-sm text-yellow-700 font-medium">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-900">{refundStats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-200 rounded-lg">
                <CheckSquare className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <p className="text-sm text-blue-700 font-medium">Approved</p>
                <p className="text-2xl font-bold text-blue-900">{refundStats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-200 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <div>
                <p className="text-sm text-green-700 font-medium">Processed</p>
                <p className="text-2xl font-bold text-green-900">{refundStats.processed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-200 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-700" />
              </div>
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Refunded</p>
                <p className="text-2xl font-bold text-purple-900">₹{refundStats.totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Refund Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-blue-600" />
            Refund Requests ({refundStats.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {refundRequests.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No Refund Requests</h3>
              <p className="text-slate-600">No refund requests have been submitted for this event yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b-2 border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Requested
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {refundRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-900">{request.user_name}</p>
                          <p className="text-sm text-slate-500">{request.user_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">₹{request.refund_amount?.toLocaleString()}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <Badge variant="outline" className="mb-1">
                            {request.reason_category?.replace('_', ' ')}
                          </Badge>
                          <p className="text-sm text-slate-600 line-clamp-2">{request.request_reason}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(request.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {new Date(request.created_date).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {/* Organizer Actions */}
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowApprovalModal(true);
                                }}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setShowRejectModal(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}

                          {/* Admin Actions */}
                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowProcessModal(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <RefreshCw className="w-4 h-4 mr-1" />
                              Process Refund
                            </Button>
                          )}

                          {/* View Details */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowApprovalModal(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Modal */}
      <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Approve Refund Request</DialogTitle>
            <DialogDescription>
              Review and approve this refund request. After approval, an admin will process the actual refund.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg">
                <div>
                  <Label className="text-sm text-slate-600">User</Label>
                  <p className="font-medium">{selectedRequest.user_name}</p>
                  <p className="text-sm text-slate-600">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <Label className="text-sm text-slate-600">Refund Amount</Label>
                  <p className="font-semibold text-lg text-green-600">₹{selectedRequest.refund_amount?.toLocaleString()}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-slate-600">Reason Category</Label>
                  <Badge variant="outline" className="mt-1">
                    {selectedRequest.reason_category?.replace('_', ' ')}
                  </Badge>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm text-slate-600">Detailed Reason</Label>
                  <p className="text-sm mt-1">{selectedRequest.request_reason}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotes"
                  placeholder="Add internal notes about this refund approval..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowApprovalModal(false);
                setSelectedRequest(null);
                setAdminNotes('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleOrganizerApprove(selectedRequest)}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Refund Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this refund request. The user will be notified.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-sm text-red-800">
                  <strong>User:</strong> {selectedRequest.user_name}
                </p>
                <p className="text-sm text-red-800 mt-1">
                  <strong>Amount:</strong> ₹{selectedRequest.refund_amount?.toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                <Textarea
                  id="rejectionReason"
                  placeholder="Explain why this refund request is being rejected..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={4}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="adminNotesReject">Admin Notes (Optional)</Label>
                <Textarea
                  id="adminNotesReject"
                  placeholder="Add internal notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedRequest(null);
                setRejectionReason('');
                setAdminNotes('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleOrganizerReject(selectedRequest)}
              disabled={isProcessing || !rejectionReason.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Refund Modal (Admin Only) */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              This will initiate the actual refund through the payment gateway. The user will receive their money within 5-7 business days.
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm text-blue-700">User</Label>
                    <p className="font-medium text-blue-900">{selectedRequest.user_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-blue-700">Refund Amount</Label>
                    <p className="font-semibold text-lg text-blue-900">₹{selectedRequest.refund_amount?.toLocaleString()}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm text-blue-700">Original Payment ID</Label>
                    <p className="font-mono text-sm text-blue-900">{selectedRequest.original_transaction_id}</p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-semibold mb-1">Important:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>This action will process the refund immediately</li>
                      <li>The payment gateway will be charged</li>
                      <li>User will be notified automatically</li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="processNotes">Processing Notes (Optional)</Label>
                <Textarea
                  id="processNotes"
                  placeholder="Add any notes about this refund processing..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProcessModal(false);
                setSelectedRequest(null);
                setAdminNotes('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleAdminProcess(selectedRequest)}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Process Refund
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}