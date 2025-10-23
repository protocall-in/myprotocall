import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wallet, CreditCard, Smartphone } from 'lucide-react';
import { toast } from "sonner";

export default function PayoutRequestModal({ open, onClose, onSubmit, availableBalance, entityType }) {
  const [formData, setFormData] = useState({
    requested_amount: '',
    payout_method: '',
    bank_details: {
      account_number: '',
      ifsc_code: '',
      account_holder_name: ''
    },
    upi_id: '',
    paypal_email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.requested_amount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    if (amount > availableBalance) {
      toast.error('Amount exceeds available balance');
      return;
    }
    
    if (!formData.payout_method) {
      toast.error('Please select a payout method');
      return;
    }
    
    // Validate method-specific fields
    if (formData.payout_method === 'bank_transfer') {
      if (!formData.bank_details.account_number || !formData.bank_details.ifsc_code || !formData.bank_details.account_holder_name) {
        toast.error('Please fill all bank details');
        return;
      }
    } else if (formData.payout_method === 'upi') {
      if (!formData.upi_id) {
        toast.error('Please enter UPI ID');
        return;
      }
    } else if (formData.payout_method === 'paypal') {
      if (!formData.paypal_email) {
        toast.error('Please enter PayPal email');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        requested_amount: amount,
        payout_method: formData.payout_method,
        bank_details: formData.payout_method === 'bank_transfer' ? formData.bank_details : null,
        upi_id: formData.payout_method === 'upi' ? formData.upi_id : null,
        paypal_email: formData.payout_method === 'paypal' ? formData.paypal_email : null
      });
    } catch (error) {
      console.error('Error submitting payout request:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-green-600" />
            Request Payout
          </DialogTitle>
          <DialogDescription>
            Request a payout from your available balance
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Available Balance</Label>
            <div className="p-3 bg-green-50 rounded-lg text-green-800 font-semibold">
              ₹{availableBalance.toLocaleString()}
            </div>
          </div>

          <div>
            <Label htmlFor="amount">Payout Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={availableBalance}
              value={formData.requested_amount}
              onChange={(e) => setFormData(prev => ({...prev, requested_amount: e.target.value}))}
              placeholder="Enter amount"
              required
            />
          </div>

          <div>
            <Label>Payout Method *</Label>
            <Select value={formData.payout_method} onValueChange={(value) => setFormData(prev => ({...prev, payout_method: value}))}>
              <SelectTrigger>
                <SelectValue placeholder="Choose payout method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Bank Transfer
                  </div>
                </SelectItem>
                <SelectItem value="upi">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4" />
                    UPI
                  </div>
                </SelectItem>
                <SelectItem value="paypal">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    PayPal
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bank Transfer Fields */}
          {formData.payout_method === 'bank_transfer' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <h4 className="font-semibold text-slate-800">Bank Details</h4>
              <div>
                <Label htmlFor="account_holder">Account Holder Name *</Label>
                <Input
                  id="account_holder"
                  value={formData.bank_details.account_holder_name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bank_details: {...prev.bank_details, account_holder_name: e.target.value}
                  }))}
                  placeholder="Full name as per bank account"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account_number">Account Number *</Label>
                <Input
                  id="account_number"
                  value={formData.bank_details.account_number}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bank_details: {...prev.bank_details, account_number: e.target.value}
                  }))}
                  placeholder="Bank account number"
                  required
                />
              </div>
              <div>
                <Label htmlFor="ifsc">IFSC Code *</Label>
                <Input
                  id="ifsc"
                  value={formData.bank_details.ifsc_code}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bank_details: {...prev.bank_details, ifsc_code: e.target.value.toUpperCase()}
                  }))}
                  placeholder="IFSC code"
                  required
                />
              </div>
            </div>
          )}

          {/* UPI Field */}
          {formData.payout_method === 'upi' && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <Label htmlFor="upi_id">UPI ID *</Label>
              <Input
                id="upi_id"
                value={formData.upi_id}
                onChange={(e) => setFormData(prev => ({...prev, upi_id: e.target.value}))}
                placeholder="username@upi (e.g., john@paytm)"
                required
              />
            </div>
          )}

          {/* PayPal Field */}
          {formData.payout_method === 'paypal' && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <Label htmlFor="paypal_email">PayPal Email *</Label>
              <Input
                id="paypal_email"
                type="email"
                value={formData.paypal_email}
                onChange={(e) => setFormData(prev => ({...prev, paypal_email: e.target.value}))}
                placeholder="your-paypal-email@example.com"
                required
              />
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Payout requests are processed within 3-5 business days after approval. 
              You'll receive email notifications about the status updates.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !formData.requested_amount || !formData.payout_method}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}