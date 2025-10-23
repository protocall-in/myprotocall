import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Download, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Receipt,
  Wallet,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { 
  RevenueTransaction, 
  CommissionTracking, 
  EventCommissionTracking,
  PayoutRequest,
  CourseEnrollment,
  Course,
  AdvisorSubscription,
  EventTicket,
  Event
} from '@/api/entities';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { toast } from 'sonner';

export default function FinancialStatement({ entityType, entityId, entityName }) {
  const [selectedPeriod, setSelectedPeriod] = useState('current_month');
  const [statementData, setStatementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate period options
  const periodOptions = [
    { value: 'current_month', label: 'Current Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'last_3_months', label: 'Last 3 Months' },
    { value: 'last_6_months', label: 'Last 6 Months' },
    { value: 'ytd', label: 'Year to Date' },
    { value: 'all_time', label: 'All Time' }
  ];

  useEffect(() => {
    loadStatementData();
  }, [selectedPeriod, entityId]);

  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;

    switch (selectedPeriod) {
      case 'current_month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'last_month':
        const lastMonth = subMonths(now, 1);
        startDate = startOfMonth(lastMonth);
        endDate = endOfMonth(lastMonth);
        break;
      case 'last_3_months':
        startDate = startOfMonth(subMonths(now, 3));
        endDate = endOfMonth(now);
        break;
      case 'last_6_months':
        startDate = startOfMonth(subMonths(now, 6));
        endDate = endOfMonth(now);
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = now;
        break;
      case 'all_time':
        startDate = new Date(2020, 0, 1); // Platform inception
        endDate = now;
        break;
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
    }

    return { startDate, endDate };
  };

  const loadStatementData = async () => {
    setIsLoading(true);
    try {
      const { startDate, endDate } = getDateRange();

      let earnings = [];
      let commissions = [];
      let payouts = [];
      let grossRevenue = 0;
      let platformCommission = 0;
      let netEarnings = 0;

      if (entityType === 'finfluencer') {
        // Fetch course revenue transactions
        const revenueTransactions = await RevenueTransaction.filter({ 
          influencer_id: entityId 
        }).catch(() => []);

        const filteredTransactions = revenueTransactions.filter(t => {
          const date = new Date(t.created_date);
          return date >= startDate && date <= endDate;
        });

        // Fetch courses for details
        const courses = await Course.filter({ influencer_id: entityId }).catch(() => []);
        const courseMap = {};
        courses.forEach(c => courseMap[c.id] = c);

        earnings = filteredTransactions.map(t => ({
          date: t.created_date,
          description: `Course: ${courseMap[t.course_id]?.title || 'Unknown'}`,
          grossAmount: t.gross_amount || 0,
          commission: t.platform_commission || 0,
          netAmount: t.influencer_payout || 0,
          type: 'Course Sale'
        }));

        grossRevenue = filteredTransactions.reduce((sum, t) => sum + (t.gross_amount || 0), 0);
        platformCommission = filteredTransactions.reduce((sum, t) => sum + (t.platform_commission || 0), 0);
        netEarnings = filteredTransactions.reduce((sum, t) => sum + (t.influencer_payout || 0), 0);

        // Fetch event commission earnings
        const eventCommissions = await EventCommissionTracking.filter({
          organizer_id: entityId
        }).catch(() => []);

        const filteredEventCommissions = eventCommissions.filter(c => {
          const date = new Date(c.created_date);
          return date >= startDate && date <= endDate;
        });

        const events = await Event.list().catch(() => []);
        const eventMap = {};
        events.forEach(e => eventMap[e.id] = e);

        const eventEarnings = filteredEventCommissions.map(c => ({
          date: c.created_date,
          description: `Event: ${eventMap[c.event_id]?.title || 'Unknown'}`,
          grossAmount: c.gross_revenue || 0,
          commission: c.platform_commission || 0,
          netAmount: c.organizer_payout || 0,
          type: 'Event Revenue'
        }));

        earnings = [...earnings, ...eventEarnings];
        grossRevenue += filteredEventCommissions.reduce((sum, c) => sum + (c.gross_revenue || 0), 0);
        platformCommission += filteredEventCommissions.reduce((sum, c) => sum + (c.platform_commission || 0), 0);
        netEarnings += filteredEventCommissions.reduce((sum, c) => sum + (c.organizer_payout || 0), 0);

      } else if (entityType === 'advisor') {
        // Fetch advisor commission tracking
        const commissionTransactions = await CommissionTracking.filter({ 
          advisor_id: entityId 
        }).catch(() => []);

        const filteredCommissions = commissionTransactions.filter(c => {
          const date = new Date(c.transaction_date);
          return date >= startDate && date <= endDate;
        });

        earnings = filteredCommissions.map(c => ({
          date: c.transaction_date,
          description: `Subscription Income`,
          grossAmount: c.gross_amount || 0,
          commission: c.platform_fee || 0,
          netAmount: c.advisor_payout || 0,
          type: 'Subscription'
        }));

        grossRevenue = filteredCommissions.reduce((sum, c) => sum + (c.gross_amount || 0), 0);
        platformCommission = filteredCommissions.reduce((sum, c) => sum + (c.platform_fee || 0), 0);
        netEarnings = filteredCommissions.reduce((sum, c) => sum + (c.advisor_payout || 0), 0);

      } else if (entityType === 'vendor') {
        // Fetch vendor ad transactions
        const { CampaignBilling } = await import('@/api/entities');
        const billings = await CampaignBilling.filter({ 
          vendor_id: entityId 
        }).catch(() => []);

        const filteredBillings = billings.filter(b => {
          const date = new Date(b.created_date);
          return date >= startDate && date <= endDate;
        });

        earnings = filteredBillings.map(b => ({
          date: b.created_date,
          description: `Ad Campaign Billing - ${b.billing_model?.toUpperCase()}`,
          grossAmount: b.amount || 0,
          commission: 0,
          netAmount: b.amount || 0,
          type: 'Ad Spend',
          paymentStatus: b.payment_status
        }));

        grossRevenue = filteredBillings.reduce((sum, b) => sum + (b.amount || 0), 0);
        netEarnings = grossRevenue; // For vendors, it's spend, not earnings
      }

      // Fetch payout requests
      const allPayouts = await PayoutRequest.filter({ 
        entity_id: entityId,
        entity_type: entityType 
      }).catch(() => []);

      const filteredPayouts = allPayouts.filter(p => {
        const date = new Date(p.created_date);
        return date >= startDate && date <= endDate;
      });

      payouts = filteredPayouts.map(p => ({
        date: p.created_date,
        amount: p.requested_amount,
        status: p.status,
        processedDate: p.processed_date,
        method: p.payout_method,
        reference: p.transaction_reference
      }));

      const totalPayouts = filteredPayouts
        .filter(p => p.status === 'processed')
        .reduce((sum, p) => sum + (p.requested_amount || 0), 0);

      const pendingPayouts = filteredPayouts
        .filter(p => ['pending', 'approved'].includes(p.status))
        .reduce((sum, p) => sum + (p.requested_amount || 0), 0);

      setStatementData({
        period: periodOptions.find(p => p.value === selectedPeriod)?.label,
        dateRange: { startDate, endDate },
        summary: {
          grossRevenue,
          platformCommission,
          netEarnings,
          totalPayouts,
          pendingPayouts,
          availableBalance: netEarnings - totalPayouts - pendingPayouts
        },
        earnings,
        payouts
      });

    } catch (error) {
      console.error('Error loading financial statement:', error);
      toast.error('Failed to load financial statement');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadStatement = (format = 'csv') => {
    if (!statementData) {
      toast.error('No data to download');
      return;
    }

    if (format === 'csv') {
      downloadCSV();
    } else {
      downloadPDF();
    }
  };

  const downloadCSV = () => {
    const { summary, earnings, payouts, period, dateRange } = statementData;

    let csvContent = `Financial Statement - ${entityName}\n`;
    csvContent += `Period: ${period}\n`;
    csvContent += `Date Range: ${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}\n\n`;

    csvContent += `SUMMARY\n`;
    csvContent += `Gross Revenue,${summary.grossRevenue.toFixed(2)}\n`;
    csvContent += `Platform Commission,${summary.platformCommission.toFixed(2)}\n`;
    csvContent += `Net Earnings,${summary.netEarnings.toFixed(2)}\n`;
    csvContent += `Total Payouts,${summary.totalPayouts.toFixed(2)}\n`;
    csvContent += `Pending Payouts,${summary.pendingPayouts.toFixed(2)}\n`;
    csvContent += `Available Balance,${summary.availableBalance.toFixed(2)}\n\n`;

    csvContent += `EARNINGS\n`;
    csvContent += `Date,Description,Type,Gross Amount,Commission,Net Amount\n`;
    earnings.forEach(e => {
      csvContent += `${format(new Date(e.date), 'yyyy-MM-dd')},${e.description},${e.type},${e.grossAmount.toFixed(2)},${e.commission.toFixed(2)},${e.netAmount.toFixed(2)}\n`;
    });

    csvContent += `\nPAYOUTS\n`;
    csvContent += `Date,Amount,Status,Method,Processed Date,Reference\n`;
    payouts.forEach(p => {
      csvContent += `${format(new Date(p.date), 'yyyy-MM-dd')},${p.amount.toFixed(2)},${p.status},${p.method || 'N/A'},${p.processedDate ? format(new Date(p.processedDate), 'yyyy-MM-dd') : 'N/A'},${p.reference || 'N/A'}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `financial_statement_${entityName}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success('Statement downloaded successfully');
  };

  const downloadPDF = () => {
    // Create a printable HTML version
    const printWindow = window.open('', '_blank');
    const { summary, earnings, payouts, period, dateRange } = statementData;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Financial Statement - ${entityName}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #4b5563; margin-top: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
          .header { margin-bottom: 30px; }
          .summary { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .summary-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #d1d5db; }
          .summary-row:last-child { border-bottom: 2px solid #2563eb; font-weight: bold; }
          .label { font-weight: 600; }
          .value { text-align: right; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th { background: #2563eb; color: white; padding: 12px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9fafb; }
          .status-badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .status-processed { background: #d1fae5; color: #065f46; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .footer { margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px; }
          @media print {
            body { margin: 20px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Financial Statement</h1>
          <p><strong>${entityName}</strong></p>
          <p>Period: ${period}</p>
          <p>Date Range: ${format(dateRange.startDate, 'MMM dd, yyyy')} - ${format(dateRange.endDate, 'MMM dd, yyyy')}</p>
          <p>Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}</p>
        </div>

        <div class="summary">
          <h2>Financial Summary</h2>
          <div class="summary-row">
            <span class="label">Gross Revenue:</span>
            <span class="value">₹${summary.grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span class="label">Platform Commission:</span>
            <span class="value">-₹${summary.platformCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span class="label">Net Earnings:</span>
            <span class="value">₹${summary.netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span class="label">Total Payouts:</span>
            <span class="value">-₹${summary.totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span class="label">Pending Payouts:</span>
            <span class="value">-₹${summary.pendingPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
          <div class="summary-row">
            <span class="label">Available Balance:</span>
            <span class="value">₹${summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <h2>Earnings Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Gross Amount</th>
              <th>Commission</th>
              <th>Net Amount</th>
            </tr>
          </thead>
          <tbody>
            ${earnings.length > 0 ? earnings.map(e => `
              <tr>
                <td>${format(new Date(e.date), 'MMM dd, yyyy')}</td>
                <td>${e.description}</td>
                <td>${e.type}</td>
                <td>₹${e.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>₹${e.commission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td>₹${e.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No earnings in this period</td></tr>'}
          </tbody>
        </table>

        <h2>Payout History</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Method</th>
              <th>Processed Date</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            ${payouts.length > 0 ? payouts.map(p => `
              <tr>
                <td>${format(new Date(p.date), 'MMM dd, yyyy')}</td>
                <td>₹${p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                <td><span class="status-badge status-${p.status}">${p.status.toUpperCase()}</span></td>
                <td>${p.method || 'N/A'}</td>
                <td>${p.processedDate ? format(new Date(p.processedDate), 'MMM dd, yyyy') : 'N/A'}</td>
                <td>${p.reference || 'N/A'}</td>
              </tr>
            `).join('') : '<tr><td colspan="6" style="text-align:center; color:#6b7280;">No payouts in this period</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <p>This is a computer-generated statement and does not require a signature.</p>
          <p>&copy; ${new Date().getFullYear()} Protocol. All rights reserved.</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px;">Print / Save as PDF</button>
          <button onclick="window.close()" style="padding: 10px 20px; background: #6b7280; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; margin-left: 10px;">Close</button>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    toast.success('Statement opened in new window');
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading financial statement...</p>
        </CardContent>
      </Card>
    );
  }

  if (!statementData) {
    return (
      <Card className="shadow-lg">
        <CardContent className="p-8 text-center">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-600">No financial data available</p>
        </CardContent>
      </Card>
    );
  }

  const { summary, earnings, payouts, period, dateRange } = statementData;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="w-6 h-6 text-blue-600" />
                Financial Statement
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">
                {format(dateRange.startDate, 'MMM dd, yyyy')} - {format(dateRange.endDate, 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => downloadStatement('csv')} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button onClick={() => downloadStatement('pdf')} className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600">
                <Download className="w-4 h-4" />
                PDF
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Gross Revenue</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{summary.grossRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Platform Commission</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{summary.platformCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-orange-100 rounded-xl">
                <Receipt className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Net Earnings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{summary.netEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Payouts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{summary.totalPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Pending Payouts</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  ₹{summary.pendingPayouts.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-700 font-medium">Available Balance</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">
                  ₹{summary.availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-emerald-200 rounded-xl">
                <Wallet className="w-6 h-6 text-emerald-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Earnings Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Earnings Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Description</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Type</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">Gross</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">Commission</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">Net</th>
                </tr>
              </thead>
              <tbody>
                {earnings.length > 0 ? (
                  earnings.map((earning, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-600">
                        {format(new Date(earning.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-3 text-sm text-slate-900">{earning.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">
                          {earning.type}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-right text-slate-900">
                        ₹{earning.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-right text-orange-600">
                        ₹{earning.commission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3 text-sm text-right font-semibold text-green-600">
                        ₹{earning.netAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No earnings in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payouts Table */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Payout History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Date</th>
                  <th className="text-right p-3 text-sm font-semibold text-slate-600">Amount</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Method</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Processed</th>
                  <th className="text-left p-3 text-sm font-semibold text-slate-600">Reference</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length > 0 ? (
                  payouts.map((payout, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-3 text-sm text-slate-600">
                        {format(new Date(payout.date), 'MMM dd, yyyy')}
                      </td>
                      <td className="p-3 text-sm text-right font-semibold text-slate-900">
                        ₹{payout.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                          payout.status === 'processed' ? 'bg-green-100 text-green-700' :
                          payout.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          payout.status === 'approved' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {payout.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-slate-600">{payout.method || 'N/A'}</td>
                      <td className="p-3 text-sm text-slate-600">
                        {payout.processedDate ? format(new Date(payout.processedDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="p-3 text-sm text-slate-600">{payout.reference || 'N/A'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No payouts in this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}