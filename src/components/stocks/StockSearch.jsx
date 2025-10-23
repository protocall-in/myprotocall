import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { stockAPI } from "./LiveStockAPI";

export default function StockSearch({ onStockSelect, placeholder = "Search stocks..." }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [priceData, setPriceData] = useState({});

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const searchTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const stocks = await stockAPI.searchStocks(query);
        setResults(stocks.slice(0, 10)); // Show top 10 results
        setShowResults(true);

        // Fetch live prices for search results
        const pricePromises = stocks.slice(0, 5).map(async (stock) => {
          try {
            const price = await stockAPI.getStockPrice(stock.symbol);
            return { [stock.symbol]: price };
          } catch {
            return { [stock.symbol]: null };
          }
        });

        const prices = await Promise.all(pricePromises);
        const priceMap = prices.reduce((acc, price) => ({ ...acc, ...price }), {});
        setPriceData(priceMap);
      } catch (error) {
        console.error("Error searching stocks:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(searchTimer);
  }, [query]);

  const handleStockSelect = (stock) => {
    const stockWithPrice = {
      ...stock,
      ...priceData[stock.symbol]
    };
    onStockSelect(stockWithPrice);
    setQuery("");
    setShowResults(false);
  };

  const getPriceColor = (changePercent) => {
    if (changePercent > 0) return "text-green-600";
    if (changePercent < 0) return "text-red-600";
    return "text-orange-600";
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
        <Input
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 pr-10"
          onFocus={() => query.length >= 2 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 animate-spin" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-white max-h-80 overflow-y-auto">
          {results.map((stock) => {
            const price = priceData[stock.symbol];
            return (
              <div
                key={stock.symbol}
                className="flex items-center justify-between p-3 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleStockSelect(stock)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h4 className="font-semibold text-slate-900">{stock.symbol}</h4>
                      <p className="text-sm text-slate-500 truncate">{stock.company_name}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {stock.exchange}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                  </div>
                </div>

                {price && (
                  <div className="text-right">
                    <div className="font-semibold">₹{price.current_price?.toFixed(2)}</div>
                    <div className={`text-sm flex items-center gap-1 ${getPriceColor(price.change_percent)}`}>
                      {price.change_percent > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{price.change_percent >= 0 ? '+' : ''}{price.change_percent?.toFixed(2)}%</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {showResults && results.length === 0 && !isSearching && query.length >= 2 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 border shadow-lg bg-white">
          <div className="p-4 text-center text-slate-500">
            No stocks found for "{query}"
          </div>
        </Card>
      )}
    </div>
  );
}