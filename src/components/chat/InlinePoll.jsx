
import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChatPoll, ChatPollVote, User, Subscription as SubEntity } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Target, 
  Crown, 
  Lock,
  Clock,
  CheckCircle
} from "lucide-react";
import { format } from "date-fns";

import PledgeModal from "./PledgeModal";

export default function InlinePoll({ chatRoomId, stockSymbol, onPollUpdate }) {
  const [poll, setPoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [showPledgeModal, setShowPledgeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isMountedRef = useRef(true); // Ref to track component mount status

  const loadPollData = useCallback(async () => {
    if (!isMountedRef.current) return; // Exit if component is unmounted
    
    try {
      const [currentUser, userSub] = await Promise.all([
        User.me().catch(() => null),
        User.me().then(u => u ? SubEntity.filter({ user_id: u.id, status: 'active' }, '-created_date', 1) : []).catch(() => [])
      ]);

      if (!isMountedRef.current) return; // Check again after async operation

      setUser(currentUser);
      setSubscription(userSub[0] || null);

      if (chatRoomId && stockSymbol) {
        const today = new Date().toISOString().split('T')[0];
        const polls = await ChatPoll.filter({ 
          chat_room_id: chatRoomId, 
          stock_symbol: stockSymbol,
          poll_date: today,
          is_active: true 
        }).catch(() => []);

        if (!isMountedRef.current) return; // Check again after async operation

        let currentPoll = polls[0];
        
        if (!currentPoll) {
          // Create new poll for today
          try {
            currentPoll = await ChatPoll.create({
              chat_room_id: chatRoomId,
              stock_symbol: stockSymbol,
              poll_date: today,
              buy_votes: 0,
              sell_votes: 0,
              hold_votes: 0,
              total_votes: 0,
              is_active: true
            });
          } catch (createError) {
            console.error("Error creating poll:", createError);
            currentPoll = null; // Ensure currentPoll is null if creation fails
          }
        }

        if (currentPoll && isMountedRef.current) { // Only update state if component is still mounted
          setPoll(currentPoll);
          onPollUpdate && onPollUpdate(currentPoll);

          // Check if user has voted
          if (currentUser) {
            const vote = await ChatPollVote.filter({
              chat_poll_id: currentPoll.id,
              user_id: currentUser.id,
              vote_date: today
            }).catch(() => []);
            
            if (isMountedRef.current) { // Only update state if component is still mounted
              setUserVote(vote[0] || null);
            }
          }
        }
      }
    } catch (error) {
      if (!isMountedRef.current) return; // Exit if component is unmounted
      console.error("Error loading poll data:", error);
      // Fallback to sample data
      const samplePoll = {
        id: 'sample',
        stock_symbol: stockSymbol,
        buy_votes: 45,
        sell_votes: 12,
        hold_votes: 33,
        total_votes: 90,
        poll_date: new Date().toISOString().split('T')[0]
      };
      if (isMountedRef.current) { // Only update state if component is still mounted
        setPoll(samplePoll);
        onPollUpdate && onPollUpdate(samplePoll);
      }
    } finally {
      if (isMountedRef.current) { // Only update state if component is still mounted
        setIsLoading(false);
      }
    }
  }, [chatRoomId, stockSymbol, onPollUpdate]);

  useEffect(() => {
    isMountedRef.current = true; // Set to true when component mounts
    loadPollData();
    const interval = setInterval(() => {
      if (isMountedRef.current) { // Only fetch if component is still mounted
        loadPollData();
      }
    }, 5000); // Update every 5 seconds
    
    return () => {
      isMountedRef.current = false; // Set to false when component unmounts
      clearInterval(interval);
    };
  }, [loadPollData]);

  const handleVote = async (vote) => {
    if (!user || !poll || !isMountedRef.current) return; // Exit if component is unmounted or no user/poll
    
    const isPremium = subscription && ['premium', 'vip'].includes(subscription.plan_type);
    
    if (!isPremium) {
      // Show upsell for non-premium users
      alert("Upgrade to Premium to participate in polls and make pledges!");
      return;
    }

    if (userVote) return; // Already voted
    
    try {
      const today = new Date().toISOString().split('T')[0];
      await ChatPollVote.create({
        chat_poll_id: poll.id,
        user_id: user.id,
        vote,
        vote_date: today
      });

      // Update poll counts
      const updatedPoll = {
        ...poll,
        [vote + '_votes']: (poll[vote + '_votes'] || 0) + 1,
        total_votes: (poll.total_votes || 0) + 1
      };

      await ChatPoll.update(poll.id, updatedPoll);
      loadPollData();
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const isPremium = subscription && ['premium', 'vip'].includes(subscription.plan_type);

  if (isLoading || !poll) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const buyPercent = poll.total_votes > 0 ? ((poll.buy_votes || 0) / poll.total_votes) * 100 : 0;
  const sellPercent = poll.total_votes > 0 ? ((poll.sell_votes || 0) / poll.total_votes) * 100 : 0;
  const holdPercent = poll.total_votes > 0 ? ((poll.hold_votes || 0) / poll.total_votes) * 100 : 0;

  const getWinningOption = () => {
    const votes = [
      { type: 'buy', count: poll.buy_votes || 0, percent: buyPercent },
      { type: 'sell', count: poll.sell_votes || 0, percent: sellPercent },
      { type: 'hold', count: poll.hold_votes || 0, percent: holdPercent }
    ];
    return votes.reduce((a, b) => a.count > b.count ? a : b);
  };

  const winningOption = getWinningOption();

  return (
    <>
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Target className="w-4 h-4 text-purple-600" />
              Today's Market Decision
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {stockSymbol}
              </Badge>
              <Badge className="bg-purple-100 text-purple-800 text-xs">
                <Clock className="w-3 h-3 mr-1" />
                Live
              </Badge>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4 p-4">
          {/* Poll Results */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">Buy</span>
                </div>
                <span className="text-xs text-slate-600 font-semibold">
                  {poll.buy_votes || 0} votes ({buyPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress value={buyPercent} className="h-3">
                <div className="bg-green-500 h-full rounded-full transition-all duration-300" style={{ width: `${buyPercent}%` }} />
              </Progress>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium text-red-700">Sell</span>
                </div>
                <span className="text-xs text-slate-600 font-semibold">
                  {poll.sell_votes || 0} votes ({sellPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress value={sellPercent} className="h-3">
                <div className="bg-red-500 h-full rounded-full transition-all duration-300" style={{ width: `${sellPercent}%` }} />
              </Progress>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <Minus className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-700">Hold</span>
                </div>
                <span className="text-xs text-slate-600 font-semibold">
                  {poll.hold_votes || 0} votes ({holdPercent.toFixed(1)}%)
                </span>
              </div>
              <Progress value={holdPercent} className="h-3">
                <div className="bg-orange-500 h-full rounded-full transition-all duration-300" style={{ width: `${holdPercent}%` }} />
              </Progress>
            </div>
          </div>

          {/* Community Consensus */}
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-slate-600">Community Consensus:</span>
              <Badge className={`${
                winningOption.type === 'buy' ? 'bg-green-100 text-green-800' :
                winningOption.type === 'sell' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {winningOption.type.toUpperCase()} {winningOption.percent.toFixed(0)}%
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Users className="w-3 h-3" />
              <span>{poll.total_votes || 0} premium members voted</span>
            </div>
          </div>

          {/* Voting Actions */}
          {!isPremium ? (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg text-center">
              <Lock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <h4 className="font-semibold text-purple-900 mb-1">Premium Feature</h4>
              <p className="text-sm text-purple-700 mb-3">
                Upgrade to Premium to vote and make market commitments
              </p>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade Now
              </Button>
            </div>
          ) : userVote ? (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-center">
                <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                <p className="text-sm font-semibold text-green-800">
                  You voted: {userVote.vote.toUpperCase()}
                </p>
                <p className="text-xs text-green-600">
                  Voted at {format(new Date(userVote.created_date || new Date()), 'h:mm a')}
                </p>
              </div>
              <Button 
                onClick={() => setShowPledgeModal(true)}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Target className="w-4 h-4 mr-2" />
                Make Pledge Commitment
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-slate-600 text-center mb-3">Cast your vote for today's session:</p>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleVote('buy')}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Buy
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleVote('sell')}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleVote('hold')}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Minus className="w-4 h-4 mr-2" />
                  Hold
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pledge Modal */}
      <PledgeModal
        open={showPledgeModal}
        onClose={() => setShowPledgeModal(false)}
        stockSymbol={stockSymbol}
        userVote={userVote?.vote}
        onPledgeComplete={() => {
          setShowPledgeModal(false);
          loadPollData();
        }}
      />
    </>
  );
}
