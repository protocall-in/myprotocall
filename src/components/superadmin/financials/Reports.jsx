import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2
} from 'lucide-react';
import { 
  SubscriptionTransaction, 
  Expense, 
  RevenueTransaction, 
  CommissionTracking,
  EventCommissionTracking,
  AdTransaction,
  User
} from '@/api/entities';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

export default function Reports() {
  const [reportType, setReportType] = useState('monthly_summary');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), i);
    return {
      value: format(date, 'yyyy-MM'),
      label: format(date, 'MMMM yyyy')
    };
  });

  useEffect(() => {
    loadReportData();
  }, [selectedMonth]);

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Parse selected month
      const [year, month] = selectedMonth.split('-');
      const monthStart = startOfMonth(new Date(parseInt(year), parseInt(month) - 1));
      const monthEnd = endOfMonth(monthStart);

      // Fetch all financial data
      const [
        subscriptionTransactions,
        expenses,
        revenueTransactions,
        advisorCommissions,
        eventCommissions,
        adTransactions,
        users
      ] = await Promise.all([
        SubscriptionTransaction.list().catch(() => []),
        Expense.list().catch(() => []),
        RevenueTransaction.list().catch(() => []),
        CommissionTracking.list().catch(() => []),
        EventCommissionTracking.list().catch(() => []),
        AdTransaction.list().catch(() => []),
        User.list().catch(() => [])
      ]);

      // Filter data for selected month
      const filterByMonth = (items, dateField = 'created_date') => {
        return items.filter(item => {
          const itemDate = new Date(item[dateField]);
          return itemDate >= monthStart && itemDate <= monthEnd;
        });
      };

      const monthlySubscriptions = filterByMonth(subscriptionTransactions);
      const monthlyExpenses = filterByMonth(expenses, 'expense_date');
      const monthlyRevenue = filterByMonth(revenueTransactions);
      const monthlyAdvisorCommissions = filterByMonth(advisorCommissions);
      const monthlyEventCommissions = filterByMonth(eventCommissions);
      const monthlyAdTransactions = filterByMonth(adTransactions);

      // Calculate metrics
      const subscriptionRevenue = monthlySubscriptions.reduce((sum, t) => sum + (t.net_amount || 0), 0);
      const courseRevenue = monthlyRevenue.reduce((sum, t) => sum + (t.gross_amount || 0), 0);
      const adRevenue = monthlyAdTransactions
        .filter(t => t.transaction_type !== 'cpc_spend')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
      const totalExpenses = monthlyExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      
      const totalGrossRevenue = subscriptionRevenue + courseRevenue + adRevenue;
      const totalNetRevenue = subscriptionRevenue + 
        monthlyRevenue.reduce((sum, t) => sum + (t.influencer_payout || 0), 0) +
        adRevenue;
      const netProfit = totalNetRevenue - totalExpenses;

      // Revenue breakdown
      const revenueBreakdown = [
        { name: 'Subscriptions', value: subscriptionRevenue },
        { name: 'Courses', value: courseRevenue },
        { name: 'Ad Revenue', value: adRevenue }
      ].filter(item => item.value > 0);

      // Expense breakdown
      const expenseBreakdown = monthlyExpenses.reduce((acc, expense) => {
        const category = expense.category || 'Miscellaneous';
        acc[category] = (acc[category] || 0) + expense.amount;
        return acc;
      }, {});

      const expenseChartData = Object.entries(expenseBreakdown).map(([name, value]) => ({
        name,
        value
      }));

      // User growth
      const newUsers = users.filter(u => {
        const createdDate = new Date(u.created_date);
        return createdDate >= monthStart && createdDate <= monthEnd;
      }).length;

      // Commission data
      const advisorCommissionTotal = monthlyAdvisorCommissions.reduce((sum, c) => sum + (c.platform_fee || 0), 0);
      const eventCommissionTotal = monthlyEventCommissions.reduce((sum, c) => sum + (c.platform_commission || 0), 0);

      setReportData({
        month: format(monthStart, 'MMMM yyyy'),
        summary: {
          totalGrossRevenue,
          totalNetRevenue,
          totalExpenses,
          netProfit,
          profitMargin: totalNetRevenue > 0 ? ((netProfit / totalNetRevenue) * 100).toFixed(2) : 0
        },
        revenue: {
          subscriptions: subscriptionRevenue,
          courses: courseRevenue,
          ads: adRevenue,
          breakdown: revenueBreakdown
        },
        expenses: {
          total: totalExpenses,
          breakdown: expenseChartData
        },
        users: {
          newUsers,
          totalUsers: users.length
        },
        commissions: {
          advisor: advisorCommissionTotal,
          event: eventCommissionTotal,
          total: advisorCommissionTotal + eventCommissionTotal
        },
        transactions: {
          subscriptionCount: monthlySubscriptions.length,
          courseCount: monthlyRevenue.length,
          adCount: monthlyAdTransactions.length
        }
      });

    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    
    // Simulate report generation
    setTimeout(() => {
      const reportContent = generateReportContent();
      downloadReport(reportContent);
      setIsGenerating(false);
    }, 1500);
  };

  const generateReportContent = () => {
    if (!reportData) return '';

    return `
FINANCIAL REPORT - ${reportData.month}
${'='.repeat(50)}

SUMMARY
-------
Total Gross Revenue: ₹${reportData.summary.totalGrossRevenue.toLocaleString()}
Total Net Revenue: ₹${reportData.summary.totalNetRevenue.toLocaleString()}
Total Expenses: ₹${reportData.summary.totalExpenses.toLocaleString()}
Net Profit: ₹${reportData.summary.netProfit.toLocaleString()}
Profit Margin: ${reportData.summary.profitMargin}%

REVENUE BREAKDOWN
-----------------
Subscriptions: ₹${reportData.revenue.subscriptions.toLocaleString()}
Courses: ₹${reportData.revenue.courses.toLocaleString()}
Ad Revenue: ₹${reportData.revenue.ads.toLocaleString()}

EXPENSES
--------
Total Expenses: ₹${reportData.expenses.total.toLocaleString()}

${reportData.expenses.breakdown.map(item => 
  `${item.name}: ₹${item.value.toLocaleString()}`
).join('\n')}

USER METRICS
------------
New Users: ${reportData.users.newUsers}
Total Users: ${reportData.users.totalUsers}

COMMISSIONS
-----------
Advisor Commissions: ₹${reportData.commissions.advisor.toLocaleString()}
Event Commissions: ₹${reportData.commissions.event.toLocaleString()}
Total Commission Earned: ₹${reportData.commissions.total.toLocaleString()}

TRANSACTIONS
------------
Subscription Transactions: ${reportData.transactions.subscriptionCount}
Course Enrollments: ${reportData.transactions.courseCount}
Ad Transactions: ${reportData.transactions.adCount}

Generated on: ${format(new Date(), 'PPpp')}
    `.trim();
  };

  const downloadReport = (content) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial-report-${selectedMonth}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No financial data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Financial Reports
          </CardTitle>
          <CardDescription>
            Generate and download detailed financial reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Report Type</label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly_summary">Monthly Summary</SelectItem>
                  <SelectItem value="revenue_analysis">Revenue Analysis</SelectItem>
                  <SelectItem value="expense_analysis">Expense Analysis</SelectItem>
                  <SelectItem value="commission_report">Commission Report</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Select Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Gross Revenue</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  ₹{(reportData.summary.totalGrossRevenue / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="p-3 bg-blue-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Net Profit</p>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  ₹{(reportData.summary.netProfit / 1000).toFixed(1)}k
                </p>
              </div>
              <div className="p-3 bg-green-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Profit Margin</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">
                  {reportData.summary.profitMargin}%
                </p>
              </div>
              <div className="p-3 bg-purple-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-50 to-orange-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">New Users</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">
                  {reportData.users.newUsers}
                </p>
              </div>
              <div className="p-3 bg-orange-500 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Revenue Breakdown</CardTitle>
            <CardDescription>Sources of income for {reportData.month}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reportData.revenue.breakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {reportData.revenue.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Spending categories for {reportData.month}</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.expenses.breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Detailed Metrics - {reportData.month}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Revenue Sources</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subscriptions:</span>
                  <span className="font-medium">₹{reportData.revenue.subscriptions.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Course Revenue:</span>
                  <span className="font-medium">₹{reportData.revenue.courses.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ad Revenue:</span>
                  <span className="font-medium">₹{reportData.revenue.ads.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Commission Earned</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Advisor Commissions:</span>
                  <span className="font-medium">₹{reportData.commissions.advisor.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Event Commissions:</span>
                  <span className="font-medium">₹{reportData.commissions.event.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-gray-700">Total:</span>
                  <span>₹{reportData.commissions.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-3">Transaction Volume</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subscriptions:</span>
                  <span className="font-medium">{reportData.transactions.subscriptionCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Course Enrollments:</span>
                  <span className="font-medium">{reportData.transactions.courseCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Ad Transactions:</span>
                  <span className="font-medium">{reportData.transactions.adCount}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}