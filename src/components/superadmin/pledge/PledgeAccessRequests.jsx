
import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  Loader2,
  ShieldQuestion,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Ban,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { PledgeAccessRequest, User as UserEntity } from '@/api/entities';
import { useConfirm } from '../../hooks/useConfirm';
import { useOptimisticPledgeUpdates } from '../../hooks/useOptimisticPledgeUpdates';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';


const statusConfig = {
  pending: { label: 'Pending', icon: Clock, classes: 'text-yellow-800 bg-yellow-100/60 border-yellow-200/80' },
  approved: { label: 'Approved', icon: CheckCircle, classes: 'text-green-800 bg-green-100/60 border-green-200/80' },
  rejected: { label: 'Rejected', icon: XCircle, classes: 'text-red-800 bg-red-100/60 border-red-200/80' },
  suspended: { label: 'Suspended', icon: Ban, classes: 'text-gray-800 bg-gray-200/60 border-gray-300/80' },
  withdrawn: { label: 'Withdrawn', icon: HelpCircle, classes: 'text-gray-800 bg-gray-100/60 border-gray-200/80' },
  unknown: { label: 'Unknown', icon: HelpCircle, classes: 'text-gray-800 bg-gray-100/60 border-gray-200/80' }
};

const filterRequests = (requests, searchTerm, statusFilter) => {
  return requests.filter(request => {
    const statusMatch = statusFilter === 'all' || request.status === statusFilter;
    const searchMatch = searchTerm === '' ||
      request.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.broker?.toLowerCase().includes(searchTerm.toLowerCase());
    return statusMatch && searchMatch;
  });
};

const ReviewRequestModal = ({ isOpen, onClose, request, onApprove, onReject, isProcessing }) => {
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (request) {
      setAdminNotes(request.admin_notes || '');
    }
  }, [request]);

  if (!isOpen || !request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Review Access Request</DialogTitle>
          <DialogDescription>
            Review the user's request for pledge trading access and take appropriate action.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          
          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">User Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Name</p>
                <p className="font-medium text-gray-900">{request.user_name}</p>
              </div>
              <div>
                <p className="text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{request.user_email}</p>
              </div>
              <div>
                <p className="text-gray-500">Demat Account</p>
                <p className="font-medium text-gray-900">{request.demat_account_id}</p>
              </div>
              <div>
                <p className="text-gray-500">Broker</p>
                <p className="font-medium text-gray-900 capitalize">{request.broker}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-gray-800">Trading Profile</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Experience Level</p>
                <p className="font-medium text-gray-900 capitalize">{request.trading_experience?.replace(/_/g, ' ')}</p>
              </div>
              <div>
                <p className="text-gray-500">Annual Income</p>
                <p className="font-medium text-gray-900">{request.annual_income_range?.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <div className="text-sm">
              <p className="text-gray-500">Risk Assessment Score</p>
              <div className="flex items-center gap-3 mt-1">
                <Progress value={request.risk_score || 0} className="w-full" />
                <span className="font-semibold text-gray-800">{request.risk_score || 0}/100</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Request Reason</h3>
            <p className="text-sm text-gray-700">{request.request_reason}</p>
          </div>

          <div>
            <label htmlFor="admin_notes" className="font-semibold text-gray-800 text-sm">Admin Review Notes</label>
            <Textarea
              id="admin_notes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add review notes here..."
              className="mt-2"
              readOnly={request.status !== 'pending'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>Close</Button>
          {request.status === 'pending' && (
            <>
              <Button
                variant="destructive"
                onClick={() => onReject(request, adminNotes)}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => onApprove(request, adminNotes)}
                disabled={isProcessing}
              >
                {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function PledgeAccessRequests({ requests: initialRequests, onUpdate, isLoading }) {
  // Use optimistic updates hook
  const { 
    data: requests, 
    setData: setRequests,
    optimisticUpdate, 
    rollback,
  } = useOptimisticPledgeUpdates(initialRequests, 'access request');

  // Update requests when parent data changes
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests, setRequests]);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [filters, setFilters] = useState({
    status: 'all',
    search: '',
    sortBy: 'created_date',
    sortOrder: 'desc'
  });

  const { ConfirmDialog, confirm } = useConfirm();

  const filteredRequests = useMemo(() => {
    return filterRequests(requests, filters.search, filters.status);
  }, [requests, filters.search, filters.status]);

  // Approve with optimistic update
  const handleApprove = async (request, adminNotes) => {
    const confirmed = await confirm({
      title: 'Approve Pledge Access',
      message: `Grant pledge access to ${request.user_name}? They will be able to create pledges immediately.`,
      confirmText: 'Approve',
      confirmVariant: 'default'
    });

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      // Update UI immediately (optimistic)
      optimisticUpdate(
        request.id, 
        { 
          status: 'approved', 
          reviewed_by: 'admin', // Placeholder for actual admin user ID
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        },
        `✅ Approved pledge access for ${request.user_name}`
      );

      // Make actual API call
      await PledgeAccessRequest.update(request.id, {
        status: 'approved',
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      });

      // Grant user access
      await UserEntity.update(request.user_id, {
        has_pledge_access: true,
        pledge_access_granted_at: new Date().toISOString(),
        pledge_access_granted_by: 'admin'
      });
      
      // Refresh data from parent if onUpdate is provided
      if (onUpdate) {
        await onUpdate();
      }

      closeReviewModal(); // Close modal on success
      console.log(`✅ Access approved for ${request.user_name}`);
    } catch (error) {
      console.error('Error approving request:', error);
      // Rollback optimistic update on error
      rollback('Failed to approve request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Reject with optimistic update
  const handleReject = async (request, adminNotes) => {
    const confirmed = await confirm({
      title: 'Reject Pledge Access',
      message: `Reject pledge access request from ${request.user_name}?`,
      confirmText: 'Reject',
      confirmVariant: 'destructive'
    });

    if (!confirmed) return;

    // The outline uses a prompt for reason, but we have adminNotes field.
    // Let's use adminNotes for rejection reason if provided, otherwise a default message.
    const rejectionReason = adminNotes || 'Request rejected by admin';

    setIsProcessing(true);

    try {
      // Update UI immediately
      optimisticUpdate(
        request.id,
        {
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: 'admin', // Placeholder for actual admin user ID
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        },
        `❌ Rejected pledge access for ${request.user_name}`
      );

      // Make actual API call
      await PledgeAccessRequest.update(request.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_by: 'admin',
        reviewed_at: new Date().toISOString(),
        admin_notes: adminNotes || null,
      });

      // Ensure user pledge access is false if rejected
      await UserEntity.update(request.user_id, { has_pledge_access: false });

      if (onUpdate) {
        await onUpdate();
      }

      closeReviewModal(); // Close modal on success
      console.log(`❌ Access rejected for ${request.user_name}`);
    } catch (error) {
      console.error('Error rejecting request:', error);
      rollback('Failed to reject request. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewModal = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };
  
  const closeReviewModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-4 text-gray-600">Loading access requests...</span>
      </div>
    );
  }

  return (
    <>
      <ConfirmDialog />
      <ReviewRequestModal 
        isOpen={isModalOpen}
        onClose={closeReviewModal}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        isProcessing={isProcessing}
      />
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldQuestion className="w-6 h-6 text-blue-600" />
                Pledge Access Requests
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">Review and manage user requests for pledge trading access.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by name, email..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="flex-grow"
              />
              <Select 
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {Object.entries(statusConfig).filter(([key]) => key !== 'unknown').map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Broker</TableHead>
                <TableHead>Requested On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length > 0 ? (
                filteredRequests.map(request => {
                  const statusInfo = statusConfig[request.status] || statusConfig.unknown;
                  const Icon = statusInfo.icon;
                  return (
                    <TableRow key={request.id} onClick={() => openReviewModal(request)} className="cursor-pointer hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">{request.user_name}</div>
                        <div className="text-xs text-gray-500">{request.user_email}</div>
                      </TableCell>
                      <TableCell className="capitalize">{request.broker}</TableCell>
                      <TableCell>{format(new Date(request.created_date), 'PP')}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(statusInfo.classes, 'border')}>
                          <Icon className="w-3 h-3 mr-1.5" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Alert className="bg-blue-50 border-blue-200 text-blue-800">
                      <ShieldQuestion className="h-4 w-4 text-blue-600" />
                      <AlertTitle>No Requests Found</AlertTitle>
                      <AlertDescription>
                        There are no access requests matching your current filters.
                      </AlertDescription>
                    </Alert>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
