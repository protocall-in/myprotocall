
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Users,
  Target,
  Crown,
  Shield,
  Lock,
  Star,
  MoreVertical,
  Trash2,
  AlertCircle,
  CheckCircle,
  Ban,
  Clock,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { usePlatformSettings } from "../hooks/usePlatformSettings";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSubscription } from "../hooks/useSubscription";
import AdDisplay from '../dashboard/AdDisplay'; // Corrected Path
import toast from 'react-hot-toast'; // Import toast for notifications

export default function PollCard({ poll, user, userVote, onVoteSubmit, onViewDetails, onDelete, isLocked, userPledge }) {
  const { settings } = usePlatformSettings();
  const { checkAccess, isLoading: isSubscriptionLoading } = useSubscription();
  const [expanded, setExpanded] = useState(false);
  const [isVoting, setIsVoting] = useState(false); // New state for voting status

  // Check if this is an advisor poll (for consistent styling)
  const isAdvisorPoll = poll.created_by_admin || poll.created_by_role === 'admin' || poll.created_by_role === 'advisor';
  const isPremiumDesign = poll.is_premium || isAdvisorPoll;

  // CRITICAL FIX: Admins always have access
  const isAdmin = user && ['admin', 'super_admin'].includes(user.app_role);
  const canAccessPollContent = isAdmin || (poll.is_premium ? checkAccess({ type: 'premium_poll' }) : true);

  // Determine if the user has general access to this poll's content
  // const canAccessPollContent = poll.is_premium ? checkAccess({ type: 'premium_poll' }) : true;

  // Determine if the poll should be locked due-to role-based restrictions
  // let roleBasedLock = false; // This is now handled by the isLocked prop
  const userIsPremium = checkAccess({ type: 'premium' });

  // roleBasedLock logic moved to parent component or assumed to be handled by `isLocked` prop
  // if (!userIsPremium && isAdvisorPoll) {
  //   roleBasedLock = true;
  // }

  // Calculate percentages based on poll type
  const totalVotes = poll.total_votes || 0;
  let voteData = {};

  // Define vote configurations with consistent structure
  const voteConfigs = {
    'sentiment': {
      bullish: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-500', label: 'Bullish' },
      bearish: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-500', label: 'Bearish' },
      neutral: { icon: Minus, color: 'text-yellow-600', bgColor: 'bg-yellow-500', label: 'Neutral' }
    },
    'price_target': {
      yes: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-500', label: 'Yes' },
      no: { icon: Ban, color: 'text-red-600', bgColor: 'bg-red-500', label: 'No' }
    },
    'buy_sell_hold': { // Default
      buy: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-500', label: 'Buy' },
      sell: { icon: TrendingDown, color: 'text-red-600', bgColor: 'bg-red-500', label: 'Sell' },
      hold: { icon: Minus, color: 'text-yellow-600', bgColor: 'bg-yellow-500', label: 'Hold' }
    }
  };

  const currentConfig = voteConfigs[poll.poll_type] || voteConfigs['buy_sell_hold'];
  const voteOrder = Object.keys(currentConfig);

  // Map poll vote counts to the config
  voteData = voteOrder.reduce((acc, key) => {
    const voteCount = poll[`${key}_votes`] || 0;
    acc[key] = {
      ...currentConfig[key],
      count: voteCount,
      percentage: totalVotes > 0 ? (voteCount / totalVotes * 100) : 0,
    };
    return acc;
  }, {});

  const getWinningVote = () => {
    const votes = Object.entries(voteData).map(([type, data]) => ({
      type: data.label,
      count: data.count,
      percentage: data.percentage
    }));

    if (totalVotes === 0) {
      return { type: 'none', count: 0, percentage: 0 };
    }
    return votes.reduce((a, b) => a.count > b.count ? a : b);
  };

  const winningVote = getWinningVote();

  // Get user vote badge styles
  const getUserVoteBadgeStyle = (vote) => {
    switch (vote) {
      case 'buy':
      case 'bullish':
      case 'yes':
        return 'bg-green-600 text-white';
      case 'sell':
      case 'bearish':
      case 'no':
        return 'bg-red-600 text-white';
      case 'hold':
      case 'neutral':
        return 'bg-orange-600 text-white';
      default:
        return 'bg-gray-600 text-white';
    }
  };

  const handleQuickVote = async (vote) => {
    if (userVote) {
      toast.info("You have already voted on this poll");
      return;
    }

    if (!user) {
      toast.error("Please log in to vote");
      return;
    }

    setIsVoting(true);
    try {
      // Use the parent's vote submit handler which performs atomic updates
      await onVoteSubmit(vote);
      // State will be updated by parent component after successful vote
    } catch (error) {
      console.error('Quick vote error:', error);
      toast.error('Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  // Premium access check - SKIP FOR ADMINS
  if (!isAdmin && !isSubscriptionLoading && !canAccessPollContent && poll.is_premium) {
    return (
      <Card className="border-2 border-dashed border-purple-200 bg-purple-50/30 relative">
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
          <div className="text-center p-6">
            <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 className="font-semibold text-purple-900">Premium Poll</h3>
            <p className="text-sm text-purple-700 mb-3">Subscribe to access premium content</p>
            <Link to={createPageUrl("Subscription")}>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-6 opacity-30">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-4"></div>
          <div className="h-3 bg-slate-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-8 bg-slate-100 rounded"></div>
            <div className="h-8 bg-slate-100 rounded"></div>
            <div className="h-8 bg-slate-100 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  // Inactive/Suspended Card
  if (!poll.is_active) {
    return (
      <Card className="border-2 border-dashed border-slate-300 bg-slate-100/50 relative">
        <div className="absolute inset-0 bg-slate-200/70 flex items-center justify-center z-10">
          <div className="text-center p-6">
            <Ban className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h3 className="font-semibold text-slate-800">Poll Suspended</h3>
            <p className="text-sm text-slate-600">This poll is currently not active.</p>
          </div>
        </div>
        <div className="p-6 opacity-50 space-y-4">
          <h3 className="font-bold text-slate-700">{poll.stock_symbol}</h3>
          <div className="space-y-3">
            {Object.entries(voteData).map(([voteType, data]) => (
              <div key={voteType} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <data.icon className={`w-4 h-4 ${data.color}`} />
                    <span className="capitalize">{data.label}</span>
                  </div>
                  <span className="font-semibold">{data.count} ({data.percentage.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-slate-300 rounded-full h-2">
                  <div className={`${data.bgColor}`} style={{ width: `${data.percentage}%`, height: '100%', borderRadius: '9999px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // Role-based locked card - SKIP FOR ADMINS
  if (!isAdmin && !isSubscriptionLoading && isLocked) { // Now uses the isLocked prop
    return (
      <div className="relative">
        <Card className="locked-poll-card bg-white border overflow-hidden">
          <div className="p-4 space-y-4">
            {/* Header - Updated to show Stock Symbol as title */}
            <div>
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-lg font-bold text-slate-900 leading-tight flex-1">
                  {poll.stock_symbol}
                </CardTitle>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {poll.is_premium && (
                    <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-xs">
                      <Crown className="w-3 h-3 mr-1" />
                      Premium Only
                    </Badge>
                  )}
                  {isAdvisorPoll && (
                    <Badge className="bg-green-100 text-green-800 border border-green-200 text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      Advisor
                    </Badge>
                  )}
                </div>
              </div>
              {/* Poll Question moved below as semi-bold description */}
              <p className="text-sm text-slate-700 font-semibold mt-2 leading-relaxed">
                {poll.title}
              </p>
              <div className="flex items-center gap-4 mt-2">
                {poll.confidence_score && (
                  <div className="flex items-center gap-1">
                    {Array(5).fill(0).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < poll.confidence_score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Voting Results */}
            <div className="space-y-3 pt-2">
              {Object.entries(voteData).map(([voteType, data]) => (
                <div key={voteType}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <div className="flex items-center gap-2">
                      <data.icon className={`w-4 h-4 ${data.color}`} />
                      <span className="font-medium text-slate-700">{data.label}</span>
                    </div>
                    <span className="font-semibold text-slate-800">{data.count} ({data.percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className={`${data.bgColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${data.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Poll Stats Footer */}
            <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                <span>{totalVotes} votes</span>
              </div>
              {winningVote.type !== 'none' && (
                <span className="font-semibold capitalize">{winningVote.type} {winningVote.percentage.toFixed(0)}%</span>
              )}
            </div>
          </div>
        </Card>

        {/* Premium Overlay */}
        <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center rounded-lg">
          <div className="text-center p-4">
            <div className="inline-flex items-center justify-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-3 mb-3">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">Premium Content</h3>
            <p className="text-sm text-gray-600 mb-4">Unlock expert insights and advisor recommendations</p>
            <Link to={createPageUrl("Subscription")}>
              <Button size="sm" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Premium
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Main Active Card
  return (
    <div className="space-y-4">
      {/* Ad Display above Polls */}
      {Math.random() < 0.2 && ( // Show ads on ~20% of poll cards
        <AdDisplay
          placement="polls"
          userContext={{
            stock_symbol: poll.stock_symbol
          }}
        />
      )}

      <TooltipProvider>
        <Card className={`transition-all duration-300 border-0 relative group ${isPremiumDesign ? "overflow-hidden shadow-lg bg-gradient-to-br from-white to-purple-50 hover:shadow-xl transform hover:-translate-y-1" : "bg-white hover:shadow-lg"} ${isLocked ? 'locked-poll-card' : ''}`}>
          {poll.is_premium && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400 to-indigo-500 opacity-10 rounded-full transform translate-x-16 -translate-y-16 z-0"></div>
          )}

          <div className="relative z-10">
            {/* Delete button removed as onDelete prop is no longer available */}

            <div className="p-4 space-y-4">
              {/* Header - Updated to show Stock Symbol as title */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-slate-900 leading-tight flex-1">
                    {poll.stock_symbol}
                  </CardTitle>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    {poll.is_premium ? (
                      <Badge className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-0 shadow-md">
                        <Crown className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    ) : isAdvisorPoll && (
                      <Badge className="bg-purple-100 text-purple-800 border border-purple-200 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Advisor
                      </Badge>
                    )}
                  </div>
                </div>
                {/* Poll Question moved below as semi-bold description */}
                <p className="text-sm text-slate-700 font-semibold mt-2 leading-relaxed">
                  {poll.title}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  {poll.confidence_score && (
                    <div className="flex items-center gap-1">
                      {Array(5).fill(0).map((_, i) => (
                        <Star key={i} className={`w-3.5 h-3.5 ${i < poll.confidence_score ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Voting Results */}
              <div className="space-y-3 pt-2">
                {Object.entries(voteData).map(([voteType, data]) => (
                  <div key={voteType}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <data.icon className={`w-4 h-4 ${data.color}`} />
                        <span className="font-medium text-slate-700">{data.label}</span>
                      </div>
                      <span className="font-semibold text-slate-800">{data.count} ({data.percentage.toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className={`${data.bgColor} h-2 rounded-full transition-all duration-500`} style={{ width: `${data.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Poll Stats Footer */}
              <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>{totalVotes} votes</span>
                </div>
                {winningVote.type !== 'none' && (
                  <span className="font-semibold capitalize">{winningVote.type} {winningVote.percentage.toFixed(0)}%</span>
                )}
              </div>

              {/* Action/Status Section - Updated for post-pledge state */}
              <div className="mt-4">
                {!userVote ? (
                  <div className={`grid gap-2 ${voteOrder.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                    {Object.entries(voteData).map(([voteType, data]) => (
                      <TooltipProvider key={voteType}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => handleQuickVote(voteType)}
                              disabled={isVoting}
                              className={`h-9 p-2 px-3 rounded-lg text-sm font-medium cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-center gap-1.5 border-none ${
                                (voteType === 'buy' || voteType === 'bullish' || voteType === 'yes') ? 'bg-green-100 text-green-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white' :
                                (voteType === 'sell' || voteType === 'bearish' || voteType === 'no') ? 'bg-red-100 text-red-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white' :
                                'bg-yellow-100 text-yellow-800 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:to-purple-600 hover:text-white'
                              }`}
                            >
                              <data.icon className="w-4 h-4" />
                              {data.label}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Click to vote '{data.label}'</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {/* Updated "You Voted" Badge */}
                    <div className="w-full text-center">
                      <Badge className={`${getUserVoteBadgeStyle(userVote)} text-sm px-3 py-1 rounded-full font-semibold hover:bg-black hover:text-white hover:shadow-md transition-all duration-200 cursor-default`}>
                        You voted: {userVote ? userVote.toUpperCase() : ''}
                      </Badge>
                    </div>
                  </div>
                )}

                {userPledge && (
                  <div className="mt-2">
                    <Button
                      disabled
                      className="w-full py-2 rounded-xl px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                    >
                      PLEDGED: ₹{userPledge.amount_committed?.toLocaleString() || 'N/A'}
                    </Button>
                  </div>
                )}

                {poll.poll_type === 'pledge_poll' && !settings.pledgeEnabled && (
                  <div className="flex items-center justify-center gap-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg mt-2">
                    <AlertCircle className="w-3 h-3" />
                    <span>Pledge system currently disabled by admin.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>
      </TooltipProvider>
    </div>
  );
}
