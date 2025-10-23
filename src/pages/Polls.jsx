import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Poll, PollVote, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Plus,
  Search,
  TrendingUp,
  Users,
  Clock,
  Award, 
  Star, 
  Check, 
  X, 
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { toast } from 'sonner';

import PollCard from "../components/polls/PollCard";
import CreatePollModal from "../components/polls/CreatePollModal";
import VoteModal from "../components/polls/VoteModal";
import AdDisplay from "../components/dashboard/AdDisplay";

export default function Polls() {
  const [polls, setPolls] = useState([]);
  const [userVotes, setUserVotes] = useState({});
  const [user, setUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVoteModal, setShowVoteModal] = useState(false);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const isMountedRef = useRef(true);
  const pollSubscriptionRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    setIsLoading(true);
    try {
      const currentUser = await User.me().catch(() => null);
      if (!isMountedRef.current) return;
      
      setUser(currentUser);

      const [allPolls, allVotes] = await Promise.all([
        Poll.list('-created_date').catch((error) => {
          if (error.message?.includes('aborted')) return [];
          console.error("Error loading polls:", error);
          return [];
        }),
        currentUser ? PollVote.filter({ user_id: currentUser.id }).catch(() => []) : Promise.resolve([])
      ]);

      if (!isMountedRef.current) return;

      setPolls(allPolls);
      const votesMap = {};
      allVotes.forEach(v => {
        votesMap[v.poll_id] = v.vote;
      });
      setUserVotes(votesMap);

      const urlParams = new URLSearchParams(window.location.search);
      const stockSymbolFromUrl = urlParams.get('stock_symbol');
      if (stockSymbolFromUrl) {
        setSearchTerm(stockSymbolFromUrl);
      }

    } catch (error) {
      if (!isMountedRef.current || error.message?.includes('aborted')) return;
      console.error("Error loading polls:", error);
      toast.error("Failed to load polls data.");
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();
    
    let pollInterval = null;
    
    const setupSubscription = async () => {
      try {
        if (typeof Poll.subscribe === 'function') {
          pollSubscriptionRef.current = await Poll.subscribe((event) => {
            console.log('Poll update received:', event);
            if (isMountedRef.current) {
                loadData();
            }
          });
          
          if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
          }
        } else {
          throw new Error('Subscribe not available');
        }
      } catch (error) {
        console.warn("Poll subscription not available or failed, falling back to polling:", error);
        if (!pollInterval && isMountedRef.current) {
          pollInterval = setInterval(() => {
            if (isMountedRef.current) {
              loadData();
            }
          }, 30000);
        }
      }
    };

    setupSubscription();
    
    return () => {
      isMountedRef.current = false;
      
      if (pollSubscriptionRef.current) {
        if (typeof pollSubscriptionRef.current.unsubscribe === 'function') {
          pollSubscriptionRef.current.unsubscribe();
        } else if (typeof pollSubscriptionRef.current === 'function') {
          pollSubscriptionRef.current();
        }
        pollSubscriptionRef.current = null;
      }
      
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };
  }, [loadData, refreshTrigger]);

  const handleVote = async (pollId, vote) => {
    if (!user) {
      toast.error("Please log in to vote!");
      return;
    }

    if (userVotes[pollId]) {
      toast.info("You have already voted on this poll.");
      return;
    }

    try {
      const poll = polls.find(p => p.id === pollId);
      if (!poll) {
        toast.error("Poll not found");
        return;
      }

      let voteFieldUpdates = { total_votes: (poll.total_votes || 0) + 1 };
      
      if (poll.poll_type === 'sentiment') {
        if (vote === 'bullish') voteFieldUpdates.bullish_votes = (poll.bullish_votes || 0) + 1;
        else if (vote === 'bearish') voteFieldUpdates.bearish_votes = (poll.bearish_votes || 0) + 1;
        else if (vote === 'neutral') voteFieldUpdates.neutral_votes = (poll.neutral_votes || 0) + 1;
      } else if (poll.poll_type === 'price_target') {
        if (vote === 'yes') voteFieldUpdates.yes_votes = (poll.yes_votes || 0) + 1;
        else if (vote === 'no') voteFieldUpdates.no_votes = (poll.no_votes || 0) + 1;
      } else {
        if (vote === 'buy') voteFieldUpdates.buy_votes = (poll.buy_votes || 0) + 1;
        else if (vote === 'sell') voteFieldUpdates.sell_votes = (poll.sell_votes || 0) + 1;
        else if (vote === 'hold') voteFieldUpdates.hold_votes = (poll.hold_votes || 0) + 1;
      }

      await Promise.all([
        PollVote.create({ poll_id: pollId, user_id: user.id, vote }),
        Poll.update(pollId, voteFieldUpdates)
      ]);

      setUserVotes(prev => ({ ...prev, [pollId]: vote }));
      
      const updatedPolls = await Poll.list('-created_date');
      setPolls(updatedPolls);

      toast.success("Your vote has been recorded!");
      setShowVoteModal(false);

    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record vote. Please try again.");
      loadData();
    }
  };

  const handleCreatePoll = async (pollData) => {
    if (!user) {
      toast.error("Please log in to create a poll!");
      return;
    }
    try {
      await Poll.create(pollData);
      toast.success("Poll created successfully!");
      setShowCreateModal(false);
      
      setRefreshTrigger(prev => prev + 1);
      loadData();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll. Please try again.");
    }
  };

  const handleDeletePoll = async (poll) => {
    if (window.confirm(`Are you sure you want to delete the poll "${poll.title}"? This action cannot be undone.`)) {
      try {
        await Poll.delete(poll.id);
        loadData();
        toast.success("Poll deleted successfully!");
      } catch (error) {
        console.error("Error deleting poll:", error);
        toast.error("Failed to delete the poll. Please try again.");
      }
    }
  };

  const filteredPolls = useMemo(() => {
    return polls.filter(poll => {
      const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (poll.stock_symbol && poll.stock_symbol.toLowerCase().includes(searchTerm.toLowerCase()));

      let matchesFilter = true;
      if (filter === 'premium') {
        matchesFilter = poll.is_premium === true;
      } else if (filter === 'free') {
        matchesFilter = !poll.is_premium && !poll.created_by_admin && poll.created_by_role !== 'admin' && poll.created_by_role !== 'advisor';
      } else if (filter === 'advisor') {
        matchesFilter = (poll.created_by_admin === true || poll.created_by_role === 'admin' || poll.created_by_role === 'advisor') && !poll.is_premium;
      } else if (filter === 'voted') {
        matchesFilter = !!userVotes[poll.id];
      } else if (filter === 'won') {
        const userVoteValue = userVotes[poll.id];
        if (!userVoteValue || poll.total_votes === 0) {
          matchesFilter = false;
        } else {
          let isWon = false;
          if (poll.poll_type === 'pledge_poll' || poll.poll_type === 'buy_sell_hold') {
            const votes = {
              buy: poll.buy_votes || 0,
              sell: poll.sell_votes || 0,
              hold: poll.hold_votes || 0,
            };
            const maxVotes = Math.max(votes.buy, votes.sell, votes.hold);
            isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
          } else if (poll.poll_type === 'sentiment') {
            const votes = {
              bullish: poll.bullish_votes || 0,
              bearish: poll.bearish_votes || 0,
              neutral: poll.neutral_votes || 0,
            };
            const maxVotes = Math.max(votes.bullish, votes.bearish, votes.neutral);
            isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
          } else if (poll.poll_type === 'price_target') {
            const votes = {
              yes: poll.yes_votes || 0,
              no: poll.no_votes || 0,
            };
            const maxVotes = Math.max(votes.yes, votes.no);
            isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
          }
          matchesFilter = isWon;
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [polls, searchTerm, filter, userVotes]);

  const userStats = useMemo(() => {
    const pollsVoted = Object.keys(userVotes).length;
    const activeParticipants = new Set(polls.map(p => p.created_by).filter(Boolean)).size;
    
    let wonPolls = 0;
    polls.forEach(poll => {
      const userVoteValue = userVotes[poll.id];
      if (userVoteValue && poll.total_votes > 0) {
        let isWon = false;
        if (poll.poll_type === 'pledge_poll' || poll.poll_type === 'buy_sell_hold') {
          const votes = {
            buy: poll.buy_votes || 0,
            sell: poll.sell_votes || 0,
            hold: poll.hold_votes || 0,
          };
          const maxVotes = Math.max(votes.buy, votes.sell, votes.hold);
          isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
        } else if (poll.poll_type === 'sentiment') {
          const votes = {
            bullish: poll.bullish_votes || 0,
            bearish: poll.bearish_votes || 0,
            neutral: poll.neutral_votes || 0,
          };
          const maxVotes = Math.max(votes.bullish, votes.bearish, votes.neutral);
          isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
        } else if (poll.poll_type === 'price_target') {
          const votes = {
            yes: poll.yes_votes || 0,
            no: poll.no_votes || 0,
          };
          const maxVotes = Math.max(votes.yes, votes.no);
          isWon = votes[userVoteValue] === maxVotes && maxVotes > 0;
        }
        if (isWon) {
          wonPolls++;
        }
      }
    });

    const successRate = pollsVoted > 0 ? Math.round((wonPolls / pollsVoted) * 100) : 0;

    return { pollsVoted, activeParticipants, wonPolls, successRate };
  }, [polls, userVotes]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-20 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-purple-700 bg-clip-text text-transparent">
              Community Polls
            </h1>
            <p className="text-slate-600 mt-1">Vote and make informed decisions together</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <BarChart3 className="w-3 h-3 mr-1" />
              {polls.filter(p => p.is_active).length} Active
            </Badge>
            <Button onClick={() => setShowCreateModal(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="w-4 h-4 mr-2" />
              Create Poll
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Polls Voted</p>
                  <p className="text-xl font-bold">{userStats.pollsVoted}</p>
                </div>
                <Check className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-emerald-500 to-cyan-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Active Participants</p>
                  <p className="text-xl font-bold">{userStats.activeParticipants}</p>
                </div>
                <Users className="w-6 h-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">My Won Polls</p>
                  <p className="text-xl font-bold">{userStats.wonPolls}</p>
                </div>
                <Star className="w-6 h-6 text-amber-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-pink-500 to-rose-600 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">Success Rate</p>
                  <p className="text-xl font-bold">{userStats.successRate}%</p>
                </div>
                <Award className="w-6 h-6 text-pink-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search polls by title or stock symbol..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-bar-input pl-10"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "All Polls", icon: BarChart3 },
              { value: "premium", label: "Premium", icon: Star },
              { value: "free", label: "Free", icon: Users },
              { value: "advisor", label: "Advisor", icon: Award },
              { value: "voted", label: "Voted", icon: Check },
              { value: "won", label: "Won", icon: TrendingUp },
            ].map(filterOption => (
              <Button
                key={filterOption.value}
                onClick={() => setFilter(filterOption.value)}
                className={`justify-center whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 disabled:pointer-events-none disabled:opacity-50 h-9 text-xs sm:text-sm rounded-xl font-semibold shadow-md flex items-center gap-2 px-2 sm:px-3 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg ${
                  filter === filterOption.value ?
                    'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' :
                    ''
                  }`
                }
              >
                <filterOption.icon className="w-4 h-4" />
                {filterOption.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Polls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPolls.map((poll, index) => {
            return (
              <React.Fragment key={poll.id}>
                <PollCard
                  poll={poll}
                  user={user}
                  userVote={userVotes[poll.id]}
                  onVoteSubmit={(vote) => handleVote(poll.id, vote)}
                  onViewDetails={() => {
                    setSelectedPoll(poll);
                    setShowVoteModal(true);
                  }}
                  onDelete={handleDeletePoll}
                  userPledge={null}
                />
                
                {index > 0 && (index + 1) % 6 === 0 && index < 12 && (
                  <div className="md:col-span-2 lg:col-span-3">
                    <AdDisplay 
                      placement="polls" 
                      userContext={{
                        stock_symbol: poll.stock_symbol
                      }}
                      className="w-full"
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Modals */}
        <CreatePollModal
          open={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          room={null}
          user={user}
          onCreatePoll={handleCreatePoll}
        />

        <VoteModal
          open={showVoteModal}
          onClose={() => setShowVoteModal(false)}
          poll={selectedPoll}
          userVote={selectedPoll ? userVotes[selectedPoll.id] : undefined}
          onVote={handleVote}
        />
      </div>
    </div>
  );
}