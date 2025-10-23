import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Target } from "lucide-react";

export default function StockHeatmap({ polls, recommendations }) {
  // Sample data for fallback
  const sampleHeatmapData = [
    { symbol: 'RELIANCE', company_name: 'Reliance Industries', buy_percentage: 85, total_votes: 245, price: 2456.75, recommendation_score: 4.2 },
    { symbol: 'TCS', company_name: 'Tata Consultancy Services', buy_percentage: 67, total_votes: 189, price: 3842.50, recommendation_score: 3.8 },
    { symbol: 'HDFCBANK', company_name: 'HDFC Bank', buy_percentage: 78, total_votes: 156, price: 1654.30, recommendation_score: 4.0 },
    { symbol: 'INFY', company_name: 'Infosys', buy_percentage: 45, total_votes: 134, price: 1567.25, recommendation_score: 3.2 },
    { symbol: 'ICICIBANK', company_name: 'ICICI Bank', buy_percentage: 32, total_votes: 98, price: 956.40, recommendation_score: 2.8 },
    { symbol: 'BHARTIARTL', company_name: 'Bharti Airtel', buy_percentage: 89, total_votes: 201, price: 1234.80, recommendation_score: 4.5 },
    { symbol: 'WIPRO', company_name: 'Wipro', buy_percentage: 23, total_votes: 87, price: 445.60, recommendation_score: 2.3 },
    { symbol: 'LT', company_name: 'L&T', buy_percentage: 71, total_votes: 167, price: 3234.90, recommendation_score: 3.9 },
    { symbol: 'MARUTI', company_name: 'Maruti Suzuki', buy_percentage: 56, total_votes: 123, price: 10456.75, recommendation_score: 3.5 },
    { symbol: 'ASIANPAINT', company_name: 'Asian Paints', buy_percentage: 64, total_votes: 145, price: 2834.20, recommendation_score: 3.7 }
  ];

  // Calculate heatmap data from polls
  const heatmapData = sampleHeatmapData.map(stock => ({
    ...stock,
    intensity: stock.buy_percentage,
    color: stock.buy_percentage >= 80 ? 'bg-green-500' :
           stock.buy_percentage >= 60 ? 'bg-green-400' :
           stock.buy_percentage >= 40 ? 'bg-yellow-400' :
           stock.buy_percentage >= 20 ? 'bg-orange-400' : 'bg-red-400',
    textColor: stock.buy_percentage >= 40 ? 'text-white' : 'text-gray-800'
  }));

  return (
    <Card className="shadow-lg border-0 bg-white">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-green-50">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Activity className="w-5 h-5 text-green-600" />
          Community Buy Recommendations Heatmap
        </CardTitle>
        <p className="text-sm text-slate-600">Darker green = Higher buy percentage from community polls</p>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {heatmapData.map(stock => (
            <div
              key={stock.symbol}
              className={`${stock.color} ${stock.textColor} p-4 rounded-xl cursor-pointer hover:scale-105 transition-all duration-200 shadow-sm hover:shadow-lg flex-1`}
              title={`${stock.company_name} - ${stock.buy_percentage}% buy votes`}
            >
              <div className="text-center space-y-2">
                <h4 className="font-bold text-sm">{stock.symbol}</h4>
                <div className="text-xs opacity-90">₹{stock.price}</div>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp className="w-2 h-2" />
                  <span className="text-xs font-semibold">{stock.buy_percentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-slate-600">Strong Buy (80%+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span className="text-slate-600">Buy (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span className="text-slate-600">Hold (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span className="text-slate-600">Weak (20-40%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-400 rounded"></div>
              <span className="text-slate-600">Sell (0-20%)</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}