import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, Users, DollarSign, Percent, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function SubscriptionAnalytics({ promoCodes }) {
  const analytics = useMemo(() => {
    // Sample data - in real app, this would come from SubscriptionTransaction entity
    const sampleSubscriptions = [
      { plan: 'Premium', gross: 50000, discount: 5000, net: 45000, count: 100 },
      { plan: 'VIP', gross: 30000, discount: 2000, net: 28000, count: 30 },
      { plan: 'Free', gross: 0, discount: 0, net: 0, count: 500 },
    ];

    const totalGross = sampleSubscriptions.reduce((sum, s) => sum + s.gross, 0);
    const totalDiscount = sampleSubscriptions.reduce((sum, s) => sum + s.discount, 0);
    const totalNet = sampleSubscriptions.reduce((sum, s) => sum + s.net, 0);
    const totalSubscribers = sampleSubscriptions.reduce((sum, s) => sum + s.count, 0);

    // Monthly trend data
    const monthlyTrend = [
      { month: 'Jan', revenue: 65000, subscribers: 580 },
      { month: 'Feb', revenue: 72000, subscribers: 620 },
      { month: 'Mar', revenue: 68000, subscribers: 650 },
      { month: 'Apr', revenue: 75000, subscribers: 680 },
      { month: 'May', revenue: 73000, subscribers: 630 },
      { month: 'Jun', revenue: 80000, subscribers: 710 },
    ];

    // Promo code analytics - now properly using promoCodes prop
    const promoAnalytics = promoCodes?.map(promo => ({
      code: promo.code,
      usage: promo.current_usage || 0,
      limit: promo.usage_limit || 0,
      discount: promo.discount_value,
      type: promo.discount_type,
      revenue_impact: (promo.current_usage || 0) * (promo.discount_type === 'flat' ? promo.discount_value : 500), // Sample calculation
      utilization: promo.usage_limit ? ((promo.current_usage || 0) / promo.usage_limit) * 100 : 0
    })) || [];

    return {
      summary: {
        totalGross,
        totalDiscount,
        totalNet,
        totalSubscribers,
        avgDiscountPercent: totalGross > 0 ? (totalDiscount / totalGross) * 100 : 0
      },
      planBreakdown: sampleSubscriptions,
      monthlyTrend,
      promoAnalytics
    };
  }, [promoCodes]); // Fixed: Removed 'plans' from dependency array since it's not used

  const exportFinancials = () => {
    // Generate CSV export
    const csvData = [
      ['Plan', 'Gross Revenue', 'Discounts Applied', 'Net Revenue', 'Subscribers'],
      ...analytics.planBreakdown.map(plan => [
        plan.plan,
        `₹${plan.gross.toLocaleString()}`,
        `₹${plan.discount.toLocaleString()}`,
        `₹${plan.net.toLocaleString()}`,
        plan.count
      ])
    ];

    const csv = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Subscribers</p>
                <p className="text-3xl font-bold">{analytics.summary.totalSubscribers.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Gross Revenue</p>
                <p className="text-3xl font-bold">₹{(analytics.summary.totalGross / 1000).toFixed(0)}k</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Net Revenue</p>
                <p className="text-3xl font-bold">₹{(analytics.summary.totalNet / 1000).toFixed(0)}k</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Avg Discount</p>
                <p className="text-3xl font-bold">{analytics.summary.avgDiscountPercent.toFixed(1)}%</p>
              </div>
              <Percent className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <Card className="shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Financial Analytics Dashboard</CardTitle>
          <Button onClick={exportFinancials} className="bg-blue-600 hover:bg-blue-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </CardHeader>
      </Card>

      {/* Revenue Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plan Revenue Breakdown */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.planBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Bar dataKey="gross" fill="#3B82F6" name="Gross Revenue" />
                <Bar dataKey="discount" fill="#EF4444" name="Discounts" />
                <Bar dataKey="net" fill="#10B981" name="Net Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subscriber Distribution */}
        <Card className="shadow-lg border-0">
          <CardHeader>
            <CardTitle>Subscriber Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.planBreakdown}
                  dataKey="count"
                  nameKey="plan"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ plan, count, percent }) => `${plan}: ${count} (${(percent * 100).toFixed(0)}%)`}
                >
                  {analytics.planBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Monthly Revenue Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={analytics.monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="revenue" orientation="left" />
              <YAxis yAxisId="subscribers" orientation="right" />
              <Tooltip />
              <Legend />
              <Line
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#10B981"
                strokeWidth={3}
                name="Revenue (₹)"
              />
              <Line
                yAxisId="subscribers"
                type="monotone"
                dataKey="subscribers"
                stroke="#3B82F6"
                strokeWidth={3}
                name="Subscribers"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Promo Code Analytics */}
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle>Promo Code Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Promo Code</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Utilization</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Revenue Impact</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {analytics.promoAnalytics.map((promo, index) => (
                  <tr key={index} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-4 py-4 font-medium">{promo.code}</td>
                    <td className="px-4 py-4">{promo.usage} / {promo.limit || '∞'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(promo.utilization, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{promo.utilization.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {promo.type === 'flat' ? `₹${promo.discount}` : `${promo.discount}%`}
                    </td>
                    <td className="px-4 py-4 text-red-600">
                      -₹{promo.revenue_impact.toLocaleString()}
                    </td>
                    <td className="px-4 py-4">
                      <Badge
                        variant={promo.utilization >= 100 ? 'destructive' : promo.utilization >= 80 ? 'secondary' : 'default'}
                      >
                        {promo.utilization >= 100 ? 'Exhausted' : promo.utilization >= 80 ? 'High Usage' : 'Active'}
                      </Badge>
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