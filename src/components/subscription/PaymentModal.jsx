import React from 'react';
import UniversalPaymentModal from '../payment/UniversalPaymentModal';

/**
 * Subscription Payment Modal
 * Wrapper around UniversalPaymentModal for subscriptions
 */
export default function PaymentModal({ open, onClose, plan, onPaymentSuccess }) {
  if (!plan) return null;

  const handleSuccess = (paymentData) => {
    // Call the original success handler with payment data
    onPaymentSuccess(plan, paymentData);
  };

  return (
    <UniversalPaymentModal
      open={open}
      onClose={onClose}
      amount={plan.price}
      currency="INR"
      description={`${plan.name} Subscription - ${plan.period}`}
      customerInfo={{
        name: 'Current User', // This will be populated from user context
        email: 'user@example.com' // This will be populated from user context
      }}
      onSuccess={handleSuccess}
      onFailure={(error) => {
        console.error('Subscription payment failed:', error);
      }}
    />
  );
}