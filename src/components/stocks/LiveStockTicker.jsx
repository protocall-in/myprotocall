
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Play, Pause } from "lucide-react";
import { stockAPI } from "./LiveStockAPI";

export default function LiveStockTicker({ className = "" }) {
  const [stocks, setStocks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    const loadStocks = async () => {
      try {
        const trendingSymbols = stockAPI.getTrendingStocks();
        // Correctly wait for all API calls to resolve
        const stockDataPromises = trendingSymbols.map(symbol => stockAPI.getStockPrice(symbol));
        const resolvedStockData = await Promise.all(stockDataPromises);
        
        // Filter out any potential nulls or undefined stocks to prevent errors
        const validStocks = resolvedStockData.filter(stock => stock && typeof stock.current_price !== 'undefined');

        // Duplicate the array for a seamless scrolling effect
        setStocks([...validStocks, ...validStocks]);
      } catch (error) {
        console.error("Error loading ticker stocks:", error);
        const sampleData = [
            { symbol: 'RELIANCE', current_price: 2439.61, change_percent: -0.70 },
            { symbol: 'TCS', current_price: 3893.20, change_percent: 1.32 },
            { symbol: 'HDFCBANK', current_price: 1671.67, change_percent: 1.05 },
            { symbol: 'INFY', current_price: 1509.70, change_percent: -1.49 },
            { symbol: 'ICICIBANK', current_price: 962.57, change_percent: 0.65 },
        ];
        setStocks([...sampleData, ...sampleData]);
      }
    };
    loadStocks();
  }, []);

  const PriceChange = ({ change }) => {
    const isPositive = change >= 0;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
      <span className={`flex items-center text-sm font-medium ${colorClass}`}>
        <Icon className="w-4 h-4 mr-1" />
        {isPositive ? '+' : ''}{change.toFixed(2)}%
      </span>
    );
  };

  return (
    <>
      <style>
        {`
          @keyframes marquee {
            0% { transform: translateX(0%); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 60s linear infinite;
          }
        `}
      </style>
      <Card className={`w-full overflow-hidden bg-white shadow-sm border ${className}`}>
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-800">Live Market</h3>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                Market Open
              </Badge>
            </div>
            <button onClick={() => setIsPlaying(!isPlaying)} className="text-gray-500 hover:text-gray-800">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
          <div className="relative flex overflow-x-hidden">
            <div 
              className="py-3 flex animate-marquee whitespace-nowrap"
              style={{ animationPlayState: isPlaying ? 'running' : 'paused' }}
            >
              {stocks.map((stock, index) => (
                <div key={index} className="flex items-center mx-4 flex-shrink-0">
                  <span className="font-semibold text-gray-700 text-sm">{stock.symbol}</span>
                  <span className="ml-2 text-gray-800 text-sm">₹{stock.current_price.toFixed(2)}</span>
                  <span className="ml-2"><PriceChange change={stock.change_percent} /></span>
                  <span className="text-gray-300 mx-4">*</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
