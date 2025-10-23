import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { TrendingUp, Eye, MessageCircle, Star, BarChart3, Users, Crown, Vote, PackageOpen } from 'lucide-react';

const ProgressBar = ({ value, color }) => (
  <div className="w-full bg-slate-200 rounded-full h-1.5">
    <div className={`${color} h-1.5 rounded-full`} style={{ width: `${value}%` }}></div>
  </div>
);

export default function TopPollsWidget({ polls, onViewDetails }) {
  const [rankingMetric, setRankingMetric] = useState('votes');
  const [timeRange, setTimeRange] = useState('all');

  const topPolls = useMemo(() => {
    if (!polls || polls.length === 0) return [];

    const now = new Date();

    const filtered = polls.filter(poll => {
      if (timeRange === 'all') return true;
      const pollDate = new Date(poll.created_date);
      if (timeRange === 'today') return pollDate.toDateString() === now.toDateString();
      if (timeRange === '7d') return pollDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      if (timeRange === '30d') return pollDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      switch (rankingMetric) {
        case 'pledges':
          return (b.total_pledge_amount || 0) - (a.total_pledge_amount || 0);
        case 'engagement':
          return ((b.total_votes || 0) + (b.total_pledges || 0)) - ((a.total_votes || 0) + (a.total_pledges || 0));
        case 'votes':
        default:
          return (b.total_votes || 0) - (a.total_votes || 0);
      }
    });

    return sorted.slice(0, 3);
  }, [polls, rankingMetric, timeRange]);

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-600" />
          Top Performing Polls
        </CardTitle>
        <div className="flex items-center gap-3">
          <Select value={rankingMetric} onValueChange={setRankingMetric}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Rank by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="votes">By Votes</SelectItem>
              <SelectItem value="pledges">By Pledges</SelectItem>
              <SelectItem value="engagement">By Engagement</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {topPolls.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPolls.map((poll) => (
              <div key={poll.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 transition-all duration-300 hover:shadow-md hover:border-purple-200">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-semibold text-slate-800 flex-1">{poll.title}</p>
                  <Badge variant={poll.is_currently_active ? 'default' : 'secondary'} className={poll.is_currently_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                    {poll.is_currently_active ? 'Active' : 'Expired'}
                  </Badge>
                </div>
                <div className="text-xs text-slate-500 mb-4 space-y-1">
                  <div className="flex items-center gap-1.5"><TrendingUp className="w-3 h-3" /><span>Stock: {poll.stock_symbol}</span></div>
                  {poll.chatroom && <div className="flex items-center gap-1.5"><MessageCircle className="w-3 h-3" /><span>Room: {poll.chatroom.name}</span></div>}
                </div>
                
                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-green-600">Buy ({poll.buy_percentage}%)</span>
                      <span className="font-medium text-slate-500">{poll.buy_votes || 0} votes</span>
                    </div>
                    <ProgressBar value={poll.buy_percentage} color="bg-green-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-red-600">Sell ({poll.sell_percentage}%)</span>
                      <span className="font-medium text-slate-500">{poll.sell_votes || 0} votes</span>
                    </div>
                    <ProgressBar value={poll.sell_percentage} color="bg-red-500" />
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-yellow-600">Hold ({poll.hold_percentage}%)</span>
                      <span className="font-medium text-slate-500">{poll.hold_votes || 0} votes</span>
                    </div>
                    <ProgressBar value={poll.hold_percentage} color="bg-yellow-500" />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                   <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-600"><Vote className="w-4 h-4"/><span>{poll.total_votes || 0}</span></div>
                      <div className="flex items-center gap-1.5 text-slate-600"><Users className="w-4 h-4"/><span>{poll.total_pledges || 0}</span></div>
                   </div>
                   <div className="flex items-center gap-2">
                     {poll.chatroom_id && (
                       <Button variant="outline" size="sm" asChild>
                         <Link to={createPageUrl(`ChatRooms?roomId=${poll.chatroom_id}`)} title="Go to Room">
                           <MessageCircle className="w-4 h-4" />
                         </Link>
                       </Button>
                     )}
                     <Button variant="default" size="sm" onClick={() => onViewDetails(poll)} title="View Details">
                       <Eye className="w-4 h-4" />
                     </Button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <PackageOpen className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-2 text-sm font-medium text-slate-900">No top polls found</h3>
            <p className="mt-1 text-sm text-slate-500">Try adjusting your filters or encourage more community participation!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}