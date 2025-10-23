
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FundTransaction, Investor, FundPlan } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, Activity } from 'lucide-react';

export default function TransactionsManager({ onUpdate }) {
  const [transactions, setTransactions] = useState([]);
  const [investors, setInvestors] = useState({});
  const [fundPlans, setFundPlans] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txns, invs, plans] = await Promise.all([
        FundTransaction.list('-transaction_date'),
        Investor.list(),
        FundPlan.list(),
      ]);

      const invMap = invs.reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {});
      const planMap = plans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {});

      setTransactions(txns);
      setInvestors(invMap);
      setFundPlans(planMap);

    } catch (error) {
      toast.error('Failed to load transactions: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusBadge = (status) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
    };
    return <Badge className={colors[status] || 'bg-gray-100'}>{status}</Badge>;
  };
  
  const getTypeBadge = (type) => {
    const colors = {
      wallet_deposit: 'bg-blue-100 text-blue-800',
      purchase: 'bg-green-100 text-green-800',
      redemption: 'bg-orange-100 text-orange-800',
      profit_payout: 'bg-purple-100 text-purple-800',
      wallet_withdrawal: 'bg-red-100 text-red-800',
      management_fee: 'bg-slate-100 text-slate-800',
    };
    return <Badge className={`${colors[type] || 'bg-gray-100'} capitalize`}>{type.replace(/_/g, ' ')}</Badge>;
  }

  if (isLoading) {
    return <div className="flex justify-center items-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /><p className="ml-4">Loading Transactions...</p></div>;
  }

  return (
    <div className="p-8 space-y-6">
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-6 h-6 text-slate-700" />
            All Fund Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Investor</th>
                  <th scope="col" className="px-6 py-3">Type</th>
                  <th scope="col" className="px-6 py-3 text-right">Amount</th>
                  <th scope="col" className="px-6 py-3">Fund/Notes</th>
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-500">
                      No transactions found.
                    </td>
                  </tr>
                ) : (
                  transactions.map(txn => {
                    const investor = investors[txn.investor_id];
                    const plan = fundPlans[txn.fund_plan_id];
                    return (
                      <tr key={txn.id} className="bg-white border-b hover:bg-slate-50">
                        <td className="px-6 py-4">{new Date(txn.transaction_date).toLocaleString()}</td>
                        <td className="px-6 py-4 font-medium">
                          {investor ? (
                            <div>
                                <p>{investor.full_name}</p>
                                <p className="text-xs text-slate-500">{investor.investor_code}</p>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4">{getTypeBadge(txn.transaction_type)}</td>
                        <td className="px-6 py-4 text-right font-semibold">₹{txn.amount?.toLocaleString('en-IN')}</td>
                        <td className="px-6 py-4">
                            {plan ? plan.plan_name : (txn.notes || 'Wallet Transaction')}
                        </td>
                        <td className="px-6 py-4 text-center">{getStatusBadge(txn.status)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
