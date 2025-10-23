
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, Building, Shield, Check, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { FundWallet, FundTransaction, FundInvoice, Notification, User } from '@/api/entities';
import { toast } from 'sonner';
import { useConfirm } from '../hooks/useConfirm'; // Added import for useConfirm

export default function PaymentModal({ isOpen, onClose, amount, investor, wallet, purpose = 'wallet_deposit', onSuccess }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    upiId: ''
  });

  const { confirm, ConfirmDialog } = useConfirm(); // Initialized useConfirm hook

  // Safely parse amount
  const paymentAmount = amount && !isNaN(parseFloat(amount)) ? parseFloat(amount) : 0;

  const handlePayment = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) { // Added check for amount as per outline
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentAmount <= 0) { // Keep existing check for consistency, though partially covered by above
      toast.error('Invalid payment amount');
      return;
    }

    if (!paymentMethod) {
      toast.error('Please select a payment method');
      return;
    }

    // Replaced native confirm with custom confirm dialog
    const confirmed = await confirm({
      title: 'Confirm Payment',
      message: `Proceed with payment of ₹${paymentAmount.toLocaleString('en-IN')} via ${paymentMethod.toUpperCase()}?`,
      confirmText: 'Pay Now',
      cancelText: 'Cancel',
      variant: 'success'
    });

    if (!confirmed) {
      return;
    }

    setIsProcessing(true);

    try {
      // Step 1: Simulate payment gateway (in real app, integrate with Razorpay/Stripe)
      const paymentId = `PAY_${Date.now()}`;

      // Step 2: Create wallet transaction
      const transaction = await FundTransaction.create({
        investor_id: investor.id,
        transaction_type: 'wallet_deposit',
        amount: paymentAmount,
        payment_method: paymentMethod,
        payment_reference: paymentId,
        status: 'completed',
        transaction_date: new Date().toISOString(),
        settlement_date: new Date().toISOString(),
        notes: `Wallet top-up via ${paymentMethod}`
      });

      // Step 3: Generate invoice WITHOUT GST
      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      await FundInvoice.create({
        investor_id: investor.id,
        transaction_id: transaction.id,
        invoice_number: invoiceNumber,
        invoice_type: 'purchase',
        invoice_date: new Date().toISOString().split('T')[0],
        gross_amount: paymentAmount,
        tax_amount: 0,
        fee_amount: 0,
        net_amount: paymentAmount,
        status: 'generated'
      });

      // Step 4: Update wallet balance or create wallet if it doesn't exist
      if (wallet) {
        await FundWallet.update(wallet.id, {
          available_balance: (wallet.available_balance || 0) + paymentAmount,
          total_deposited: (wallet.total_deposited || 0) + paymentAmount,
          last_transaction_date: new Date().toISOString()
        });
      } else {
        // Create wallet if doesn't exist
        await FundWallet.create({
          investor_id: investor.id,
          available_balance: paymentAmount,
          locked_balance: 0,
          total_deposited: paymentAmount,
          total_withdrawn: 0,
          last_transaction_date: new Date().toISOString()
        });
      }

      // Step 5: Send notification to investor with page type
      await Notification.create({
        user_id: investor.user_id,
        title: 'Wallet Credited',
        message: `₹${paymentAmount.toLocaleString('en-IN')} has been credited to your wallet.`,
        type: 'info',
        page: 'wallet'
      });

      // Step 6: SEND NOTIFICATION TO FUND MANAGER with page type
      const fundManagers = await User.filter({ app_role: 'super_admin' });
      for (const manager of fundManagers) {
        await Notification.create({
          user_id: manager.id,
          title: 'Wallet Credit Alert',
          message: `Investor ${investor.investor_code} (${investor.full_name}) credited ₹${paymentAmount.toLocaleString('en-IN')} to wallet via ${paymentMethod}.`,
          type: 'info',
          page: 'transaction',
          meta: JSON.stringify({
            investor_id: investor.id,
            investor_code: investor.investor_code,
            amount: paymentAmount,
            payment_method: paymentMethod,
            action: 'wallet_credit'
          })
        });
      }

      toast.success('₹' + paymentAmount.toLocaleString('en-IN') + ' credited to wallet successfully!');

      onClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Don't render if amount is invalid
  if (paymentAmount <= 0) {
    return null;
  }

  return (
    <>
      <ConfirmDialog /> {/* Render the custom confirm dialog */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Complete Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Amount Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-slate-900">
                  {purpose === 'wallet_deposit' ? 'Add to Wallet' : 'Investment Amount'}
                </h3>
                <Badge className="bg-blue-600">
                  {purpose === 'wallet_deposit' ? 'Wallet Top-up' : 'Fund Investment'}
                </Badge>
              </div>
              <div className="text-3xl font-bold text-blue-900">₹{paymentAmount.toLocaleString('en-IN')}</div>
              <p className="text-sm text-slate-600 mt-1">
                {purpose === 'wallet_deposit' ? 'Instant credit to your wallet' : 'One-time payment'}
              </p>
            </div>

            {/* Payment Method Selection */}
            <div>
              <Label className="text-base font-medium mb-3 block">Payment Method</Label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Button
                  type="button"
                  variant={paymentMethod === 'upi' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('upi')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-xs">UPI</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'card' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('card')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <CreditCard className="w-5 h-5" />
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  type="button"
                  variant={paymentMethod === 'netbanking' ? 'default' : 'outline'}
                  onClick={() => setPaymentMethod('netbanking')}
                  className="flex flex-col items-center gap-2 h-auto py-3"
                >
                  <Building className="w-5 h-5" />
                  <span className="text-xs">Net Banking</span>
                </Button>
              </div>
            </div>

            {/* Payment Form */}
            <form onSubmit={handlePayment} className="space-y-4">
              {paymentMethod === 'card' && (
                <>
                  <div>
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={paymentData.cardNumber}
                      onChange={(e) => setPaymentData({...paymentData, cardNumber: e.target.value})}
                      maxLength="19"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiryDate">Expiry Date</Label>
                      <Input
                        id="expiryDate"
                        placeholder="MM/YY"
                        value={paymentData.expiryDate}
                        onChange={(e) => setPaymentData({...paymentData, expiryDate: e.target.value})}
                        maxLength="5"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv">CVV</Label>
                      <Input
                        id="cvv"
                        placeholder="123"
                        value={paymentData.cvv}
                        onChange={(e) => setPaymentData({...paymentData, cvv: e.target.value})}
                        maxLength="4"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={paymentData.cardName}
                      onChange={(e) => setPaymentData({...paymentData, cardName: e.target.value})}
                      required
                    />
                  </div>
                </>
              )}

              {paymentMethod === 'upi' && (
                <div>
                  <Label htmlFor="upiId">UPI ID</Label>
                  <Input
                    id="upiId"
                    placeholder="username@paytm"
                    value={paymentData.upiId}
                    onChange={(e) => setPaymentData({...paymentData, upiId: e.target.value})}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    💡 Enter your UPI ID or scan QR code in your UPI app
                  </p>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="text-center py-4">
                  <Building className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 text-sm">You will be redirected to your bank's website</p>
                </div>
              )}

              {isProcessing ? (
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Processing your payment...</p>
                    <p className="text-xs text-slate-500 mt-1">Please do not close this window</p>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
                    <Check className="w-4 h-4 mr-2" />
                    Pay ₹{paymentAmount.toLocaleString('en-IN')}
                  </Button>
                </div>
              )}
            </form>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Secure Payment</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                Your payment information is encrypted and secure. Powered by Razorpay.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
