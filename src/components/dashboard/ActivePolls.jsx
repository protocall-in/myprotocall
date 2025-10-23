import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ActivePolls({ polls }) {
  // Fallback sample data
  const samplePolls = [
    {
      id: '1',
      title: 'Should we buy RELIANCE at current levels?',
      stock_symbol: 'RELIANCE',
      buy_votes: 145,
      sell_votes: 23,
      hold_votes: 87,
      total_votes: 255
    },
    {
      id: '2',
      title: 'TCS Q3 Results Impact',
      stock_symbol: 'TCS',
      buy_votes: 89,
      sell_votes: 34,
      hold_votes: 156,
      total_votes: 279
    },
    {
      id: '3',
      title: 'Banking Sector Outlook',
      stock_symbol: 'HDFCBANK',
      buy_votes: 167,
      sell_votes: 45,
      hold_votes: 98,
      total_votes: 310
    }
  ];

  const pollData = polls.length > 0 ? polls : samplePolls;

  const getVoteIcon = (vote) => {
    switch(vote) {
      case 'buy': return <TrendingUp className="w-3 h-3" />;
      case 'sell': return <TrendingDown className="w-3 h-3" />;
      case 'hold': return <Minus className="w-3 h-3" />;
      default: return null;
    }
  };

  const getWinningVote = (poll) => {
    const votes = [
      { type: 'buy', count: poll.buy_votes || 0 },
      { type: 'sell', count: poll.sell_votes || 0 },
      { type: 'hold', count: poll.hold_votes || 0 }
    ];
    return votes.reduce((a, b) => a.count > b.count ? a : b);
  };

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-purple-50">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-slate-900">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            Active Polls
          </CardTitle>
          <Link to={createPageUrl("Polls")}>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {pollData.slice(0, 3).map(poll => {
            const winningVote = getWinningVote(poll);
            const totalVotes = poll.total_votes || 0;
            
            return (
              <div key={poll.id} className="p-3 rounded-lg border bg-gradient-to-br from-white to-slate-50">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm text-slate-900 mb-1">{poll.title}</h4>
                    <Badge variant="outline" className="text-xs">
                      {poll.stock_symbol}
                    </Badge>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      winningVote.type === 'buy' ? 'bg-green-100 text-green-800 border-green-200' :
                      winningVote.type === 'sell' ? 'bg-red-100 text-red-800 border-red-200' :
                      'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }`}
                  >
                    {getVoteIcon(winningVote.type)}
                    <span className="ml-1 capitalize">{winningVote.type}</span>
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{totalVotes} votes</span>
                  <span>{winningVote.count > 0 ? Math.round((winningVote.count / totalVotes) * 100) : 0}% consensus</span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}