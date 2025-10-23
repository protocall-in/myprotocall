
import React, { useState } from "react";
import SampleStockCard from "../components/stocks/SampleStockCard";
import { IndianRupee, TrendingUp, TrendingDown } from "lucide-react";

// Dummy Card components for compilation.
// In a real project, these would typically be imported from a UI library
// (e.g., from '@/components/ui/card' if using Shadcn UI).
const Card = ({ className, children }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {children}
  </div>
);

const CardContent = ({ className, children }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export default function SamplePortfolio() {
  // Sample static data for portfolio statistics
  const [portfolioStats] = useState({
    totalInvested: 150000,
    currentValue: 175000,
    totalPL: 25000,
    plPercentage: 16.67,
    dailyChange: 4500, // Added for the fourth card example
    dailyChangePercentage: 2.5, // Added for the fourth card example
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Enhanced Stock Portfolio Sample
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Showcasing all the advanced features: Investment Tracking, Premium Advice, Multi-Channel Alerts & More
          </p>
        </div>

        {/* Portfolio Summary */}
        <div className="grid grid-cols-1 md:// ... keep existing code (imports and component logic) ...:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Invested</p>
                  <p className="text-3xl font-bold mt-2">₹{portfolioStats.totalInvested.toLocaleString()}</p>
                </div>
                <IndianRupee className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Current Value</p>
                  <p className="text-3xl font-bold mt-2">₹{portfolioStats.currentValue.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className={`bg-gradient-to-br ${portfolioStats.totalPL >= 0 ? 'from-green-500 to-emerald-600' : 'from-red-500 to-rose-600'} text-white border-0 shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium">Total P/L</p>
                  <p className="text-3xl font-bold mt-2">₹{portfolioStats.totalPL.toLocaleString()}</p>
                  <p className="text-white/90 text-xs mt-1">{portfolioStats.plPercentage.toFixed(2)}%</p>
                </div>
                {portfolioStats.totalPL >= 0 ? <TrendingUp className="w-10 h-10 text-white/80" /> : <TrendingDown className="w-10 h-10 text-white/80" />}
              </div>
            </CardContent>
          </Card>

          {/* Additional card for Daily Change, following the pattern */}
          <Card className={`bg-gradient-to-br ${portfolioStats.dailyChange >= 0 ? 'from-orange-500 to-amber-600' : 'from-red-500 to-rose-600'} text-white border-0 shadow-lg`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/90 text-sm font-medium">Daily Change</p>
                  <p className="text-3xl font-bold mt-2">₹{portfolioStats.dailyChange.toLocaleString()}</p>
                  <p className="text-white/90 text-xs mt-1">{portfolioStats.dailyChangePercentage.toFixed(2)}%</p>
                </div>
                {portfolioStats.dailyChange >= 0 ? <TrendingUp className="w-10 h-10 text-white/80" /> : <TrendingDown className="w-10 h-10 text-white/80" />}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sample Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold text-sm">P&L</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Investment Tracking</p>
                <p className="text-xs text-slate-500">Real-time profit/loss calculation</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">AI</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Premium Advice</p>
                <p className="text-xs text-slate-500">Community + SEBI advisor consensus</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-sm">🔔</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Smart Alerts</p>
                <p className="text-xs text-slate-500">Multi-channel notifications</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">📊</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900">Live Data</p>
                <p className="text-xs text-slate-500">Real-time market insights</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sample Stock Card */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm">
            <SampleStockCard />
          </div>
        </div>

        {/* Feature Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-green-700">💰 Investment Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Real-time profit/loss calculation
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Portfolio value tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Performance percentage display
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Investment history & analytics
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-purple-700">👥 Premium Advice</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Community poll consensus
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                SEBI advisor recommendations
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Confidence scoring system
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Premium subscription benefits
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-blue-700">🔔 Smart Alerts</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Price change notifications
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Profit/loss target alerts
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Community consensus changes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Multi-channel delivery (app, email, push)
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <h3 className="font-bold text-lg mb-4 text-orange-700">📊 Live Features</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Real-time stock prices
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Market sentiment tracking
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Volume & volatility data
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                Interactive navigation
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
