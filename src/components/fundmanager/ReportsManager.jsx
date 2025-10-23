import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FundAllocation, Investor, FundPlan, FundTransaction } from '@/api/entities';
import { toast } from 'sonner';
import { Loader2, BarChart3, Download, TrendingUp, DollarSign, Users } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Helper to format currency
const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;

export default function ReportsManager() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const processReportData = useCallback((allocations, investors, fundPlans, transactions) => {
    if (!allocations.length || !investors.length) {
      return {
        totalAUM: 0,
        totalPNL: 0,
        investorCount: 0,
        totalProfitPayouts: 0,
        aumGrowth: [],
        planDistribution: [],
        topAllocations: [],
        largestInvestors: []
      };
    }

    // 1. Calculate KPIs
    const totalAUM = allocations.reduce((sum, alloc) => sum + (alloc.current_value || 0), 0);
    const totalInvested = allocations.reduce((sum, alloc) => sum + (alloc.total_invested || 0), 0);
    const totalPNL = totalAUM - totalInvested;
    const investorCount = new Set(allocations.map(a => a.investor_id)).size;

    // Calculate Total Profit Payouts
    const totalProfitPayouts = transactions
      .filter((txn) => txn.transaction_type === 'profit_payout' && txn.status === 'completed')
      .reduce((sum, txn) => sum + (txn.amount || 0), 0);

    // 2. AUM Growth Data (simplified by investment date)
    const monthlyData = {};
    allocations.forEach(alloc => {
      if (alloc.investment_date) {
        const month = new Date(alloc.investment_date).toISOString().slice(0, 7);
        if (!monthlyData[month]) {
          monthlyData[month] = 0;
        }
        monthlyData[month] += alloc.total_invested || 0;
      }
    });

    let cumulativeAUM = 0;
    const aumGrowth = Object.keys(monthlyData).sort().map(month => {
      cumulativeAUM += monthlyData[month];
      return {
        month,
        aum: cumulativeAUM
      };
    });

    // 3. ✅ FIXED: Plan Distribution Data - NOW USES PLAN NAMES AND CODES
    console.log('📊 Processing Plan Distribution with Fund Plans:', fundPlans);
    
    // Create a map of plan IDs to their names and codes
    const planMap = {};
    fundPlans.forEach(plan => {
      planMap[plan.id] = {
        name: plan.plan_name || 'Unnamed Plan',
        code: plan.plan_code || 'N/A'
      };
    });
    
    console.log('📊 Plan Map Created:', planMap);
    
    // Group allocations by plan name
    const planData = {};
    allocations.forEach(alloc => {
      const planInfo = planMap[alloc.fund_plan_id];
      
      // Create a readable name: "Plan Name (CODE)"
      const displayName = planInfo 
        ? `${planInfo.name} (${planInfo.code})` 
        : `Unknown Plan (${alloc.fund_plan_id?.slice(0, 8)})`;
      
      if (!planData[displayName]) {
        planData[displayName] = 0;
      }
      planData[displayName] += alloc.total_invested || 0;
    });
    
    const planDistribution = Object.entries(planData).map(([name, value]) => ({ 
      name, 
      value 
    }));
    
    console.log('📊 Final Plan Distribution:', planDistribution);

    // 4. Top Performing Allocations
    const investorMap = investors.reduce((acc, inv) => ({ ...acc, [inv.id]: inv }), {});
    const topAllocations = [...allocations]
      .sort((a, b) => (b.profit_loss || 0) - (a.profit_loss || 0))
      .slice(0, 5)
      .map(alloc => {
        const planInfo = planMap[alloc.fund_plan_id];
        return {
          ...alloc,
          investorName: investorMap[alloc.investor_id]?.full_name || 'Unknown',
          planName: planInfo ? planInfo.name : 'Unknown'
        };
      });

    // 5. Largest Investors
    const investorInvestment = {};
    allocations.forEach(alloc => {
        if (!investorInvestment[alloc.investor_id]) {
            investorInvestment[alloc.investor_id] = 0;
        }
        investorInvestment[alloc.investor_id] += alloc.total_invested || 0;
    });

    const largestInvestors = Object.keys(investorInvestment)
        .map(investorId => ({
            id: investorId,
            name: investorMap[investorId]?.full_name || 'Unknown',
            totalInvested: investorInvestment[investorId]
        }))
        .sort((a, b) => b.totalInvested - a.totalInvested)
        .slice(0, 5);

    return { totalAUM, totalPNL, investorCount, totalProfitPayouts, aumGrowth, planDistribution, topAllocations, largestInvestors };
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allocations, investors, fundPlans, transactions] = await Promise.all([
        FundAllocation.list(),
        Investor.list(),
        FundPlan.list(),
        FundTransaction.list(),
      ]);
      
      console.log('📊 Loaded Fund Plans for Reports:', fundPlans);
      
      const data = processReportData(allocations, investors, fundPlans, transactions);
      setReportData(data);
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Failed to load report data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  }, [processReportData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full p-12">
        <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">Generating Reports...</p>
        </div>
      </div>
    );
  }

  if (!reportData || reportData.planDistribution.length === 0) {
    return (
        <div className="p-8 space-y-6">
            <Card className="shadow-lg border-0 bg-white">
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-slate-700" />
                    Reporting & Analytics
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex flex-col items-center justify-center h-96 text-center text-slate-500">
                    <BarChart3 className="w-24 h-24 text-slate-300 mb-4" />
                    <h2 className="text-xl font-semibold">No Data to Generate Reports</h2>
                    <p className="mt-2 max-w-md">
                    Once there are investments and allocations, this section will populate with detailed reports.
                    </p>
                </div>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-slate-900">Reporting & Analytics</h1>
        <Button variant="outline" onClick={loadData}>
          <Download className="w-4 h-4 mr-2" />
          Refresh Reports
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total AUM</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(reportData.totalAUM)}</div>
            <p className="text-xs text-muted-foreground">Total Assets Under Management</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${reportData.totalPNL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(reportData.totalPNL)}
            </div>
            <p className="text-xs text-muted-foreground">Total Unrealized Profit & Loss</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.investorCount}</div>
            <p className="text-xs text-muted-foreground">Unique investors with active allocations</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Profit Payouts</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{formatCurrency(reportData.totalProfitPayouts)}</div>
            <p className="text-xs text-purple-600">Lifetime distributed to investors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AUM Growth (YTD)</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+ {formatCurrency(reportData.aumGrowth.reduce((acc, item) => acc + item.aum, 0))}</div>
            <p className="text-xs text-muted-foreground">Based on new investments this year</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>AUM Growth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.aumGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.aumGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="aum" name="Cumulative AUM" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No growth data available
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investment Distribution by Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.planDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie 
                    data={reportData.planDistribution} 
                    dataKey="value" 
                    nameKey="name" 
                    cx="50%" 
                    cy="50%" 
                    outerRadius={100} 
                    label={(entry) => entry.name}
                  >
                    {reportData.planDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                No distribution data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader><CardTitle>Top 5 Performing Allocations</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    {reportData.topAllocations.length > 0 ? (
                      <table className="w-full">
                          <thead>
                              <tr className="border-b">
                                  <th className="py-2 text-left text-sm font-semibold text-slate-600">Investor</th>
                                  <th className="py-2 text-left text-sm font-semibold text-slate-600">Plan</th>
                                  <th className="py-2 text-right text-sm font-semibold text-slate-600">Profit/Loss</th>
                              </tr>
                          </thead>
                          <tbody>
                              {reportData.topAllocations.map(alloc => (
                                  <tr key={alloc.id} className="border-b">
                                      <td className="py-3 text-sm">{alloc.investorName}</td>
                                      <td className="py-3 text-sm">{alloc.planName}</td>
                                      <td className={`py-3 text-right text-sm font-semibold ${alloc.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                          {formatCurrency(alloc.profit_loss)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    ) : (
                      <div className="py-8 text-center text-slate-500">No allocation data available</div>
                    )}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Top 5 Largest Investors</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    {reportData.largestInvestors.length > 0 ? (
                      <table className="w-full">
                          <thead>
                              <tr className="border-b">
                                  <th className="py-2 text-left text-sm font-semibold text-slate-600">Investor</th>
                                  <th className="py-2 text-right text-sm font-semibold text-slate-600">Total Invested</th>
                              </tr>
                          </thead>
                          <tbody>
                              {reportData.largestInvestors.map(inv => (
                                  <tr key={inv.id} className="border-b">
                                      <td className="py-3 text-sm">{inv.name}</td>
                                      <td className="py-3 text-right text-sm font-semibold text-blue-600">
                                          {formatCurrency(inv.totalInvested)}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                    ) : (
                      <div className="py-8 text-center text-slate-500">No investor data available</div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}