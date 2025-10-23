import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  Trash2,
  Download,
  AlertTriangle,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function EventBulkActions({ 
  selectedEvents, 
  onClearSelection, 
  onBulkApprove, 
  onBulkReject, 
  onBulkDelete,
  onBulkExport 
}) {
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (selectedEvents.length === 0) return null;

  const handleBulkApprove = async () => {
    setIsProcessing(true);
    try {
      await onBulkApprove(selectedEvents, adminNotes);
      toast.success(`${selectedEvents.length} events approved successfully`);
      setShowApproveDialog(false);
      setAdminNotes('');
      onClearSelection();
    } catch (error) {
      toast.error('Failed to approve events');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (!adminNotes.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    
    setIsProcessing(true);
    try {
      await onBulkReject(selectedEvents, adminNotes);
      toast.success(`${selectedEvents.length} events rejected`);
      setShowRejectDialog(false);
      setAdminNotes('');
      onClearSelection();
    } catch (error) {
      toast.error('Failed to reject events');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedEvents);
      toast.success(`${selectedEvents.length} events deleted`);
      setShowDeleteDialog(false);
      onClearSelection();
    } catch (error) {
      toast.error('Failed to delete events');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkExport = () => {
    try {
      onBulkExport(selectedEvents);
      toast.success('Events exported successfully');
    } catch (error) {
      toast.error('Failed to export events');
      console.error(error);
    }
  };

  const pendingCount = selectedEvents.filter(e => e.status === 'pending_approval').length;
  const canApprove = pendingCount > 0;
  const canReject = pendingCount > 0;

  return (
    <>
      {/* Bulk Actions Toolbar */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            {/* Selection Count */}
            <div className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold">
                {selectedEvents.length}
              </Badge>
              <span className="text-sm font-semibold text-slate-700">
                {selectedEvents.length === 1 ? 'event' : 'events'} selected
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {canApprove && (
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve ({pendingCount})
                </Button>
              )}

              {canReject && (
                <Button
                  onClick={() => setShowRejectDialog(true)}
                  variant="outline"
                  className="border-2 border-red-300 text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-400 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject ({pendingCount})
                </Button>
              )}

              <Button
                onClick={handleBulkExport}
                variant="outline"
                className="border-2 border-blue-300 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:border-blue-400 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>

              <Button
                onClick={() => setShowDeleteDialog(true)}
                variant="outline"
                className="border-2 border-slate-300 text-slate-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:border-red-300 hover:text-red-700 shadow-md hover:shadow-lg transition-all duration-300"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>

            <div className="h-8 w-px bg-slate-200"></div>

            {/* Clear Selection */}
            <Button
              onClick={onClearSelection}
              variant="ghost"
              size="icon"
              className="hover:bg-slate-100 rounded-xl"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Bulk Approve Events
            </DialogTitle>
            <DialogDescription>
              You are about to approve {pendingCount} pending event{pendingCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>{pendingCount}</strong> event{pendingCount !== 1 ? 's' : ''} will be approved and visible to users
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Admin Notes (Optional)
              </label>
              <Textarea
                placeholder="Add any notes about this approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowApproveDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkApprove}
              disabled={isProcessing}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Events
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Bulk Reject Events
            </DialogTitle>
            <DialogDescription>
              You are about to reject {pendingCount} pending event{pendingCount !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <p className="text-sm text-red-800">
                <strong>{pendingCount}</strong> event{pendingCount !== 1 ? 's' : ''} will be rejected. Organizers will be notified.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">
                Reason for Rejection <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Provide a clear reason for rejection..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={4}
                className="border-red-200 focus:border-red-400"
              />
              <p className="text-xs text-slate-500 mt-1">
                This message will be sent to all organizers
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectDialog(false);
                setAdminNotes('');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkReject}
              disabled={isProcessing || !adminNotes.trim()}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Events
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Bulk Delete Events
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 p-4 rounded-lg border-2 border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-800 mb-1">Warning: Permanent Deletion</p>
                  <p className="text-sm text-red-700">
                    You are about to permanently delete <strong>{selectedEvents.length}</strong> event{selectedEvents.length !== 1 ? 's' : ''}.
                    This will also delete all associated tickets, RSVPs, and revenue records.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Consider cancelling events instead of deleting them to preserve records
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}