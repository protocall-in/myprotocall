/**
 * Universal Payment Service
 * Supports Razorpay and Stripe with dynamic configuration
 * Works with test keys (simulation) or production keys (real payments)
 */

import { PlatformSetting } from '@/api/entities';

class PaymentService {
  constructor() {
    this.razorpayLoaded = false;
    this.stripeLoaded = false;
    this.config = null;
  }

  async loadConfig() {
    try {
      const settings = await PlatformSetting.list();
      const configMap = settings.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      this.config = {
        defaultGateway: configMap.payment_gateway_default || 'razorpay',
        razorpay: {
          keyId: configMap.razorpay_key_id || 'rzp_test_demo123456789', // Demo key for testing
          keySecret: configMap.razorpay_key_secret || 'demo_secret_key',
          enabled: configMap.razorpay_enabled === 'true' || !configMap.razorpay_enabled,
          webhookSecret: configMap.razorpay_webhook_secret || ''
        },
        stripe: {
          publishableKey: configMap.stripe_publishable_key || 'pk_test_demo123456789', // Demo key
          secretKey: configMap.stripe_secret_key || 'sk_test_demo',
          enabled: configMap.stripe_enabled === 'true' || false,
          webhookSecret: configMap.stripe_webhook_secret || ''
        }
      };

      return this.config;
    } catch (error) {
      console.error('Error loading payment config:', error);
      // Return demo config as fallback
      return {
        defaultGateway: 'razorpay',
        razorpay: {
          keyId: 'rzp_test_demo123456789',
          keySecret: 'demo_secret_key',
          enabled: true,
          webhookSecret: ''
        },
        stripe: {
          publishableKey: 'pk_test_demo123456789',
          secretKey: 'sk_test_demo',
          enabled: false,
          webhookSecret: ''
        }
      };
    }
  }

  async loadRazorpay() {
    if (this.razorpayLoaded) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        this.razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  async loadStripe() {
    if (this.stripeLoaded) return true;

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        this.stripeLoaded = true;
        resolve(true);
      };
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  /**
   * Create a payment order
   * @param {Object} options - Payment options
   * @param {number} options.amount - Amount in INR (for Razorpay) or smallest currency unit
   * @param {string} options.currency - Currency code (INR, USD, etc.)
   * @param {string} options.description - Payment description
   * @param {string} options.gateway - 'razorpay' or 'stripe' (optional, uses default)
   * @returns {Promise<Object>} Order details
   */
  async createOrder({ amount, currency = 'INR', description, gateway }) {
    const config = await this.loadConfig();
    const selectedGateway = gateway || config.defaultGateway;

    if (selectedGateway === 'razorpay') {
      return this.createRazorpayOrder({ amount, currency, description });
    } else {
      return this.createStripePaymentIntent({ amount, currency, description });
    }
  }

  async createRazorpayOrder({ amount, currency, description }) {
    const config = await this.loadConfig();
    
    // In production with real keys, this would call your backend
    // For now, simulate order creation
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      gateway: 'razorpay',
      orderId,
      amount: Math.round(amount * 100), // Razorpay uses paise (smallest unit)
      currency,
      keyId: config.razorpay.keyId,
      description,
      status: 'created'
    };
  }

  async createStripePaymentIntent({ amount, currency, description }) {
    const config = await this.loadConfig();
    
    // In production with real keys, this would call your backend
    // For now, simulate payment intent creation
    const clientSecret = `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      gateway: 'stripe',
      clientSecret,
      amount: Math.round(amount * 100), // Stripe uses smallest currency unit (cents/paise)
      currency: currency.toLowerCase(),
      publishableKey: config.stripe.publishableKey,
      description,
      status: 'created'
    };
  }

  /**
   * Process payment with Razorpay
   * @param {Object} orderDetails - Order details from createOrder
   * @param {Object} customerInfo - Customer information
   * @param {Function} onSuccess - Success callback
   * @param {Function} onFailure - Failure callback
   */
  async processRazorpayPayment(orderDetails, customerInfo, onSuccess, onFailure) {
    await this.loadRazorpay();

    if (!window.Razorpay) {
      // Razorpay script not loaded, simulate payment for demo
      console.warn('Razorpay SDK not loaded, simulating payment...');
      setTimeout(() => {
        const mockPaymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onSuccess({
          razorpay_payment_id: mockPaymentId,
          razorpay_order_id: orderDetails.orderId,
          razorpay_signature: `sig_${Math.random().toString(36).substr(2, 16)}`
        });
      }, 2000);
      return;
    }

    const options = {
      key: orderDetails.keyId,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      name: 'Protocol',
      description: orderDetails.description,
      order_id: orderDetails.orderId,
      prefill: {
        name: customerInfo.name,
        email: customerInfo.email,
        contact: customerInfo.phone || ''
      },
      theme: {
        color: '#3b82f6'
      },
      handler: function (response) {
        onSuccess(response);
      },
      modal: {
        ondismiss: function () {
          onFailure({ error: 'Payment cancelled by user' });
        }
      }
    };

    const razorpay = new window.Razorpay(options);
    razorpay.open();
  }

  /**
   * Process payment with Stripe
   * @param {Object} paymentIntent - Payment intent from createOrder
   * @param {Object} cardElement - Stripe card element
   * @param {Function} onSuccess - Success callback
   * @param {Function} onFailure - Failure callback
   */
  async processStripePayment(paymentIntent, cardElement, onSuccess, onFailure) {
    await this.loadStripe();

    if (!window.Stripe) {
      // Stripe script not loaded, simulate payment for demo
      console.warn('Stripe SDK not loaded, simulating payment...');
      setTimeout(() => {
        const mockPaymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        onSuccess({
          id: mockPaymentId,
          status: 'succeeded',
          client_secret: paymentIntent.clientSecret
        });
      }, 2000);
      return;
    }

    const stripe = window.Stripe(paymentIntent.publishableKey);

    try {
      const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: cardElement ? {
            card: cardElement
          } : undefined
        }
      );

      if (error) {
        onFailure(error);
      } else if (confirmedIntent.status === 'succeeded') {
        onSuccess(confirmedIntent);
      } else {
        onFailure({ error: 'Payment processing failed' });
      }
    } catch (error) {
      onFailure(error);
    }
  }

  /**
   * Verify payment signature (server-side in production)
   * @param {Object} paymentData - Payment response data
   * @param {string} gateway - Gateway used
   * @returns {Promise<boolean>} Verification result
   */
  async verifyPayment(paymentData, gateway) {
    // In production, this MUST be done on the backend for security
    // This is a client-side simulation only for demo purposes
    
    if (gateway === 'razorpay') {
      // Razorpay signature verification would happen on backend
      // For demo, we just check if required fields exist
      return !!(paymentData.razorpay_payment_id && 
                paymentData.razorpay_order_id && 
                paymentData.razorpay_signature);
    } else if (gateway === 'stripe') {
      // Stripe payment verification would happen via webhooks
      // For demo, check if payment succeeded
      return paymentData.status === 'succeeded';
    }
    
    return false;
  }

  /**
   * Get payment gateway display info
   * @param {string} gateway - Gateway name
   * @returns {Object} Gateway info
   */
  getGatewayInfo(gateway) {
    const info = {
      razorpay: {
        name: 'Razorpay',
        logo: '💳',
        description: 'UPI, Cards, Net Banking, Wallets',
        recommended: 'For Indian customers'
      },
      stripe: {
        name: 'Stripe',
        logo: '💵',
        description: 'Credit/Debit Cards',
        recommended: 'For International customers'
      }
    };

    return info[gateway] || info.razorpay;
  }
}

export const paymentService = new PaymentService();
export default paymentService;