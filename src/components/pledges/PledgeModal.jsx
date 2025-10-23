
import React, { useState, useEffect, useMemo } from 'react';
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
  Target, Activity, CheckCircle, Clock, RefreshCw, TrendingUp, TrendingDown,
  AlertCircle, Users
} from 'lucide-react';
import { toast } from 'sonner';
import { stockAPI } from '../stocks/LiveStockAPI';
import RiskDisclosureModal from './RiskDisclosureModal';
import DigitalConsentForm from './DigitalConsentForm';

export default function PledgeModal({
  isOpen,
  onClose,
  stock_symbol, // New prop
  session,
  user,
  onSubmit, // Replaces onSuccess
  isProcessing, // New prop
  convenienceFee, // New prop, replaces internal calculatedFee
  sessionLimits, // New prop, replaces session.min_qty and max_qty
}) {
  const [pledgeData, setPledgeData] = useState({
    qty: '',
    price_target: '',
    stock_symbol: stock_symbol || session?.stock_symbol || '',
    auto_sell_price: '', // Optional target sell price
    // Fields for submission, initialized
    session_id: '',
    user_id: user?.id || '',
    side: '', // Will be set in useEffect based on session mode
    consent_hash: null,
    risk_acknowledgment: null,
    digital_consent: null,
    convenience_fee_amount: 0, // Will be set to convenienceFee prop before submission
    auto_sell_config: null,
    status: 'draft',
    convenience_fee_paid: false,
  });

  const [currentMarketPrice, setCurrentMarketPrice] = useState(null);
  const [loadingPrice, setLoadingPrice] = useState(false);

  const [showRiskDisclosure, setShowRiskDisclosure] = useState(false);
  const [showConsentForm, setShowConsentForm] = useState(false);
  const [riskAcknowledged, setRiskAcknowledged] = useState(false);

  const isBuySellCycle = session?.session_mode === 'buy_sell_cycle';

  // Memoize totalValue for display
  const totalPledgeValue = useMemo(() => {
    const qty = parseFloat(pledgeData.qty) || 0;
    const price = parseFloat(pledgeData.price_target) || 0;
    return qty * price;
  }, [pledgeData.qty, pledgeData.price_target]);

  // Effect to pre-fill pledgeData when session or stock_symbol are available
  useEffect(() => {
    if (session) {
      setPledgeData(prev => ({
        ...prev,
        session_id: session.id,
        stock_symbol: stock_symbol || session.stock_symbol,
        user_id: user?.id || '',
        side: session.session_mode === 'sell_only' ? 'sell' : 'buy',
      }));
    }
    // If a stock_symbol is passed directly, use it
    if (stock_symbol && pledgeData.stock_symbol !== stock_symbol) {
        setPledgeData(prev => ({ ...prev, stock_symbol: stock_symbol }));
    }
  }, [session, user, stock_symbol]);

  const handlePledgeDataChange = (field, value) => {
    setPledgeData(prev => ({ ...prev, [field]: value }));
  };

  const fetchMarketPrice = async () => {
    setLoadingPrice(true);
    try {
      const stockData = await stockAPI.getStockPrice(pledgeData.stock_symbol);
      if (stockData && stockData.current_price) {
        const price = stockData.current_price.toFixed(2);
        setCurrentMarketPrice(price);
        setPledgeData(prev => ({ ...prev, price_target: price }));
      }
    } catch (error) {
      console.warn('Error fetching market price:', error);
      toast.error('Failed to fetch current market price.');
    } finally {
      setLoadingPrice(false);
    }
  };

  const handleInitialSubmit = (e) => {
    e.preventDefault();

    const qty = parseFloat(pledgeData.qty);
    const price = parseFloat(pledgeData.price_target);

    if (!qty || qty <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (sessionLimits?.min_qty && qty < sessionLimits.min_qty) {
      toast.error(`Minimum quantity is ${sessionLimits.min_qty}`);
      return;
    }

    if (sessionLimits?.max_qty && qty > sessionLimits.max_qty) {
      toast.error(`Maximum quantity is ${sessionLimits.max_qty}`);
      return;
    }

    if (!price || price <= 0) {
      toast.error('Please enter a valid target price');
      return;
    }

    setShowRiskDisclosure(true);
  };

  const handleRiskAcknowledged = () => {
    setShowRiskDisclosure(false);
    setRiskAcknowledged(true);
    setShowConsentForm(true);
  };

  const handleConsentSigned = async (consentHash, fullConsentData) => {
    setShowConsentForm(false);

    if (!session || !user) {
      toast.error('Session or user information is missing');
      return;
    }

    try {
      const qty = parseFloat(pledgeData.qty);
      const price = parseFloat(pledgeData.price_target);
      const sellTarget = pledgeData.auto_sell_price ? parseFloat(pledgeData.auto_sell_price) : null;

      let currentPledgeSide = session.session_mode === 'sell_only' ? 'sell' : 'buy';

      let autoSellConfig = null;
      if (isBuySellCycle) {
        autoSellConfig = {
          enabled: true,
          has_target: !!sellTarget,
          sell_price: sellTarget || null,
          sell_qty: qty,
          execution_type: sellTarget ? 'auto_target' : 'admin_managed'
        };
      }

      // Construct the final pledge object for submission
      const finalPledgeForSubmission = {
        ...pledgeData, // Start with current state values
        session_id: session.id,
        user_id: user.id,
        stock_symbol: pledgeData.stock_symbol,
        qty: qty,
        price_target: price,
        side: currentPledgeSide,
        consent_hash: consentHash,
        risk_acknowledgment: JSON.stringify({
          acknowledged: true,
          timestamp: new Date().toISOString(),
          disclosure_version: '1.0'
        }),
        digital_consent: JSON.stringify(fullConsentData),
        convenience_fee_amount: convenienceFee, // Use prop for convenience fee
        auto_sell_config: autoSellConfig ? JSON.stringify(autoSellConfig) : null,
        status: 'pending_payment', // Initial status after consent, before payment
      };

      // Call onSubmit prop to pass the fully constructed object to parent
      // The parent component is responsible for handling the actual submission,
      // setting isProcessing, and displaying success/error toasts.
      if (typeof onSubmit === 'function') {
        await onSubmit(finalPledgeForSubmission);
      } else {
        console.error('❌ onSubmit is not a function');
        toast.error('Failed to complete pledge. Please try again.');
      }
    } catch (error) {
      console.error('Error during pledge submission:', error);
      toast.error('Error submitting pledge. Please try again.');
    }
  };

  // Add session validation at component level
  if (!session) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Session Not Found</DialogTitle>
            <DialogDescription>
              <div className="p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  Session information is missing. Please close this dialog and try again.
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Target className="w-6 h-6 text-blue-600" />
              Place Your Pledge - {session.stock_name}
            </DialogTitle>
            <DialogDescription>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {pledgeData.stock_symbol}
                </Badge>
                <Badge variant="outline" className={`${
                  session.session_mode === 'buy_only' ? 'bg-green-50 text-green-700' :
                  session.session_mode === 'sell_only' ? 'bg-red-50 text-red-700' :
                  'bg-purple-50 text-purple-700'
                }`}>
                  {session.session_mode === 'buy_only' ? 'Buy Only' :
                   session.session_mode === 'sell_only' ? 'Sell Only' :
                   'Buy & Sell Cycle'}
                </Badge>
                {session.allow_amo && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700">
                    <Clock className="w-3 h-3 mr-1" />
                    AMO Enabled
                  </Badge>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInitialSubmit} className="space-y-6">
            {/* Buy Configuration */}
            <div className="p-4 bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border-2 border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Buy Configuration</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="qty" className="text-sm font-medium">
                    Quantity <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="qty"
                    type="number"
                    value={pledgeData.qty}
                    onChange={(e) => handlePledgeDataChange('qty', e.target.value)}
                    placeholder="10"
                    className="mt-2"
                    required
                  />
                  {sessionLimits?.min_qty && (
                    <p className="text-xs text-gray-600 mt-1">
                      Min: {sessionLimits.min_qty} {sessionLimits.max_qty && `| Max: ${sessionLimits.max_qty}`}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="price_target" className="text-sm font-medium">
                    Buy Price <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="price_target"
                      type="number"
                      step="0.01"
                      value={pledgeData.price_target}
                      onChange={(e) => handlePledgeDataChange('price_target', e.target.value)}
                      placeholder="₹2500.00"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={fetchMarketPrice}
                      disabled={loadingPrice || isProcessing} // Disable if overall form is processing
                    >
                      {loadingPrice ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {currentMarketPrice && (
                    <p className="text-xs text-gray-600 mt-1">
                      Current Market: ₹{currentMarketPrice}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Sell Configuration - Only for Buy-Sell Cycle */}
            {isBuySellCycle && (
              <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingDown className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-orange-900">Sell Configuration</h4>
                  <Badge variant="outline" className="ml-auto bg-blue-50 text-blue-700 text-xs">
                    Optional
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="auto_sell_price" className="text-sm font-medium">
                      Target Sell Price (Optional)
                    </Label>
                    <Input
                      id="auto_sell_price"
                      type="number"
                      step="0.01"
                      value={pledgeData.auto_sell_price}
                      onChange={(e) => handlePledgeDataChange('auto_sell_price', e.target.value)}
                      placeholder="₹2600.00"
                      className="mt-2"
                    />
                  </div>

                  {/* Dynamic Info Based on User Choice */}
                  {pledgeData.auto_sell_price && parseFloat(pledgeData.auto_sell_price) > 0 ? (
                    <div className="p-3 bg-green-100 rounded-lg border border-green-300">
                      <div className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-green-900">🤖 Auto-Sell Enabled</p>
                          <p className="text-xs text-green-800 mt-1">
                            System will automatically sell when price reaches ₹{pledgeData.auto_sell_price}.
                            You'll be notified when the sale is executed. Admin can override if needed.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-100 rounded-lg border border-blue-300">
                      <div className="flex items-start gap-2">
                        <Users className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900">👨‍💼 Admin-Managed Position</p>
                          <p className="text-xs text-blue-800 mt-1">
                            Our admin will monitor market trends and execute the sell at the optimal time
                            (intraday, days, or weeks later based on market conditions).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Universal Manual Sell Note */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-gray-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-gray-700">
                        <strong>Note:</strong> You can always sell manually via your Demat account
                        (Zerodha/Upstox) anytime, regardless of this setting.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Fee Summary */}
            <div className="p-4 bg-gray-50 rounded-xl border">
              <h4 className="font-semibold text-gray-900 mb-3">Fee Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Pledge Value:</span>
                  <span className="font-semibold">₹{totalPledgeValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Convenience Fee:</span>
                  <span className="font-semibold">₹{convenienceFee.toFixed(2)}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-base">
                  <span className="font-semibold text-gray-900">Total to Pay:</span>
                  <span className="font-bold text-blue-600">₹{(totalPledgeValue + convenienceFee).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Continue to Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Risk Disclosure Modal */}
      <RiskDisclosureModal
        isOpen={showRiskDisclosure}
        onClose={() => setShowRiskDisclosure(false)}
        onAccept={handleRiskAcknowledged}
        sessionDetails={session}
      />

      {/* Digital Consent Form */}
      <DigitalConsentForm
        isOpen={showConsentForm}
        onClose={() => setShowConsentForm(false)}
        onSign={handleConsentSigned}
        pledgeDetails={{
          stock_symbol: pledgeData.stock_symbol,
          qty: pledgeData.qty,
          price: pledgeData.price_target, // Using pledgeData.price_target here
          sell_target: pledgeData.auto_sell_price || 'Admin Managed',
          side: session.session_mode === 'sell_only' ? 'sell' : 'buy',
          fee: convenienceFee
        }}
      />
    </>
  );
}
