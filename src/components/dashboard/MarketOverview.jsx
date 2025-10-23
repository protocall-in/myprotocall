import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

export default function MarketOverview({ stocks }) {
  // Comprehensive sample data for fallback
  const sampleData = {
    gainers: [
      { id: 'g1', symbol: 'BHARTIARTL', company_name: 'Bharti Airtel', current_price: 1234.80, change_percent: 3.46 },
      { id: 'g2', symbol: 'SBIN', company_name: 'State Bank of India', current_price: 542.30, change_percent: 2.57 },
      { id: 'g3', symbol: 'HDFCBANK', company_name: 'HDFC Bank', current_price: 1654.30, change_percent: 1.8 }
    ],
    losers: [
      { id: 'l1', symbol: 'WIPRO', company_name: 'Wipro Limited', current_price: 445.60, change_percent: -2.8 },
      { id: 'l2', symbol: 'ICICIBANK', company_name: 'ICICI Bank', current_price: 956.40, change_percent: -2.1 },
      { id: 'l3', symbol: 'INFY', company_name: 'Infosys', current_price: 1567.25, change_percent: -1.8 },
    ]
  };

  // Determine top gainers from live data, or use fallback
  const topGainers = stocks && stocks.filter(s => s.change_percent > 0).length > 0
    ? [...stocks]
        .filter(s => s.change_percent > 0)
        .sort((a, b) => b.change_percent - a.change_percent)
        .slice(0, 3)
    : sampleData.gainers;

  // Determine top losers from live data, or use fallback
  const topLosers = stocks && stocks.filter(s => s.change_percent < 0).length > 0
    ? [...stocks]
        .filter(s => s.change_percent < 0)
        .sort((a, b) => a.change_percent - b.change_percent)
        .slice(0, 3)
    : sampleData.losers;

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-blue-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Activity className="w-5 h-5 text-blue-600" />
          Market Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div>
            <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Gainers
            </h4>
            <div className="space-y-2">
              {topGainers.length > 0 ? topGainers.map(stock => (
                <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 hover:bg-green-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{stock.symbol}</p>
                    <p className="text-xs text-slate-500">{stock.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{stock.current_price?.toFixed(2)}</p>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      +{stock.change_percent?.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No gainers today</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Losers */}
          <div>
            <h4 className="font-semibold text-red-700 mb-3 flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Top Losers
            </h4>
            <div className="space-y-2">
              {topLosers.length > 0 ? topLosers.map(stock => (
                <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                  <div>
                    <p className="font-semibold text-slate-900">{stock.symbol}</p>
                    <p className="text-xs text-slate-500">{stock.company_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{stock.current_price?.toFixed(2)}</p>
                    <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                      {stock.change_percent?.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-500 py-4">
                  <p>No losers today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}