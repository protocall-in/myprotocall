
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  FundAllocation, 
  FundPlan, 
  Investor, 
  FundTransaction, 
  FundWallet,
  FundNotification
} from '@/api/entities';
import { toast } from 'sonner';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Loader2,
  Send,
  History,
  Database,
  RefreshCw,
  Zap,
  Bug,
  Trash2,
  ChevronsRight
} from 'lucide-react';
import { SendEmail } from '@/api/integrations';

export default function ProfitDistribution({ onUpdate }) {
  const [allocations, setAllocations] = useState([]);
  const [investors, setInvestors] = useState({});
  const [fundPlans, setFundPlans] = useState({});
  const [payoutTransactions, setPayoutTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInitiateModal, setShowInitiateModal] = useState(false);
  const [payoutPercentage, setPayoutPercentage] = useState(10);
  const [adminNotes, setAdminNotes] = useState('');
  const [isInitiating, setIsInitiating] = useState(false);
  const [isGeneratingSampleData, setIsGeneratingSampleData] = useState(false);
  const [isClearingData, setIsClearingData] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const [allAllocs, allInvs, allPlans, allTxns] = await Promise.all([
        FundAllocation.list().catch(() => []),
        Investor.list().catch(() => []),
        FundPlan.list().catch(() => []),
        FundTransaction.filter({ transaction_type: 'profit_payout' }).catch(() => [])
      ]);
      const invMap = allInvs.reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {});
      const planMap = allPlans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {});
      setAllocations(allAllocs);
      setInvestors(invMap);
      setFundPlans(planMap);
      setPayoutTransactions(allTxns);
    } catch (error) {
      toast.error('Failed to load profit payout data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    toast.success('✅ CORRECT Profit Distribution Component Loaded!', { duration: 5000 });
    loadData();
  }, [loadData]);

  const calculateEffectiveProfit = useCallback((allocation) => {
    const currentValue = allocation.current_value || 0;
    const totalInvested = allocation.total_invested || 0;
    const unrealizedProfit = currentValue - totalInvested;
    if (unrealizedProfit <= 0) return 0;

    const alreadyPaidProfits = payoutTransactions
      .filter(txn => txn.allocation_id === allocation.id && txn.status === 'completed')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    return Math.max(0, unrealizedProfit - alreadyPaidProfits);
  }, [payoutTransactions]);

  const eligibleAllocations = allocations.filter(alloc => {
    if (alloc.status !== 'active') return false;
    const effectiveProfit = calculateEffectiveProfit(alloc); // Store the calculated value
    return effectiveProfit > 0;
  });

  const totalDistributableProfit = eligibleAllocations.reduce((sum, alloc) => {
    return sum + calculateEffectiveProfit(alloc);
  }, 0);

  const totalAmountToPayout = totalDistributableProfit * (payoutPercentage / 100);

  const triggerAutoPayout = async () => {
    if (!confirm('🤖 Trigger automatic monthly profit payout for all eligible plans? This will process payouts based on each plan\'s expected monthly return.')) return;

    setIsAutomating(true);
    toast.info('🚀 Initiating automated monthly profit payout...');

    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      
      const allPlans = await FundPlan.filter({ auto_payout_enabled: true, profit_payout_frequency: 'monthly' });
      const eligiblePlans = allPlans.filter(plan => plan.last_auto_payout_month !== currentMonth && (plan.expected_return_percent || 0) > 0);

      if (eligiblePlans.length === 0) {
        toast.success('✅ All eligible plans have already been processed for this month, or no eligible plans found.');
        setIsAutomating(false);
        return;
      }

      let totalPayouts = 0;
      let totalInvestorsAffected = 0;
      const affectedInvestorIds = new Set();

      for (const plan of eligiblePlans) {
        toast.info(`Processing plan: ${plan.plan_name}...`);
        const planAllocations = await FundAllocation.filter({ fund_plan_id: plan.id, status: 'active' });

        for (const allocation of planAllocations) {
          if ((allocation.total_invested || 0) <= 0) continue;

          const profitAmount = (allocation.total_invested * (plan.expected_return_percent / 100));
          if (profitAmount <= 0) continue;

          // Find investor wallet
          const wallets = await FundWallet.filter({ investor_id: allocation.investor_id });
          if (wallets.length === 0) {
            console.warn(`No wallet found for investor ${allocation.investor_id}. Skipping payout for allocation ${allocation.id}.`);
            continue;
          }
          const wallet = wallets[0];
          
          // Credit wallet
          await FundWallet.update(wallet.id, {
            available_balance: (wallet.available_balance || 0) + profitAmount
          });

          // Create transaction record
          await FundTransaction.create({
            investor_id: allocation.investor_id,
            fund_plan_id: plan.id,
            allocation_id: allocation.id,
            transaction_type: 'profit_payout',
            amount: profitAmount,
            status: 'completed',
            notes: `Automated monthly profit payout (${plan.expected_return_percent}% of ₹${allocation.total_invested.toLocaleString()})`,
            transaction_date: new Date().toISOString(),
            settlement_date: new Date().toISOString().split('T')[0],
          });
          
          totalPayouts += profitAmount;
          affectedInvestorIds.add(allocation.investor_id);
        }

        // Mark plan as processed for the month
        await FundPlan.update(plan.id, { last_auto_payout_month: currentMonth });
      }
      totalInvestorsAffected = affectedInvestorIds.size;

      toast.success(`🎉 Automated payout complete! ₹${totalPayouts.toLocaleString()} distributed to ${totalInvestorsAffected} investors.`);
      loadData(); // Refresh data

    } catch (error) {
      toast.error('Automated payout failed: ' + error.message);
      console.error(error);
    } finally {
      setIsAutomating(false);
    }
  };

  const generateSampleData = async () => {
    if (!confirm('⚠️ This will create sample investors, plans, and profitable allocations. Continue?')) return;
    setIsGeneratingSampleData(true);
    toast.info('🔧 Generating sample data... Please wait (this can take up to a minute).');
    try {
      const investor = await Investor.create({ user_id: `test_user_${Date.now()}`, investor_code: `TEST_INV_${Date.now()}`, full_name: 'Sample Investor', email: `sample.${Date.now()}@test.com`, mobile_number: '+919999988888', kyc_status: 'verified', status: 'active' });
      await FundWallet.create({ investor_id: investor.id, available_balance: 1000000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      const plan = await FundPlan.create({ plan_name: 'Growth Fund', plan_code: `GF${Date.now()}`, is_active: true, minimum_investment: 10000, auto_payout_enabled: true, profit_payout_frequency: 'monthly', expected_return_percent: 5 }); // Added auto-payout props
      await new Promise(resolve => setTimeout(resolve, 1000));
      await FundAllocation.create({ investor_id: investor.id, fund_plan_id: plan.id, total_invested: 200000, current_value: 250000, status: 'active' });
      toast.success('🎉 Sample data created! Reloading...');
      await loadData();
    } catch (e) { toast.error(`Sample data generation failed: ${e.message}`); } finally { setIsGeneratingSampleData(false); }
  };

  const clearSampleData = async () => {
    if (!confirm('🛑 DANGER: This will delete ALL Investors, Allocations, Plans, Wallets, and Fund Transactions. Are you absolutely sure?')) return;
    setIsClearingData(true);
    toast.warning('🗑️ Clearing all related fund data... Please wait.');
    try {
        const entitiesToDelete = [FundAllocation, FundPlan, Investor, FundTransaction, FundWallet, FundNotification];
        for(const entity of entitiesToDelete) {
            const records = await entity.list();
            for(const record of records) {
                await entity.delete(record.id);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        toast.success('🧹 All data cleared successfully! Reloading...');
        await loadData();
    } catch(e) { toast.error(`Data clearing failed: ${e.message}`); } finally { setIsClearingData(false); }
  };

  const handleInitiatePayout = async () => {
    if (totalAmountToPayout <= 0) {
      toast.error('No distributable profit to pay out.');
      return;
    }
    setIsInitiating(true);
    toast.info(`Initiating payout of ${payoutPercentage}% of profits...`);

    const payoutPromises = eligibleAllocations.map(async (alloc) => {
      const profit = calculateEffectiveProfit(alloc);
      const payoutAmount = profit * (payoutPercentage / 100);
      const investor = investors[alloc.investor_id];
      const wallet = await FundWallet.filter({ investor_id: investor.id }).then(res => res[0]);

      await FundTransaction.create({
        investor_id: investor.id,
        fund_plan_id: alloc.fund_plan_id,
        allocation_id: alloc.id,
        transaction_type: 'profit_payout',
        amount: payoutAmount,
        status: 'completed',
        notes: `Profit payout (${payoutPercentage}%) - ${adminNotes || 'Scheduled payout'}`
      });

      await FundWallet.update(wallet.id, { available_balance: (wallet.available_balance || 0) + payoutAmount });
      await FundNotification.create({ investor_id: investor.id, notification_type: 'transaction', title: 'Profit Payout Received', message: `You have received a profit payout of ₹${payoutAmount.toFixed(2)} in your wallet.` });
    });

    try {
      await Promise.all(payoutPromises);
      toast.success('All profit payouts have been successfully processed!');
      setShowInitiateModal(false);
      setAdminNotes('');
      await loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error('An error occurred during payout: ' + error.message);
    } finally {
      setIsInitiating(false);
    }
  };

  const PayoutRow = ({ allocation }) => {
    const investor = investors[allocation.investor_id];
    const plan = fundPlans[allocation.fund_plan_id];
    const profit = calculateEffectiveProfit(allocation);

    if (!investor || !plan || profit <= 0) return null;

    return (
      <tr className="bg-white border-b hover:bg-slate-50 transition-colors">
        <td className="px-6 py-4 font-medium">{investor.full_name}</td>
        <td className="px-6 py-4">{plan.plan_name}</td>
        <td className="px-6 py-4 text-right">₹{allocation.total_invested?.toLocaleString()}</td>
        <td className="px-6 py-4 text-right">₹{allocation.current_value?.toLocaleString()}</td>
        <td className="px-6 py-4 text-right text-green-600 font-semibold">₹{profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
      </tr>
    );
  };

  const HistoryRow = ({ transaction }) => {
    const investor = investors[transaction.investor_id];
    const plan = fundPlans[transaction.fund_plan_id];
    if (!investor || !plan) return null;

    return (
      <tr className="bg-white border-b hover:bg-slate-50">
        <td className="px-6 py-4">{new Date(transaction.created_date).toLocaleString()}</td>
        <td className="px-6 py-4">{investor.full_name}</td>
        <td className="px-6 py-4">{plan.plan_name}</td>
        <td className="px-6 py-4 text-right">₹{transaction.amount?.toLocaleString()}</td>
        <td className="px-6 py-4"><Badge variant="secondary">{transaction.notes}</Badge></td>
      </tr>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="ml-4 text-slate-600">Loading Profit Distribution Data...</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* UNMISSSABLE VISUAL CONFIRMATION BANNER */}
      <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white p-4 rounded-lg text-center font-bold text-lg shadow-xl">
        PROFIT DISTRIBUTION - VERSION 4.0 (WITH AUTOMATION) LOADED
      </div>

      {/* Debug and Actions Panel */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="cursor-pointer" onClick={() => setShowDebug(!showDebug)}>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Bug className="w-5 h-5" />
            Debug Information & Quick Actions
            <Badge variant={showDebug ? "default" : "outline"}>{showDebug ? 'Hide' : 'Show'}</Badge>
          </CardTitle>
        </CardHeader>
        {showDebug && (
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button onClick={generateSampleData} disabled={isGeneratingSampleData || isClearingData} className="w-full bg-green-600 hover:bg-green-700">
                  {isGeneratingSampleData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                  Generate Sample Data Now
                </Button>
                <Button onClick={clearSampleData} disabled={isClearingData || isGeneratingSampleData} variant="destructive" className="w-full">
                  {isClearingData ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                  Clear ALL Sample Data
                </Button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-300">
                <h4 className="font-semibold text-blue-900 mb-2">New: Automated Payout Trigger</h4>
                <p className="text-sm text-blue-800 mb-3">
                  Click this to run the "automatic" monthly profit distribution for all fund plans that have auto-payout enabled.
                </p>
                <Button onClick={triggerAutoPayout} disabled={isAutomating} className="w-full bg-blue-600 hover:bg-blue-700">
                  {isAutomating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ChevronsRight className="w-4 h-4 mr-2" />}
                  Trigger Monthly Auto-Payout
                </Button>
            </div>
            <Button onClick={loadData} disabled={isLoading} variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Force Refresh Data
            </Button>
          </CardContent>
        )}
      </Card>

      {/* --- ELIGIBLE ALLOCATIONS --- */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <div>
              <CardTitle>Active Allocations with Distributable Profit</CardTitle>
              <p className="text-sm text-slate-500">
                Total Distributable Profit: <span className="font-bold text-green-700">₹{totalDistributableProfit.toLocaleString()}</span>
              </p>
            </div>
          </div>
          <Button onClick={() => setShowInitiateModal(true)} disabled={eligibleAllocations.length === 0}>
            <Send className="w-4 h-4 mr-2" />
            Initiate New Profit Payout
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Investor</th>
                  <th scope="col" className="px-6 py-3">Fund Plan</th>
                  <th scope="col" className="px-6 py-3 text-right">Total Invested</th>
                  <th scope="col" className="px-6 py-3 text-right">Current Value</th>
                  <th scope="col" className="px-6 py-3 text-right">Distributable Profit</th>
                </tr>
              </thead>
              <tbody>
                {eligibleAllocations.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12">
                      <Users className="mx-auto h-12 w-12 text-slate-400" />
                      <h3 className="mt-2 text-sm font-medium text-slate-900">No Active Allocations with Profit</h3>
                      <p className="mt-1 text-sm text-slate-500">There are no investments currently showing a distributable profit.</p>
                      <Button size="sm" className="mt-4" onClick={generateSampleData}>Generate Sample Data</Button>
                    </td>
                  </tr>
                ) : (
                  eligibleAllocations.map(alloc => <PayoutRow key={alloc.id} allocation={alloc} />)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* --- PAYOUT HISTORY --- */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-500" />
            Profit Payout History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Investor</th>
                  <th scope="col" className="px-6 py-3">Fund Plan</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3">Notes</th>
                </tr>
              </thead>
              <tbody>
                {payoutTransactions.length === 0 ? (
                  <tr><td colSpan="5" className="text-center py-8">No profit payouts have been made yet.</td></tr>
                ) : (
                  payoutTransactions.sort((a,b) => new Date(b.created_date) - new Date(a.created_date)).map(txn => <HistoryRow key={txn.id} transaction={txn} />)
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* --- INITIATE PAYOUT MODAL --- */}
      <Dialog open={showInitiateModal} onOpenChange={setShowInitiateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Initiate Profit Payout</DialogTitle>
            <DialogDescription>
              This will distribute a percentage of the total distributable profit to all eligible investors' wallets.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-slate-100 rounded-lg text-center">
              <p className="text-sm text-slate-600">Total Distributable Profit</p>
              <p className="text-3xl font-bold text-slate-800">₹{totalDistributableProfit.toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="payout-percentage">Payout Percentage (%)</Label>
              <Input
                id="payout-percentage"
                type="number"
                value={payoutPercentage}
                onChange={(e) => setPayoutPercentage(e.target.value)}
                placeholder="e.g., 10"
              />
              <p className="text-xs text-slate-500 mt-1">Enter a percentage of the profit to distribute (1-100).</p>
            </div>
             <div className="p-4 bg-green-100 rounded-lg text-center">
              <p className="text-sm text-green-700">Total Amount to be Paid Out</p>
              <p className="text-3xl font-bold text-green-800">₹{totalAmountToPayout.toLocaleString()}</p>
            </div>
            <div>
              <Label htmlFor="admin-notes">Admin Notes (Optional)</Label>
              <Textarea
                id="admin-notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g., Q2 Profit Distribution"
              />
            </div>
            <div className="flex items-start p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                    This action is irreversible. It will create fund transactions and add the payout amount to each eligible investor's wallet.
                </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInitiateModal(false)}>Cancel</Button>
            <Button onClick={handleInitiatePayout} disabled={isInitiating || totalAmountToPayout <= 0}>
              {isInitiating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isInitiating ? 'Processing...' : 'Confirm & Process Payout'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
