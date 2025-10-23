
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, X, MessageSquare, BarChart3, Bell, Lock, Crown, CheckCircle, Pause, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { User, Poll, AdvisorPost, Subscription } from "@/api/entities";
import AlertModal from "./AlertModal";
import AdDisplay from "@/components/common/AdDisplay"; // Assuming AdDisplay component is located here

export default function StockCard({ stock, onRemove, onSell, showRemove = false, userInvestment, onWatchlistChange, onInvestmentChange }) {
  const [communityAdvice, setCommunityAdvice] = useState(null);
  const [user, setUser] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAlertModal, setShowAlertModal] = useState(false);

  const isPositive = stock.change_percent >= 0;

  useEffect(() => {
    const loadCommunityAdvice = async () => {
      try {
        // Get community polls for this stock
        const polls = await Poll.filter({
          stock_symbol: stock.symbol,
          is_active: true
        }, '-total_votes', 3).catch(() => []);

        // Get advisor recommendations
        const advisorPosts = await AdvisorPost.filter({
          stock_symbol: stock.symbol
        }, '-created_date', 3).catch(() => []);

        // Calculate consensus
        let communityVotes = { buy: 0, sell: 0, hold: 0 };
        let advisorRecommendations = { buy: 0, sell: 0, hold: 0 };

        // Aggregate community poll results
        polls.forEach((poll) => {
          communityVotes.buy += poll.buy_votes || 0;
          communityVotes.sell += poll.sell_votes || 0;
          communityVotes.hold += poll.hold_votes || 0;
        });

        // Aggregate advisor recommendations
        advisorPosts.forEach((post) => {
          if (post.recommendation_type === 'buy') advisorRecommendations.buy++;
          else if (post.recommendation_type === 'sell') advisorRecommendations.sell++;
          else if (post.recommendation_type === 'hold') advisorRecommendations.hold++;
        });

        // Determine consensus (weighted: advisor recommendations count more)
        const weightedScores = {
          buy: communityVotes.buy + advisorRecommendations.buy * 10,
          sell: communityVotes.sell + advisorRecommendations.sell * 10,
          hold: communityVotes.hold + advisorRecommendations.hold * 10
        };

        const consensus = Object.keys(weightedScores).reduce((a, b) =>
          weightedScores[a] > weightedScores[b] ? a : b
        );

        setCommunityAdvice({
          consensus,
          communityVotes,
          advisorCount: advisorPosts.length,
          confidence: Math.min(100, Math.max(50, advisorRecommendations[consensus] * 20 + 30))
        });
      } catch (error) {
        console.error("Error loading community advice:", error);
      }
    };

    const loadUserData = async () => {
      try {
        const currentUser = await User.me().catch(() => null);
        setUser(currentUser);
        if (!currentUser) {
          setIsLoading(false);
          return;
        }

        // Check if user is premium
        const subscription = await Subscription.filter({
          user_id: currentUser.id,
          status: 'active'
        }, '-created_date', 1).catch(() => []);
        const userIsPremium = subscription.length > 0 && ['premium', 'vip'].includes(subscription[0].plan_type);
        setIsPremium(userIsPremium);

        // Load community advice for premium users
        if (userIsPremium) {
          await loadCommunityAdvice();
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [stock.symbol]);

  const calculateProfitLoss = () => {
    if (!userInvestment || !stock.current_price) return null;

    const currentValue = userInvestment.quantity * stock.current_price;
    const investedAmount = userInvestment.total_invested;
    const profitLoss = currentValue - investedAmount;
    const profitLossPercent = profitLoss / investedAmount * 100;

    return {
      profitLoss,
      profitLossPercent,
      currentValue,
      investedAmount
    };
  };

  const getAdviceIcon = (advice) => {
    switch (advice) {
      case 'buy': return <CheckCircle className="w-4 h-4" />;
      case 'sell': return <XCircle className="w-4 h-4" />;
      case 'hold': return <Pause className="w-4 h-4" />;
      default: return <Pause className="w-4 h-4" />;
    }
  };

  const getAdviceColor = (advice) => {
    switch (advice) {
      case 'buy': return 'bg-green-50 border-green-200 text-green-800';
      case 'sell': return 'bg-red-50 border-red-200 text-red-800';
      case 'hold': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const profitLossData = calculateProfitLoss();

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white relative overflow-hidden flex flex-col">
        {Math.random() < 0.3 && ( // Show ads on ~30% of stock cards
          <div className="p-4 border-b">
            <AdDisplay
              placement="stocks"
              userContext={{
                stock_symbol: stock.symbol,
                sectors: [stock.sector]
              }}
              className="mb-0"
            />
          </div>
        )}

        {showRemove &&
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 z-10 h-6 w-6"
            onClick={() => onRemove(stock.id)}>

            <X className="w-3 h-3" />
          </Button>
        }

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{stock.symbol}</CardTitle>
              <p className="text-xs text-slate-500 truncate">{stock.company_name}</p>
            </div>
            {stock.is_trending &&
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                Trending
              </Badge>
            }
          </div>
        </CardHeader>

        <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
          <div>
            {/* Price Section */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900">₹{stock.current_price?.toFixed(2)}</span>
                <Badge
                  variant="outline" className={`${isPositive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                  {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                  {isPositive ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                </Badge>
              </div>

              {/* User Investment & Profit/Loss */}
              {!isLoading &&
                <div className="bg-slate-50 rounded-lg p-3">
                  {userInvestment && profitLossData ?
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Avg. Buy Price</span>
                        <span className="text-sm font-medium">₹{userInvestment.avg_buy_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Quantity</span>
                        <span className="text-sm font-medium">{userInvestment.quantity}</span>
                      </div>
                      <div className="flex justify-between items-center border-t pt-2 mt-2">
                        <span className="text-sm text-slate-600">P&L</span>
                        <span className={`text-sm font-bold ${profitLossData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {profitLossData.profitLoss >= 0 ? '+' : ''}₹{profitLossData.profitLoss?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          ({profitLossData.profitLoss >= 0 ? '+' : ''}{profitLossData.profitLossPercent?.toFixed(1)}%)
                        </span>
                      </div>
                    </div> :

                    <div className="text-center">
                      <span className="text-sm text-slate-400">No investment data</span>
                    </div>
                  }
                </div>
              }
            </div>

            {/* Premium Advice Section */}
            {!isLoading && isPremium && communityAdvice &&
              <div className="space-y-2 mb-4">
                <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-purple-500" />
                  Community & Advisor Insights
                </h4>
                <div className={`rounded-lg p-3 border ${getAdviceColor(communityAdvice.consensus)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getAdviceIcon(communityAdvice.consensus)}
                      <span className="font-semibold text-sm uppercase">
                        Consensus: {communityAdvice.consensus}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {communityAdvice.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="text-xs opacity-75">
                    Based on {communityAdvice.advisorCount} advisor(s) and community polls
                  </div>
                </div>
              </div>
            }
          </div>

          <div>
            {/* Sector Badge */}
            <Badge variant="outline" className="w-fit mb-4">
              {stock.sector}
            </Badge>

            {/* Navigation Buttons */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Link to={createPageUrl("ChatRooms", { stockSymbol: stock.symbol })}>
                <Button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
                  <MessageSquare className="w-3 h-3" />
                  Chat
                </Button>
              </Link>
              <Link to={createPageUrl("Polls", { stockSymbol: stock.symbol })}>
                <Button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
                  <BarChart3 className="w-3 h-3" />
                  Poll
                </Button>
              </Link>
            </div>

            {/* Investment Action Buttons */}
            {userInvestment ? (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => onSell(stock)}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  <TrendingDown className="w-4 h-4 mr-2" />
                  Sell
                </Button>
                <Button
                  onClick={() => setShowAlertModal(true)}
                  variant="outline"
                  className="w-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            ) : (
              <div className="w-full">
                <Button
                  onClick={() => setShowAlertModal(true)}
                  variant="outline"
                  className="w-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50">
                  <Bell className="w-4 h-4 mr-2" />
                  Set Alert
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertModal
        open={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        stock={stock}
        user={user}
        isPremium={isPremium} />

    </>
  );
}
