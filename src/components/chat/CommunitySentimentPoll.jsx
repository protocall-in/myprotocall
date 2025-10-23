import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Poll, PollVote, Pledge } from '@/api/entities';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import PollCard from '../polls/PollCard';
import { Skeleton } from '@/components/ui/skeleton';

export default function CommunitySentimentPoll({ stockSymbol, user, refreshTrigger = 0 }) {
  const [poll, setPoll] = useState(null);
  const [userVote, setUserVote] = useState(null);
  const [userPledge, setUserPledge] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const isMountedRef = useRef(true);

  const fetchPollAndUserData = useCallback(async () => {
    if (!isMountedRef.current) return;

    if (!stockSymbol) {
      if (isMountedRef.current) {
        setIsLoading(false);
        setPoll(null);
      }
      return;
    }

    if (isMountedRef.current) setIsLoading(true);

    try {
      console.log("Fetching polls for stock:", stockSymbol); // Debug log

      // Fetch the most recent active poll for this stock
      const polls = await Poll.filter({
        stock_symbol: stockSymbol,
        is_active: true
      }, '-created_date', 10); // Fetch top 10 to debug

      console.log("Polls found:", polls); // Debug log

      if (!isMountedRef.current) return;

      if (polls.length > 0) {
        const activePoll = polls[0];
        console.log("Active poll selected:", activePoll); // Debug log
        setPoll(activePoll);

        if (user) {
          // Fetch user vote
          const userVotes = await PollVote.filter({
            poll_id: activePoll.id,
            user_id: user.id
          });
          
          if (!isMountedRef.current) return;
          
          console.log("User votes:", userVotes); // Debug log
          setUserVote(userVotes.length > 0 ? userVotes[0] : null);

          // Fetch user pledge if it's a pledge poll
          if (activePoll.poll_type === 'pledge_poll') {
            const userPledges = await Pledge.filter({
              poll_id: activePoll.id,
              user_id: user.id
            });
            
            if (!isMountedRef.current) return;
            
            setUserPledge(userPledges.length > 0 ? userPledges[0] : null);
          } else {
            if (isMountedRef.current) setUserPledge(null);
          }
        } else {
          if (isMountedRef.current) {
            setUserVote(null);
            setUserPledge(null);
          }
        }
      } else {
        console.log("No active polls found for stock:", stockSymbol); // Debug log
        if (isMountedRef.current) {
          setPoll(null);
          setUserVote(null);
          setUserPledge(null);
        }
      }
    } catch (error) {
      console.error("Error fetching community sentiment poll and user data:", error);
      if (isMountedRef.current) {
        setPoll(null);
        setUserVote(null);
        setUserPledge(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [stockSymbol, user]);

  // Effect to fetch poll data initially and when dependencies change
  useEffect(() => {
    isMountedRef.current = true;
    console.log("CommunitySentimentPoll: Refresh triggered", { stockSymbol, refreshTrigger }); // Debug log
    fetchPollAndUserData();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchPollAndUserData, refreshTrigger]); // refreshTrigger as dependency

  const handleVote = async (vote) => {
    if (!user) {
      toast.error("Please log in to vote!");
      return;
    }

    if (userVote) {
      toast.info("You've already voted!");
      return;
    }

    if (!poll) {
      toast.error("Poll not found or not active.");
      return;
    }

    if (isVoting) return;
    setIsVoting(true);

    try {
      const currentPoll = poll;

      // Prepare atomic update for vote counts
      const voteFieldUpdates = {
        total_votes: (currentPoll.total_votes || 0) + 1
      };

      // Update appropriate vote count based on poll type
      if (currentPoll.poll_type === 'sentiment') {
        if (vote === 'bullish') voteFieldUpdates.bullish_votes = (currentPoll.bullish_votes || 0) + 1;
        else if (vote === 'bearish') voteFieldUpdates.bearish_votes = (currentPoll.bearish_votes || 0) + 1;
        else if (vote === 'neutral') voteFieldUpdates.neutral_votes = (currentPoll.neutral_votes || 0) + 1;
      } else if (currentPoll.poll_type === 'price_target') {
        if (vote === 'yes') voteFieldUpdates.yes_votes = (currentPoll.yes_votes || 0) + 1;
        else if (vote === 'no') voteFieldUpdates.no_votes = (currentPoll.no_votes || 0) + 1;
      } else { // buy_sell_hold or pledge_poll
        if (vote === 'buy') voteFieldUpdates.buy_votes = (currentPoll.buy_votes || 0) + 1;
        else if (vote === 'sell') voteFieldUpdates.sell_votes = (currentPoll.sell_votes || 0) + 1;
        else if (vote === 'hold') voteFieldUpdates.hold_votes = (currentPoll.hold_votes || 0) + 1;
      }

      console.log("Submitting vote:", { vote, voteFieldUpdates }); // Debug log

      // ATOMIC UPDATE: Create vote and update poll counts simultaneously
      await Promise.all([
        PollVote.create({ poll_id: currentPoll.id, user_id: user.id, vote }),
        Poll.update(currentPoll.id, voteFieldUpdates)
      ]);

      toast.success(`Voted ${vote}!`);
      
      // Reload polls to get authoritative state from database
      await fetchPollAndUserData();

    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote. Please try again.");
      await fetchPollAndUserData();
    } finally {
      setIsVoting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-lg border-0 bg-white">
        <CardContent className="p-4">
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!poll) {
    return null;
  }

  return (
    <PollCard
      poll={poll}
      user={user}
      userVote={userVote?.vote}
      onVoteSubmit={handleVote}
      onViewDetails={() => {}}
      onDelete={null}
      userPledge={userPledge}
    />
  );
}