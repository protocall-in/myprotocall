
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  IndianRupee, 
  TrendingUp, 
  Hash, 
  Calendar,
  FileText,
  Sparkles,
  X,
  ArrowRight
} from 'lucide-react';

export default function PaymentSuccessModal({ 
  isOpen, 
  onClose, 
  pledgeDetails,
  paymentDetails 
}) {
  if (!pledgeDetails || !paymentDetails) return null;

  const handleClose = () => {
    console.log('🔄 Success modal closed - triggering final refresh');
    onClose();
    // Trigger a page reload to ensure everything is in sync
    window.location.reload();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white z-10 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold flex items-center gap-2 text-green-700">
              <CheckCircle className="w-8 h-8 text-green-600" />
              Payment Successful!
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <DialogDescription>
            Your pledge has been created and payment processed successfully
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Success Animation Banner */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border-2 border-green-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-300 opacity-20 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Pledge Confirmed!</h3>
                  <p className="text-sm text-green-700">Your order is ready for execution</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-green-800 flex-wrap">
                <TrendingUp className="w-4 h-4" />
                <span className="font-semibold">{pledgeDetails.stock_symbol}</span>
                <span>•</span>
                <span>{pledgeDetails.qty} shares @ ₹{pledgeDetails.price_target}</span>
              </div>
            </div>
          </div>

          {/* Payment Details Card */}
          <Card className="border-2 border-gray-200">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Payment Details
              </h4>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Hash className="w-4 h-4" />
                    Payment ID
                  </span>
                  <span className="font-mono text-sm font-semibold text-gray-900 break-all text-right ml-4">
                    {paymentDetails.payment_id}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600 flex items-center gap-2">
                    <IndianRupee className="w-4 h-4" />
                    Amount Paid
                  </span>
                  <span className="font-bold text-lg text-green-600">
                    ₹{paymentDetails.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date & Time
                  </span>
                  <span className="font-semibold text-gray-900">
                    {new Date().toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-600">Payment Method</span>
                  <Badge className="bg-blue-100 text-blue-800 text-xs font-semibold uppercase">
                    {paymentDetails.method === 'test_razorpay' ? 'TEST_RAZORPAY' : paymentDetails.method}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pledge Summary Card */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50">
            <CardContent className="p-6 space-y-4">
              <h4 className="font-bold text-purple-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Pledge Summary
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Stock Symbol</p>
                  <p className="font-bold text-lg text-gray-900">{pledgeDetails.stock_symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Quantity</p>
                  <p className="font-bold text-lg text-gray-900">{pledgeDetails.qty} shares</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Buy Price</p>
                  <p className="font-bold text-lg text-gray-900">₹{pledgeDetails.price_target}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Order Type</p>
                  <p className="font-bold text-lg text-gray-900 capitalize">{pledgeDetails.side}</p>
                </div>
              </div>

              <div className="bg-blue-100 p-4 rounded-lg mt-4">
                <p className="text-sm text-gray-600 mb-1">Total Pledge Value</p>
                <p className="font-bold text-2xl text-blue-700">
                  ₹{(pledgeDetails.qty * pledgeDetails.price_target).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* What Happens Next Card */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardContent className="p-6">
              <h4 className="font-bold text-amber-900 flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-amber-600" />
                What happens next?
              </h4>

              <ol className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                  <div>
                    <p className="font-semibold text-gray-900">Your pledge is now marked as "Ready for Execution"</p>
                    <p className="text-sm text-gray-600">The system will process your order when conditions are met</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                  <div>
                    <p className="font-semibold text-gray-900">The trade will execute automatically during the session execution window</p>
                    <p className="text-sm text-gray-600">You'll receive a notification once execution is complete</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-amber-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                  <div>
                    <p className="font-semibold text-gray-900">Track your pledge status in real-time</p>
                    <p className="text-sm text-gray-600">Visit the "My Pledges" tab to monitor execution progress</p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              onClick={handleClose}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white h-12 text-base font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Got it, thanks!
            </Button>
            <Button 
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-2 border-blue-200 hover:bg-blue-50 h-12 text-base font-semibold"
            >
              View My Pledges
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
