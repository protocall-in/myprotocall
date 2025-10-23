
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FundWithdrawalRequest, FundAllocation, FundPlan, PlatformSetting, Notification, User } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Clock, Ban } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';

export default function WithdrawalRequestModal({ investor, wallet, allocations, isOpen, onClose, onSuccess }) {
  const [selectedAllocationId, setSelectedAllocationId] = useState('');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalType, setWithdrawalType] = useState('partial');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [fundPlans, setFundPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawalsEnabled, setWithdrawalsEnabled] = useState(true);
  const [noticePeriodDays, setNoticePeriodDays] = useState(30);

  const { confirm, ConfirmDialog } = useConfirm();

  const selectedAllocation = allocations.find(a => a.id === selectedAllocationId);
  const selectedPlan = fundPlans.find(p => p.id === selectedAllocation?.fund_plan_id);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load fund plans
      const plans = await FundPlan.list();
      setFundPlans(plans);

      // Load settings
      const settings = await PlatformSetting.list();
      const withdrawalsSetting = settings.find(s => s.setting_key === 'fund_withdrawals_enabled');
      const noticePeriodSetting = settings.find(s => s.setting_key === 'fund_min_notice_period_days');

      setWithdrawalsEnabled(withdrawalsSetting?.setting_value !== 'false');
      const minNoticePeriod = noticePeriodSetting ? parseInt(noticePeriodSetting.setting_value) : 30;
      setNoticePeriodDays(minNoticePeriod);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Reset form
      setSelectedAllocationId('');
      setWithdrawalAmount('');
      setWithdrawalType('partial');
      setReason('');
    }
  }, [isOpen, loadData]);

  const handleSubmit = async () => {
    // Validation
    if (!selectedAllocationId) {
      toast.error('Please select an investment to withdraw from');
      return;
    }

    if (!withdrawalsEnabled) {
      toast.error('Withdrawals are currently disabled by the fund manager');
      return;
    }

    if (withdrawalType === 'partial') {
      if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
        toast.error('Please enter a valid withdrawal amount');
        return;
      }

      const amount = parseFloat(withdrawalAmount);
      if (amount > selectedAllocation.total_invested) {
        toast.error('Withdrawal amount cannot exceed invested amount');
        return;
      }
    }

    if (!reason.trim()) {
      toast.error('Please provide a reason for withdrawal');
      return;
    }

    const finalAmount = withdrawalType === 'full' ? selectedAllocation.total_invested : parseFloat(withdrawalAmount);

    // ✅ Use custom confirm dialog
    const confirmed = await confirm({
      title: 'Confirm Withdrawal Request',
      message: `Submit withdrawal request for ₹${finalAmount.toLocaleString('en-IN')} from ${selectedPlan?.plan_name || 'your investment'}?`,
      confirmText: 'Submit Request',
      cancelText: 'Cancel',
      variant: 'warning'
    });

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      const expectedProcessingDate = new Date();
      expectedProcessingDate.setDate(expectedProcessingDate.getDate() + noticePeriodDays);

      // Create withdrawal request
      await FundWithdrawalRequest.create({
        investor_id: investor.id,
        allocation_id: selectedAllocation.id,
        fund_plan_id: selectedAllocation.fund_plan_id,
        withdrawal_amount: finalAmount,
        withdrawal_type: withdrawalType,
        notice_period_days: noticePeriodDays,
        expected_processing_date: expectedProcessingDate.toISOString(),
        reason: reason,
        status: 'pending'
      });

      // ❌ REMOVED: Do NOT send notification to investor
      // The investor knows they submitted the request - no need for notification

      // ✅ ONLY send notification to fund managers
      const fundManagers = await User.filter({ app_role: 'super_admin' });
      for (const manager of fundManagers) {
        // Skip if manager is the same as investor (edge case)
        if (manager.id === investor.user_id) continue;
        
        await Notification.create({
          user_id: manager.id,
          title: 'New Withdrawal Request',
          message: `Investor ${investor.investor_code} (${investor.full_name}) requested withdrawal of ₹${finalAmount.toLocaleString('en-IN')} from ${selectedPlan?.plan_name || 'Unknown Plan'}.`,
          type: 'warning',
          page: 'withdrawal', // ✅ Correct page type for fund manager
          meta: JSON.stringify({
            investor_id: investor.id,
            investor_code: investor.investor_code,
            investor_name: investor.full_name,
            fund_plan_id: selectedAllocation.fund_plan_id,
            fund_plan_name: selectedPlan?.plan_name || 'Unknown Plan',
            amount: finalAmount,
            withdrawal_type: withdrawalType,
            action: 'withdrawal_request'
          })
        });
      }

      toast.success(`✅ Withdrawal request submitted! Expected processing: ${expectedProcessingDate.toLocaleDateString('en-IN')}`);
      
      // Close modal and trigger refresh
      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting withdrawal request:', error);
      toast.error('Failed to submit withdrawal request');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Filter active allocations
  const activeAllocations = allocations.filter(a => a.status === 'active');

  return (
    <>
      <ConfirmDialog />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Request Fund Withdrawal</DialogTitle>
            <DialogDescription>
              Submit a request to withdraw funds from your investments
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Withdrawals Disabled Warning */}
            {!withdrawalsEnabled && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <Ban className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-semibold">Withdrawals Currently Disabled</p>
                    <p className="mt-1">The fund manager has temporarily disabled withdrawal requests. Please try again later.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeAllocations.length === 0 ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
                <p className="font-semibold text-yellow-900">No Active Investments</p>
                <p className="text-sm text-yellow-800 mt-1">You don't have any active investments to withdraw from.</p>
              </div>
            ) : (
              <>
                {/* Select Allocation */}
                <div>
                  <Label htmlFor="allocation">Select Investment</Label>
                  <Select value={selectedAllocationId} onValueChange={setSelectedAllocationId}>
                    <SelectTrigger id="allocation" className="mt-1">
                      <SelectValue placeholder="Choose an investment" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeAllocations.map((alloc) => {
                        const plan = fundPlans.find(p => p.id === alloc.fund_plan_id);
                        return (
                          <SelectItem key={alloc.id} value={alloc.id}>
                            {plan?.plan_name || 'Unknown Plan'} - ₹{(alloc.total_invested || 0).toLocaleString('en-IN')}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Selected Allocation Info */}
                {selectedAllocation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600">Total Invested</p>
                        <p className="font-bold text-blue-900">₹{selectedAllocation.total_invested.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Current Value</p>
                        <p className="font-bold text-green-900">₹{selectedAllocation.current_value.toLocaleString('en-IN')}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Units Held</p>
                        <p className="font-bold text-slate-900">{selectedAllocation.units_held.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600">Notice Period</p>
                        <p className="font-bold text-slate-900">{selectedPlan?.notice_period_days || noticePeriodDays} days</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Withdrawal Type */}
                <div>
                  <Label>Withdrawal Type</Label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="partial"
                        checked={withdrawalType === 'partial'}
                        onChange={(e) => setWithdrawalType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Partial Withdrawal</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="full"
                        checked={withdrawalType === 'full'}
                        onChange={(e) => setWithdrawalType(e.target.value)}
                        className="w-4 h-4"
                      />
                      <span>Full Withdrawal</span>
                    </label>
                  </div>
                </div>

                {/* Withdrawal Amount */}
                {withdrawalType === 'partial' && (
                  <div>
                    <Label htmlFor="amount">Withdrawal Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="Enter amount"
                      value={withdrawalAmount}
                      onChange={(e) => setWithdrawalAmount(e.target.value)}
                      max={selectedAllocation?.total_invested}
                      className="mt-1"
                    />
                  </div>
                )}

                {/* Reason */}
                <div>
                  <Label htmlFor="reason">Reason for Withdrawal</Label>
                  <Textarea
                    id="reason"
                    placeholder="Enter reason for withdrawal..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    className="mt-1"
                  />
                </div>

                {/* Notice Period Info */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
                  <p className="font-semibold mb-1">⏱️ Processing Timeline:</p>
                  <p>Your withdrawal will be processed after a {noticePeriodDays}-day notice period. Expected completion: <strong>{new Date(Date.now() + noticePeriodDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN')}</strong></p>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !withdrawalsEnabled || activeAllocations.length === 0 || !selectedAllocationId}
              className="bg-gradient-to-r from-red-500 to-orange-600"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
