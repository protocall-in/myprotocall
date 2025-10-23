import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Vote, CheckCircle, Crown, Users, TrendingUp, Vote as PollIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className={`p-4 rounded-lg flex items-center gap-4 ${color.bg}`}>
    <div className={`p-3 rounded-full ${color.iconBg}`}>
      <Icon className={`w-5 h-5 ${color.iconText}`} />
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500">{title}</p>
      <p className="text-xl font-bold text-slate-800">{value}</p>
    </div>
  </div>
);

export default function PollOverview({ polls, stats }) {

  const overviewData = [
    { title: 'Total Polls', value: stats?.total || 0, icon: Vote, color: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600' } },
    { title: 'Active Polls', value: stats?.active || 0, icon: CheckCircle, color: { bg: 'bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-600' } },
    { title: 'Premium Polls', value: stats?.premium || 0, icon: Crown, color: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-600' } },
    { title: 'Total Votes', value: stats?.totalVotes || 0, icon: Users, color: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600' } },
    { title: 'Avg. Votes', value: stats?.avgVotes || 0, icon: TrendingUp, color: { bg: 'bg-indigo-50', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600' } }
  ];

  const topPolls = [...polls]
    .sort((a, b) => (b.total_votes || 0) - (a.total_votes || 0))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {overviewData.map(stat => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top Performing Polls
          </CardTitle>
        </CardHeader>
        <CardContent>
          {topPolls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left">Poll Title</th>
                    <th className="px-4 py-2 text-center">Votes</th>
                    <th className="px-4 py-2 text-center">Status</th>
                    <th className="px-4 py-2 text-left">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topPolls.map(poll => (
                    <tr key={poll.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{poll.title}</div>
                        <div className="text-xs text-slate-500">{poll.stock_symbol}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-slate-700">{poll.total_votes || 0}</td>
                      <td className="px-4 py-3 text-center">
                        {poll.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Active</Badge>
                        ) : (
                          <Badge variant="outline">Expired</Badge>
                        )}
                        {poll.is_premium && (
                          <Badge className="ml-2 bg-purple-100 text-purple-700 border-0">Premium</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">
                        {formatDistanceToNow(new Date(poll.created_date), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <PollIcon className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-medium text-slate-900">No polls to display</h3>
              <p className="mt-1 text-sm text-slate-500">Polls will appear here as they are created.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}