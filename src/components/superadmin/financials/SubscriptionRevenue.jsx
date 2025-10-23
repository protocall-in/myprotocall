import React, { useMemo } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
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
  Cell
} from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444'];

export default function SubscriptionRevenue({ subscriptionTransactions, subscriptionPlans, promoCodes }) {

  const analytics = useMemo(() => {
    const byPlan = subscriptionPlans.reduce((acc, plan) => {
      acc[plan.name] = { name: plan.name, gross: 0, discounts: 0, net: 0, count: 0 };
      return acc;
    }, {});

    subscriptionTransactions.forEach(tx => {
      if (byPlan[tx.plan_name]) {
        byPlan[tx.plan_name].gross += tx.gross_amount;
        byPlan[tx.plan_name].discounts += tx.discount_amount;
        byPlan[tx.plan_name].net += tx.net_amount;
        byPlan[tx.plan_name].count++;
      }
    });

    const monthlyData = {};
    subscriptionTransactions.forEach(tx => {
        const month = format(new Date(tx.created_date), 'MMM yyyy');
        if (!monthlyData[month]) {
            monthlyData[month] = { month, revenue: 0, discounts: 0 };
        }
        monthlyData[month].revenue += tx.net_amount;
        monthlyData[month].discounts += tx.discount_amount;
    });

    return {
      planBreakdown: Object.values(byPlan),
      monthlyTrend: Object.values(monthlyData).sort((a,b) => new Date(a.month) - new Date(b.month))
    };
  }, [subscriptionTransactions, subscriptionPlans]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Subscription Revenue</CardTitle>
          <CardDescription>Analytics on revenue generated from platform subscription plans like Premium and VIP.</CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.planBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="gross" fill="#3B82F6" name="Gross" />
                <Bar dataKey="discounts" fill="#EF4444" name="Discounts" />
                <Bar dataKey="net" fill="#10B981" name="Net" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Count by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.planBreakdown}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ name, count }) => `${name}: ${count}`}
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
    </div>
  );
}