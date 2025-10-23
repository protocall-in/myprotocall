
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Users, 
  Target, 
  Star,
  Shield,
  Crown
} from "lucide-react";
import { toast } from "react-hot-toast"; // Assuming react-hot-toast for toast notifications

export default function VoteModal({ open, onClose, poll, userVote, onVote }) {
  const [selectedVote, setSelectedVote] = useState(userVote || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Reset selectedVote when the modal opens or userVote changes from parent
    if (open) {
      setSelectedVote(userVote || null);
    }
  }, [open, userVote]);

  if (!poll) return null;

  const totalVotes = poll.total_votes || 0;
  
  // Calculate percentages based on poll type
  let voteData = {};
  
  if (poll.poll_type === 'sentiment') {
    voteData = {
      bullish: {
        count: poll.bullish_votes || 0,
        percentage: totalVotes > 0 ? (poll.bullish_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        label: 'Bullish',
        description: 'I think this stock will perform well'
      },
      bearish: {
        count: poll.bearish_votes || 0,
        percentage: totalVotes > 0 ? (poll.bearish_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        label: 'Bearish',
        description: 'I think this stock will perform poorly'
      },
      neutral: {
        count: poll.neutral_votes || 0,
        percentage: totalVotes > 0 ? (poll.neutral_votes || 0) / totalVotes * 100 : 0,
        icon: Minus,
        color: 'text-yellow-600',
        label: 'Neutral',
        description: 'I think this stock will remain stable'
      }
    };
  } else if (poll.poll_type === 'price_target') {
    voteData = {
      yes: {
        count: poll.yes_votes || 0,
        percentage: totalVotes > 0 ? (poll.yes_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        label: 'Yes',
        description: `It will reach ₹${poll.target_price}`
      },
      no: {
        count: poll.no_votes || 0,
        percentage: totalVotes > 0 ? (poll.no_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        label: 'No',
        description: `It won't reach ₹${poll.target_price}`
      }
    };
  } else {
    voteData = {
      buy: {
        count: poll.buy_votes || 0,
        percentage: totalVotes > 0 ? (poll.buy_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingUp,
        color: 'text-green-600',
        label: 'Buy',
        description: 'I think this stock will go up'
      },
      sell: {
        count: poll.sell_votes || 0,
        percentage: totalVotes > 0 ? (poll.sell_votes || 0) / totalVotes * 100 : 0,
        icon: TrendingDown,
        color: 'text-red-600',
        label: 'Sell',
        description: 'I think this stock will go down'
      },
      hold: {
        count: poll.hold_votes || 0,
        percentage: totalVotes > 0 ? (poll.hold_votes || 0) / totalVotes * 100 : 0,
        icon: Minus,
        color: 'text-yellow-600',
        label: 'Hold',
        description: 'I think this stock will stay stable'
      }
    };
  }

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

  const handleSubmit = async () => {
    if (!selectedVote) {
      toast.error("Please select an option to vote");
      return;
    }

    if (userVote) {
      toast.info("You have already voted on this poll");
      return;
    }

    setIsSubmitting(true);
    try {
      // Call parent vote handler which performs atomic update
      // It's assumed the onVote function now accepts poll.id and the selected vote type.
      await onVote(poll.id, selectedVote);
      // Modal will be closed by parent component after successful vote, or if `onClose()` is called here
      // For now, let's keep it as per outline (parent closes)
    } catch (error) {
      console.error('Error submitting vote:', error);
      toast.error('Failed to submit vote. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          {/* Updated title display - Stock Symbol as main title */}
          <DialogTitle>{poll.stock_symbol}</DialogTitle>
          {/* Poll question as semi-bold description */}
          <p className="text-sm text-slate-700 font-semibold mt-2 leading-relaxed">{poll.title}</p>
          <div className="flex items-center gap-2 mt-2">
            {poll.is_premium && (
              <Badge className="bg-purple-100 text-purple-800">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            {poll.created_by_admin && (
              <Badge className="bg-green-100 text-green-800">
                <Shield className="w-3 h-3 mr-1" />
                Admin
              </Badge>
            )}
            <Badge variant="outline" className="text-xs">
              {poll.poll_type === 'sentiment' ? 'Market Sentiment' : 
               poll.poll_type === 'price_target' ? 'Price Target' : 'Trading Poll'}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Target Price Display for Price Target Polls */}
          {poll.poll_type === 'price_target' && poll.target_price && (
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-800">Target Price</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">₹{poll.target_price}</p>
              <p className="text-sm text-orange-700 mt-1">
                Will {poll.stock_symbol} reach this price within the poll duration?
              </p>
            </div>
          )}

          {/* Admin Details */}
          {poll.created_by_admin && poll.poll_type !== 'price_target' && (
            <div className="p-4 bg-green-50 rounded-lg space-y-2">
              {poll.target_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Admin Target Price:</span>
                  <span className="font-semibold text-green-800">₹{poll.target_price}</span>
                </div>
              )}
              {poll.confidence_score && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-green-700">Confidence:</span>
                  <div className="flex">
                    {Array(poll.confidence_score).fill(0).map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Voting Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Current Results</h3>
            
            <div className="space-y-3">
              {Object.entries(voteData).map(([voteType, data]) => (
                <div key={voteType} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <data.icon className={`w-4 h-4 ${data.color}`} />
                      <span>{data.label}</span>
                    </div>
                    <span className="font-semibold">{data.count} votes ({data.percentage.toFixed(1)}%)</span>
                  </div>
                  <Progress value={data.percentage} className="h-3" />
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-slate-500 border-t pt-3">
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                <span>{totalVotes} total votes</span>
              </div>
              {poll.poll_type === 'pledge_poll' && (
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  <span>{poll.total_pledges || 0} pledges</span>
                </div>
              )}
            </div>
          </div>

          {/* Voting Buttons */}
          {!userVote ? (
            <div className="space-y-3">
              <h3 className="font-semibold">
                {poll.poll_type === 'sentiment' ? 'Share Your Market Sentiment' : 
                 poll.poll_type === 'price_target' ? 'Will it reach the target?' : 'Cast Your Vote'}
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(voteData).map(([voteType, data]) => (
                  <Button 
                    key={voteType}
                    size="lg"
                    variant={selectedVote === voteType ? 'default' : 'outline'}
                    onClick={() => setSelectedVote(voteType)}
                    className={`justify-start ${
                      selectedVote === voteType ? (
                        voteType === 'buy' || voteType === 'bullish' || voteType === 'yes' ? 'bg-green-600 hover:bg-green-700 text-white' :
                        voteType === 'sell' || voteType === 'bearish' || voteType === 'no' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        'bg-orange-600 hover:bg-orange-700 text-white'
                      ) : ''
                    }`}
                  >
                    <data.icon className="w-4 h-4 mr-2" />
                    {data.label} - {data.description}
                  </Button>
                ))}
              </div>
              <Button
                size="lg"
                className="w-full mt-4"
                onClick={handleSubmit}
                disabled={isSubmitting || !selectedVote}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          ) : (
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              {/* Updated "You Voted" Badge */}
              <Badge className={`${getUserVoteBadgeStyle(userVote)} text-lg px-4 py-2 rounded-full font-semibold hover:bg-black hover:text-white hover:shadow-md transition-all duration-200 cursor-default`}>
                You voted: {
                  poll.poll_type === 'sentiment' && userVote === 'bullish' ? 'BULLISH' :
                  poll.poll_type === 'sentiment' && userVote === 'bearish' ? 'BEARISH' :
                  poll.poll_type === 'sentiment' && userVote === 'neutral' ? 'NEUTRAL' :
                  poll.poll_type === 'price_target' && userVote === 'yes' ? 'YES' :
                  poll.poll_type === 'price_target' && userVote === 'no' ? 'NO' :
                  userVote.toUpperCase()
                }
              </Badge>
              <p className="text-sm text-slate-600 mt-2">Thank you for participating!</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
