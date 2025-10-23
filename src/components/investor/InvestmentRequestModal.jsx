
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Retained if needed elsewhere, but not used for fund selection anymore.
import { FundPlan, FundWallet, InvestmentRequest, Notification, User } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, AlertTriangle, Briefcase, WalletIcon, AlertCircle, CheckCircle } from 'lucide-react'; // Added new icons

export default function InvestmentRequestModal({ investor, fundPlan, wallet, isOpen, onClose, onSuccess }) {
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBalance = wallet?.available_balance || 0;
  const minimumInvestment = fundPlan?.minimum_investment || 0;
  const maximumInvestment = fundPlan?.maximum_investment || null;

  // No longer need to load fund plans or manage selectedPlanId internally
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setInvestmentAmount('');
      setIsSubmitting(false);
    }
  }, [isOpen]);


  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(investmentAmount);

    // CRITICAL VALIDATION: Check wallet balance
    if (!wallet) {
      toast.error('Wallet not found. Please contact support.');
      return;
    }

    if (amount <= 0 || isNaN(amount)) {
      toast.error('Please enter a valid investment amount');
      return;
    }

    if (amount > availableBalance) {
      toast.error(
        `Insufficient wallet balance. You have ₹${availableBalance.toLocaleString('en-IN')} but trying to invest ₹${amount.toLocaleString('en-IN')}. Please add funds to your wallet first.`,
        { duration: 5000 }
      );
      return;
    }

    if (amount < minimumInvestment) {
      toast.error(`Minimum investment amount for this plan is ₹${minimumInvestment.toLocaleString('en-IN')}`);
      return;
    }

    if (maximumInvestment && amount > maximumInvestment) {
      toast.error(`Maximum investment amount for this plan is ₹${maximumInvestment.toLocaleString('en-IN')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Create Investment Request
      await InvestmentRequest.create({
        investor_id: investor.id,
        fund_plan_id: fundPlan.id,
        requested_amount: amount,
        status: 'pending_execution',
        payment_method: 'wallet',
        notes: `Investment request for ${fundPlan.plan_name}`
      });

      // Step 2: Lock the funds in wallet immediately
      await FundWallet.update(wallet.id, {
        available_balance: availableBalance - amount,
        locked_balance: (wallet.locked_balance || 0) + amount
      });

      // Send notification to investor
      await Notification.create({
        user_id: investor.user_id,
        title: 'Investment Request Submitted',
        message: `Your investment request of ₹${amount.toLocaleString('en-IN')} for ${fundPlan.plan_name} has been submitted. Funds locked in your wallet.`,
        type: 'info',
        page: 'report'
      });

      // Send notification to fund managers
      const fundManagers = await User.filter({ app_role: 'super_admin' });
      for (const manager of fundManagers) {
        await Notification.create({
          user_id: manager.id,
          title: 'New Investment Request',
          message: `Investor ${investor.investor_code} (${investor.full_name}) requested to invest ₹${amount.toLocaleString('en-IN')} in ${fundPlan.plan_name}. Funds locked in wallet.`,
          type: 'info',
          page: 'allocation',
          meta: JSON.stringify({
            investor_id: investor.id,
            investor_code: investor.investor_code,
            fund_plan_id: fundPlan.id,
            fund_plan_name: fundPlan.plan_name,
            amount: amount,
            action: 'investment_request'
          })
        });
      }

      toast.success('Investment request submitted successfully! Funds have been locked in your wallet.');
      onClose(); // Close modal on success
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting investment request:', error);
      toast.error('Failed to submit investment request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!fundPlan) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="flex items-center justify-center py-8">
            <AlertTriangle className="w-8 h-8 text-yellow-600 mr-2" />
            <p className="text-lg text-slate-700">No Fund Plan selected.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Investment Request
          </DialogTitle>
          <DialogDescription>
            Request to invest in {fundPlan?.plan_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Wallet Balance Display */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-700 font-medium">Available Wallet Balance</span>
              <WalletIcon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">₹{availableBalance.toLocaleString('en-IN')}</p>
          </div>

          {/* Investment Amount */}
          <div>
            <Label htmlFor="amount">Investment Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min={minimumInvestment}
              // Max should be the lesser of maximumInvestment and availableBalance
              max={maximumInvestment ? Math.min(maximumInvestment, availableBalance) : availableBalance}
              step="100" // Changed step for better usability
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              placeholder={`Min: ₹${minimumInvestment.toLocaleString('en-IN')}`}
              className="mt-1"
              required
            />
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <span>Min: ₹{minimumInvestment.toLocaleString('en-IN')}</span>
              <span>Max: ₹{(maximumInvestment ? Math.min(maximumInvestment, availableBalance) : availableBalance).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[minimumInvestment, 50000, 100000].map((presetAmt, idx) => {
              // Ensure preset amounts don't exceed available balance or max investment
              const actualAmt = maximumInvestment ? Math.min(presetAmt, maximumInvestment) : presetAmt;
              if (actualAmt > availableBalance || actualAmt < minimumInvestment) return null; // Only show relevant buttons

              return (
                <Button
                  key={idx}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setInvestmentAmount(actualAmt.toString())}
                  className="text-xs"
                  disabled={actualAmt > availableBalance} // Button is disabled if preset is more than available
                >
                  {`₹${actualAmt >= 100000 ? `${(actualAmt / 100000).toFixed(0)}L` : `${(actualAmt / 1000).toFixed(0)}k`}`}
                </Button>
              );
            })}
            {availableBalance > minimumInvestment && ( // Only show 'Max' button if available balance is above minimum
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setInvestmentAmount(maximumInvestment ? Math.min(availableBalance, maximumInvestment).toString() : availableBalance.toString())}
                    className="text-xs"
                >
                    Max
                </Button>
            )}
          </div>

          {/* Fund Details */}
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Fund Plan:</span>
              <span className="font-semibold text-slate-900">{fundPlan?.plan_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Expected Return:</span>
              <span className="font-semibold text-green-700">{fundPlan?.expected_return_percent || 'Variable'}% /mo</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Investment Period:</span>
              <span className="font-semibold text-slate-900">{fundPlan?.investment_period?.replace('_', ' ') || 'Flexible'}</span>
            </div>
          </div>

          {/* Warning if amount exceeds balance */}
          {investmentAmount && parseFloat(investmentAmount) > availableBalance && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-800">
                <p className="font-semibold">Insufficient Balance</p>
                <p>Please add ₹{(parseFloat(investmentAmount) - availableBalance).toLocaleString('en-IN')} to your wallet or reduce the investment amount.</p>
              </div>
            </div>
          )}

          {/* Important Note */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <strong>Note:</strong> The requested amount will be locked in your wallet until the fund manager processes your request.
            </p>
          </div>

          <DialogFooter className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || 
                !investmentAmount || 
                isNaN(parseFloat(investmentAmount)) ||
                parseFloat(investmentAmount) <= 0 ||
                parseFloat(investmentAmount) > availableBalance ||
                parseFloat(investmentAmount) < minimumInvestment ||
                (maximumInvestment && parseFloat(investmentAmount) > maximumInvestment)
              }
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
