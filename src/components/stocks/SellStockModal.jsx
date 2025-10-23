import React, { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, TrendingDown, AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function SellStockModal({ 
  open, 
  onClose, 
  investment, 
  currentPrice, 
  onSell 
}) {
  const [quantity, setQuantity] = useState("");
  const [sellPrice, setSellPrice] = useState(currentPrice?.toString() || "");
  const [sellDate, setSellDate] = useState(new Date());
  const [isSelling, setIsSelling] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open && currentPrice) {
      setSellPrice(currentPrice.toString());
      setQuantity("");
      setSellDate(new Date());
      setErrors({});
    }
  }, [open, currentPrice]);

  const validateForm = () => {
    const newErrors = {};

    // Quantity validation
    if (!quantity || parseFloat(quantity) <= 0) {
      newErrors.quantity = "Quantity must be greater than 0";
    } else if (parseFloat(quantity) > investment?.quantity) {
      newErrors.quantity = `Cannot exceed owned quantity (${investment?.quantity})`;
    }

    // Sell price validation
    if (!sellPrice || parseFloat(sellPrice) <= 0) {
      newErrors.sellPrice = "Sell price must be greater than 0";
    }

    // Sell date validation
    const purchaseDate = new Date(investment?.purchase_date);
    if (sellDate < purchaseDate) {
      newErrors.sellDate = "Sell date cannot be before purchase date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateProfitLoss = () => {
    if (!quantity || !sellPrice || !investment) return null;

    const sellQuantity = parseFloat(quantity);
    const sellPriceNum = parseFloat(sellPrice);
    const avgBuyPrice = investment.avg_buy_price;

    const sellValue = sellQuantity * sellPriceNum;
    const costBasis = sellQuantity * avgBuyPrice;
    const realizedPL = sellValue - costBasis;
    const realizedPLPercent = (realizedPL / costBasis) * 100;

    return {
      sellValue,
      costBasis,
      realizedPL,
      realizedPLPercent
    };
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSelling(true);
    try {
      const sellData = {
        quantity: parseFloat(quantity),
        sell_price: parseFloat(sellPrice),
        sell_date: format(sellDate, 'yyyy-MM-dd'),
        current_price: currentPrice
      };

      await onSell(investment, sellData);
      onClose();
    } catch (error) {
      console.error("Error selling stock:", error);
    } finally {
      setIsSelling(false);
    }
  };

  const profitLoss = calculateProfitLoss();
  const isFullSale = quantity && parseFloat(quantity) === investment?.quantity;

  if (!investment) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-600" />
            Sell {investment.stock_symbol}
          </DialogTitle>
          <DialogDescription>
            Sell shares from your {investment.stock_name} position
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Position Info */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Current Position</span>
              <Badge variant="outline">{investment.quantity} shares</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Average Buy Price</span>
              <span className="text-sm font-medium">₹{investment.avg_buy_price?.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Current Market Price</span>
              <span className="text-sm font-medium">₹{currentPrice?.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Sell</Label>
              <Input
                id="quantity"
                type="number"
                placeholder={`Max: ${investment.quantity}`}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && <p className="text-xs text-red-500">{errors.quantity}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="sell-price">Sell Price per Share (₹)</Label>
              <Input
                id="sell-price"
                type="number"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className={errors.sellPrice ? "border-red-500" : ""}
              />
              {errors.sellPrice && <p className="text-xs text-red-500">{errors.sellPrice}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sell-date">Sell Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="sell-date"
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${errors.sellDate ? "border-red-500" : ""}`}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {sellDate ? format(sellDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={sellDate} onSelect={setSellDate} initialFocus />
              </PopoverContent>
            </Popover>
            {errors.sellDate && <p className="text-xs text-red-500">{errors.sellDate}</p>}
          </div>

          {/* Profit/Loss Preview */}
          {profitLoss && (
            <Alert className={profitLoss.realizedPL >= 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}>
              <AlertCircle className={`h-4 w-4 ${profitLoss.realizedPL >= 0 ? "text-green-600" : "text-red-600"}`} />
              <AlertDescription>
                <div className="flex justify-between items-center text-sm">
                  <span>Estimated Realized P/L:</span>
                  <span className={`font-bold ${profitLoss.realizedPL >= 0 ? "text-green-600" : "text-red-600"}`}>
                    {profitLoss.realizedPL >= 0 ? '+' : ''}₹{profitLoss.realizedPL.toFixed(2)}
                    ({profitLoss.realizedPL >= 0 ? '+' : ''}{profitLoss.realizedPLPercent.toFixed(1)}%)
                  </span>
                </div>
                {isFullSale && (
                  <p className="text-xs text-slate-500 mt-1">
                    This will close your entire position in {investment.stock_symbol}.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSelling}>
            {isSelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sell {quantity} Shares
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}