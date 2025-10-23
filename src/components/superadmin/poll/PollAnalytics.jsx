
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar } from 'recharts';
import { BarChart3, TrendingUp, Users, Crown, Vote, Calendar } from 'lucide-react';
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className={`p-4 rounded-lg flex items-center gap-4 ${color.bg}`}>
    <div className={`p-3 rounded-full ${color.iconBg}`}>
      <Icon className={`w-5 h-5 ${color.iconText}`} />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
      {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
  </div>
);

export default function PollAnalytics({ polls = [], votes = [] }) {
  console.log('Analytics - Polls:', polls.length, 'Votes:', votes.length);

  const analytics = useMemo(() => {
    if (!polls.length) {
      return {
        totalEngagement: 0,
        buySentiment: 0,
        sellSentiment: 0,
        holdSentiment: 0,
        premiumEngagement: 0,
        avgParticipation: 0,
        voteDistribution: [],
        participationTrend: [],
        topStocks: []
      };
    }

    // Calculate total engagement
    const totalVotes = polls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
    const totalPledges = polls.reduce((sum, poll) => sum + (poll.total_pledges || 0), 0);
    const totalEngagement = totalVotes + totalPledges;

    // Calculate sentiment distribution
    const totalBuyVotes = polls.reduce((sum, poll) => sum + (poll.buy_votes || 0), 0);
    const totalSellVotes = polls.reduce((sum, poll) => sum + (poll.sell_votes || 0), 0);
    const totalHoldVotes = polls.reduce((sum, poll) => sum + (poll.hold_votes || 0), 0);
    
    const buySentiment = totalVotes > 0 ? (totalBuyVotes / totalVotes * 100).toFixed(1) : 0;
    const sellSentiment = totalVotes > 0 ? (totalSellVotes / totalVotes * 100).toFixed(1) : 0;
    const holdSentiment = totalVotes > 0 ? (totalHoldVotes / totalVotes * 100).toFixed(1) : 0;

    // Calculate premium engagement
    const premiumPolls = polls.filter(p => p.is_premium);
    const premiumEngagement = premiumPolls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);

    // Calculate average participation
    const avgParticipation = polls.length > 0 ? (totalVotes / polls.length).toFixed(1) : 0;

    // Create vote distribution data for pie chart
    const voteDistribution = [
      { name: 'Buy', value: totalBuyVotes, color: '#10B981', percentage: buySentiment },
      { name: 'Sell', value: totalSellVotes, color: '#EF4444', percentage: sellSentiment },
      { name: 'Hold', value: totalHoldVotes, color: '#F59E0B', percentage: holdSentiment }
    ].filter(item => item.value > 0);

    // Create 7-day participation trend
    const last7Days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date()
    });

    const participationTrend = last7Days.map(day => {
      const dayPolls = polls.filter(poll => {
        const pollDate = new Date(poll.created_date);
        return format(pollDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      });
      
      const dayVotes = dayPolls.reduce((sum, poll) => sum + (poll.total_votes || 0), 0);
      
      return {
        day: format(day, 'MMM dd'),
        votes: dayVotes,
        polls: dayPolls.length
      };
    });

    // Top performing stocks
    const stockPerformance = {};
    polls.forEach(poll => {
      if (poll.stock_symbol) {
        if (!stockPerformance[poll.stock_symbol]) {
          stockPerformance[poll.stock_symbol] = { symbol: poll.stock_symbol, votes: 0, polls: 0 };
        }
        stockPerformance[poll.stock_symbol].votes += poll.total_votes || 0;
        stockPerformance[poll.stock_symbol].polls += 1;
      }
    });

    const topStocks = Object.values(stockPerformance)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);

    return {
      totalEngagement,
      buySentiment,
      sellSentiment,
      holdSentiment,
      premiumEngagement,
      avgParticipation,
      voteDistribution,
      participationTrend,
      topStocks,
      totalVotes,
      totalPledges
    };
  }, [polls]);

  if (!polls.length) {
    return (
      <div className="space-y-6">
        <div className="text-center py-16">
          <BarChart3 className="mx-auto h-16 w-16 text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">No analytics data yet</h3>
          <p className="mt-2 text-sm text-slate-500">
            Analytics will appear here once polls are created and receive votes.
          </p>
        </div>
      </div>
    );
  }

  const COLORS = ['#10B981', '#EF4444', '#F59E0B'];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Engagement"
          value={analytics.totalEngagement}
          subtitle={`${analytics.totalVotes} votes + ${analytics.totalPledges} pledges`}
          icon={Users}
          color={{ bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' }}
        />
        <StatCard
          title="Buy Sentiment"
          value={`${analytics.buySentiment}%`}
          subtitle="of all votes"
          icon={TrendingUp}
          color={{ bg: 'bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-600' }}
        />
        <StatCard
          title="Premium Engagement"
          value={analytics.premiumEngagement}
          subtitle="votes on premium polls"
          icon={Crown}
          color={{ bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-600' }}
        />
        <StatCard
          title="Avg. Participation"
          value={analytics.avgParticipation}
          subtitle="votes per poll"
          icon={Vote}
          color={{ bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600' }}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Vote Distribution Pie Chart */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Overall Vote Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.voteDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.voteDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({name, percentage}) => `${name}: ${percentage}%`}
                  >
                    {analytics.voteDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [value, `${name} Votes`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-slate-500">
                <div className="text-center">
                  <Vote className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>No vote data available</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 7-Day Participation Trend */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              7-Day Participation Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.participationTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'votes' ? 'Votes' : 'Polls']}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="votes" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  name="Daily Votes"
                />
                <Line 
                  type="monotone" 
                  dataKey="polls" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="New Polls"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Stocks */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performing Stocks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topStocks.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.topStocks}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="symbol" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="votes" fill="#8884d8" name="Total Votes" />
                <Bar dataKey="polls" fill="#82ca9d" name="Number of Polls" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-slate-500">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>No stock performance data available</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sentiment Breakdown Table */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle>Detailed Sentiment Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{analytics.buySentiment}%</div>
              <div className="text-sm text-green-700">Bullish Sentiment</div>
              <div className="text-xs text-slate-500 mt-1">
                {polls.reduce((sum, poll) => sum + (poll.buy_votes || 0), 0)} total buy votes
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">{analytics.sellSentiment}%</div>
              <div className="text-sm text-red-700">Bearish Sentiment</div>
              <div className="text-xs text-slate-500 mt-1">
                {polls.reduce((sum, poll) => sum + (poll.sell_votes || 0), 0)} total sell votes
              </div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-orange-600">{analytics.holdSentiment}%</div>
              <div className="text-sm text-orange-700">Neutral Sentiment</div>
              <div className="text-xs text-slate-500 mt-1">
                {polls.reduce((sum, poll) => sum + (poll.hold_votes || 0), 0)} total hold votes
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
