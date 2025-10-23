import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Lock, Loader2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { PlatformSetting, User } from '@/api/entities';

export default function UniversalPaymentModal({
  open,
  onClose,
  amount,
  currency = 'INR',
  description,
  customerInfo,
  onSuccess,
  onFailure
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentGateway, setPaymentGateway] = useState('razorpay');
  const [gatewayKeys, setGatewayKeys] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [useMockPayment, setUseMockPayment] = useState(false);

  // Load payment gateway settings
  useEffect(() => {
    const loadGatewaySettings = async () => {
      try {
        // Get current user
        const user = await User.me().catch(() => null);
        setCurrentUser(user);

        const settings = await PlatformSetting.list();
        const settingsMap = {};
        settings.forEach(s => {
          settingsMap[s.setting_key] = s.setting_value;
        });

        const gateway = settingsMap['payment_gateway'] || 'razorpay';
        setPaymentGateway(gateway);

        if (gateway === 'razorpay') {
          const keyId = settingsMap['razorpay_key_id'];
          const keySecret = settingsMap['razorpay_key_secret'];
          
          // Check if using test credentials
          const isTest = keyId?.startsWith('rzp_test_');
          setIsTestMode(isTest);
          
          setGatewayKeys({
            keyId: keyId,
            keySecret: keySecret
          });

          // Check if keys are configured
          if (!keyId) {
            // Enable mock payment for admins if keys not configured
            if (user && ['admin', 'super_admin'].includes(user.app_role)) {
              setUseMockPayment(true);
              setError(null);
            } else {
              setError('Payment gateway not configured. Please contact support.');
            }
          }
        }
      } catch (error) {
        console.error('Error loading payment settings:', error);
        setError('Failed to load payment settings. Please try again.');
      }
    };

    if (open) {
      loadGatewaySettings();
    }
  }, [open]);

  const handleMockPayment = () => {
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      const mockPaymentData = {
        paymentId: `mock_pay_${Date.now()}`,
        orderId: `mock_order_${Date.now()}`,
        signature: 'mock_signature',
        gateway: 'mock',
        amount: amount,
        currency: currency
      };

      setIsProcessing(false);
      toast.success('Mock payment successful! (Testing Mode)');
      onSuccess(mockPaymentData);
      onClose();
    }, 1500);
  };

  const handlePayment = async () => {
    // If mock payment is enabled (admin without keys), use mock
    if (useMockPayment) {
      handleMockPayment();
      return;
    }

    if (error) {
      toast.error(error);
      return;
    }

    if (!gatewayKeys?.keyId) {
      toast.error('Payment gateway not configured');
      return;
    }

    setIsProcessing(true);

    try {
      // Load Razorpay script dynamically
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        initializeRazorpay();
      };
      
      script.onerror = () => {
        setIsProcessing(false);
        setError('Failed to load payment gateway. Please refresh and try again.');
        toast.error('Failed to load payment gateway');
      };
      
      document.body.appendChild(script);
    } catch (error) {
      console.error('Payment initialization error:', error);
      setIsProcessing(false);
      setError('Failed to initialize payment. Please try again.');
      toast.error('Payment initialization failed');
    }
  };

  const initializeRazorpay = () => {
    if (!window.Razorpay) {
      setIsProcessing(false);
      setError('Payment gateway failed to load');
      return;
    }

    const options = {
      key: gatewayKeys.keyId,
      amount: Math.round(amount * 100), // Convert to paise
      currency: currency,
      name: 'Protocol',
      description: description,
      prefill: {
        name: customerInfo?.name || '',
        email: customerInfo?.email || '',
        contact: customerInfo?.phone || ''
      },
      theme: {
        color: '#7c3aed'
      },
      handler: function (response) {
        // Payment successful
        setIsProcessing(false);
        
        const paymentData = {
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          signature: response.razorpay_signature,
          gateway: 'razorpay',
          amount: amount,
          currency: currency
        };

        toast.success('Payment successful!');
        onSuccess(paymentData);
        onClose();
      },
      modal: {
        ondismiss: function() {
          // User closed the payment modal
          setIsProcessing(false);
          toast.info('Payment cancelled');
        }
      }
    };

    try {
      const razorpay = new window.Razorpay(options);
      
      razorpay.on('payment.failed', function (response) {
        setIsProcessing(false);
        const errorMsg = response.error?.description || 'Payment failed';
        setError(errorMsg);
        toast.error(errorMsg);
        
        if (onFailure) {
          onFailure({
            error: errorMsg,
            code: response.error?.code,
            reason: response.error?.reason
          });
        }
      });

      razorpay.open();
    } catch (error) {
      console.error('Razorpay initialization error:', error);
      setIsProcessing(false);
      setError('Failed to open payment gateway');
      toast.error('Failed to open payment gateway');
    }
  };

  const isAdmin = currentUser && ['admin', 'super_admin'].includes(currentUser.app_role);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Complete Your Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Details */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-800 mb-1">{description}</h3>
            <p className="text-3xl font-bold text-blue-600">₹{amount.toLocaleString()}</p>
            <p className="text-sm text-slate-600 mt-1">One-time payment</p>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-2 p-3 border rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-600">R</span>
            </div>
            <span className="text-sm font-medium">
              {useMockPayment ? 'Mock Payment (Testing)' : 'Payment via Razorpay'}
            </span>
          </div>

          {/* Security Badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="text-xs font-medium text-green-800">Secure Payment</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">256-bit SSL</span>
            </div>
          </div>

          {/* Error Display - Admin Instructions */}
          {error && isAdmin && (
            <Alert className="bg-orange-50 border-orange-300">
              <Settings className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-sm text-orange-800">
                <strong>Admin Notice:</strong> Payment gateway not configured.
                <br />
                <strong>To enable real payments:</strong>
                <ol className="list-decimal ml-4 mt-2 space-y-1">
                  <li>Go to <strong>Dashboard → Platform Settings</strong></li>
                  <li>Navigate to <strong>Payment Gateway tab</strong></li>
                  <li>Add your <strong>Razorpay Key ID</strong> and <strong>Key Secret</strong></li>
                  <li>Save settings</li>
                </ol>
                <p className="mt-2 text-xs">For now, you can use <strong>Mock Payment</strong> for testing.</p>
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display - Regular Users */}
          {error && !isAdmin && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Mock Payment Notice */}
          {useMockPayment && (
            <Alert className="bg-purple-50 border-purple-300">
              <AlertTriangle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-sm text-purple-800">
                <strong>Mock Payment Mode:</strong> Payment gateway not configured. Using mock payment for testing. No real money will be processed.
              </AlertDescription>
            </Alert>
          )}

          {/* Security Notice */}
          {!error && !useMockPayment && (
            <Alert className="bg-green-50 border-green-200">
              <Shield className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-sm text-green-800">
                <strong>100% Secure Payment</strong>
                <br />
                Your payment information is encrypted and never stored on our servers.
              </AlertDescription>
            </Alert>
          )}

          {/* Test Mode Warning */}
          {isTestMode && !useMockPayment && (
            <Alert className="bg-yellow-50 border-yellow-300">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-sm text-yellow-800">
                <strong>Test Mode:</strong> Using test/demo credentials. No actual money will be charged. Configure real API keys in Platform Settings to enable live payments.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing || (error && !useMockPayment)}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : useMockPayment ? (
                <>
                  Mock Pay ₹{amount.toLocaleString()}
                </>
              ) : (
                <>
                  Pay ₹{amount.toLocaleString()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}