import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FundAllocation, FundWallet, FundTransaction, InvestmentRequest, InvestmentAllocation, Investor, Notification, FundPlan } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, AlertCircle } from 'lucide-react';

export default function ExecuteAllocationModal({ isOpen, onClose, request, investor, fundPlan, onSuccess }) {
  const [nav, setNav] = useState(fundPlan?.nav || 10);
  const [units, setUnits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [wallet, setWallet] = useState(null);

  useEffect(() => {
    if (request && nav > 0) {
      const calculatedUnits = request.requested_amount / nav;
      setUnits(calculatedUnits);
    }
  }, [request, nav]);

  useEffect(() => {
    const loadWallet = async () => {
      if (!investor?.id) return;
      try {
        const wallets = await FundWallet.filter({ investor_id: investor.id });
        if (wallets.length > 0) {
          setWallet(wallets[0]);
        }
      } catch (error) {
        console.error('Error loading wallet:', error);
      }
    };

    if (isOpen) {
      loadWallet();
    }
  }, [isOpen, investor]);

  const handleExecute = async () => {
    if (!nav || nav <= 0) {
      toast.error('Please enter a valid NAV');
      return;
    }

    if (!units || units <= 0) {
      toast.error('Invalid units calculation');
      return;
    }

    if (!wallet) {
      toast.error('Investor wallet not found');
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Create NEW InvestmentAllocation record (supports multiple allocations per plan)
      const newInvestmentAllocation = await InvestmentAllocation.create({
        investor_id: investor.id,
        fund_plan_id: fundPlan.id,
        allocation_amount: request.requested_amount,
        allocation_date: new Date().toISOString(),
        nav_at_allocation: nav,
        units_allocated: units,
        current_value: request.requested_amount,
        profit_earned: 0,
        status: 'active',
        days_held: 0,
        investment_request_id: request.id
      });

      // Step 2: Update or Create FundAllocation (legacy - keeps totals)
      const existingAllocations = await FundAllocation.filter({
        investor_id: investor.id,
        fund_plan_id: fundPlan.id,
        status: 'active'
      });

      if (existingAllocations.length > 0) {
        // Update existing allocation with cumulative values
        const existingAlloc = existingAllocations[0];
        await FundAllocation.update(existingAlloc.id, {
          units_held: (existingAlloc.units_held || 0) + units,
          total_invested: (existingAlloc.total_invested || 0) + request.requested_amount,
          current_value: (existingAlloc.current_value || 0) + request.requested_amount,
          last_transaction_date: new Date().toISOString()
        });
      } else {
        // Create new FundAllocation
        await FundAllocation.create({
          investor_id: investor.id,
          fund_plan_id: fundPlan.id,
          units_held: units,
          average_nav: nav,
          total_invested: request.requested_amount,
          current_value: request.requested_amount,
          profit_loss: 0,
          profit_loss_percent: 0,
          investment_date: new Date().toISOString().split('T')[0],
          last_transaction_date: new Date().toISOString(),
          status: 'active'
        });
      }

      // Step 3: Create transaction record
      await FundTransaction.create({
        investor_id: investor.id,
        fund_plan_id: fundPlan.id,
        allocation_id: newInvestmentAllocation.id,
        transaction_type: 'purchase',
        amount: request.requested_amount,
        units: units,
        nav: nav,
        payment_method: 'wallet',
        status: 'completed',
        transaction_date: new Date().toISOString(),
        settlement_date: new Date().toISOString().split('T')[0]
      });

      // Step 4: Update wallet - move from locked to invested
      await FundWallet.update(wallet.id, {
        locked_balance: Math.max(0, (wallet.locked_balance || 0) - request.requested_amount),
        last_transaction_date: new Date().toISOString()
      });

      // Step 5: Update investment request status
      await InvestmentRequest.update(request.id, {
        status: 'executed',
        executed_by: 'admin',
        executed_at: new Date().toISOString(),
        allocation_id: newInvestmentAllocation.id
      });

      // Step 6: Update investor totals
      const allAllocations = await FundAllocation.filter({ investor_id: investor.id, status: 'active' });
      const newTotalInvested = allAllocations.reduce((sum, a) => sum + (a.total_invested || 0), 0);
      const newCurrentValue = allAllocations.reduce((sum, a) => sum + (a.current_value || 0), 0);

      await Investor.update(investor.id, {
        total_invested: newTotalInvested,
        current_value: newCurrentValue,
        total_profit_loss: newCurrentValue - newTotalInvested
      });

      // Step 7: Update fund plan stats
      await FundPlan.update(fundPlan.id, {
        total_aum: (fundPlan.total_aum || 0) + request.requested_amount,
        total_investors: (fundPlan.total_investors || 0) + (existingAllocations.length === 0 ? 1 : 0)
      });

      // Step 8: Send notification to investor
      await Notification.create({
        user_id: investor.user_id,
        title: 'Allocation Executed',
        message: `Your investment of ₹${request.requested_amount.toLocaleString('en-IN')} in ${fundPlan.plan_name} has been allocated. Units: ${units.toFixed(4)}`,
        type: 'info',
        page: 'allocation',
        meta: JSON.stringify({
          fund_plan_id: fundPlan.id,
          fund_plan_name: fundPlan.plan_name,
          amount: request.requested_amount,
          units: units,
          nav: nav,
          allocation_id: newInvestmentAllocation.id,
          action: 'allocation_executed'
        })
      });

      toast.success('✅ Allocation executed successfully!');
      
      // Close modal first
      onClose();
      
      // Call onSuccess callback after a short delay to ensure UI updates
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 500);
      }
    } catch (error) {
      console.error('Error executing allocation:', error);
      toast.error('Failed to execute allocation');
      setIsProcessing(false);
    }
  };

  if (!request || !investor || !fundPlan) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Execute Investment Allocation</DialogTitle>
          <DialogDescription>
            Allocate units for {investor.full_name}'s investment in {fundPlan.plan_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Investor Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Investor</p>
                <p className="font-bold text-slate-900">{investor.full_name}</p>
                <p className="text-xs text-slate-500">{investor.investor_code}</p>
              </div>
              <div>
                <p className="text-slate-600">Investment Amount</p>
                <p className="font-bold text-blue-600">₹{request.requested_amount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </div>

          {/* NAV Input */}
          <div>
            <Label htmlFor="nav">Current NAV (₹)</Label>
            <Input
              id="nav"
              type="number"
              value={nav}
              onChange={(e) => setNav(parseFloat(e.target.value) || 0)}
              placeholder="Enter NAV"
              step="0.01"
              className="mt-1"
            />
            <p className="text-xs text-slate-500 mt-1">Enter the current Net Asset Value per unit</p>
          </div>

          {/* Calculated Units */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <Label>Units to be Allocated</Label>
            <p className="text-3xl font-bold text-blue-600 mt-1">{units.toFixed(4)}</p>
            <p className="text-xs text-slate-600 mt-1">
              Calculation: ₹{request.requested_amount.toLocaleString('en-IN')} ÷ ₹{nav} = {units.toFixed(4)} units
            </p>
          </div>

          {/* Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-green-800">
              <p className="font-semibold mb-1">Multiple Allocations Supported:</p>
              <p>This will create a new allocation entry. The investor can have multiple allocations in the same plan.</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleExecute}
            disabled={isProcessing || !nav || nav <= 0}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Execute Allocation'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}