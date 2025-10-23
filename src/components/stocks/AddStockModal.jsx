import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { Stock } from "@/api/entities";
import { debounce } from "lodash";

export default function AddStockModal({ open, onClose, watchlist, onAddStock }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedStocks, setSearchedStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Load all stocks when modal opens
  useEffect(() => {
    if (open) {
      const loadAllStocks = async () => {
        setIsSearching(true);
        try {
          const stocks = await Stock.list('', 50);
          setAllStocks(stocks);
        } catch (error) {
          console.error('Error loading stocks:', error);
          setAllStocks([]);
        } finally {
          setIsSearching(false);
        }
      };
      loadAllStocks();
    }
  }, [open]);

  const debouncedSearch = useMemo(
    () => debounce((term) => {
      if (term.length < 2) {
        setSearchedStocks([]);
        return;
      }

      const watchlistSymbols = new Set((watchlist || []).map(w => w.stock_symbol));
      
      const filteredStocks = allStocks.filter(stock => {
        const matchesSearch = 
          stock.symbol.toLowerCase().includes(term.toLowerCase()) ||
          stock.company_name.toLowerCase().includes(term.toLowerCase());
        
        const notInWatchlist = !watchlistSymbols.has(stock.symbol);
        
        return matchesSearch && notInWatchlist;
      });

      setSearchedStocks(filteredStocks);
    }, 300),
    [allStocks, watchlist]
  );
  
  useEffect(() => {
    // Clear search results when modal is closed
    if (!open) {
      setSearchTerm("");
      setSearchedStocks([]);
    }
    return () => {
      debouncedSearch.cancel();
    };
  }, [open, debouncedSearch]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Stock to Watchlist</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input
              placeholder="Search stocks by name or symbol..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
            />
            {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
          </div>

          {/* Stock List */}
          <div className="flex-1 overflow-y-auto space-y-2 p-1">
            {isSearching ? (
              <div className="text-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                <p className="text-slate-500">Loading stocks...</p>
              </div>
            ) : searchTerm.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">Type at least 2 characters to search stocks</p>
              </div>
            ) : searchedStocks.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-500">No stocks found matching your search</p>
              </div>
            ) : (
              searchedStocks.map(stock => (
                <div key={stock.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div>
                        <h4 className="font-semibold">{stock.symbol}</h4>
                        <p className="text-sm text-slate-500">{stock.company_name}</p>
                      </div>
                      {stock.sector && <Badge variant="outline" className="text-xs">
                        {stock.sector}
                      </Badge>}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-semibold">₹{stock.current_price?.toFixed(2)}</p>
                      <div className="flex items-center justify-end gap-1">
                        {stock.change_percent >= 0 ? 
                          <TrendingUp className="w-3 h-3 text-green-500" /> : 
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        }
                        <span className={`text-xs ${stock.change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change_percent >= 0 ? '+' : ''}{stock.change_percent?.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                    
                    <Button 
                      size="sm" 
                      onClick={() => onAddStock(stock)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}