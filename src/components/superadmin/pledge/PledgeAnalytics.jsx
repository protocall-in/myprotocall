
import React, { useState, useEffect, useCallback } from 'react';
// Removed PledgeSession, Pledge, PledgeExecutionRecord imports as they are no longer used within this component
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    TrendingUp,
    DollarSign,
    Users,
    Activity,
    BarChart3,
    PieChart,
    Target,
    Loader2
} from 'lucide-react';
import { ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from 'recharts';
import { format } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function PledgeAnalytics({ user, sessions, pledges, executions, isLoading }) {
    // sessions, pledges, executions, and isLoading are now received as props.
    // Internal state for these items is removed.

    const [analytics, setAnalytics] = useState({
        totalSessions: 0,
        activeSessions: 0,
        totalPledgeValue: 0,
        totalExecutionValue: 0,
        participationRate: 0,
        successRate: 0,
        totalCommissionEarned: 0, // Added for new financial metric
        totalConvenienceFees: 0,   // Added for new financial metric
        totalRevenue: 0            // Added for new financial metric
    });
    const [chartData, setChartData] = useState({
        sessionsByMode: [],
        pledgesByStock: [],
        executionTrend: [],
        participationTrend: []
    });

    // Helper function to generate chart data, memoized with useCallback
    const generateChartData = useCallback((currentSessions, currentPledges, currentExecutions) => {
        // Session mode distribution
        const sessionModeCount = currentSessions.reduce((acc, session) => {
            const mode = session.session_mode || 'buy_only';
            acc[mode] = (acc[mode] || 0) + 1;
            return acc;
        }, {});

        const sessionsByMode = Object.entries(sessionModeCount).map(([mode, count]) => ({
            name: mode === 'buy_only' ? 'Buy Only' :
                  mode === 'sell_only' ? 'Sell Only' : 'Buy & Sell Cycle',
            value: count,
            mode
        }));

        // Pledge distribution by stock
        const pledgesByStock = currentPledges.reduce((acc, pledge) => {
            const stock = pledge.stock_symbol || 'Unknown';
            const existingStock = acc.find(item => item.stock === stock);
            if (existingStock) {
                existingStock.pledges += 1;
                existingStock.value += (pledge.qty || 0) * (pledge.price_target || 0);
            } else {
                acc.push({
                    stock,
                    pledges: 1,
                    value: (pledge.qty || 0) * (pledge.price_target || 0)
                });
            }
            return acc;
        }, []).sort((a, b) => b.value - a.value).slice(0, 10);

        // Monthly execution trend
        const executionTrend = currentExecutions.reduce((acc, execution) => {
            if (execution.executed_at) {
                const month = format(new Date(execution.executed_at), 'MMM yyyy');
                const existing = acc.find(item => item.month === month);
                if (existing) {
                    existing.executions += 1;
                    existing.value += parseFloat(execution.total_execution_value) || 0;
                } else {
                    acc.push({
                        month,
                        executions: 1,
                        value: parseFloat(execution.total_execution_value) || 0
                    });
                }
            }
            return acc;
        }, []).sort((a, b) => {
            // Robust date sorting for 'MMM yyyy'
            const dateA = new Date(a.month.replace(' ', ' 1, '));
            const dateB = new Date(b.month.replace(' ', ' 1, '));
            return dateA.getTime() - dateB.getTime();
        });

        // Participation trend
        const participationTrend = currentSessions.reduce((acc, session) => {
            const month = format(new Date(session.created_date), 'MMM yyyy');
            const sessionPledges = currentPledges.filter(p => p.session_id === session.id).length;
            const existing = acc.find(item => item.month === month);
            if (existing) {
                existing.sessions += 1;
                existing.pledges += sessionPledges;
            } else {
                acc.push({
                    month,
                    sessions: 1,
                    pledges: sessionPledges,
                });
            }
            return acc;
        }, []).map(item => ({
            ...item,
            participationRate: Math.round((item.pledges / item.sessions) * 100)
        })).sort((a, b) => {
            // Robust date sorting for 'MMM yyyy'
            const dateA = new Date(a.month.replace(' ', ' 1, '));
            const dateB = new Date(b.month.replace(' ', ' 1, '));
            return dateA.getTime() - dateB.getTime();
        });

        setChartData({
            sessionsByMode,
            pledgesByStock,
            executionTrend,
            participationTrend
        });
    }, []); // generateChartData depends only on its parameters, not external state

    const processAnalyticsData = useCallback(() => {
        // Guard clause: If data is still loading or not in array format, reset analytics and charts
        if (isLoading || !Array.isArray(sessions) || !Array.isArray(pledges) || !Array.isArray(executions)) {
            setAnalytics({
                totalSessions: 0, activeSessions: 0, totalPledgeValue: 0,
                totalExecutionValue: 0, participationRate: 0, successRate: 0,
                totalCommissionEarned: 0, totalConvenienceFees: 0, totalRevenue: 0
            });
            setChartData({
                sessionsByMode: [], pledgesByStock: [], executionTrend: [], participationTrend: []
            });
            return;
        }

        // Calculate comprehensive analytics
        const totalSessions = sessions.length;
        const activeSessions = sessions.filter(s => s.status === 'active').length;
        const totalPledgeValue = pledges.reduce((sum, p) => sum + ((p.qty || 0) * (p.price_target || 0)), 0);
        const totalExecutionValue = executions.reduce((sum, e) => sum + (parseFloat(e.total_execution_value) || 0), 0);
        const participationRate = totalSessions > 0 ? ((pledges.length / totalSessions) * 100) : 0;
        const successRate = executions.length > 0 ?
            (executions.filter(e => e.status === 'completed')?.length || 0) / (executions.length) * 100 : 0;

        // New financial metrics calculation
        let totalCommissionEarned = 0;
        let totalConvenienceFees = 0;

        executions.forEach(exec => {
            // FIX: Handle 0% commission properly, default to 0 if not set
            const commissionRate = exec.commission_rate || 0; 
            totalCommissionEarned += ((exec.total_execution_value || 0) * commissionRate) / 100;
        });

        pledges.forEach(pledge => {
            totalConvenienceFees += pledge.convenience_fee_amount || 0;
        });

        const totalRevenue = totalCommissionEarned + totalConvenienceFees;

        setAnalytics({
            totalSessions,
            activeSessions,
            totalPledgeValue,
            totalExecutionValue,
            participationRate: Math.round(participationRate),
            successRate: Math.round(successRate),
            totalCommissionEarned: totalCommissionEarned,
            totalConvenienceFees: totalConvenienceFees,
            totalRevenue: totalRevenue
        });

        // Generate chart data using the provided props
        generateChartData(sessions, pledges, executions);
    }, [sessions, pledges, executions, isLoading, generateChartData]);

    useEffect(() => {
        processAnalyticsData();
    }, [processAnalyticsData]);

    // Enhanced: Stats cards with gradient theme
    const StatsCard = ({ title, value, subtitle, icon: Icon, gradient, trend }) => (
        <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-white/80">{title}</p>
                    <p className="text-3xl font-bold">{value}</p>
                    {subtitle && <p className="text-xs text-white/70 mt-1">{subtitle}</p>}
                    {trend && <p className="text-xs text-white/90 mt-1 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" /> {trend}
                    </p>}
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Icon className="w-8 h-8 text-white" />
                </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full transform translate-x-16 -translate-y-16"></div>
        </div>
    );

    // Display loading spinner if isLoading prop is true
    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-lg font-medium text-gray-700">Loading analytics data...</p>
                    <p className="text-sm text-gray-500">Calculating comprehensive statistics</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Enhanced: Analytics Overview with Gradient Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatsCard
                    title="Total Sessions"
                    value={analytics.totalSessions}
                    subtitle={`${analytics.activeSessions} active sessions`}
                    icon={Target}
                    gradient="from-blue-500 to-blue-600"
                />
                <StatsCard
                    title="Pledge Value"
                    value={`₹${(analytics.totalPledgeValue / 1000).toFixed(0)}k`}
                    subtitle="Total pledged amount"
                    icon={DollarSign}
                    gradient="from-green-500 to-emerald-600"
                />
                <StatsCard
                    title="Execution Value"
                    value={`₹${(analytics.totalExecutionValue / 1000).toFixed(0)}k`}
                    subtitle="Successfully executed"
                    icon={Activity}
                    gradient="from-purple-500 to-purple-600"
                />
                <StatsCard
                    title="Participation Rate"
                    value={`${analytics.participationRate}%`}
                    subtitle="User engagement"
                    icon={Users}
                    gradient="from-cyan-500 to-blue-600"
                />
                <StatsCard
                    title="Success Rate"
                    value={`${analytics.successRate}%`}
                    subtitle="Execution success"
                    icon={TrendingUp}
                    gradient="from-orange-500 to-red-500"
                />
                <StatsCard
                    title="Total Users"
                    value={pledges && pledges.length > 0 ? new Set(pledges.map(p => p.user_id)).size : 0}
                    subtitle="Unique participants"
                    icon={Users}
                    gradient="from-pink-500 to-rose-600"
                />
                {/* New Financial Metrics Cards */}
                <StatsCard
                    title="Commission Earned"
                    value={`₹${(analytics.totalCommissionEarned / 1000).toFixed(2)}k`}
                    subtitle="Total commission from executions"
                    icon={DollarSign}
                    gradient="from-yellow-500 to-amber-600"
                />
                <StatsCard
                    title="Convenience Fees"
                    value={`₹${(analytics.totalConvenienceFees / 1000).toFixed(2)}k`}
                    subtitle="Total fees collected from pledges"
                    icon={DollarSign}
                    gradient="from-lime-500 to-green-600"
                />
                <StatsCard
                    title="Total Revenue"
                    value={`₹${(analytics.totalRevenue / 1000).toFixed(2)}k`}
                    subtitle="Commission + Convenience Fees"
                    icon={DollarSign}
                    gradient="from-indigo-500 to-purple-700"
                />
            </div>

            {/* Enhanced: Charts and Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Session Mode Distribution */}
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-purple-600" />
                            Session Mode Distribution
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.sessionsByMode && chartData.sessionsByMode.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <RechartsPieChart>
                                    <Pie
                                        data={chartData.sessionsByMode}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {chartData.sessionsByMode.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RechartsPieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <PieChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                No session data available in the database.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Top Pledged Stocks */}
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-green-600" />
                            Top Pledged Stocks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.pledgesByStock && chartData.pledgesByStock.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.pledgesByStock.slice(0, 6)} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="stock" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Pledge Value']} />
                                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                No pledge data available in the database.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Execution Trend */}
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-600" />
                            Execution Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.executionTrend && chartData.executionTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData.executionTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip formatter={(value, name) => [
                                        name === 'value' ? `₹${value.toLocaleString()}` : value,
                                        name === 'value' ? 'Execution Value' : 'Executions'
                                    ]} />
                                    <Line type="monotone" dataKey="executions" stroke="#3B82F6" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Activity className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                No execution data available in the database.
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Participation Trend */}
                <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="w-5 h-5 text-cyan-600" />
                            Participation Trend
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {chartData.participationTrend && chartData.participationTrend.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData.participationTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="sessions" fill="#8B5CF6" name="Sessions" />
                                    <Bar dataKey="pledges" fill="#10B981" name="Pledges" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                No participation data available in the database.
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
