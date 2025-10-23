import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, X, MessageSquare, BarChart3, Bell, Lock, Crown, CheckCircle, Pause, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import AlertModal from "./AlertModal";

export default function SampleStockCard() {
  const [showAlertModal, setShowAlertModal] = useState(false);

  // Sample data showcasing all features
  const sampleStock = {
    id: 'sample-1',
    symbol: 'RELIANCE',
    company_name: 'Reliance Industries Ltd',
    current_price: 2456.75,
    change_percent: 2.3,
    day_high: 2489.60,
    day_low: 2434.20,
    volume: 2547890,
    sector: 'Energy',
    is_trending: true
  };

  const sampleUserInvestment = {
    quantity: 50,
    avg_buy_price: 2200.50,
    total_invested: 110025,
    current_value: 122837.50
  };

  const sampleUser = {
    id: 'sample-user',
    display_name: 'Sample Trader',
    email: 'trader@example.com'
  };

  const sampleCommunityAdvice = {
    consensus: 'buy',
    communityVotes: { buy: 145, sell: 23, hold: 87 },
    advisorCount: 3,
    confidence: 85
  };

  const isPremium = true; // Show premium features in sample
  const isPositive = sampleStock.change_percent >= 0;

  // Calculate profit/loss
  const profitLossData = {
    profitLoss: sampleUserInvestment.current_value - sampleUserInvestment.total_invested,
    profitLossPercent: ((sampleUserInvestment.current_value - sampleUserInvestment.total_invested) / sampleUserInvestment.total_invested) * 100,
    currentValue: sampleUserInvestment.current_value,
    investedAmount: sampleUserInvestment.total_invested
  };

  const getAdviceIcon = (advice) => {
    switch(advice) {
      case 'buy': return <CheckCircle className="w-4 h-4" />;
      case 'sell': return <XCircle className="w-4 h-4" />;
      case 'hold': return <Pause className="w-4 h-4" />;
      default: return <Pause className="w-4 h-4" />;
    }
  };

  const getAdviceColor = (advice) => {
    switch(advice) {
      case 'buy': return 'bg-green-50 border-green-200 text-green-800';
      case 'sell': return 'bg-red-50 border-red-200 text-red-800';
      case 'hold': return 'bg-amber-50 border-amber-200 text-amber-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <>
      <Card className="hover:shadow-lg transition-all duration-200 border-0 bg-white relative overflow-hidden max-w-sm">
        {/* Trending badge */}
        <div className="absolute top-2 right-2 z-10">
          {sampleStock.is_trending && (
            <Badge className="bg-orange-100 text-orange-800 text-xs">
              Trending
            </Badge>
          )}
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{sampleStock.symbol}</CardTitle>
              <p className="text-xs text-slate-500 truncate">{sampleStock.company_name}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Price Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-900">₹{sampleStock.current_price.toFixed(2)}</span>
              <Badge
                variant="outline"
                className={`${isPositive
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-red-100 text-red-800 border-red-200"
                }`}
              >
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {isPositive ? '+' : ''}{sampleStock.change_percent.toFixed(2)}%
              </Badge>
            </div>

            {/* User Investment & Profit/Loss */}
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Invested</span>
                  <span className="text-sm font-medium">₹{sampleUserInvestment.total_invested.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Current Value</span>
                  <span className="text-sm font-medium">₹{profitLossData.currentValue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-sm text-slate-600">P&L</span>
                  <span className={`text-sm font-bold ${profitLossData.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profitLossData.profitLoss >= 0 ? '+' : ''}₹{profitLossData.profitLoss.toLocaleString()}
                    ({profitLossData.profitLoss >= 0 ? '+' : ''}{profitLossData.profitLossPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Day High:</span>
                <span className="font-medium">₹{sampleStock.day_high.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Day Low:</span>
                <span className="font-medium">₹{sampleStock.day_low.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume:</span>
                <span className="font-medium">{(sampleStock.volume / 1000).toFixed(0)}K</span>
              </div>
            </div>
          </div>

          {/* Premium Advice Section */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-500" />
              Community & Advisor Insights
            </h4>

            {isPremium && sampleCommunityAdvice ? (
              <div className={`rounded-lg p-3 border ${getAdviceColor(sampleCommunityAdvice.consensus)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getAdviceIcon(sampleCommunityAdvice.consensus)}
                    <span className="font-semibold text-sm uppercase">
                      Consensus: {sampleCommunityAdvice.consensus}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {sampleCommunityAdvice.confidence}% confidence
                  </Badge>
                </div>
                <div className="text-xs opacity-75">
                  Based on {sampleCommunityAdvice.advisorCount} advisor(s) and community polls
                </div>
              </div>
            ) : (
              <div className="relative rounded-lg p-3 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200">
                <div className="flex items-center justify-center">
                  <Lock className="w-4 h-4 text-purple-500 mr-2" />
                  <span className="text-sm text-purple-700 font-medium">Upgrade to Premium to unlock advice</span>
                </div>
                <Link to={createPageUrl("Subscription")} className="absolute inset-0">
                  <div className="w-full h-full"></div>
                </Link>
              </div>
            )}
          </div>

          {/* Sector Badge */}
          <Badge variant="outline" className="w-fit">
            {sampleStock.sector}
          </Badge>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <Link to={createPageUrl("ChatRooms")}>
              <Button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
                <MessageSquare className="w-3 h-3" />
                Chat
              </Button>
            </Link>
            <Link to={createPageUrl("Polls")}>
              <Button className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg">
                <BarChart3 className="w-3 h-3" />
                Poll
              </Button>
            </Link>
            <Button
              onClick={() => setShowAlertModal(true)}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-semibold text-sm shadow-md transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg relative">
              <Bell className="w-3 h-3" />
              Alert
              {/* Sample alert badge */}
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                2
              </div>
            </Button>
          </div>

          {/* Sample Alert Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs text-green-700 font-medium">
                2 active alerts configured
              </span>
            </div>
            <div className="text-xs text-green-600 mt-1">
              Price ±5% • Profit +10% target
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert Modal */}
      <AlertModal
        open={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        stock={sampleStock}
        user={sampleUser}
        isPremium={isPremium}
      />
    </>
  );
}