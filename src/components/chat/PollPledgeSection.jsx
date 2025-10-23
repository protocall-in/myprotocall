
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Users,
  ArrowRight,
  CheckCircle, // Added from outline
  ExternalLink, // Added from outline
  Plus // Added from outline
} from "lucide-react";
import { Subscription as SubEntity, Poll, PollVote, Pledge, PlatformSetting } from "@/api/entities"; // Changed ChatPoll to Poll, ChatPollVote to PollVote
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // Added from outline

import PledgeModal from "./PledgeModal";

export default function PollPledgeSection({ chatRoomId, stockSymbol, user, onPollUpdate }) {
  const [poll, setPoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [userPledge, setUserPledge] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pledgesEnabled, setPledgesEnabled] = useState(true);

  // Combined and adapted from original loadPollAndPledgeData and outline's loadPollData
  const loadPollData = useCallback(async () => {
    if (!chatRoomId || !stockSymbol) return;

    setIsLoading(true);

    try {
      const [userSub, pledgeSettings] = await Promise.all([
        user ? SubEntity.filter({ user_id: user.id, status: 'active' }, '-created_date', 1).catch(() => []) : [],
        PlatformSetting.filter({ setting_key: 'pledges_enabled' }).catch(() => [])
      ]);

      setSubscription(userSub[0] || null);
      setPledgesEnabled(pledgeSettings.length > 0 ? pledgeSettings[0].setting_value === 'true' : true);

      // Load poll based on outline's criteria
      const polls = await Poll.filter({ stock_symbol: stockSymbol, poll_type: 'pledge_poll', is_active: true }, '-created_date', 1);
      let mainPoll = polls[0];

      // If no poll exists, create one (from original logic, adapted to new entity)
      if (!mainPoll) {
        const today = new Date().toISOString().split('T')[0];
        mainPoll = await Poll.create({
          chat_room_id: chatRoomId,
          stock_symbol: stockSymbol,
          poll_date: today,
          buy_votes: 0,
          sell_votes: 0,
          hold_votes: 0,
          total_votes: 0,
          is_active: true,
          poll_type: 'pledge_poll', // From outline
          title: `Daily sentiment poll for ${stockSymbol}`, // Inferred title for new poll
          is_premium: false // Default value for new poll
        }).catch(() => null);
      }

      if (mainPoll) {
        setPoll(mainPoll);
        if (onPollUpdate) {
          onPollUpdate(mainPoll);
        }

        if (user) {
          // Load user vote and pledge for this poll (adapted to new entities)
          const [votes, pledges] = await Promise.all([
            PollVote.filter({ poll_id: mainPoll.id, user_id: user.id }).catch(() => []),
            Pledge.filter({ poll_id: mainPoll.id, user_id: user.id, status: 'active' }).catch(() => [])
          ]);
          setUserVote(votes[0] || null);
          setUserPledge(pledges[0] || null);
        } else {
          setUserVote(null);
          setUserPledge(null);
        }
      } else {
        setPoll(null);
        setUserVote(null);
        setUserPledge(null);
      }
    } catch (error) {
      console.error("Error loading poll and pledge data:", error);
      setPoll(null);
      setUserVote(null);
      setUserPledge(null);
      setPledgesEnabled(false);
    } finally {
      setIsLoading(false);
    }
  }, [chatRoomId, stockSymbol, user, onPollUpdate]);

  useEffect(() => {
    loadPollData();
  }, [loadPollData]);

  // Adapted handleVote from outline with optimistic updates
  const handleVote = async (vote) => {
    if (!user || !poll) {
      toast.error("Please log in to vote.");
      return;
    }

    // Prevent duplicate votes
    if (userVote?.vote === vote) {
      toast.info("You've already cast this vote.");
      return;
    }

    // Store original state for rollback
    const originalPoll = { ...poll };
    const originalUserVote = userVote ? { ...userVote } : null;

    try {
      // Optimistic Update
      const previousVote = userVote?.vote;
      const optimisticPoll = { ...poll };
      
      // Adjust vote counts
      if (!previousVote) {
        optimisticPoll.total_votes = (optimisticPoll.total_votes || 0) + 1;
      }
      if (previousVote && previousVote !== vote) {
        optimisticPoll[`${previousVote}_votes`] = Math.max(0, (optimisticPoll[`${previousVote}_votes`] || 0) - 1);
      }
      optimisticPoll[`${vote}_votes`] = (optimisticPoll[`${vote}_votes`] || 0) + 1;
      
      setPoll(optimisticPoll);
      // Optimistically update the user's vote state
      setUserVote(prev => ({ ...prev, poll_id: poll.id, user_id: user.id, vote: vote }));

      // Backend Update
      let updatedVoteResponse;
      if (originalUserVote?.id && typeof originalUserVote.id === 'string') {
        // Update existing vote using the original vote's ID
        updatedVoteResponse = await PollVote.update(originalUserVote.id, { vote });
      } else {
        // Create new vote
        updatedVoteResponse = await PollVote.create({ 
          poll_id: poll.id, 
          user_id: user.id, 
          vote 
        });
      }
      
      setUserVote(updatedVoteResponse); // Set the real vote object from backend
      toast.success("Vote recorded!");

      // Re-fetch for consistency after a short delay
      setTimeout(async () => {
        try {
          const updatedPolls = await Poll.filter({ id: poll.id });
          if (updatedPolls.length > 0) {
            setPoll(updatedPolls[0]);
            if (onPollUpdate) {
              onPollUpdate(updatedPolls[0]);
            }
          }
        } catch (error) {
          console.warn("Could not refresh poll data:", error);
        }
      }, 1000);

    } catch (error) {
      console.error("Failed to vote:", error);
      
      // Rollback optimistic update
      setPoll(originalPoll);
      setUserVote(originalUserVote);
      
      // Handle different error scenarios
      if (error.message && error.message.includes('404')) {
        toast.error("Your previous vote was not found. Attempting to create a new one...");
        try {
          // Attempt to create a new vote if update failed due to 404
          const newVote = await PollVote.create({ 
            poll_id: poll.id, 
            user_id: user.id, 
            vote 
          });
          setUserVote(newVote);
          toast.success("New vote recorded successfully!");
          // Re-fetch poll data after successful creation
          setTimeout(async () => {
            try {
              const updatedPolls = await Poll.filter({ id: poll.id });
              if (updatedPolls.length > 0) {
                setPoll(updatedPolls[0]);
                if (onPollUpdate) {
                  onPollUpdate(updatedPolls[0]);
                }
              }
            } catch (refreshError) {
              console.warn("Could not refresh poll data after new vote creation:", refreshError);
            }
          }, 1000);
        } catch (createError) {
          console.error("Failed to create new vote:", createError);
          toast.error("Could not record vote. Please try again.");
        }
      } else {
        toast.error("Could not record vote. Please try again.");
      }
    }
  };

  const handlePledgeClick = () => {
    if (!user) {
      toast.info("Please log in to make a pledge!");
      return;
    }

    if (!pledgesEnabled) {
      toast.error("Pledges are currently disabled by administrators.");
      return;
    }

    const isPremiumUser = subscription && ['premium', 'vip'].includes(subscription.plan_type);

    if (!isPremiumUser) {
      setShowUpgradePrompt(true);
      return;
    }

    setShowPledgeModal(true);
  };

  const handlePledge = async (pledgeData) => {
    // Additional server-side validation
    if (!pledgesEnabled) {
      toast.error("Pledges are currently disabled.");
      return;
    }

    try {
      await Pledge.create({
        ...pledgeData,
        user_id: user.id,
        poll_id: poll.id,
        status: 'active'
      });

      loadPollData();
      setShowPledgeModal(false);
      toast.success("Pledge created successfully!");
    } catch (error) {
      console.error("Error creating pledge:", error);
      toast.error("Failed to create pledge. Please try again.");
    }
  };

  const totalVotes = (poll?.buy_votes || 0) + (poll?.sell_votes || 0) + (poll?.hold_votes || 0);
  const buyPercent = totalVotes > 0 ? Math.round(((poll?.buy_votes || 0) / totalVotes) * 100) : 0;
  const sellPercent = totalVotes > 0 ? Math.round(((poll?.sell_votes || 0) / totalVotes) * 100) : 0;
  const holdPercent = totalVotes > 0 ? Math.round(((poll?.hold_votes || 0) / totalVotes) * 100) : 0; // Fixed original calculation to sum up to 100%

  // Refactored PollBar component based on new CSS outline
  const PollBar = ({ label, value, percentage, barFillColorClass, indicatorColorClass }) => (
    <div className="mb-2.5">
      <div className="flex items-center text-sm mb-1.5 text-gray-600">
        <div className={`w-3 h-3 rounded-full mr-2 flex-shrink-0 ${indicatorColorClass}`}></div>
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-xs text-slate-500">{value} ({percentage}%)</span>
      </div>
      <Progress
        value={percentage}
        className={`h-2 rounded-lg bg-gray-200 [&>div]:rounded-lg [&>div]:${barFillColorClass}`}
      />
    </div>
  );

  return (
    <>
      <Card className="shadow-lg border-0 bg-white"> {/* Updated Card styles from outline */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            {/* Updated CardTitle styles from outline */}
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" /> {/* Changed icon color from outline */}
              Daily Poll & Pledge
            </CardTitle>
            {poll?.is_premium && <Badge className="text-xs bg-purple-100 text-purple-700 border-0">Premium</Badge>} {/* Added from outline */}
            {!pledgesEnabled && ( // Kept original pledgesEnabled logic
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-200 text-xs">
                Pledges Disabled
              </Badge>
            )}
          </div>
          {poll && <p className="text-sm text-slate-600 line-clamp-2">{poll.title}</p>} {/* Added from outline */}
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : !poll ? (
            <div className="text-center text-slate-500">
              <Target className="w-12 h-12 mx-auto mb-2" />
              <p>No active poll for {stockSymbol}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <PollBar
                  label="Buy"
                  value={poll.buy_votes || 0}
                  percentage={buyPercent}
                  barFillColorClass="bg-green-500"
                  indicatorColorClass="bg-green-500"
                />
                <PollBar
                  label="Sell"
                  value={poll.sell_votes || 0}
                  percentage={sellPercent}
                  barFillColorClass="bg-red-500"
                  indicatorColorClass="bg-red-500"
                />
                <PollBar
                  label="Hold"
                  value={poll.hold_votes || 0}
                  percentage={holdPercent}
                  barFillColorClass="bg-orange-500"
                  indicatorColorClass="bg-orange-500"
                />
              </div>

              <div className="text-xs text-slate-500 pt-2 border-t">
                Total Votes: {totalVotes}
              </div>

              {/* Updated Voting Buttons section from outline */}
              {user && (
                <div className="pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-2 font-medium">Cast your vote:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleVote('buy')}
                      size="sm"
                      disabled={!user}
                      className={cn("text-white text-xs px-2 py-1 transition-all", userVote?.vote === 'buy' ? "bg-green-700 ring-2 ring-green-400 ring-offset-1" : "bg-green-500 hover:bg-green-600")}
                    >
                      {userVote?.vote === 'buy' && <CheckCircle className="w-3 h-3 mr-1" />}
                      Buy
                    </Button>
                    <Button
                      onClick={() => handleVote('sell')}
                      size="sm"
                      disabled={!user}
                      className={cn("text-white text-xs px-2 py-1 transition-all", userVote?.vote === 'sell' ? "bg-red-700 ring-2 ring-red-400 ring-offset-1" : "bg-red-500 hover:bg-red-600")}
                    >
                      {userVote?.vote === 'sell' && <CheckCircle className="w-3 h-3 mr-1" />}
                      Sell
                    </Button>
                    <Button
                      onClick={() => handleVote('hold')}
                      size="sm"
                      disabled={!user}
                      className={cn("text-white text-xs px-2 py-1 transition-all", userVote?.vote === 'hold' ? "bg-yellow-600 ring-2 ring-yellow-400 ring-offset-1" : "bg-yellow-500 hover:bg-yellow-600")}
                    >
                      {userVote?.vote === 'hold' && <CheckCircle className="w-3 h-3 mr-1" />}
                      Hold
                    </Button>
                  </div>
                </div>
              )}

              {!!userPledge ? (
                <Button 
                  disabled 
                  className="w-full py-2 rounded-xl px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold shadow-md hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                >
                  PLEDGED: ₹{userPledge.amount_committed?.toLocaleString() || 'N/A'}
                </Button>
              ) : (
                <Button 
                  onClick={handlePledgeClick}
                  disabled={!user || !pledgesEnabled}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-md transition-all duration-300"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Make Pledge
                </Button>
              )}

              {!pledgesEnabled && (
                <div className="text-xs text-orange-600 text-center bg-orange-50 p-2 rounded-lg">
                  Pledges are currently disabled by administrators.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <PledgeModal
        open={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        stockSymbol={stockSymbol}
        userVote={userVote?.vote}
        onPledge={handlePledge}
      />

      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-purple-600" />
                Premium Feature
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-slate-600">
                Pledging is available for Premium and VIP members only. Upgrade your subscription to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  Make investment pledges with the community
                </li>
                <li className="flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-600" />
                  Access premium chat rooms and admin insights
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  Join exclusive trading events and webinars
                </li>
              </ul>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowUpgradePrompt(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Link to={createPageUrl("Subscription")} className="flex-1">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
