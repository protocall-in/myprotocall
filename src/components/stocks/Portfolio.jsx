import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { List, LayoutGrid, TrendingUp, TrendingDown, Activity, MessageSquare, BarChart3, Bell } from "lucide-react";
import StockCard from "./StockCard";

// Custom Rupee Symbol Component
const RupeeIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M6 3h12M6 8h12m-12 5h12M8 21l8-8" />
    <path d="M6 8c0-2 2-3 4-3s4 1 4 3-2 3-4 3H6" />
  </svg>
);

export default function Portfolio({ 
  stocks, 
  onRemove, 
  onSell, 
  onSetAlert, 
  totalValue = 0, 
  totalChange = 0, 
  totalInvestment = 0 
}) {
  const [view, setView] = useState("grid"); // "grid" | "list"

  if (!stocks) {
    return (
        <div className="text-center p-8 text-slate-500">
            Loading portfolio...
        </div>
    );
  }

  // We only want to show invested stocks
  const investedStocks = stocks.filter(stock => stock.user_investment_data);

  if (investedStocks.length === 0) {
    return (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Portfolio Value</p>
                    <p className="text-xl font-bold">₹0</p>
                  </div>
                  <RupeeIcon className="w-6 h-6 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-100 text-sm">Total Change</p>
                    <p className="text-xl font-bold">₹0</p>
                  </div>
                  <Activity className="w-6 h-6 text-gray-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Gainers</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                  <TrendingUp className="w-6 h-6 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Losers</p>
                    <p className="text-xl font-bold">0</p>
                  </div>
                  <TrendingDown className="w-6 h-6 text-red-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center p-8 bg-white rounded-2xl shadow-sm">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-800">Your portfolio is empty.</h3>
            <p className="text-gray-500 mt-2">Add your first investment to start tracking.</p>
          </div>
        </div>
    );
  }

  const gainers = investedStocks.filter(s => {
    const investment = s.user_investment_data;
    const currentValue = s.current_price * investment.quantity;
    const invested = investment.total_invested;
    return currentValue > invested;
  }).length;

  const losers = investedStocks.filter(s => {
    const investment = s.user_investment_data;
    const currentValue = s.current_price * investment.quantity;
    const invested = investment.total_invested;
    return currentValue < invested;
  }).length;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Portfolio Value</p>
                <p className="text-xl font-bold">₹{(totalValue / 100000).toFixed(1)}L</p>
              </div>
              <RupeeIcon className="w-6 h-6 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`${totalChange >= 0 ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} text-white border-0`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`${totalChange >= 0 ? 'text-green-100' : 'text-red-100'} text-sm`}>Total Change</p>
                <p className="text-xl font-bold">{totalChange >= 0 ? '+' : ''}₹{Math.abs(totalChange / 1000).toFixed(1)}K</p>
              </div>
              {totalChange >= 0 ? 
                <TrendingUp className="w-6 h-6 text-green-200" /> : 
                <TrendingDown className="w-6 h-6 text-red-200" />
              }
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Gainers</p>
                <p className="text-xl font-bold">{gainers}</p>
              </div>
              <TrendingUp className="w-6 h-6 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Losers</p>
                <p className="text-xl font-bold">{losers}</p>
              </div>
              <TrendingDown className="w-6 h-6 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle Buttons */}
      <div className="flex justify-end mb-4 space-x-2">
        <Button
          onClick={() => setView("grid")}
          variant={view === 'grid' ? 'default' : 'outline'}
          size="icon"
          className="bg-gradient-to-r from-blue-500 to-purple-600 text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-600"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setView("list")}
          variant={view === 'list' ? 'default' : 'outline'}
          size="icon"
           className="bg-gradient-to-r from-blue-500 to-purple-600 text-white data-[state=inactive]:bg-white data-[state=inactive]:text-slate-600"
        >
          <List className="w-4 h-4" />
        </Button>
      </div>

      {/* Grid View */}
      {view === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {investedStocks.map((stock) => (
            <StockCard
              key={stock.id}
              stock={stock}
              onRemove={onRemove}
              onSell={onSell}
              onSetAlert={onSetAlert}
              showRemove={false}
              userInvestment={stock.user_investment_data}
            />
          ))}
        </div>
      )}

      {/* List View */}
      {view === "list" && (
        <div className="overflow-x-auto bg-white shadow-lg rounded-2xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3 text-right">Qty</th>
                <th className="px-6 py-3 text-right">Avg. Buy Price</th>
                <th className="px-6 py-3 text-right">Current Price</th>
                <th className="px-6 py-3 text-right">Unrealized P&L</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {investedStocks.map((stock) => {
                const investment = stock.user_investment_data;
                const pnl = (stock.current_price * investment.quantity) - investment.total_invested;
                const pnlPercent = (pnl / investment.total_invested) * 100;
                const isPositive = stock.change_percent >= 0;

                return (
                  <tr key={stock.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{stock.symbol}</div>
                      <div className="text-xs text-slate-500 truncate">{stock.company_name}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-right">{investment.quantity}</td>
                    <td className="px-6 py-4 text-right">₹{investment.avg_buy_price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                       <div className="font-medium text-slate-800">₹{stock.current_price.toFixed(2)}</div>
                       <Badge variant="outline" className={`${isPositive ? "bg-green-100 text-green-800 border-green-200" : "bg-red-100 text-red-800 border-red-200"}`}>
                          {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                          {isPositive ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                        </Badge>
                    </td>
                    <td className={`px-6 py-4 text-right font-bold ${pnl >= 0 ? "text-green-600" : "text-red-600"}`}>
                      <div>{pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toFixed(2)}</div>
                      <div className="text-xs font-normal">({pnlPercent.toFixed(2)}%)</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Button size="sm" onClick={() => onSell(stock)} className="bg-red-500 hover:bg-red-600 text-white">
                          <TrendingDown className="w-3 h-3 mr-1"/>
                          Sell
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onSetAlert && onSetAlert(stock)}>
                          <Bell className="w-3 h-3 mr-1"/>
                          Alert
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}