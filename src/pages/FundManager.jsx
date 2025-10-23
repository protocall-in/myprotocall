
import React, { createContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FundPlan,
  InvestorRequest,
  Investor,
  FundAllocation,
  FundWithdrawalRequest,
  FundTransaction,
  FundPayoutRequest,
  FundWallet,
  User,
  Notification,
  PlatformSetting,
  InvestmentRequest,
  FundInvoice
} from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  TrendingUp,
  Users,
  FileText,
  Activity,
  Download,
  Home,
  Shield,
  IndianRupee, // Changed from DollarSign to IndianRupee
  Wallet,
  CheckCircle,
  Clock,
  LogOut,
  ChevronDown,
  Target,
  BarChart3,
  AlertTriangle,
  LifeBuoy,
  Trash2,
  Loader2,
  UserCheck, // Added for Investor & KYC
  PieChart as PieChartIcon,
  Settings,
  Calendar,
  Bell,
  X,
  XCircle // Added XCircle for PayoutManagement and KYC
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import InvestorRequestsManager from '../components/superadmin/fundmanager/InvestorRequestsManager';
import FundPlansManager from '../components/superadmin/fundmanager/FundPlansManager';
// The WithdrawalManagement component was moved inline and renamed to WithdrawalManagementContent, so this import is no longer needed.
import ExecuteAllocationModal from '../components/superadmin/fundmanager/ExecuteAllocationModal';
import TransactionsManager from '../components/fundmanager/TransactionsManager';
import ProfitDistribution from '../components/fundmanager/ProfitDistribution';
import ReportsManager from '../components/fundmanager/ReportsManager';


// Dashboard Home View
function DashboardHomeView({ stats, investors, transactions, allocations, pendingInvestments, onRefresh }) {
  // Force refresh on mount
  useEffect(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  const [fundPlans, setFundPlans] = useState([]);

  // Load fund plans for the chart
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plans = await FundPlan.list();
        setFundPlans(plans);
      } catch (error) {
        console.error('Error loading fund plans for dashboard chart:', error);
      }
    };
    loadPlans();
  }, []);

  // Use stats.totalCapitalInvested directly, it's now computed centrally
  const totalCapitalInvested = stats.totalCapitalInvested;

  const totalCurrentValue = allocations
    .filter((a) => a.status === 'active')
    .reduce((sum, alloc) => sum + (alloc.current_value || 0), 0);

  const totalProfitLoss = totalCurrentValue - totalCapitalInvested;

  // NEW: Calculate Total Profit Payouts
  const totalProfitPayouts = transactions
    .filter((txn) => txn.transaction_type === 'profit_payout' && txn.status === 'completed')
    .reduce((sum, txn) => sum + (txn.amount || 0), 0);

  const recentTransactions = transactions.slice(0, 10).reverse().map((txn) => ({
    date: new Date(txn.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: txn.amount || 0,
    type: txn.transaction_type
  }));

  // FIXED: Plan Distribution with actual plan names
  const planMap = {};
  fundPlans.forEach(plan => {
    planMap[plan.id] = {
      name: plan.plan_name || 'Unnamed Plan',
      code: plan.plan_code || 'N/A'
    };
  });

  const planData = {};
  allocations.forEach((alloc) => {
    const planInfo = planMap[alloc.fund_plan_id];
    const displayName = planInfo
      ? `${planInfo.name} (${planInfo.code})`
      : `Unknown Plan (ID: ${alloc.fund_plan_id?.slice(0, 8)})`;

    if (!planData[displayName]) {
      planData[displayName] = 0;
    }
    planData[displayName] += alloc.total_invested || 0;
  });

  const pieData = Object.entries(planData).map(([name, value]) => ({
    name: name,
    value: value
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Fund Manager Dashboard</h1>
        <p className="text-indigo-100">Complete overview of all fund operations and investor activities</p>
      </div>

      {/* Key Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <IndianRupee className="w-6 h-6 text-indigo-600" /> {/* Changed to IndianRupee */}
              </div>
              <Badge variant="outline" className="text-xs">Total AUM</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-1">Assets Under Management</p>
            <p className="text-2xl font-bold text-slate-900">₹{(stats.totalAUM / 100000).toFixed(2)}L</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <Badge variant="outline" className="text-xs">Active</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-1">Active Plans</p>
            <p className="text-2xl font-bold text-slate-900">{stats.activePlans}</p>
            <p className="text-xs text-slate-400 mt-1">of {stats.totalPlans} total</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <Badge variant="outline" className="text-xs">Investors</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Investors</p>
            <p className="text-2xl font-bold text-slate-900">{stats.totalInvestors}</p>
            <p className="text-xs text-slate-400 mt-1">{stats.totalAllocations} allocations</p>
          </CardContent>
        </Card>

        <Card className={`border-0 shadow-lg hover:shadow-xl transition-shadow ${totalProfitLoss >= 0 ? 'bg-gradient-to-br from-emerald-50 to-green-50' : 'bg-gradient-to-br from-red-50 to-pink-50'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${totalProfitLoss >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                <TrendingUp className={`w-6 h-6 ${totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`} />
              </div>
              <Badge className={totalProfitLoss >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                {(totalCapitalInvested > 0 ? (totalProfitLoss / totalCapitalInvested * 100) : 0).toFixed(2)}%
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total P&L</p>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
              {totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(totalProfitLoss).toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>

        {/* Total Profit Payouts Card */}
        <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Wallet className="w-6 h-6 text-purple-600" />
              </div>
              <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700">Distributed</Badge>
            </div>
            <p className="text-sm text-slate-500 mb-1">Total Profit Payouts</p>
            <p className="text-2xl font-bold text-purple-900">₹{totalProfitPayouts.toLocaleString('en-IN')}</p>
            <p className="text-xs text-purple-600 mt-1">Lifetime distributed to investors</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Row - Updated with Pending Fund Allocations */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Pending Requests</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingRequests}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Pending Fund Allocations</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingAllocations}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Download className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Pending Withdrawals</p>
              <p className="text-2xl font-bold text-slate-900">{stats.pendingWithdrawals}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500 mb-1">Approved Withdrawals</p>
              <p className="text-2xl font-bold text-slate-900">{stats.approvedWithdrawals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Recent Transaction Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentTransactions.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={recentTransactions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                    formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                  />
                  <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={3} dot={{ fill: '#3b82f6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-600" />
              Investment Distribution by Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No allocation data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Recent Investors</CardTitle>
        </CardHeader>
        <CardContent>
          {investors.length === 0 ? (
            <div className="py-8 text-center text-slate-500">
              <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm">No investors yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investors.slice(0, 6).map((inv) => (
                <div key={inv.id} className="p-4 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{inv.full_name}</p>
                        <p className="text-xs text-slate-500">{inv.email}</p>
                      </div>
                    </div>
                    <Badge className={inv.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {inv.status}
                    </Badge>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Invested:</span>
                      <span className="font-semibold">₹{(inv.total_invested || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Allocations View - Fixed with proper refresh
function AllocationsView({ onUpdate }) {
  const [allocations, setAllocations] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [fundPlans, setFundPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showExecuteModal, setShowExecuteModal] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel
      const [allocs, requests, invs, plans] = await Promise.all([
        FundAllocation.list('-created_date').catch(() => []),
        InvestmentRequest.filter({ status: 'pending_execution' }, '-created_date').catch(() => []),
        Investor.list().catch(() => []),
        FundPlan.list().catch(() => [])
      ]);

      setAllocations(allocs);
      setPendingRequests(requests);
      setInvestors(invs);
      setFundPlans(plans);

    } catch (error) {
      if (error.name !== 'AbortError' && !error.message?.includes('Rate limit') && !error.message?.includes('aborted')) {
        console.error('Error loading allocations:', error);
        toast.error('Failed to load some data. Please refresh.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getInvestorCode = (investorId) => {
    const investor = investors.find(inv => inv.id === investorId);
    return investor?.investor_code || investorId?.slice(0, 8);
  };

  const getInvestorName = (investorId) => {
    const investor = investors.find(inv => inv.id === investorId);
    return investor?.full_name || 'Unknown';
  };

  const getInvestorDetails = (investorId) => {
    return investors.find(inv => inv.id === investorId);
  };

  const getPlanInfo = (planId) => {
    const plan = fundPlans.find(p => p.id === planId);
    return {
      name: plan?.plan_name || 'Unknown Plan',
      code: plan?.plan_code || 'N/A',
      plan: plan
    };
  };

  const handleExecuteRequest = (request) => {
    setSelectedRequest(request);
    setShowExecuteModal(true);
  };

  const handleExecuteSuccess = async () => {
    setShowExecuteModal(false);
    setSelectedRequest(null);

    // Reload data after successful execution
    toast.success('Refreshing data...');
    await loadData();

    // Notify parent to refresh stats
    if (onUpdate) {
      onUpdate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading allocations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fund Allocations</h1>
        <p className="text-slate-600 mt-1">Manage investor fund allocations and pending requests</p>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="active">
            Active Allocations ({allocations.length})
          </TabsTrigger>
          <TabsTrigger value="pending" className="relative">
            Pending Requests ({pendingRequests.length})
            {pendingRequests.length > 0 && (
              <Badge className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 animate-pulse">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Active Allocations Tab */}
        <TabsContent value="active" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              {allocations.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Target className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p>No allocations found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Investor Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Investor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fund Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Plan Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Units Held</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Total Invested</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Current Value</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">P&L</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Investment Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {allocations.map((alloc) => {
                        const profitLoss = (alloc.current_value || 0) - (alloc.total_invested || 0);
                        const profitLossPercent = alloc.total_invested > 0
                          ? ((profitLoss / alloc.total_invested) * 100).toFixed(2)
                          : 0;
                        const planInfo = getPlanInfo(alloc.fund_plan_id);

                        return (
                          <tr key={alloc.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-blue-600">
                                {getInvestorCode(alloc.investor_id)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900">
                              {getInvestorName(alloc.investor_id)}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-medium text-slate-900">{planInfo.name}</span>
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">{planInfo.code}</span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {(alloc.units_held || 0).toFixed(4)}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-blue-600">
                              ₹{(alloc.total_invested || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4 text-sm font-semibold text-green-600">
                              ₹{(alloc.current_value || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className={`font-semibold text-sm ${profitLoss >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                  {profitLoss >= 0 ? '+' : ''}₹{Math.abs(profitLoss).toLocaleString('en-IN')}
                                </span>
                                <span className={`text-xs ${profitLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {profitLoss >= 0 ? '+' : ''}{profitLossPercent}%
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <Badge className={alloc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                {alloc.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {alloc.investment_date ? new Date(alloc.investment_date).toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
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
        </TabsContent>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                Pending Fund Allocation Requests
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <CheckCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p>No pending investment requests</p>
                  <p className="text-sm text-slate-400 mt-2">All investment requests have been processed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Request Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Investor Code</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Investor Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Fund Plan</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Requested Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Payment Method</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {pendingRequests.map((request) => {
                        const planInfo = getPlanInfo(request.fund_plan_id);
                        const investor = getInvestorDetails(request.investor_id);

                        return (
                          <tr key={request.id} className="hover:bg-slate-50">
                            <td className="px-4 py-4 text-sm text-slate-600">
                              {new Date(request.created_date).toLocaleString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-4 py-4">
                              <span className="text-sm font-bold text-blue-600">
                                {getInvestorCode(request.investor_id)}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-900">
                              {getInvestorName(request.investor_id)}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-slate-900">{planInfo.name}</span>
                                <span className="text-xs font-mono text-slate-500">{planInfo.code}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 text-sm font-bold text-indigo-600">
                              ₹{(request.requested_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td className="px-4 py-4">
                              <Badge variant="outline" className="capitalize">
                                {request.payment_method || 'wallet'}
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <Badge className="bg-yellow-100 text-yellow-800">
                                Pending Execution
                              </Badge>
                            </td>
                            <td className="px-4 py-4">
                              <Button
                                size="sm"
                                onClick={() => handleExecuteRequest(request)}
                                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
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
        </TabsContent>

        {/* Execute Allocation Modal */}
        {selectedRequest && (
          <ExecuteAllocationModal
            request={selectedRequest}
            investor={getInvestorDetails(selectedRequest.investor_id)}
            fundPlan={getPlanInfo(selectedRequest.fund_plan_id).plan}
            isOpen={showExecuteModal}
            onClose={() => {
              setShowExecuteModal(false);
              setSelectedRequest(null);
            }}
            onSuccess={handleExecuteSuccess}
          />
        )}
      </Tabs>
    </div>
  );
}

// Withdrawals AND Payouts View - FIXED to include both
function WithdrawalsAndPayoutsView({ onUpdate }) {
  const [activeTab, setActiveTab] = useState('withdrawals');

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Withdrawals & Payouts Management</h1>
        <p className="text-slate-600 mt-1">Manage fund withdrawals and wallet payout requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="withdrawals">
            <Download className="w-4 h-4 mr-2" />
            Fund Withdrawals
          </TabsTrigger>
          <TabsTrigger value="payouts">
            <Wallet className="w-4 h-4 mr-2" />
            Wallet Payouts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="withdrawals" className="mt-6">
          <WithdrawalManagementContent onUpdate={onUpdate} />
        </TabsContent>

        <TabsContent value="payouts" className="mt-6">
          <PayoutManagement onUpdate={onUpdate} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Payout Management Component - NEW
function PayoutManagement({ onUpdate }) {
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [investors, setInvestors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requests, invs] = await Promise.all([
        FundPayoutRequest.list('-created_date'),
        Investor.list()
      ]);

      const invsMap = invs.reduce((acc, inv) => {
        acc[inv.id] = inv;
        return acc;
      }, {});

      setPayoutRequests(requests);
      setInvestors(invsMap);
    } catch (error) {
      console.error('Error loading payout requests:', error);
      toast.error('Failed to load payout requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleProcessPayout = (request) => {
    setSelectedRequest(request);
    setUtrNumber('');
    setShowProcessModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      await FundPayoutRequest.update(selectedRequest.id, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      });

      const investor = investors[selectedRequest.investor_id];

      await Notification.create({
        user_id: investor?.user_id,
        title: 'Payout Request Approved',
        message: `Your payout request of ₹${selectedRequest.requested_amount?.toLocaleString('en-IN')} has been approved and will be processed shortly.`,
        type: 'info',
        page: 'wallet'
      });

      toast.success('Payout request approved');
      setShowApproveModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await FundPayoutRequest.update(selectedRequest.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      });

      const investor = investors[selectedRequest.investor_id];

      await Notification.create({
        user_id: investor?.user_id,
        title: 'Payout Request Rejected',
        message: `Your payout request of ₹${selectedRequest.requested_amount?.toLocaleString('en-IN')} has been rejected. Reason: ${rejectionReason}`,
        type: 'alert',
        page: 'wallet'
      });

      toast.success('Payout request rejected');
      setShowRejectModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmProcessPayout = async () => {
    if (!selectedRequest || !utrNumber.trim()) {
      toast.error('Please provide UTR number');
      return;
    }

    setIsProcessing(true);
    try {
      // Get investor wallet
      const wallets = await FundWallet.filter({ investor_id: selectedRequest.investor_id });
      if (wallets.length === 0) {
        toast.error('Investor wallet not found');
        setIsProcessing(false);
        return;
      }

      const wallet = wallets[0];

      console.log('💸 Before Payout Processing:');
      console.log('Available Balance:', wallet.available_balance);
      console.log('Payout Amount:', selectedRequest.requested_amount);

      // Check if sufficient balance
      if ((wallet.available_balance || 0) < selectedRequest.requested_amount) {
        toast.error('Insufficient wallet balance for payout');
        setIsProcessing(false);
        return;
      }

      const newAvailableBalance = Math.max(0, (wallet.available_balance || 0) - selectedRequest.requested_amount);

      // Deduct from wallet
      await FundWallet.update(wallet.id, {
        available_balance: newAvailableBalance,
        total_withdrawn: (wallet.total_withdrawn || 0) + selectedRequest.requested_amount,
        last_transaction_date: new Date().toISOString()
      });

      console.log('💸 After Payout Processing:');
      console.log('New Available Balance:', newAvailableBalance);

      // Create transaction log for wallet withdrawal
      await FundTransaction.create({
        investor_id: selectedRequest.investor_id,
        transaction_type: 'wallet_withdrawal',
        amount: selectedRequest.requested_amount,
        payment_method: 'bank_transfer',
        payment_reference: utrNumber,
        status: 'completed',
        transaction_date: new Date().toISOString(),
        settlement_date: new Date().toISOString().split('T')[0],
        notes: `Wallet payout processed - UTR: ${utrNumber} - Transferred to ${selectedRequest.bank_account_number}`
      });

      // Update payout request
      await FundPayoutRequest.update(selectedRequest.id, {
        status: 'processed',
        processed_date: new Date().toISOString(),
        utr_number: utrNumber,
        transaction_reference: utrNumber,
        admin_notes: `Payout processed via bank transfer - UTR: ${utrNumber}`
      });

      const investor = investors[selectedRequest.investor_id];

      await Notification.create({
        user_id: investor?.user_id,
        title: 'Payout Processed ✅',
        message: `Your payout of ₹${selectedRequest.requested_amount?.toLocaleString('en-IN')} has been processed. UTR: ${utrNumber}. Funds will be credited within 1-2 business days.`,
        type: 'info',
        page: 'wallet'
      });

      toast.success(`✅ Payout processed! ₹${selectedRequest.requested_amount?.toLocaleString('en-IN')} transferred via bank. UTR: ${utrNumber}`);
      setShowProcessModal(false);
      setUtrNumber('');
      setSelectedRequest(null);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error processing payout:', error);
      toast.error('Failed to process payout');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Wallet Payout Requests Management</CardTitle>
        </CardHeader>
        <CardContent>
          {payoutRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No payout requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Investor</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Bank Details</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Request Date</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payoutRequests.map((request) => {
                    const investor = investors[request.investor_id];

                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{investor?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{investor?.investor_code || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-sm">₹{(request.requested_amount || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="text-xs text-slate-600">A/C: {request.bank_account_number}</p>
                          <p className="text-xs text-slate-500">IFSC: {request.bank_ifsc_code}</p>
                          <p className="text-xs text-slate-500">{request.bank_name}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1 justify-center w-fit mx-auto text-xs`}>
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <p className="text-xs text-slate-600">
                            {new Date(request.created_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(request)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {request.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessPayout(request)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                              >
                                <Wallet className="w-4 h-4 mr-1" />
                                Process Payout
                              </Button>
                            )}

                            {request.status === 'processed' && (
                              <div className="flex flex-col items-center gap-1">
                                <Badge className="bg-green-100 text-green-800 border border-green-300">
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Completed
                                </Badge>
                                {request.utr_number && (
                                  <p className="text-xs text-slate-500">UTR: {request.utr_number}</p>
                                )}
                              </div>
                            )}

                            {request.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
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

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Payout Request</DialogTitle>
            <DialogDescription>
              Approve payout of ₹{selectedRequest?.requested_amount?.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payout Request</DialogTitle>
            <DialogDescription>
              Reject payout of ₹{selectedRequest?.requested_amount?.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmReject} disabled={isProcessing || !rejectionReason.trim()} variant="destructive">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payout Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>
              Process payout of ₹{selectedRequest?.requested_amount?.toLocaleString('en-IN')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-2">Bank Details:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>A/C: {selectedRequest?.bank_account_number}</p>
                <p>IFSC: {selectedRequest?.bank_ifsc_code}</p>
                <p>Bank: {selectedRequest?.bank_name}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="utrNumber">UTR Number *</Label>
              <Input
                id="utrNumber"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="Enter bank transaction UTR number"
                className="mt-1"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Enter the unique transaction reference number from your bank</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmProcessPayout} disabled={isProcessing || !utrNumber.trim()} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
              Process Payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Withdrawal Management Content Component - Renamed to avoid conflict
function WithdrawalManagementContent({ onUpdate }) {
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [allocations, setAllocations] = useState({}); // Map allocation_id to allocation object
  const [investors, setInvestors] = useState({}); // Map investor_id to investor object
  const [fundPlans, setFundPlans] = useState({}); // Map fund_plan_id to plan object
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingNotes, setProcessingNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [requests, allocs, invs, plans] = await Promise.all([
        FundWithdrawalRequest.list('-created_date'),
        FundAllocation.list(),
        Investor.list(),
        FundPlan.list()
      ]);

      const allocsMap = allocs.reduce((acc, alloc) => ({ ...acc, [alloc.id]: alloc }), {});
      const invsMap = invs.reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {});
      const plansMap = plans.reduce((acc, plan) => ({ ...acc, [plan.id]: plan }), {});

      setWithdrawalRequests(requests);
      setAllocations(allocsMap);
      setInvestors(invsMap);
      setFundPlans(plansMap);
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      toast.error('Failed to load withdrawal requests');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-blue-600" />;
      case 'processed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleApproveRequest = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleRejectRequest = (request) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleProcessWithdrawal = (request) => {
    setSelectedRequest(request);
    setProcessingNotes('');
    setShowProcessModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;

    setIsProcessing(true);
    try {
      // Lock funds in wallet
      const wallets = await FundWallet.filter({ investor_id: selectedRequest.investor_id });
      if (wallets.length > 0) {
        const wallet = wallets[0];
        if ((wallet.available_balance || 0) < selectedRequest.withdrawal_amount) {
          toast.error("Insufficient available balance in investor's wallet to approve this withdrawal.");
          setIsProcessing(false);
          return;
        }
        await FundWallet.update(wallet.id, {
          available_balance: (wallet.available_balance || 0) - selectedRequest.withdrawal_amount,
          locked_balance: (wallet.locked_balance || 0) + selectedRequest.withdrawal_amount,
          last_transaction_date: new Date().toISOString()
        });
      }

      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'approved',
        admin_notes: adminNotes,
        reviewed_at: new Date().toISOString()
      });

      const investor = investors[selectedRequest.investor_id];
      const fundPlan = fundPlans[selectedRequest.fund_plan_id];

      await Notification.create({
        user_id: investor?.user_id,
        title: 'Withdrawal Request Approved',
        message: `Your withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} for ${fundPlan?.plan_name} has been approved. Funds are now locked and will be processed within the notice period.`,
        type: 'info',
        page: 'wallet'
      });

      toast.success('Withdrawal request approved');
      setShowApproveModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    try {
      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'rejected',
        rejection_reason: rejectionReason,
        reviewed_at: new Date().toISOString()
      });

      // If funds were locked during approval, unlock them
      const wallets = await FundWallet.filter({ investor_id: selectedRequest.investor_id });
      if (wallets.length > 0) {
        const wallet = wallets[0];
        await FundWallet.update(wallet.id, {
          available_balance: (wallet.available_balance || 0) + selectedRequest.withdrawal_amount,
          locked_balance: Math.max(0, (wallet.locked_balance || 0) - selectedRequest.withdrawal_amount),
          last_transaction_date: new Date().toISOString()
        });
      }

      const investor = investors[selectedRequest.investor_id];
      const fundPlan = fundPlans[selectedRequest.fund_plan_id];

      await Notification.create({
        user_id: investor?.user_id,
        title: 'Withdrawal Request Rejected',
        message: `Your withdrawal request of ₹${selectedRequest.withdrawal_amount?.toLocaleString('en-IN')} for ${fundPlan?.plan_name} has been rejected. Reason: ${rejectionReason}`,
        type: 'alert',
        page: 'wallet'
      });

      toast.success('Withdrawal request rejected');
      setShowRejectModal(false);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmProcessWithdrawal = async () => {
    if (!selectedRequest || !processingNotes.trim()) {
      toast.error('Please provide processing notes');
      return;
    }

    setIsProcessing(true);
    try {
      const allocation = allocations[selectedRequest.allocation_id];
      if (!allocation) {
        toast.error('Allocation not found');
        return;
      }

      const withdrawalAmount = selectedRequest.withdrawal_amount;

      // Step 1: Update allocation
      if (selectedRequest.withdrawal_type === 'full') {
        await FundAllocation.update(allocation.id, {
          status: 'redeemed',
          units_held: 0,
          total_invested: 0,
          current_value: 0,
          profit_loss: 0,
          profit_loss_percent: 0,
          last_transaction_date: new Date().toISOString()
        });
      } else {
        const remainingInvested = (allocation.total_invested || 0) - withdrawalAmount;
        const remainingValue = (allocation.current_value || 0) - withdrawalAmount;
        const newUnits = remainingInvested / (allocation.average_nav || 1);

        await FundAllocation.update(allocation.id, {
          total_invested: Math.max(0, remainingInvested),
          current_value: Math.max(0, remainingValue),
          units_held: Math.max(0, newUnits),
          profit_loss: Math.max(0, remainingValue) - Math.max(0, remainingInvested),
          profit_loss_percent: remainingInvested > 0 ? ((Math.max(0, remainingValue) - Math.max(0, remainingInvested)) / Math.max(0, remainingInvested)) * 100 : 0,
          status: remainingInvested > 0 ? 'active' : 'redeemed',
          last_transaction_date: new Date().toISOString()
        });
      }

      // Step 2: CRITICAL FIX - Credit wallet with withdrawal amount
      const wallets = await FundWallet.filter({ investor_id: selectedRequest.investor_id });
      if (wallets.length > 0) {
        const wallet = wallets[0];

        console.log('💰 Before Withdrawal Processing:');
        console.log('Available Balance:', wallet.available_balance);
        console.log('Withdrawal Amount:', withdrawalAmount);

        const newAvailableBalance = (wallet.available_balance || 0) + withdrawalAmount;

        await FundWallet.update(wallet.id, {
          available_balance: newAvailableBalance,
          locked_balance: Math.max(0, (wallet.locked_balance || 0) - withdrawalAmount), // Unlock funds
          last_transaction_date: new Date().toISOString()
        });

        console.log('💰 After Withdrawal Processing:');
        console.log('New Available Balance:', newAvailableBalance);

        // Create transaction record for withdrawal (credit to wallet)
        await FundTransaction.create({
          investor_id: selectedRequest.investor_id,
          fund_plan_id: selectedRequest.fund_plan_id,
          allocation_id: selectedRequest.allocation_id,
          transaction_type: 'redemption',
          amount: withdrawalAmount,
          payment_method: 'internal_transfer',
          status: 'completed',
          transaction_date: new Date().toISOString(),
          settlement_date: new Date().toISOString().split('T')[0],
          notes: `Fund withdrawal processed - ₹${withdrawalAmount.toLocaleString('en-IN')} credited to wallet`
        });
      } else {
        toast.error('Investor wallet not found');
        setIsProcessing(false);
        return;
      }

      // Step 3: Update withdrawal request status
      await FundWithdrawalRequest.update(selectedRequest.id, {
        status: 'processed',
        admin_notes: processingNotes,
        processed_date: new Date().toISOString()
      });

      // Step 4: Update investor totals
      const investor = investors[selectedRequest.investor_id];
      if (investor) {
        const newTotalInvested = Math.max(0, (investor.total_invested || 0) - withdrawalAmount);
        const newCurrentValue = Math.max(0, (investor.current_value || 0) - withdrawalAmount);

        await Investor.update(investor.id, {
          total_invested: newTotalInvested,
          current_value: newCurrentValue,
          total_profit_loss: newCurrentValue - newTotalInvested
        });

        // Send notification
        await Notification.create({
          user_id: investor.user_id,
          title: 'Withdrawal Processed ✅',
          message: `Your withdrawal of ₹${withdrawalAmount.toLocaleString('en-IN')} has been processed and credited to your wallet. Available balance updated.`,
          type: 'info',
          page: 'wallet'
        });
      }

      toast.success(`✅ Withdrawal processed! ₹${withdrawalAmount.toLocaleString('en-IN')} credited to investor wallet.`);
      setShowProcessModal(false);
      setProcessingNotes('');
      setSelectedRequest(null);
      loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      toast.error('Failed to process withdrawal');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Fund Withdrawal Requests Management</CardTitle>
        </CardHeader>
        <CardContent>
          {withdrawalRequests.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Download className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Investor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Fund Plan</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Amount</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Type</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Request Date</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold min-w-[200px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawalRequests.map((request) => {
                    const investor = investors[request.investor_id];
                    const fundPlan = fundPlans[request.fund_plan_id];

                    return (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{investor?.full_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{investor?.investor_code || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4">
                          <p className="font-medium text-sm">{fundPlan?.plan_name || 'Unknown Plan'}</p>
                          <p className="text-xs text-slate-500">{fundPlan?.plan_code || 'N/A'}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-sm">₹{(request.withdrawal_amount || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge variant="outline" className="capitalize text-xs">
                            {request.withdrawal_type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={`${getStatusColor(request.status)} border flex items-center gap-1 justify-center w-fit mx-auto text-xs`}>
                            {getStatusIcon(request.status)}
                            <span className="capitalize">{request.status}</span>
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <p className="text-xs text-slate-600">
                            {new Date(request.created_date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </p>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex gap-2 justify-center flex-wrap">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleApproveRequest(request)}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRejectRequest(request)}
                                >
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}

                            {request.status === 'approved' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessWithdrawal(request)}
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Process Withdrawal
                              </Button>
                            )}

                            {request.status === 'processed' && (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Completed
                              </Badge>
                            )}

                            {request.status === 'rejected' && (
                              <Badge className="bg-red-100 text-red-800">
                                <XCircle className="w-4 h-4 mr-1" />
                                Rejected
                              </Badge>
                            )}
                          </div>
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

      {/* Approve Modal */}
      <Dialog open={showApproveModal} onOpenChange={setShowApproveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Withdrawal Request</DialogTitle>
            <DialogDescription>
              Approve withdrawal of ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')} for{' '}
              {fundPlans[selectedRequest?.fund_plan_id]?.plan_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adminNotes">Admin Notes (Optional)</Label>
              <Textarea
                id="adminNotes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes..."
                rows={3}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmApprove} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
            <DialogDescription>
              Reject withdrawal of ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')} for{' '}
              {fundPlans[selectedRequest?.fund_plan_id]?.plan_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                rows={3}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmReject} disabled={isProcessing || !rejectionReason.trim()} variant="destructive">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Withdrawal Modal */}
      <Dialog open={showProcessModal} onOpenChange={setShowProcessModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Process withdrawal of ₹{selectedRequest?.withdrawal_amount?.toLocaleString('en-IN')} for{' '}
              {fundPlans[selectedRequest?.fund_plan_id]?.plan_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="processingNotes">Processing Notes *</Label>
              <Textarea
                id="processingNotes"
                value={processingNotes}
                onChange={(e) => setProcessingNotes(e.target.value)}
                placeholder="Add notes about the processing, e.g., redemption details"
                rows={3}
                className="mt-1"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessModal(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={confirmProcessWithdrawal} disabled={isProcessing || !processingNotes.trim()} className="bg-blue-600 hover:bg-blue-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              Complete Processing
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// NEW: ProfitPayoutManager component
// This component has been renamed to ProfitDistribution for clarity and is now in '../components/fundmanager/ProfitDistribution'.
// The previous code for this component is now located there.

// NEW: KYCApprovalModal Component
function KYCApprovalModal({ investor, wallet, isOpen, onClose, onUpdate }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVerifyKYC = async () => {
    if (!investor) return;

    setIsProcessing(true);
    try {
      await Investor.update(investor.id, { kyc_status: 'verified', status: 'active' });

      // Create a notification for the investor
      await Notification.create({
        user_id: investor.user_id,
        title: 'KYC Verified! 🎉',
        message: 'Your KYC documents have been successfully verified. You can now fully utilize your investment account.',
        type: 'success',
        page: 'kyc'
      });

      toast.success(`KYC for ${investor.full_name} verified successfully!`);
      onUpdate();
    } catch (error) {
      console.error('Error verifying KYC:', error);
      toast.error('Failed to verify KYC.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRejectKYC = async () => {
    if (!investor || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }

    setIsProcessing(true);
    try {
      await Investor.update(investor.id, { kyc_status: 'failed', rejection_reason: rejectionReason, status: 'inactive' });

      // Create a notification for the investor
      await Notification.create({
        user_id: investor.user_id,
        title: 'KYC Rejected 🙁',
        message: `Your KYC documents could not be verified. Reason: ${rejectionReason}. Please update your documents.`,
        type: 'alert',
        page: 'kyc'
      });

      toast.success(`KYC for ${investor.full_name} rejected.`);
      onUpdate();
    } catch (error) {
      console.error('Error rejecting KYC:', error);
      toast.error('Failed to reject KYC.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!investor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Review Investor KYC: {investor.full_name}
          </DialogTitle>
          <DialogDescription>
            Review the submitted KYC documents and decide to approve or reject.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500">Investor Code:</p>
              <p className="font-semibold">{investor.investor_code}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Email:</p>
              <p className="font-semibold">{investor.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Mobile:</p>
              <p className="font-semibold">{investor.mobile_number}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Current KYC Status:</p>
              {investor.kyc_status === 'verified' && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" /> Verified
                </Badge>
              )}
              {investor.kyc_status === 'pending' && (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" /> Pending
                </Badge>
              )}
              {investor.kyc_status === 'failed' && (
                <Badge className="bg-red-100 text-red-800 border-red-200">
                  <XCircle className="w-3 h-3 mr-1" /> Rejected
                </Badge>
              )}
            </div>
          </div>

          <hr className="my-4" />

          {/* KYC Documents Section */}
          <div>
            <h3 className="font-bold text-lg mb-3">Submitted Documents</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {investor.kyc_documents?.pan_card_url && (
                <a href={investor.kyc_documents.pan_card_url} target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-medium text-sm">PAN Card</p>
                  <p className="text-xs text-slate-500 truncate">{investor.kyc_documents.pan_card_url}</p>
                </a>
              )}
              {investor.kyc_documents?.address_proof_url && (
                <a href={investor.kyc_documents.address_proof_url} target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <FileText className="w-6 h-6 text-blue-600 mb-2" />
                  <p className="font-medium text-sm">Address Proof</p>
                  <p className="text-xs text-slate-500 truncate">{investor.kyc_documents.address_proof_url}</p>
                </a>
              )}
              {!investor.kyc_documents?.pan_card_url && !investor.kyc_documents?.address_proof_url && (
                <p className="text-sm text-slate-500 col-span-2">No documents submitted yet.</p>
              )}
            </div>
          </div>

          {investor.kyc_status !== 'verified' && (
            <div>
              <Label htmlFor="rejectionReason" className="text-base font-semibold">
                Rejection Reason (only if rejecting)
              </Label>
              <Textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter a reason if rejecting KYC (e.g., blurry document, mismatch data)"
                rows={3}
                className="mt-2"
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          {investor.kyc_status !== 'verified' && (
            <Button
              onClick={handleRejectKYC}
              disabled={isProcessing || !rejectionReason.trim()}
              variant="destructive"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Reject KYC
            </Button>
          )}
          {investor.kyc_status !== 'verified' && (
            <Button onClick={handleVerifyKYC} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Verify KYC
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// NEW: InvestorsAndKYCManager Component
function InvestorsAndKYCManager({ onUpdate }) {
  const [investors, setInvestors] = useState([]);
  const [wallets, setWallets] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [showKYCModal, setShowKYCModal] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState([]);
  const [showDuplicatesWarning, setShowDuplicatesWarning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [invs, walletsData] = await Promise.all([
        Investor.list('-created_date'),
        FundWallet.list()
      ]);

      const walletsMap = walletsData.reduce((acc, w) => {
        acc[w.investor_id] = w;
        return acc;
      }, {});

      // Detect duplicates by user_id
      const userIdMap = {};
      invs.forEach(inv => {
        if (!userIdMap[inv.user_id]) {
          userIdMap[inv.user_id] = [];
        }
        userIdMap[inv.user_id].push(inv);
      });

      const duplicates = Object.values(userIdMap).filter(group => group.length > 1);

      if (duplicates.length > 0) {
        setDuplicateGroups(duplicates);
        setShowDuplicatesWarning(true);
        console.warn('⚠️ Found duplicate investors:', duplicates);
      } else {
        setDuplicateGroups([]);
        setShowDuplicatesWarning(false);
      }

      setInvestors(invs);
      setWallets(walletsMap);
    } catch (error) {
      console.error('Error loading investors:', error);
      toast.error('Failed to load investors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeDuplicates = async (group) => {
    if (!confirm(`Merge ${group.length} duplicate investor records for user ${group[0].user_id}? This will keep the oldest investor record (${group[0].investor_code}) and delete the others, consolidating all associated data.`)) {
      return;
    }

    try {
      setIsLoading(true); // Show loading indicator during merge
      // Keep the oldest investor (first one)
      const primaryInvestor = group[0];
      const duplicatesToDelete = group.slice(1);

      for (const duplicate of duplicatesToDelete) {
        // Get all allocations for this duplicate
        const allocations = await FundAllocation.filter({ investor_id: duplicate.id });
        for (const alloc of allocations) {
          await FundAllocation.update(alloc.id, { investor_id: primaryInvestor.id });
        }

        // Get all transactions for this duplicate
        const transactions = await FundTransaction.filter({ investor_id: duplicate.id });
        for (const txn of transactions) {
          await FundTransaction.update(txn.id, { investor_id: primaryInvestor.id });
        }

        // Get wallet for this duplicate
        const duplicateWallets = await FundWallet.filter({ investor_id: duplicate.id });
        if (duplicateWallets.length > 0) {
          const duplicateWallet = duplicateWallets[0];

          // Find or create primary wallet
          let primaryWallets = await FundWallet.filter({ investor_id: primaryInvestor.id });
          if (primaryWallets.length === 0) {
            // Create a wallet for the primary if it doesn't exist
            primaryWallets = [await FundWallet.create({
              investor_id: primaryInvestor.id,
              user_id: primaryInvestor.user_id,
              available_balance: 0,
              locked_balance: 0,
              total_deposited: 0,
              total_withdrawn: 0,
              created_date: new Date().toISOString()
            })];
          }
          const primaryWallet = primaryWallets[0];

          // Merge wallet balance into primary wallet
          await FundWallet.update(primaryWallet.id, {
            available_balance: (primaryWallet.available_balance || 0) + (duplicateWallet.available_balance || 0),
            locked_balance: (primaryWallet.locked_balance || 0) + (duplicateWallet.locked_balance || 0),
            total_deposited: (primaryWallet.total_deposited || 0) + (duplicateWallet.total_deposited || 0),
            total_withdrawn: (primaryWallet.total_withdrawn || 0) + (duplicateWallet.total_withdrawn || 0),
            last_transaction_date: new Date().toISOString()
          });
          // Delete duplicate wallet
          await FundWallet.delete(duplicateWallet.id);
        }

        // Delete duplicate investor
        await Investor.delete(duplicate.id);
      }

      // Recalculate primary investor totals based on newly consolidated active allocations
      const allAllocations = await FundAllocation.filter({ investor_id: primaryInvestor.id });
      const activeAllocations = allAllocations.filter(a => a.status === 'active');

      const newTotalInvested = activeAllocations.reduce((sum, a) => sum + (a.total_invested || 0), 0);
      const newCurrentValue = activeAllocations.reduce((sum, a) => sum + (a.current_value || 0), 0);
      const newTotalProfitLoss = newCurrentValue - newTotalInvested;

      await Investor.update(primaryInvestor.id, {
        total_invested: newTotalInvested,
        current_value: newCurrentValue,
        total_profit_loss: newTotalProfitLoss
      });

      toast.success(`✅ Successfully merged ${duplicatesToDelete.length} records into primary investor ${primaryInvestor.investor_code}`);

      // Reload all data to ensure UI is consistent
      await loadData();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error merging duplicates:', error);
      toast.error('Failed to merge duplicate investors: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewKYC = (investor) => {
    setSelectedInvestor(investor);
    setShowKYCModal(true);
  };

  const handleKYCUpdate = () => {
    setShowKYCModal(false);
    setSelectedInvestor(null);
    loadData();
    if (onUpdate) onUpdate();
  };

  const getKYCStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Investors & KYC Management</h1>
        <p className="text-slate-600 mt-1">Review and approve investor KYC documents and manage investor accounts</p>
      </div>

      {/* Duplicate Warning Banner */}
      {showDuplicatesWarning && duplicateGroups.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                ⚠️ Duplicate Investor Records Detected
              </h3>
              <p className="text-sm text-red-800 mb-3">
                Found {duplicateGroups.length} user(s) with multiple investor accounts. Click "Merge Duplicates" to consolidate records.
                The oldest investor record by creation date will be kept as the primary.
              </p>
              <div className="space-y-2">
                {duplicateGroups.map((group, idx) => {
                  // Sort group by created_date to ensure the oldest is first
                  const sortedGroup = [...group].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
                  const primaryInv = sortedGroup[0];
                  const duplicateInvCodes = sortedGroup.slice(1).map(inv => inv.investor_code).join(', ');

                  return (
                    <div key={idx} className="bg-white border border-red-200 rounded p-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-medium text-sm text-slate-900">{primaryInv.full_name} (<span className="font-mono text-blue-600">{primaryInv.investor_code}</span>)</p>
                          <p className="text-xs text-slate-600">
                            Duplicates: {duplicateInvCodes || 'None found (Primary only)'}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleMergeDuplicates(sortedGroup)}
                          className="bg-red-600 hover:bg-red-700"
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Merge Duplicates
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>All Investors</CardTitle>
        </CardHeader>
        <CardContent>
          {investors.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p>No investors found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold">Investor</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold">Contact</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Status</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">KYC Status</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Total Invested</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold">Wallet Balance</th>
                    <th className="text-center py-3 px-4 text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {investors.map((investor) => {
                    const wallet = wallets[investor.id];
                    return (
                      <tr key={investor.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium text-sm">{investor.full_name}</p>
                            <p className="text-xs text-slate-500">{investor.investor_code}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="text-sm">
                            <p className="text-slate-700">{investor.email}</p>
                            <p className="text-slate-500">{investor.mobile_number}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Badge className={
                            investor.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : investor.status === 'inactive'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }>
                            {investor.status}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-center">
                          {getKYCStatusBadge(investor.kyc_status)}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-sm">₹{(investor.total_invested || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <p className="font-bold text-sm text-green-600">₹{(wallet?.available_balance || 0).toLocaleString('en-IN')}</p>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReviewKYC(investor)}
                            className="bg-gradient-to-r from-purple-50 to-blue-50 hover:from-purple-100 hover:to-blue-100"
                          >
                            <Shield className="w-4 h-4 mr-1" />
                            Review KYC
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

      {/* KYC Approval Modal */}
      {selectedInvestor && (
        <KYCApprovalModal
          investor={selectedInvestor}
          wallet={wallets[selectedInvestor.id]}
          isOpen={showKYCModal}
          onClose={() => {
            setShowKYCModal(false);
            setSelectedInvestor(null);
          }}
          onUpdate={handleKYCUpdate}
        />
      )}
    </div>
  );
}


// PHASE 4: Settings View with Admin Controls + Reset Test Data
function SettingsView() {
  const [settings, setSettings] = useState({
    withdrawals_enabled: true,
    payouts_enabled: true,
    min_notice_period_days: 30,
    auto_approve_small_amounts: false,
    small_amount_threshold: 10000
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadSettings = async () => {
      try {
        const allSettings = await PlatformSetting.list().catch(() => []);
        const settingsMap = {};

        allSettings.forEach(setting => {
          if (setting.setting_key.startsWith('fund_')) {
            const key = setting.setting_key.replace('fund_', '');
            settingsMap[key] = setting.setting_value === 'true' ? true :
              setting.setting_value === 'false' ? false :
                !isNaN(setting.setting_value) ? parseFloat(setting.setting_value) :
                  setting.setting_value;
          }
        });

        if (isMounted && Object.keys(settingsMap).length > 0) {
          setSettings(prev => ({ ...prev, ...settingsMap }));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        if (isMounted && !error.message?.includes('Rate limit') && !error.message?.includes('aborted')) {
          toast.error('Failed to load settings');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadSettings();
    return () => { isMounted = false; };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        saveSetting('fund_withdrawals_enabled', settings.withdrawals_enabled.toString()),
        saveSetting('fund_payouts_enabled', settings.payouts_enabled.toString()),
        saveSetting('fund_min_notice_period_days', settings.min_notice_period_days.toString()),
        saveSetting('fund_auto_approve_small_amounts', settings.auto_approve_small_amounts.toString()),
        saveSetting('fund_small_amount_threshold', settings.small_amount_threshold.toString())
      ]);

      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      if (!error.message?.includes('Rate limit') && !error.message?.includes('aborted')) {
        toast.error('Failed to save settings');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      const existing = await PlatformSetting.filter({ setting_key: key }).catch(() => []);

      if (existing.length > 0) {
        await PlatformSetting.update(existing[0].id, { setting_value: value });
      } else {
        await PlatformSetting.create({
          setting_key: key,
          setting_value: value,
          description: getSettingDescription(key)
        });
      }
    } catch (error) {
      console.error(`Error saving setting ${key}:`, error);
      throw error;
    }
  };

  const getSettingDescription = (key) => {
    const descriptions = {
      'fund_withdrawals_enabled': 'Enable or disable withdrawal requests globally',
      'fund_payouts_enabled': 'Enable or disable payout requests globally',
      'fund_min_notice_period_days': 'Minimum notice period for withdrawals in days',
      'fund_auto_approve_small_amounts': 'Automatically approve withdrawals below threshold',
      'fund_small_amount_threshold': 'Threshold amount for auto-approval'
    };
    return descriptions[key] || '';
  };

  const handleResetTestData = async () => {
    if (resetConfirmText !== 'RESET') {
      toast.error('Please type RESET to confirm');
      return;
    }

    setIsResetting(true);
    try {
      // Step 1: Reset all FundWallets
      const wallets = await FundWallet.list().catch(() => []);
      for (const wallet of wallets) {
        await FundWallet.update(wallet.id, {
          available_balance: 0,
          locked_balance: 0,
          total_deposited: 0,
          total_withdrawn: 0
        });
      }

      // Step 2: Reset all Investors
      const investors = await Investor.list().catch(() => []);
      for (const investor of investors) {
        await Investor.update(investor.id, {
          total_invested: 0,
          current_value: 0,
          total_profit_loss: 0,
          status: 'inactive'
        });
      }

      // Step 3: Delete all FundAllocations
      const allocations = await FundAllocation.list().catch(() => []);
      for (const allocation of allocations) {
        await FundAllocation.delete(allocation.id);
      }

      // Step 4: Delete all FundWithdrawalRequests
      const withdrawals = await FundWithdrawalRequest.list().catch(() => []);
      for (const withdrawal of withdrawals) {
        await FundWithdrawalRequest.delete(withdrawal.id);
      }

      // Step 5: Delete all FundPayoutRequests
      const payouts = await FundPayoutRequest.list().catch(() => []);
      for (const payout of payouts) {
        await FundPayoutRequest.delete(payout.id);
      }

      // Step 6: Delete all FundTransactions
      const transactions = await FundTransaction.list().catch(() => []);
      for (const transaction of transactions) {
        await FundTransaction.delete(transaction.id);
      }

      // Step 7: Delete all InvestmentRequests
      const investmentRequests = await InvestmentRequest.list().catch(() => []);
      for (const request of investmentRequests) {
        await InvestmentRequest.delete(request.id);
      }

      // Step 8: Reset all InvestorRequests to pending
      const investorRequests = await InvestorRequest.list().catch(() => []);
      for (const request of investorRequests) {
        await InvestorRequest.update(request.id, {
          status: 'pending'
        });
      }

      // Step 9: Delete all Notifications for fund manager
      const notifications = await Notification.filter({ recipient_id: null, type: ['transaction', 'allocation', 'investor', 'withdrawal', 'payout']}).catch(() => []); // recipient_id: user?.id is not available here, setting to null
      for (const notification of notifications) {
        await Notification.delete(notification.id);
      }

      toast.success('✅ Fund Manager test data has been reset successfully. All wallets and investments are now zeroed out.');
      setShowResetModal(false);
      setResetConfirmText('');

      // Redirect to FundManager dashboard
      setTimeout(() => {
        window.location.hash = 'home';
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error resetting test data:', error);
      if (!error.message?.includes('Rate limit') && !error.message?.includes('aborted')) {
        toast.error('Failed to reset test data: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setIsResetting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Fund Manager Settings</h1>
        <p className="text-slate-600 mt-1">Configure global fund management settings</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Withdrawal & Payout Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PHASE 4: Toggle Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-900">Enable Withdrawals</p>
                <p className="text-sm text-slate-600">Allow investors to request fund withdrawals</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.withdrawals_enabled}
                  onChange={(e) => setSettings({ ...settings, withdrawals_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-900">Enable Payouts</p>
                <p className="text-sm text-slate-600">Allow investors to request wallet payouts</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payouts_enabled}
                  onChange={(e) => setSettings({ ...settings, payouts_enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-semibold text-slate-900">Auto-Approve Small Amounts</p>
                <p className="text-sm text-slate-600">Automatically approve withdrawals below threshold</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.auto_approve_small_amounts}
                  onChange={(e) => setSettings({ ...settings, auto_approve_small_amounts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="notice_period">Minimum Notice Period (Days)</Label>
              <Input
                id="notice_period"
                type="number"
                value={settings.min_notice_period_days}
                onChange={(e) => setSettings({ ...settings, min_notice_period_days: parseInt(e.target.value) })}
                min="0"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Minimum days investors must wait before withdrawal</p>
            </div>

            <div>
              <Label htmlFor="threshold">Small Amount Threshold (₹)</Label>
              <Input
                id="threshold"
                type="number"
                value={settings.small_amount_threshold}
                onChange={(e) => setSettings({ ...settings, small_amount_threshold: parseInt(e.target.value) })}
                min="0"
                className="mt-1"
              />
              <p className="text-xs text-slate-500 mt-1">Auto-approve withdrawals below this amount</p>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Important:</p>
                <p className="mt-1">Disabling withdrawals will prevent all investors from requesting new withdrawals. Existing pending requests will not be affected.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Test Data Section */}
      <Card className="border-2 border-red-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="w-6 h-6" />
            Danger Zone: Reset Test Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>⚠️ Warning:</strong> This action will reset all Fund Management data to a clean state. This includes:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
              <li>All Investor Wallets will be reset to ₹0</li>
              <li>All Investor records will be marked as inactive</li>
              <li>All Fund Allocations will be deleted</li>
              <li>All Withdrawal Requests will be deleted</li>
              <li>All Payout Requests will be deleted</li>
              <li>All Fund Transactions will be deleted</li>
              <li>All Investment Requests will be deleted</li>
              <li>Investor Requests will be reset to pending status</li>
              <li>All Fund Manager Notifications will be deleted</li>
            </ul>
            <p className="text-sm text-red-800 mt-3">
              <strong>Note:</strong> Fund Plans will remain unchanged.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() => setShowResetModal(true)}
              className="bg-gradient-to-r from-red-500 to-red-700 text-white hover:from-red-600 hover:to-red-800"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Reset FundManager Test Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Modal */}
      <Dialog open={showResetModal} onOpenChange={setShowResetModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-900">
              <AlertTriangle className="w-6 h-6" />
              Confirm Test Data Reset
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              This action cannot be undone. All fund management data will be permanently reset.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4">
              <p className="text-sm text-red-900 font-semibold mb-2">
                ⚠️ This will reset all Investor Wallets, Investments, Allocations, and Payouts back to zero. Fund Plans will remain unchanged.
              </p>
              <p className="text-sm text-red-800">
                Do you want to proceed?
              </p>
            </div>

            <div>
              <Label htmlFor="confirm-text" className="text-slate-900 font-semibold">
                Type <span className="text-red-600 font-mono">RESET</span> to confirm:
              </Label>
              <Input
                id="confirm-text"
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                placeholder="Type RESET here"
                className="mt-2 border-2 border-red-300 focus:border-red-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowResetModal(false);
                setResetConfirmText('');
              }}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResetTestData}
              disabled={isResetting || resetConfirmText !== 'RESET'}
              className="bg-gradient-to-r from-red-500 to-red-700 text-white"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Reset All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Support View
function SupportView() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Support & Help</h1>
        <p className="text-slate-600 mt-1">Get assistance with fund management operations</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-blue-600" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">📧 Email Support</h3>
              <p className="text-sm text-blue-700">fundmanager@protocol.in</p>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-900 mb-2">📞 Phone Support</h3>
              <p className="text-sm text-green-700">+91-80-4567-8900</p>
              <p className="text-xs text-green-600 mt-1">Mon-Fri, 9 AM - 6 PM IST</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">How to approve investor requests?</h3>
              <p className="text-sm text-slate-600">Navigate to the Investors page and review pending requests.</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">How to create a new fund plan?</h3>
              <p className="text-sm text-slate-600">Go to Fund Plans and click "Create New Fund Plan".</p>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-900 mb-2">How to process payouts?</h3>
              <p className="text-sm text-slate-600">Check the Payouts section for pending requests.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Component - RATE LIMIT SAFE
export default function FundManager() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalPlans: 0,
    activePlans: 0,
    totalInvestors: 0,
    pendingRequests: 0,
    pendingAllocations: 0,
    totalAUM: 0,
    pendingWithdrawals: 0,
    approvedWithdrawals: 0,
    totalAllocations: 0,
    totalCapitalInvested: 0
  });
  const [investors, setInvestors] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [pendingInvestments, setPendingInvestments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('home');
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);

  const isMountedRef = useRef(true);
  const loadingRef = useRef(false);
  const abortControllerRef = useRef(null);

  // Page-specific notification counts - DISABLED
  const transactionNotifs = { count: 0, markAsRead: async () => {} };
  const allocationNotifs = { count: 0, markAsRead: async () => {} };
  const investorNotifs = { count: 0, markAsRead: async () => {} };
  const payoutNotifs = { count: 0, markAsRead: async () => {} };
  const withdrawalNotifs = { count: 0, markAsRead: async () => {} };

  const totalUnreadCount =
    transactionNotifs.count +
    allocationNotifs.count +
    investorNotifs.count +
    payoutNotifs.count +
    withdrawalNotifs.count;

  const markAllAsRead = async () => {
    await transactionNotifs.markAsRead();
    await allocationNotifs.markAsRead();
    await investorNotifs.markAsRead();
    await payoutNotifs.markAsRead();
    await withdrawalNotifs.markAsRead();
  };

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') || 'home';
    setCurrentView(hash);
  }, [location]);

  const loadAllData = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current) {
      console.log('⏳ Load already in progress, skipping...');
      return;
    }

    // Cancel any pending requests from previous runs
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this run
    abortControllerRef.current = new AbortController();

    loadingRef.current = true;
    setIsLoading(true);

    try {
      if (!isMountedRef.current) return;

      // Step 1: Check user authentication FIRST
      const currentUser = await User.me();
      if (!isMountedRef.current) return;
      setUser(currentUser);

      console.log('📊 Loading Fund Manager Data with Sequential Delays...');

      // CRITICAL FIX: Load data SEQUENTIALLY with delays and error handling
      // Add signal to abort controller for Model calls if supported,
      // otherwise, `isMountedRef.current` checks prevent state updates.

      // Wait 1 second before starting
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (!isMountedRef.current) return;

      const plans = await FundPlan.list().catch(err => {
        console.error('Error loading plans:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const requests = await InvestorRequest.list().catch(err => {
        console.error('Error loading investor requests:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const invs = await Investor.list('-created_date', 20).catch(err => {
        console.error('Error loading recent investors:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const allInvs = await Investor.list().catch(err => {
        console.error('Error loading all investors:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const allocs = await FundAllocation.list().catch(err => {
        console.error('Error loading allocations:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const withdrawals = await FundWithdrawalRequest.list().catch(err => {
        console.error('Error loading withdrawals:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const txns = await FundTransaction.list('-transaction_date', 20).catch(err => {
        console.error('Error loading transactions:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      await new Promise(resolve => setTimeout(resolve, 1500));
      if (!isMountedRef.current) return;

      const pendingInv = await InvestmentRequest.filter({ status: 'pending_execution' }).catch(err => {
        console.error('Error loading pending investments:', err);
        return [];
      });
      if (!isMountedRef.current) return;

      console.log('✅ All Data Loaded Successfully');

      // Calculate stats from loaded data
      const totalAUM = allocs
        .filter(a => a.status === 'active')
        .reduce((sum, a) => sum + (a.current_value || 0), 0);

      const totalCapitalInvested = allocs
        .filter((a) => a.status === 'active')
        .reduce((sum, alloc) => sum + (alloc.total_invested || 0), 0);

      const activePlans = plans.filter(p => p.is_active).length;
      const pendingRequests = requests.filter(r => r.status === 'pending' || r.status === 'under_review').length;
      const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending').length;
      const approvedWithdrawals = withdrawals.filter(w => w.status === 'approved').length;

      setStats({
        totalPlans: plans.length,
        activePlans,
        totalInvestors: allInvs.length,
        pendingRequests,
        pendingAllocations: pendingInv.length,
        totalAUM,
        pendingWithdrawals,
        approvedWithdrawals,
        totalAllocations: allocs.length,
        totalCapitalInvested
      });

      setInvestors(invs);
      setTransactions(txns);
      setAllocations(allocs);
      setPendingInvestments(pendingInv);

    } catch (error) {
      if (isMountedRef.current && error.name !== 'AbortError') {
        console.error("Error loading fund manager data:", error);
        if (!error.message?.includes('Rate limit') && !error.message?.includes('aborted')) {
          toast.error("Failed to load some data. Please refresh.");
        }
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      loadingRef.current = false;
      abortControllerRef.current = null; // Clear the abort controller after the process
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Load immediately
    loadAllData();

    return () => {
      isMountedRef.current = false;
      loadingRef.current = false;
      
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadAllData]);

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout. Please try again.');
    }
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    window.location.hash = view;
  };

  const handleRefresh = useCallback(() => {
    // Force refresh after any operation - but prevent if already loading
    if (!loadingRef.current) {
      loadAllData();
    } else {
      console.log('⏳ Refresh requested but load already in progress');
    }
  }, [loadAllData]);

  // Navigation items with badges
  const navigationItems = [
    { view: 'home', label: 'Dashboard', icon: Home },
    { view: 'plans', label: 'Fund Plans', icon: Target },
    {
      view: 'investors-kyc', // New view for Investor KYC
      label: 'Investors & KYC',
      icon: Users
    },
    {
      view: 'investors', // Existing InvestorRequestsManager
      label: 'Investor Requests', // Label changed for clarity
      icon: UserCheck, // Icon changed for clarity
      badge: stats.pendingRequests > 0 ? stats.pendingRequests : undefined
    },
    { view: 'transactions', label: 'Transactions', icon: Activity },
    {
      view: 'allocations',
      label: 'Allocations',
      icon: TrendingUp,
      badge: stats.pendingAllocations > 0 ? stats.pendingAllocations : undefined
    },
    {
      view: 'withdrawals',
      label: 'Withdrawals & Payouts',
      icon: Download,
      badge: stats.pendingWithdrawals > 0 ? stats.pendingWithdrawals : undefined
    },
    { view: 'profit_payouts', label: 'Profit Payouts', icon: IndianRupee }, // Changed to IndianRupee
    { view: 'reports', label: 'Reports', icon: BarChart3 },
    { view: 'settings', label: 'Settings', icon: Settings },
    { view: 'support', label: 'Support', icon: LifeBuoy }
  ];

  if (isLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading Fund Manager...</p>
          <p className="text-slate-400 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-lg">
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b border-slate-200 bg-gradient-to-r from-blue-600 to-purple-600 p-4">
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Fund Manager</h1>
            <p className="text-xs text-blue-100">Investment Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.view}
              onClick={() => handleViewChange(item.view)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                currentView === item.view
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="flex-1 text-left font-medium">{item.label}</span>
              {item.badge && (
                <Badge className="bg-red-500 text-white">{item.badge}</Badge>
              )}
            </button>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
              {user?.display_name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate text-sm">{user?.display_name || 'Admin'}</p>
              <p className="text-xs text-slate-500">Fund Manager</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate(createPageUrl('Profile'))}>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowNotificationSettings(true)}>
                  <Bell className="w-4 h-4 mr-2" />
                  Notifications
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {user?.app_role === 'super_admin' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl('SuperAdmin'))}>
                      <Shield className="w-4 h-4 mr-2" />
                      Back to Admin Panel
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {navigationItems.find(item => item.view === currentView)?.label || 'Dashboard'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <button
              className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => {
                setShowNotificationSettings(true);
                markAllAsRead(); // Mark all notifications as read when opening the modal
              }}
              title="View Notifications"
            >
              <Bell className="w-6 h-6 text-slate-600" />
              {totalUnreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Activity className="w-4 h-4 mr-2" />
              )}
              Refresh
            </Button>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <Shield className="w-3 h-3 mr-1" />
              Fund Manager
            </Badge>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          {currentView === 'home' && <DashboardHomeView stats={stats} investors={investors} transactions={transactions} allocations={allocations} pendingInvestments={pendingInvestments} onRefresh={handleRefresh} />}
          {currentView === 'plans' && (
            <div className="p-8 space-y-6">
              <FundPlansManager onUpdate={handleRefresh} />
            </div>
          )}
          {currentView === 'investors-kyc' && <InvestorsAndKYCManager onUpdate={handleRefresh} />}
          {currentView === 'investors' && (
            <div className="p-8 space-y-6">
              <InvestorRequestsManager onUpdate={handleRefresh} />
            </div>
          )}
          {currentView === 'transactions' && <TransactionsManager onUpdate={handleRefresh} />}
          {currentView === 'allocations' && <AllocationsView onUpdate={handleRefresh} />}
          {currentView === 'withdrawals' && <WithdrawalsAndPayoutsView onUpdate={handleRefresh} />}
          {currentView === 'profit_payouts' && (
            <div className="p-8 space-y-6">
              <ProfitDistribution onUpdate={handleRefresh} />
            </div>
          )}
          {currentView === 'reports' && <ReportsManager />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'support' && <SupportView />}
        </main>

        {/* Notification Settings Modal */}
        {showNotificationSettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Notification Settings</h2>
                <button onClick={() => setShowNotificationSettings(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-slate-600 text-sm mb-4">Notification preferences can be configured here.</p>
              <p className="text-slate-500 text-xs italic">This section is currently under development.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
