
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart3, TrendingUp, TrendingDown, Minus, Users, CheckCircle, Crown, Lock, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function CommunitySentiment({ stockSymbol, pollData, user, userVote, subscription, onVote }) {
  // Helper function to determine if poll should be locked for current user based on roles
  const shouldLockPoll = (poll) => {
    if (!poll || !user) return false; // If no poll or no user, no role-based lock applies

    // If user is premium, they can always see role-based restricted polls
    if (subscription && ['premium', 'vip'].includes(subscription.plan_type)) {
      return false;
    }
    
    // If user is not premium and poll is created by admin/advisor, lock it
    if (poll.created_by_role === 'admin' || poll.created_by_role === 'advisor' || poll.created_by_admin) {
      return true;
    }
    
    return false;
  };

  // Early returns for no stock, no poll, or suspended poll
  if (!stockSymbol) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Community Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm">No stock specified for this room</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!pollData) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Community Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No active polls yet for {stockSymbol}</p>
            <p className="text-xs mt-1 text-slate-400">Create a poll in Community section to see sentiment</p>
            
            {/* Add Create Poll Button */}
            {user && (
              <div className="mt-4">
                <Link to={createPageUrl("Polls")}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-1" />
                    Create Poll
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle suspended polls
  if (!pollData.is_active) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-red-50">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-red-600" />
            Community Sentiment
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center py-8 text-red-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-red-300" />
            <p className="text-sm font-medium">Poll Suspended</p>
            <p className="text-xs mt-1">This poll has been disabled by admin</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate vote percentages based on poll type
  let voteData = {};
  const totalVotes = pollData.total_votes || 0;

  if (pollData.poll_type === 'sentiment') {
    const bullishVotes = pollData.bullish_votes || 0;
    const bearishVotes = pollData.bearish_votes || 0;
    const neutralVotes = pollData.neutral_votes || 0;
    
    voteData = {
      bullish: {
        count: bullishVotes,
        percentage: totalVotes > 0 ? (bullishVotes / totalVotes) * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        progressBg: 'bg-green-100',
        progressBar: 'bg-green-600'
      },
      bearish: {
        count: bearishVotes,
        percentage: totalVotes > 0 ? (bearishVotes / totalVotes) * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        progressBg: 'bg-red-100',
        progressBar: 'bg-red-600'
      },
      neutral: {
        count: neutralVotes,
        percentage: totalVotes > 0 ? (neutralVotes / totalVotes) * 100 : 0,
        icon: Minus,
        color: 'text-orange-600',
        progressBg: 'bg-orange-100',
        progressBar: 'bg-orange-600'
      }
    };
  } else if (pollData.poll_type === 'price_target') {
    const yesVotes = pollData.yes_votes || 0;
    const noVotes = pollData.no_votes || 0;
    
    voteData = {
      yes: {
        count: yesVotes,
        percentage: totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        progressBg: 'bg-green-100',
        progressBar: 'bg-green-600'
      },
      no: {
        count: noVotes,
        percentage: totalVotes > 0 ? (noVotes / totalVotes) * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        progressBg: 'bg-red-100',
        progressBar: 'bg-red-600'
      }
    };
  } else {
    // Default to buy/sell/hold for other poll types
    const buyVotes = pollData.buy_votes || 0;
    const sellVotes = pollData.sell_votes || 0;
    const holdVotes = pollData.hold_votes || 0;

    voteData = {
      buy: {
        count: buyVotes,
        percentage: totalVotes > 0 ? (buyVotes / totalVotes) * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        progressBg: 'bg-green-100',
        progressBar: 'bg-green-600'
      },
      sell: {
        count: sellVotes,
        percentage: totalVotes > 0 ? (sellVotes / totalVotes) * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        progressBg: 'bg-red-100',
        progressBar: 'bg-red-600'
      },
      hold: {
        count: holdVotes,
        percentage: totalVotes > 0 ? (holdVotes / totalVotes) * 100 : 0,
        icon: Minus,
        color: 'text-orange-600',
        progressBg: 'bg-orange-100',
        progressBar: 'bg-orange-600'
      }
    };
  }

  // Determine sentiment based on poll type and results
  let sentiment = 'Neutral';
  let sentimentColor = 'bg-gray-100 text-gray-700';
  
  const sortedVotes = Object.entries(voteData).sort((a, b) => b[1].percentage - a[1].percentage);
  const topVote = sortedVotes[0];
  
  if (topVote && topVote[1].percentage > 0) {
    const voteType = topVote[0];
    if (['buy', 'bullish', 'yes'].includes(voteType)) {
      sentiment = pollData.poll_type === 'sentiment' ? 'Bullish' : pollData.poll_type === 'price_target' ? 'Positive' : 'Bullish';
      sentimentColor = 'bg-green-100 text-green-700';
    } else if (['sell', 'bearish', 'no'].includes(voteType)) {
      sentiment = pollData.poll_type === 'sentiment' ? 'Bearish' : pollData.poll_type === 'price_target' ? 'Negative' : 'Bearish';
      sentimentColor = 'bg-red-100 text-red-700';
    }
  }

  // Check for role-based locking after initial checks and vote data calculation
  const isRoleBasedLocked = shouldLockPoll(pollData);

  // Role-based locked sentiment (NEW)
  if (isRoleBasedLocked) {
    return (
      <Card className="shadow-lg border-0 bg-white relative overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Community Sentiment
              <Crown className="w-4 h-4 text-purple-600" />
            </CardTitle>
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              Premium Only
            </Badge>
          </div>
        </CardHeader>
        
        {/* Blurred Content */}
        <div className="relative pointer-events-none filter blur-sm"> {/* Added filter for blurring */}
          <CardContent className="p-4 space-y-4">
            {/* Vote Results with Progress Bars */}
            <div className="space-y-3">
              {Object.entries(voteData).map(([voteType, data]) => (
                <div key={voteType}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <data.icon className={`w-4 h-4 ${data.color}`} />
                      <span className="text-sm font-medium capitalize">{voteType}</span>
                    </div>
                    <span className="text-sm font-semibold text-slate-700">
                      {data.count} ({data.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className={`w-full ${data.progressBg} rounded-full h-2 mt-1`}>
                    <div 
                      className={`${data.progressBar} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${data.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Votes */}
            <div className="flex items-center justify-center gap-1 text-sm text-slate-500 pt-2 border-t">
              <Users className="w-4 h-4" />
              <span>Total Votes: {totalVotes}</span>
            </div>
          </CardContent>
        </div>

        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-3 mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Expert Insights</h3>
            <p className="text-sm text-gray-600 mb-4">Unlock admin recommendations and sentiment analysis</p>
            <Link to={createPageUrl("Subscription")}>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // The rest of the component for unlocked sentiment
  const hasVoted = userVote && userVote.vote;
  
  // Premium access logic (existing, for voting on premium polls)
  const canVote = user && (!pollData.is_premium || (subscription && ['premium', 'vip'].includes(subscription.plan_type)));
  const isPremiumPoll = pollData.is_premium;
  const isLockedForUser = isPremiumPoll && !canVote; // This handles polls marked as 'is_premium'

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Community Sentiment
            {isPremiumPoll && ( // This refers to polls explicitly marked as is_premium
              <Crown className="w-4 h-4 text-purple-600" />
            )}
          </CardTitle>
          <Badge className={`text-xs font-semibold ${sentimentColor}`}>
            {sentiment}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">{pollData.title}</p>
          {isPremiumPoll && (
            <Badge className="bg-purple-100 text-purple-700 text-xs">
              Premium
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Vote Results with Progress Bars */}
        <div className="space-y-3">
          {Object.entries(voteData).map(([voteType, data]) => (
            <div key={voteType}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <data.icon className={`w-4 h-4 ${data.color}`} />
                  <span className="text-sm font-medium capitalize">{voteType}</span>
                </div>
                <span className="text-sm font-semibold text-slate-700">
                  {data.count} ({data.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className={`w-full ${data.progressBg} rounded-full h-2 mt-1`}>
                <div 
                  className={`${data.progressBar} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${data.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Total Votes */}
        <div className="flex items-center justify-center gap-1 text-sm text-slate-500 pt-2 border-t">
          <Users className="w-4 h-4" />
          <span>Total Votes: {totalVotes}</span>
        </div>

        {/* Voting Buttons or Results */}
        {!user ? (
          <div className="text-center py-2">
            <p className="text-sm text-slate-500">Please log in to vote</p>
          </div>
        ) : isLockedForUser ? ( // This handles polls explicitly marked as is_premium for voting
          <div className="text-center py-4 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50">
            <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-purple-900">Premium Poll</p>
            <p className="text-xs text-purple-700 mb-3">Upgrade to vote on premium content</p>
            <Link to={createPageUrl("Subscription")}>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Crown className="w-4 h-4 mr-1" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-2">
            <Badge className="bg-green-100 text-green-800 flex items-center gap-2 justify-center py-2 px-4">
              <CheckCircle className="w-4 h-4" />
              You voted: {userVote.vote.toUpperCase()}
            </Badge>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium text-slate-700 mb-3">Cast your vote:</p>
            <div className={`flex gap-2 ${Object.keys(voteData).length === 2 ? 'grid-cols-2' : 'grid-cols-3'} grid`}>
              {Object.entries(voteData).map(([voteType, data]) => (
                <Button 
                  key={voteType}
                  size="sm" 
                  onClick={() => onVote(voteType)}
                  className={`flex-1 ${
                    ['buy', 'bullish', 'yes'].includes(voteType) ? 'bg-green-600 hover:bg-green-700' :
                    ['sell', 'bearish', 'no'].includes(voteType) ? 'bg-red-600 hover:bg-red-700' :
                    'bg-orange-600 hover:bg-orange-700'
                  } text-white`}
                >
                  <data.icon className="w-4 h-4 mr-1" />
                  {voteType.charAt(0).toUpperCase() + voteType.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Community Consensus */}
        <div className="text-center pt-2 border-t">
          <p className="text-xs text-slate-500">
            Community is <span className="font-semibold">{sentiment.toLowerCase()}</span> on {stockSymbol}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
