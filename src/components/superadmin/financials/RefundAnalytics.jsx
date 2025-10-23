
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, TrendingDown, Clock, CheckCircle, XCircle, AlertCircle, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';

export default function RefundAnalytics({ refunds, permissions }) {
  const refundStats = useMemo(() => {
    const total = refunds.length;
    const pending = refunds.filter(r => r.status === 'pending').length;
    const processed = refunds.filter(r => r.status === 'processed').length;
    const rejected = refunds.filter(r => r.status === 'rejected').length;
    const failed = refunds.filter(r => r.status === 'failed').length;
    
    const totalAmount = refunds
      .filter(r => r.status === 'processed')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0);
    
    const avgProcessingTime = refunds
      .filter(r => r.status === 'processed' && r.processed_date)
      .reduce((sum, r, _, arr) => {
        const created = new Date(r.created_date).getTime();
        const processed = new Date(r.processed_date).getTime();
        const days = (processed - created) / (1000 * 60 * 60 * 24);
        return sum + days / arr.length;
      }, 0);

    // Refunds by type
    const byType = refunds.reduce((acc, r) => {
      const type = r.transaction_type || 'unknown';
      if (!acc[type]) acc[type] = { count: 0, amount: 0 };
      acc[type].count++;
      if (r.status === 'processed') {
        acc[type].amount += r.refund_amount || 0;
      }
      return acc;
    }, {});

    // Refunds by reason
    const byReason = refunds.reduce((acc, r) => {
      const reason = r.reason_category || 'other';
      if (!acc[reason]) acc[reason] = 0;
      acc[reason]++;
      return acc;
    }, {});

    // Monthly trend
    const monthlyData = refunds.reduce((acc, r) => {
      const month = format(new Date(r.created_date), 'MMM yyyy');
      if (!acc[month]) acc[month] = { month, count: 0, amount: 0 };
      acc[month].count++;
      if (r.status === 'processed') {
        acc[month].amount += r.refund_amount || 0;
      }
      return acc;
    }, {});

    return {
      total,
      pending,
      processed,
      rejected,
      failed,
      totalAmount,
      avgProcessingTime: Math.round(avgProcessingTime),
      byType: Object.entries(byType).map(([name, data]) => ({ name, ...data })),
      byReason: Object.entries(byReason).map(([name, value]) => ({ name, value })),
      monthlyTrend: Object.values(monthlyData).sort((a, b) => 
        new Date(a.month) - new Date(b.month)
      )
    };
  }, [refunds]);

  const COLORS = {
    subscription: '#3B82F6',
    event_ticket: '#8B5CF6',
    course_enrollment: '#10B981',
    advisor_subscription: '#F59E0B',
    pledge_payment: '#EF4444',
    wallet_topup: '#6B7280'
  };

  const REASON_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6B7280'];

  const getTypeLabel = (type) => {
    const labels = {
      subscription: 'Platform Subscription',
      event_ticket: 'Event Tickets',
      course_enrollment: 'Course Enrollments',
      advisor_subscription: 'Advisor Subscriptions',
      pledge_payment: 'Pledge Payments',
      wallet_topup: 'Wallet Top-ups'
    };
    return labels[type] || type;
  };

  const getReasonLabel = (reason) => {
    const labels = {
      cancelled_service: 'Service Cancelled',
      poor_quality: 'Poor Quality',
      technical_issue: 'Technical Issue',
      not_satisfied: 'Not Satisfied',
      duplicate_payment: 'Duplicate Payment',
      fraudulent: 'Fraudulent',
      other: 'Other'
    };
    return labels[reason] || reason;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-600 font-medium">Total Refunds</p>
                <p className="text-3xl font-bold text-orange-900 mt-1">{refundStats.total}</p>
                <p className="text-xs text-orange-600 mt-1">All time</p>
              </div>
              <RotateCcw className="w-10 h-10 text-orange-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{refundStats.pending}</p>
                <p className="text-xs text-yellow-600 mt-1">Awaiting action</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Processed</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{refundStats.processed}</p>
                <p className="text-xs text-green-600 mt-1">Successfully refunded</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Refunded</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">₹{refundStats.totalAmount.toLocaleString()}</p>
                <p className="text-xs text-purple-600 mt-1">Avg: {refundStats.avgProcessingTime} days</p>
              </div>
              <TrendingDown className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Refunds by Transaction Type */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-orange-600" />
              Refunds by Transaction Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={refundStats.byType}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, count }) => `${getTypeLabel(name).split(' ')[0]}: ${count}`}
                >
                  {refundStats.byType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.wallet_topup} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [
                  `${value} refunds (₹${props.payload.amount.toLocaleString()})`,
                  getTypeLabel(props.payload.name)
                ]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Refunds by Reason */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              Refund Reasons
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={refundStats.byReason}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tickFormatter={getReasonLabel} angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value, name, props) => [value, getReasonLabel(props.payload.name)]} />
                <Bar dataKey="value" name="Count">
                  {refundStats.byReason.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Refund Trend */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Monthly Refund Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={refundStats.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="count" stroke="#F59E0B" strokeWidth={3} name="Refund Count" />
              <Line yAxisId="right" type="monotone" dataKey="amount" stroke="#EF4444" strokeWidth={3} name="Refund Amount (₹)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Refunds Table */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Recent Refund Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {refunds.slice(0, 10).map((refund) => (
                  <tr key={refund.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {format(new Date(refund.created_date), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {refund.user_name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {getTypeLabel(refund.transaction_type)}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      ₹{refund.refund_amount?.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={
                        refund.status === 'processed' ? 'bg-green-100 text-green-800' :
                        refund.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        refund.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {getReasonLabel(refund.reason_category)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
