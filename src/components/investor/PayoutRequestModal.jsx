
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FundPayoutRequest, PlatformSetting, Notification, FundWallet, User } from '@/api/entities';
import { toast } from 'sonner';
import { AlertTriangle, Wallet, DollarSign } from 'lucide-react';
import { useConfirm } from '../hooks/useConfirm';

export default function PayoutRequestModal({ investor, wallet, isOpen, onClose, onSuccess }) {
  const [requestAmount, setRequestAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    account_number: '',
    ifsc_code: '',
    bank_name: ''
  });
  const [payoutsEnabled, setPayoutsEnabled] = useState(true);
  const { confirm, ConfirmDialog } = useConfirm();

  useEffect(() => {
    if (investor && isOpen) {
      setBankDetails({
        account_number: investor.bank_account_number || '',
        ifsc_code: investor.bank_ifsc_code || '',
        bank_name: investor.bank_name || ''
      });
    }
  }, [investor, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const settings = await PlatformSetting.list();
      const payoutsSetting = settings.find(s => s.setting_key === 'fund_payouts_enabled');
      setPayoutsEnabled(payoutsSetting?.setting_value !== 'false');
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load payout settings.');
      setPayoutsEnabled(false);
    }
  };

  const handleSubmit = async () => {
    if (!payoutsEnabled) {
      toast.error('Payouts are currently disabled by the fund manager');
      return;
    }

    if (investor?.kyc_status !== 'verified') {
      toast.error('KYC verification is required to request payouts.');
      return;
    }

    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const amount = parseFloat(requestAmount);
    const availableBalance = wallet?.available_balance || 0;

    if (amount > availableBalance) {
      toast.error(`Insufficient balance. Available: ₹${availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`);
      return;
    }

    if (amount < 100) {
      toast.error("Minimum payout amount is ₹100");
      return;
    }

    if (!bankDetails.account_number || !bankDetails.ifsc_code || !bankDetails.bank_name) {
      toast.error("Please provide complete bank details");
      return;
    }

    const confirmed = await confirm({
      title: 'Confirm Payout Request',
      message: `Request payout of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} to your bank account?`,
      confirmText: 'Submit Request',
      cancelText: 'Cancel',
      variant: 'default'
    });

    if (!confirmed) return;

    setIsProcessing(true);

    try {
      await FundPayoutRequest.create({
        investor_id: investor.id,
        requested_amount: amount,
        available_balance: availableBalance,
        bank_account_number: bankDetails.account_number,
        bank_ifsc_code: bankDetails.ifsc_code,
        bank_name: bankDetails.bank_name,
        status: 'pending',
        admin_notes: reason || 'Payout request from investor'
      });

      await FundWallet.update(wallet.id, {
        investor_id: investor.id,
        available_balance: availableBalance - amount,
        locked_balance: (wallet.locked_balance || 0) + amount,
        total_deposited: wallet.total_deposited || 0,
        total_withdrawn: wallet.total_withdrawn || 0,
        last_transaction_date: new Date().toISOString()
      });

      const fundManagers = await User.filter({ app_role: 'super_admin' });
      for (const manager of fundManagers) {
        await Notification.create({
          user_id: manager.id,
          title: 'Payout Request',
          message: `Investor ${investor.investor_code} (${investor.full_name}) requested payout of ₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}.`,
          type: 'warning',
          page: 'payout',
          meta: JSON.stringify({
            investor_id: investor.id,
            investor_code: investor.investor_code,
            amount: amount,
            action: 'payout_request'
          })
        });
      }

      toast.success("Payout request submitted successfully!");
      onClose();
      onSuccess && onSuccess();
      setRequestAmount('');
      setReason('');
    } catch (error) {
      console.error("Error submitting payout request:", error);
      toast.error(error?.message || "Failed to submit payout request");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !investor || !wallet) return null;

  const availableBalance = wallet.available_balance || 0;

  return (
    <>
      <ConfirmDialog />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Request Payout
            </DialogTitle>
            <DialogDescription>
              Withdraw funds from your investment wallet to your bank account
            </DialogDescription>
          </DialogHeader>

          {/* KYC Verification Check */}
          {investor?.kyc_status !== 'verified' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-2 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold mb-1">KYC Verification Required</p>
                <p>
                  {investor?.kyc_status === 'pending' && 
                    'Your KYC is pending verification. You cannot request payouts until your KYC is approved.'}
                  {investor?.kyc_status === 'failed' && 
                    'Your KYC was rejected. Please re-upload correct documents to request payouts.'}
                  {!investor?.kyc_status && 
                    'Please complete your KYC verification to request payouts.'}
                </p>
              </div>
            </div>
          )}

          {!payoutsEnabled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-700">
                <p className="font-semibold">Payouts Disabled</p>
                <p>Fund payouts are currently disabled by the fund manager. Please try again later.</p>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-1 space-y-4 py-2">
            {/* Wallet Balance */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Available Balance</p>
                  <p className="text-2xl font-bold text-blue-900">
                    ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Wallet className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {/* Payout Amount */}
            <div className="space-y-2">
              <Label htmlFor="payout_amount">Payout Amount (INR)</Label>
              <Input
                id="payout_amount"
                type="number"
                min="100"
                max={availableBalance}
                step="100"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                placeholder="Enter amount (minimum ₹100)"
                className="text-lg font-semibold"
                disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
              />
              <p className="text-xs text-slate-500">
                Minimum: ₹100 | Maximum: ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[1000, 5000, 10000, availableBalance].map((amt, idx) => (
                amt <= availableBalance && amt >= 100 && (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => setRequestAmount(amt.toString())}
                    disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
                  >
                    {idx === 3 ? 'All' : `₹${amt >= 1000 ? `${amt/1000}k` : amt}`}
                  </Button>
                )
              ))}
            </div>

            {/* Bank Details */}
            <div className="space-y-3 pt-2">
              <h4 className="font-semibold text-sm text-slate-700">Bank Account Details</h4>
              
              <div className="space-y-2">
                <Label htmlFor="account_number">Account Number</Label>
                <Input
                  id="account_number"
                  value={bankDetails.account_number}
                  onChange={(e) => setBankDetails({...bankDetails, account_number: e.target.value})}
                  placeholder="Enter account number"
                  disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ifsc_code">IFSC Code</Label>
                <Input
                  id="ifsc_code"
                  value={bankDetails.ifsc_code}
                  onChange={(e) => setBankDetails({...bankDetails, ifsc_code: e.target.value.toUpperCase()})}
                  placeholder="Enter IFSC code"
                  disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={bankDetails.bank_name}
                  onChange={(e) => setBankDetails({...bankDetails, bank_name: e.target.value})}
                  placeholder="Enter bank name"
                  disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
                />
              </div>
            </div>

            {/* Reason (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Add a note about this payout request..."
                rows={2}
                disabled={!payoutsEnabled || isProcessing || investor?.kyc_status !== 'verified'}
              />
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-semibold">Processing Time</p>
                <p>Payout requests are typically processed within 3-5 business days after admin approval.</p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-shrink-0 border-t pt-4">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                isProcessing || 
                !requestAmount || 
                parseFloat(requestAmount) <= 0 || 
                parseFloat(requestAmount) > availableBalance || 
                !payoutsEnabled ||
                investor?.kyc_status !== 'verified'
              }
              className="bg-gradient-to-r from-green-600 to-emerald-600"
            >
              {isProcessing ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
