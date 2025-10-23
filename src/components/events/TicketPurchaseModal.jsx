import React, { useState } from 'react';
import { EventTicket, EventCommissionTracking, Notification, EventAttendee } from '@/api/entities';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  MapPin,
  Crown,
  Loader2,
  CheckCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import UniversalPaymentModal from '../payment/UniversalPaymentModal';

export default function TicketPurchaseModal({ event, user, onClose, onSuccess }) {
  const [showPayment, setShowPayment] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePurchase = () => {
    setShowPayment(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    setIsProcessing(true);
    
    try {
      // Create ticket record with real payment data
      const newTicket = await EventTicket.create({
        event_id: event.id,
        user_id: user.id,
        ticket_price: event.ticket_price || 0,
        payment_id: paymentData.paymentId,
        status: 'active',
        payment_method: paymentData.gateway,
        purchased_date: new Date().toISOString()
      });

      // CRITICAL: Auto-RSVP to YES after ticket purchase
      try {
        // Check if user already has an RSVP
        const existingRSVP = await EventAttendee.filter({ 
          event_id: event.id, 
          user_id: user.id 
        });

        if (existingRSVP && existingRSVP.length > 0) {
          // Update existing RSVP to YES
          await EventAttendee.update(existingRSVP[0].id, {
            rsvp_status: 'yes',
            user_name: user.display_name || user.full_name,
            confirmed: false
          });
        } else {
          // Create new RSVP with YES status
          await EventAttendee.create({
            event_id: event.id,
            user_id: user.id,
            user_name: user.display_name || user.full_name,
            rsvp_status: 'yes',
            confirmed: false
          });
        }
      } catch (rsvpError) {
        console.error('Error creating auto-RSVP:', rsvpError);
        // Don't fail the whole transaction if RSVP fails
      }

      // Update commission tracking
      const existingTracking = await EventCommissionTracking.filter({ event_id: event.id });
      
      if (existingTracking.length > 0) {
        const tracking = existingTracking[0];
        await EventCommissionTracking.update(tracking.id, {
          gross_revenue: (tracking.gross_revenue || 0) + (event.ticket_price || 0),
          total_tickets_sold: (tracking.total_tickets_sold || 0) + 1,
          platform_commission: ((tracking.gross_revenue || 0) + (event.ticket_price || 0)) * (tracking.platform_commission_rate / 100),
          organizer_payout: ((tracking.gross_revenue || 0) + (event.ticket_price || 0)) * (1 - tracking.platform_commission_rate / 100)
        });
      } else {
        const platformCommissionRate = 20;
        const grossRevenue = event.ticket_price || 0;
        const platformCommission = grossRevenue * (platformCommissionRate / 100);
        const organizerPayout = grossRevenue - platformCommission;
        
        await EventCommissionTracking.create({
          event_id: event.id,
          organizer_id: event.organizer_id,
          organizer_role: 'event_organizer',
          gross_revenue: grossRevenue,
          platform_commission_rate: platformCommissionRate,
          platform_commission: platformCommission,
          organizer_payout: organizerPayout,
          payout_status: 'pending',
          total_tickets_sold: 1
        });
      }

      // Send confirmation notifications
      await Notification.create({
        user_id: user.id,
        title: 'Ticket Purchased Successfully',
        message: `Your ticket for "${event.title}" has been confirmed. You've been automatically RSVP'd as "YES". Ticket ID: ${newTicket.id.slice(-8).toUpperCase()}. Payment ID: ${paymentData.paymentId}`,
        type: 'info',
        page: 'general'
      });

      await Notification.create({
        user_id: event.organizer_id,
        title: 'New Ticket Sale',
        message: `A ticket has been sold for your event "${event.title}"`,
        type: 'info',
        page: 'general'
      });

      setPaymentSuccess(true);
      toast.success('Ticket purchased successfully! Your RSVP is set to YES.');
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('Failed to process ticket purchase:', error);
      toast.error('Failed to create ticket. Please contact support.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentFailure = (error) => {
    console.error('Payment failed:', error);
    setShowPayment(false);
    toast.error(error.error || 'Payment failed. Please try again.');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (paymentSuccess) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-gray-600 mb-2">Your ticket has been confirmed.</p>
            <p className="text-green-600 font-semibold">✅ Your RSVP is set to YES</p>
            <p className="text-sm text-gray-500 mt-4">Check your notifications for details.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={!showPayment} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Purchase Ticket
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Event Summary */}
            <div className="p-4 bg-slate-50 rounded-lg">
              <h3 className="font-semibold text-slate-800 mb-2">{event.title}</h3>
              
              <div className="space-y-2 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {event.location?.includes('http') ? 'Online Event' : event.location || 'Location TBD'}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Crown className="w-4 h-4" />
                  <span>Premium Event</span>
                </div>
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Event Ticket</span>
                <span className="font-medium">₹{(event.ticket_price || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600">Platform Fee</span>
                <span className="font-medium">₹0</span>
              </div>
              
              <div className="border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-800">Total Amount</span>
                  <span className="font-bold text-lg text-slate-800">₹{(event.ticket_price || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Auto-RSVP Notice */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800 text-center">
                ✅ After payment, your RSVP will be automatically set to <strong>"YES"</strong>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={onClose}
                className="flex-1"
                disabled={isProcessing}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handlePurchase}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                  </>
                )}
              </Button>
            </div>

            {/* Terms & Conditions */}
            <div className="text-xs text-slate-500 text-center">
              By completing this purchase, you agree to our Terms of Service and Event Cancellation Policy.
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Universal Payment Modal */}
      {showPayment && (
        <UniversalPaymentModal
          open={showPayment}
          onClose={() => setShowPayment(false)}
          amount={event.ticket_price || 0}
          currency="INR"
          description={`Ticket for ${event.title}`}
          customerInfo={{
            name: user.display_name || user.full_name,
            email: user.email,
            phone: user.mobile_number
          }}
          onSuccess={handlePaymentSuccess}
          onFailure={handlePaymentFailure}
        />
      )}
    </>
  );
}