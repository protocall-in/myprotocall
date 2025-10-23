
import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stockAPI } from "../stocks/LiveStockAPI";

export default function LiveStockTicker({ stockSymbol, onPriceUpdate }) {
  const [stockData, setStockData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadStockData = useCallback(async () => {
    if (!stockSymbol) return;
    
    try {
      const data = await stockAPI.getStockPrice(stockSymbol);
      setStockData(data);
      setLastUpdate(new Date());
      onPriceUpdate && onPriceUpdate(data);
    } catch (error) {
      console.error("Error loading stock data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [stockSymbol, onPriceUpdate]);

  useEffect(() => {
    if (!stockSymbol) return;

    loadStockData();
    
    // Subscribe to real-time updates
    const unsubscribe = stockAPI.subscribe(stockSymbol, (updatedStock) => {
      setStockData(updatedStock);
      setLastUpdate(new Date());
      onPriceUpdate && onPriceUpdate(updatedStock);
    });

    // Refresh every 30 seconds
    const interval = setInterval(loadStockData, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [stockSymbol, onPriceUpdate, loadStockData]);

  const getPriceColor = (changePercent) => {
    if (changePercent > 0) return "text-green-600 bg-green-50 border-green-200";
    if (changePercent < 0) return "text-red-600 bg-red-50 border-red-200";
    return "text-orange-600 bg-orange-50 border-orange-200";
  };

  const getPriceIcon = (changePercent) => {
    if (changePercent > 0) return <TrendingUp className="w-4 h-4" />;
    if (changePercent < 0) return <TrendingDown className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-slate-600">Loading {stockSymbol} price...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stockData) {
    return (
      <Card className="bg-gradient-to-r from-red-50 to-orange-50 border-0">
        <CardContent className="p-4">
          <div className="text-center text-sm text-slate-600">
            Unable to load price data for {stockSymbol}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-0 ${getPriceColor(stockData.change_percent).replace('text-', 'from-').replace('bg-', 'to-')} bg-gradient-to-r`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{stockSymbol}</h2>
                {stockData.isFallback && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200" title="Live data limit reached. Showing simulated price.">
                    Simulated
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span>NSE</span>
                <span>•</span>
                <span>{lastUpdate?.toLocaleTimeString()}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-slate-900">
                ₹{stockData.current_price?.toFixed(2)}
              </div>
              <Badge 
                variant="outline" 
                className={`${getPriceColor(stockData.change_percent)} border`}
              >
                {getPriceIcon(stockData.change_percent)}
                <span className="ml-1">
                  {stockData.change_percent >= 0 ? '+' : ''}
                  {stockData.change_percent?.toFixed(2)}%
                </span>
                <span className="ml-2">
                  ({stockData.change_percent >= 0 ? '+' : ''}₹{stockData.change_amount?.toFixed(2)})
                </span>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-slate-500">High</div>
              <div className="font-semibold">₹{stockData.day_high?.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">Low</div>
              <div className="font-semibold">₹{stockData.day_low?.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-slate-500">Volume</div>
              <div className="font-semibold">{(stockData.volume / 1000).toFixed(0)}K</div>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="icon"
            onClick={loadStockData}
            className="flex-shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
