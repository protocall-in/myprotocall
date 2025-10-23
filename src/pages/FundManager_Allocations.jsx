import React, { useState, useEffect } from 'react';
import FundManagerLayout from '../components/layouts/FundManagerLayout';
import { FundAllocation, Investor, FundPlan, InvestmentRequest, FundWallet } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';
import ExecuteAllocationModal from '../components/superadmin/fundmanager/ExecuteAllocationModal';

export default function FundManager_Allocations() {
  const [allocations, setAllocations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [fundPlans, setFundPlans] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const results = await Promise.allSettled([
        FundAllocation.list(),
        InvestmentRequest.filter({ status: 'pending_execution' }, '-created_date'),
        Investor.list(),
        FundPlan.list(),
        FundWallet.list()
      ]);

      const [allocsResult, requestsResult, investorsResult, plansResult, walletsResult] = results;

      setAllocations(allocsResult.status === 'fulfilled' ? allocsResult.value : []);
      setPendingRequests(requestsResult.status === 'fulfilled' ? requestsResult.value : []);
      setInvestors(investorsResult.status === 'fulfilled' ? investorsResult.value : []);
      setFundPlans(plansResult.status === 'fulfilled' ? plansResult.value : []);
      setWallets(walletsResult.status === 'fulfilled' ? walletsResult.value : []);
    } catch (error) {
      console.error('Error loading allocations:', error);
      toast.error('Failed to load allocations');
    } finally {
      setIsLoading(false);
    }
  };

  const getInvestorDetails = (investorId) => {
    return investors.find(inv => inv.id === investorId);
  };

  const getPlanDetails = (planId) => {
    return fundPlans.find(p => p.id === planId);
  };

  const getWalletDetails = (investorId) => {
    return wallets.find(w => w.investor_id === investorId);
  };

  const handleExecuteClick = (request) => {
    const investor = getInvestorDetails(request.investor_id);
    const plan = getPlanDetails(request.fund_plan_id);
    const wallet = getWalletDetails(request.investor_id);

    if (!investor || !plan) {
      toast.error('Failed to load investor or plan details');
      return;
    }

    setSelectedRequest(request);
    setSelectedInvestor(investor);
    setSelectedPlan(plan);
    setSelectedWallet(wallet);
    setShowExecuteModal(true);
  };

  const handleExecuteSuccess = () => {
    setShowExecuteModal(false);
    setSelectedRequest(null);
    setSelectedInvestor(null);
    setSelectedPlan(null);
    setSelectedWallet(null);
    loadData();
  };

  if (isLoading) {
    return (
      <FundManagerLayout activePage="allocations">
        <div className="flex items-center justify-center h-full p-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </FundManagerLayout>
    );
  }

  return (
    <FundManagerLayout activePage="allocations">
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Fund Allocations</h1>
          <p className="text-slate-600 mt-1">Manage investor fund allocations and execute pending requests</p>
        </div>

        {/* Tabs */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={activeTab === 'pending' ? 'default' : 'outline'}
                onClick={() => setActiveTab('pending')}
                size="sm"
                className={activeTab === 'pending' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : ''}
              >
                <Clock className="w-4 h-4 mr-2" />
                Pending Executions ({pendingRequests.length})
              </Button>
              <Button
                variant={activeTab === 'active' ? 'default' : 'outline'}
                onClick={() => setActiveTab('active')}
                size="sm"
                className={activeTab === 'active' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white' : ''}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Active Allocations ({allocations.filter(a => a.status === 'active').length})
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pending Executions Tab */}
        {activeTab === 'pending' && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Pending Allocation Executions ({pendingRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-sm">No pending execution requests</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Request Date</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investor Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fund Plan</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Requested Amount</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Wallet Balance</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pendingRequests.map((req) => {
                        const investor = getInvestorDetails(req.investor_id);
                        const plan = getPlanDetails(req.fund_plan_id);
                        const wallet = getWalletDetails(req.investor_id);

                        return (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {new Date(req.created_date).toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-blue-600">
                                {investor?.investor_code || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900">
                              {investor?.full_name || 'Unknown'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{plan?.plan_name || 'Unknown'}</span>
                                <span className="text-xs text-slate-500">{plan?.plan_code || ''}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-bold text-blue-600">
                              ₹{(req.requested_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-green-600">
                              ₹{((wallet?.available_balance || 0) + (wallet?.locked_balance || 0)).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-center">
                              <Button
                                onClick={() => handleExecuteClick(req)}
                                size="sm"
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Execute Allocation
                              </Button>
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
        )}

        {/* Active Allocations Tab */}
        {activeTab === 'active' && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Active Allocations</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {allocations.filter(a => a.status === 'active').length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p>No active allocations</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investor Code</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Fund Plan</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Units Held</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total Invested</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Current Value</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Investment Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allocations.filter(a => a.status === 'active').map((alloc) => {
                        const investor = getInvestorDetails(alloc.investor_id);
                        const plan = getPlanDetails(alloc.fund_plan_id);
                        const profitLoss = (alloc.current_value || 0) - (alloc.total_invested || 0);
                        const profitLossPercent = alloc.total_invested > 0 ? ((profitLoss / alloc.total_invested) * 100).toFixed(2) : 0;

                        return (
                          <tr key={alloc.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-blue-600">
                                {investor?.investor_code || 'N/A'}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900">
                              {investor?.full_name || 'Unknown'}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{plan?.plan_name || 'Unknown'}</span>
                                <span className="text-xs text-slate-500">{plan?.plan_code || ''}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-right text-sm text-slate-600">
                              {(alloc.units_held || 0).toFixed(4)}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-blue-600">
                              ₹{(alloc.total_invested || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-right text-sm font-semibold text-green-600">
                              ₹{(alloc.current_value || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-right">
                              <div className="flex flex-col items-end">
                                <span className={`font-semibold text-sm flex items-center gap-1 ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {profitLoss >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                  {profitLoss >= 0 ? '+' : ''}₹{Math.abs(profitLoss).toLocaleString('en-IN')}
                                </span>
                                <span className={`text-xs ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {profitLoss >= 0 ? '+' : ''}{profitLossPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {alloc.investment_date ? new Date(alloc.investment_date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              }) : 'N/A'}
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
        )}

        {/* Execute Allocation Modal */}
        {showExecuteModal && selectedRequest && selectedInvestor && selectedPlan && (
          <ExecuteAllocationModal
            request={selectedRequest}
            investor={selectedInvestor}
            plan={selectedPlan}
            wallet={selectedWallet}
            isOpen={showExecuteModal}
            onClose={() => {
              setShowExecuteModal(false);
              setSelectedRequest(null);
              setSelectedInvestor(null);
              setSelectedPlan(null);
              setSelectedWallet(null);
            }}
            onSuccess={handleExecuteSuccess}
          />
        )}
      </div>
    </FundManagerLayout>
  );
}