
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, X, Search, Loader2 } from "lucide-react";
import { Stock, User, UserInvestment } from "@/api/entities";
import { toast } from "sonner";
import { debounce } from "lodash";

export default function AddInvestmentModal({ open, onClose, onSave, existingInvestment = null }) {
  const [transactions, setTransactions] = useState([{ quantity: "", price: "" }]);
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Stock search state
  const [searchTerm, setSearchTerm] = useState("");
  const [searchedStocks, setSearchedStocks] = useState([]);
  const [allStocks, setAllStocks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);

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

  useEffect(() => {
    if (existingInvestment) {
      // Pre-fill form for editing
      setSelectedStock({
        symbol: existingInvestment.stock_symbol,
        company_name: existingInvestment.stock_name,
      });
      setTransactions([{ 
        quantity: existingInvestment.quantity, 
        price: existingInvestment.avg_buy_price 
      }]);
      setPurchaseDate(new Date(existingInvestment.purchase_date || Date.now()));
      setNotes(existingInvestment.notes || "");
    } else {
      // Reset form for new entry
      resetForm();
    }
  }, [existingInvestment, open]);
  
  const resetForm = () => {
    setSelectedStock(null);
    setSearchTerm("");
    setSearchedStocks([]);
    setTransactions([{ quantity: "", price: "" }]);
    setPurchaseDate(new Date());
    setNotes("");
  };

  const debouncedSearch = useMemo(
    () => debounce((term) => {
      if (term.length < 2) {
        setSearchedStocks([]);
        return;
      }

      const filteredStocks = allStocks.filter(stock => 
        stock.symbol.toLowerCase().includes(term.toLowerCase()) ||
        stock.company_name.toLowerCase().includes(term.toLowerCase())
      );

      setSearchedStocks(filteredStocks);
    }, 300),
    [allStocks]
  );

  // Cleanup the debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleSelectStock = (stock) => {
    setSelectedStock(stock);
    setSearchTerm(stock.company_name);
    setSearchedStocks([]);
  };

  const handleTransactionChange = (index, field, value) => {
    const newTransactions = [...transactions];
    newTransactions[index][field] = value;
    setTransactions(newTransactions);
  };

  const addTransactionRow = () => {
    setTransactions([...transactions, { quantity: "", price: "" }]);
  };

  const removeTransactionRow = (index) => {
    const newTransactions = transactions.filter((_, i) => i !== index);
    setTransactions(newTransactions);
  };

  const handleSubmit = async () => {
    if (!selectedStock) {
      toast.error("Please select a stock.");
      return;
    }

    const validTransactions = transactions.filter(
      t => parseFloat(t.quantity) > 0 && parseFloat(t.price) > 0
    );

    if (validTransactions.length === 0) {
      toast.error("Please enter at least one valid transaction (quantity and price).");
      return;
    }

    setIsSaving(true);

    const totalQuantity = validTransactions.reduce((sum, t) => sum + parseFloat(t.quantity), 0);
    const totalInvested = validTransactions.reduce((sum, t) => sum + parseFloat(t.quantity) * parseFloat(t.price), 0);
    const avgBuyPrice = totalInvested / totalQuantity;

    const investmentData = {
      stock_symbol: selectedStock.symbol,
      stock_name: selectedStock.company_name,
      quantity: totalQuantity,
      total_invested: totalInvested,
      avg_buy_price: avgBuyPrice,
      purchase_date: format(purchaseDate, 'yyyy-MM-dd'),
      notes: notes,
    };
    
    if (existingInvestment) {
      await onSave(investmentData, existingInvestment);
    } else {
      await onSave(investmentData);
    }
    
    setIsSaving(false);
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{existingInvestment ? 'Edit Investment' : 'Add New Investment'}</DialogTitle>
          <DialogDescription>
            {existingInvestment ? `Editing your position in ${existingInvestment.stock_name}.` : 'Add a stock you own to your portfolio to track its performance.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Stock Search Section */}
          {!selectedStock && (
            <div className="space-y-2">
              <Label htmlFor="stock-search">Search Stock</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="stock-search"
                  placeholder="e.g., Reliance, TCS, HDFC Bank..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
              </div>
              {searchTerm.length >= 2 && searchedStocks.length > 0 && (
                <div className="border rounded-md max-h-32 overflow-y-auto">
                  {searchedStocks.map(stock => (
                    <div 
                      key={stock.id}
                      onClick={() => handleSelectStock(stock)}
                      className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                    >
                      <span className="font-semibold">{stock.symbol}</span> - {stock.company_name}
                    </div>
                  ))}
                </div>
              )}
              {searchTerm.length >= 2 && searchedStocks.length === 0 && !isSearching && (
                <div className="text-center py-4 text-gray-500">
                  No stocks found matching your search
                </div>
              )}
            </div>
          )}

          {/* Selected Stock Display */}
          {selectedStock && (
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="font-bold text-lg">{selectedStock.symbol}</p>
                <p className="text-sm text-slate-600">{selectedStock.company_name}</p>
              </div>
              {!existingInvestment && (
                 <Button variant="ghost" size="sm" onClick={() => setSelectedStock(null)}>
                   Change
                 </Button>
              )}
            </div>
          )}

          {/* Transactions Section */}
          <div className="space-y-3">
            <Label>Purchase Transactions</Label>
            {transactions.map((tx, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={tx.quantity}
                  onChange={(e) => handleTransactionChange(index, "quantity", e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Price per share (₹)"
                  value={tx.price}
                  onChange={(e) => handleTransactionChange(index, "price", e.target.value)}
                />
                {transactions.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeTransactionRow(index)}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!existingInvestment && (
                <Button variant="outline" size="sm" onClick={addTransactionRow} className="w-full hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">
                <Plus className="h-4 w-4 mr-2" />
                Add another buy transaction
                </Button>
            )}
          </div>
          
          {/* Date and Notes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase-date">Purchase Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="purchase-date"
                    variant={"outline"}
                    className="w-full justify-start text-left font-normal hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={purchaseDate}
                    onSelect={setPurchaseDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="e.g., Bought on dip, long-term hold"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => { resetForm(); onClose(); }} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSaving ? 'Saving...' : (existingInvestment ? 'Update Investment' : 'Add to Portfolio')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
