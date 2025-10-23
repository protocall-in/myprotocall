import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  IndianRupee, 
  Info, 
  AlertCircle,
  Loader2,
  CheckCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { toast } from 'sonner';

export default function PledgeModal({ 
  isOpen, 
  onClose, 
  stock_symbol, 
  session,
  onSubmit, 
  isProcessing,
  sessionLimits = {}
}) {
  const [quantity, setQuantity] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [calculatedFee, setCalculatedFee] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  // Calculate convenience fee and total value
  useEffect(() => {
    if (!session || !quantity) {
      setCalculatedFee(0);
      setTotalValue(0);
      return;
    }

    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(targetPrice) || 0;
    const pledgeValue = qty * price;

    let fee = 0;
    if (session.convenience_fee_type === 'flat') {
      fee = session.convenience_fee_amount || 0;
    } else if (session.convenience_fee_type === 'percentage' || session.convenience_fee_type === 'percent') {
      fee = (pledgeValue * (session.convenience_fee_amount || 0)) / 100;
    }

    setCalculatedFee(fee);
    setTotalValue(pledgeValue);
  }, [quantity, targetPrice, session]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    const qty = parseFloat(quantity);
    const price = parseFloat(targetPrice);

    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (session.min_qty && qty < session.min_qty) {
      toast.error(`Minimum quantity is ${session.min_qty}`);
      return;
    }

    if (session.max_qty && qty > session.max_qty) {
      toast.error(`Maximum quantity is ${session.max_qty}`);
      return;
    }

    if (!price || price <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }

    if (!agreedToTerms) {
      toast.error('Please agree to the terms and conditions');
      return;
    }

    // Prepare pledge data
    const pledgeData = {
      stock_symbol: session.stock_symbol,
      quantity: qty,
      target_price: price,
      pledge_type: session.session_mode === 'buy_only' ? 'buy' : 
                   session.session_mode === 'sell_only' ? 'sell' : 'buy'
    };

    // Call parent submit handler
    onSubmit(pledgeData);
  };

  const resetForm = () => {
    setQuantity('');
    setTargetPrice('');
    setAgreedToTerms(false);
    setCalculatedFee(0);
    setTotalValue(0);
  };

  const handleClose = () => {
    if (!isProcessing) {
      resetForm();
      onClose();
    }
  };

  if (!session) return null;

  const isPurchaseMode = session.session_mode === 'buy_only' || session.session_mode === 'buy_sell_cycle';
  const isSellMode = session.session_mode === 'sell_only';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Make a Pledge - {session.stock_symbol}
          </DialogTitle>
          <DialogDescription>
            {session.stock_name}
          </DialogDescription>
        </DialogHeader>

        {/* Session Info Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <Badge className={`${
                isPurchaseMode ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              } mb-2`}>
                {isPurchaseMode && <TrendingUp className="w-3 h-3 mr-1" />}
                {isSellMode && <TrendingDown className="w-3 h-3 mr-1" />}
                {session.session_mode === 'buy_only' && 'Buy Only'}
                {session.session_mode === 'sell_only' && 'Sell Only'}
                {session.session_mode === 'buy_sell_cycle' && 'Buy & Sell Cycle'}
              </Badge>
              <p className="text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {isPurchaseMode && 'You can only place buy orders in this session'}
                {isSellMode && 'You can only place sell orders in this session'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Session ends</p>
              <p className="text-sm font-semibold text-gray-900">
                {new Date(session.session_end).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Quantity Input */}
          <div>
            <Label htmlFor="quantity" className="text-base font-semibold">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min={session.min_qty || 1}
              max={session.max_qty || 10000}
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter number of shares"
              className="mt-2 h-12 text-lg"
              disabled={isProcessing}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {session.min_qty && `Min: ${session.min_qty}`}
              {session.min_qty && session.max_qty && ' | '}
              {session.max_qty && `Max: ${session.max_qty}`}
            </p>
          </div>

          {/* Target Price Input */}
          <div>
            <Label htmlFor="price" className="text-base font-semibold">
              Target Price (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative mt-2">
              <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                id="price"
                type="number"
                min="0.01"
                step="0.01"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter target price per share"
                className="pl-10 h-12 text-lg"
                disabled={isProcessing}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              The price at which you want to {isPurchaseMode ? 'buy' : 'sell'} this stock
            </p>
          </div>

          {/* Calculation Summary */}
          {quantity && targetPrice && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-semibold text-gray-900">Summary</h4>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pledge Value</span>
                <span className="font-semibold">₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Convenience Fee 
                  {session.convenience_fee_type === 'percentage' && ` (${session.convenience_fee_amount}%)`}
                </span>
                <span className="font-semibold text-orange-600">
                  ₹{calculatedFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>

              <div className="border-t pt-2 flex justify-between">
                <span className="font-semibold text-gray-900">Total to Pay Now</span>
                <span className="font-bold text-lg text-blue-600">
                  ₹{calculatedFee.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}

          {/* Terms Checkbox */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <input
              type="checkbox"
              id="terms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              disabled={isProcessing}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm text-gray-700 cursor-pointer">
              <span className="font-semibold">I agree to the terms and conditions</span>
              <p className="mt-1 text-xs">
                I authorize the platform to execute this pledge on my behalf through my linked demat account. 
                I understand that the convenience fee is non-refundable and that execution depends on market conditions.
              </p>
            </label>
          </div>

          {/* Important Notice */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">Important:</p>
              <p className="mt-1">
                After payment, your pledge will be marked as "Ready for Execution". 
                The actual trade will be executed during the session execution window.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
              className="px-6"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isProcessing || !agreedToTerms || !quantity || !targetPrice}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing Payment...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}