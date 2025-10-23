import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Investor, FundPlan, FundAllocation, FundTransaction, FundWithdrawalRequest, FundPayoutRequest } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Loader2, Calendar, TrendingUp, DollarSign, Users, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import FundManagerLayout from '../components/layouts/FundManagerLayout';

export default function FundManagerReports() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [reportType, setReportType] = useState('transactions');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedInvestor, setSelectedInvestor] = useState('all');
  const [selectedPlan, setSelectedPlan] = useState('all');
  const [investors, setInvestors] = useState([]);
  const [fundPlans, setFundPlans] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Stats
  const [stats, setStats] = useState({
    totalInvestors: 0,
    totalPlans: 0,
    totalAUM: 0,
    totalTransactions: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = await User.me();
        setUser(currentUser);

        // Load data with delays
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        await delay(500);
        const invs = await Investor.list().catch(() => []);
        setInvestors(invs);

        await delay(1500);
        const plans = await FundPlan.list().catch(() => []);
        setFundPlans(plans);

        await delay(1500);
        const allocs = await FundAllocation.list().catch(() => []);
        const totalAUM = allocs.filter(a => a.status === 'active').reduce((sum, a) => sum + (a.current_value || 0), 0);

        await delay(1500);
        const txns = await FundTransaction.list().catch(() => []);

        setStats({
          totalInvestors: invs.length,
          totalPlans: plans.length,
          totalAUM: totalAUM,
          totalTransactions: txns.length
        });

        // Set default date range (last 30 days)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);

      } catch (error) {
        console.error('Error loading report data:', error);
        if (!error.message?.includes('Rate limit')) {
          toast.error('Failed to load report data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Please select date range');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('Start date cannot be after end date');
      return;
    }

    setIsGenerating(true);

    try {
      let data = [];
      let filename = '';
      let headers = [];

      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      switch (reportType) {
        case 'transactions':
          await delay(500);
          const txns = await FundTransaction.filter({
            transaction_date: { $gte: startDate, $lte: endDate }
          }).catch(() => []);
          
          // Filter by investor if selected
          let filteredTxns = txns;
          if (selectedInvestor !== 'all') {
            filteredTxns = txns.filter(t => t.investor_id === selectedInvestor);
          }
          
          // Filter by plan if selected
          if (selectedPlan !== 'all') {
            filteredTxns = filteredTxns.filter(t => t.fund_plan_id === selectedPlan);
          }

          headers = ['Transaction Date', 'Transaction Type', 'Investor Code', 'Fund Plan', 'Amount', 'Units', 'NAV', 'Status'];
          data = filteredTxns.map(txn => {
            const investor = investors.find(i => i.id === txn.investor_id);
            const plan = fundPlans.find(p => p.id === txn.fund_plan_id);
            return [
              new Date(txn.transaction_date).toLocaleDateString('en-IN'),
              txn.transaction_type,
              investor?.investor_code || 'N/A',
              plan?.plan_name || 'N/A',
              `₹${(txn.amount || 0).toLocaleString('en-IN')}`,
              txn.units || 'N/A',
              txn.nav ? `₹${txn.nav}` : 'N/A',
              txn.status
            ];
          });
          filename = `transactions_${startDate}_to_${endDate}.csv`;
          break;

        case 'investor_summary':
          await delay(500);
          const allocations = await FundAllocation.list().catch(() => []);
          
          let investorsToReport = investors;
          if (selectedInvestor !== 'all') {
            investorsToReport = investors.filter(i => i.id === selectedInvestor);
          }

          headers = ['Investor Code', 'Name', 'Email', 'Total Invested', 'Current Value', 'Profit/Loss', 'Status'];
          data = investorsToReport.map(inv => {
            const invAllocs = allocations.filter(a => a.investor_id === inv.id && a.status === 'active');
            const totalInvested = invAllocs.reduce((sum, a) => sum + (a.total_invested || 0), 0);
            const currentValue = invAllocs.reduce((sum, a) => sum + (a.current_value || 0), 0);
            const profitLoss = currentValue - totalInvested;

            return [
              inv.investor_code,
              inv.full_name,
              inv.email,
              `₹${totalInvested.toLocaleString('en-IN')}`,
              `₹${currentValue.toLocaleString('en-IN')}`,
              `₹${profitLoss.toLocaleString('en-IN')}`,
              inv.status
            ];
          });
          filename = `investor_summary_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'fund_performance':
          let plansToReport = fundPlans;
          if (selectedPlan !== 'all') {
            plansToReport = fundPlans.filter(p => p.id === selectedPlan);
          }

          headers = ['Fund Plan', 'Plan Code', 'Total Investors', 'Total AUM', 'Expected Return', 'Status'];
          data = plansToReport.map(plan => [
            plan.plan_name,
            plan.plan_code,
            plan.total_investors || 0,
            `₹${((plan.total_aum || 0) / 100000).toFixed(2)}L`,
            `${plan.expected_return_percent}% per month`,
            plan.is_active ? 'Active' : 'Inactive'
          ]);
          filename = `fund_performance_${new Date().toISOString().split('T')[0]}.csv`;
          break;

        case 'withdrawals':
          await delay(500);
          const withdrawals = await FundWithdrawalRequest.filter({
            created_date: { $gte: startDate, $lte: endDate }
          }).catch(() => []);

          let filteredWithdrawals = withdrawals;
          if (selectedInvestor !== 'all') {
            filteredWithdrawals = withdrawals.filter(w => w.investor_id === selectedInvestor);
          }

          headers = ['Request Date', 'Investor Code', 'Fund Plan', 'Amount', 'Type', 'Status', 'Processed Date'];
          data = filteredWithdrawals.map(w => {
            const investor = investors.find(i => i.id === w.investor_id);
            const plan = fundPlans.find(p => p.id === w.fund_plan_id);
            return [
              new Date(w.created_date).toLocaleDateString('en-IN'),
              investor?.investor_code || 'N/A',
              plan?.plan_name || 'N/A',
              `₹${(w.withdrawal_amount || 0).toLocaleString('en-IN')}`,
              w.withdrawal_type,
              w.status,
              w.processed_date ? new Date(w.processed_date).toLocaleDateString('en-IN') : 'Pending'
            ];
          });
          filename = `withdrawals_${startDate}_to_${endDate}.csv`;
          break;

        case 'payouts':
          await delay(500);
          const payouts = await FundPayoutRequest.filter({
            created_date: { $gte: startDate, $lte: endDate }
          }).catch(() => []);

          let filteredPayouts = payouts;
          if (selectedInvestor !== 'all') {
            filteredPayouts = payouts.filter(p => p.investor_id === selectedInvestor);
          }

          headers = ['Request Date', 'Investor Code', 'Amount', 'Bank Account', 'Status', 'Processed Date'];
          data = filteredPayouts.map(p => {
            const investor = investors.find(i => i.id === p.investor_id);
            return [
              new Date(p.created_date).toLocaleDateString('en-IN'),
              investor?.investor_code || 'N/A',
              `₹${(p.requested_amount || 0).toLocaleString('en-IN')}`,
              p.bank_account_number || 'N/A',
              p.status,
              p.processed_date ? new Date(p.processed_date).toLocaleDateString('en-IN') : 'Pending'
            ];
          });
          filename = `payouts_${startDate}_to_${endDate}.csv`;
          break;

        default:
          toast.error('Invalid report type');
          setIsGenerating(false);
          return;
      }

      // Generate CSV
      const csvContent = [
        headers.join(','),
        ...data.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();

      toast.success('Report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <FundManagerLayout currentView="reports">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
        </div>
      </FundManagerLayout>
    );
  }

  return (
    <FundManagerLayout currentView="reports">
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-600 mt-1">Generate detailed reports for analysis</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/FundManager')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-700 font-medium">Total Investors</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.totalInvestors}</p>
                </div>
                <Users className="w-12 h-12 text-blue-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 font-medium">Total AUM</p>
                  <p className="text-3xl font-bold text-green-900 mt-2">₹{(stats.totalAUM / 100000).toFixed(2)}L</p>
                </div>
                <DollarSign className="w-12 h-12 text-green-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-700 font-medium">Active Plans</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.totalPlans}</p>
                </div>
                <TrendingUp className="w-12 h-12 text-purple-600 opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">Transactions</p>
                  <p className="text-3xl font-bold text-orange-900 mt-2">{stats.totalTransactions}</p>
                </div>
                <FileText className="w-12 h-12 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Report Generation Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Report Type */}
            <div>
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transactions">Complete Transactions</SelectItem>
                  <SelectItem value="investor_summary">Investor Summary</SelectItem>
                  <SelectItem value="fund_performance">Fund Performance</SelectItem>
                  <SelectItem value="withdrawals">Withdrawals Report</SelectItem>
                  <SelectItem value="payouts">Payouts Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Start Date
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  End Date
                </Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="selectedInvestor">Filter by Investor (Optional)</Label>
                <Select value={selectedInvestor} onValueChange={setSelectedInvestor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Investors</SelectItem>
                    {investors.map(investor => (
                      <SelectItem key={investor.id} value={investor.id}>
                        {investor.investor_code} - {investor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="selectedPlan">Filter by Fund Plan (Optional)</Label>
                <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Plans</SelectItem>
                    {fundPlans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.plan_code} - {plan.plan_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateReport}
              disabled={isGenerating}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg py-6 shadow-lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Generate & Download Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </FundManagerLayout>
  );
}