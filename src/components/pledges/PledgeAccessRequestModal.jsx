import React, { useState } from 'react';
import { PledgeAccessRequest } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Shield, CheckCircle, AlertCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';

export default function PledgeAccessRequestModal({ 
  isOpen, 
  onClose, 
  user, 
  onRequestSubmitted 
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    demat_account_id: '',
    broker: '',
    request_reason: '',
    trading_experience: '',
    annual_income_range: '',
    consent_given: false
  });
  const [validationErrors, setValidationErrors] = useState({});

  const validateDematAccount = (dematId) => {
    // Demat account validation - typically 16 digits, alphanumeric
    const dematRegex = /^[A-Za-z0-9]{8,16}$/;
    return dematRegex.test(dematId);
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Real-time validation for Demat Account ID
    if (field === 'demat_account_id') {
      const isValid = validateDematAccount(value);
      setValidationErrors(prev => ({
        ...prev,
        demat_account_id: value && !isValid ? 'Please enter a valid Demat Account ID (8-16 alphanumeric characters)' : null
      }));
    }
  };

  const calculateRiskScore = () => {
    let score = 50; // Base score
    
    // Experience factor
    switch (formData.trading_experience) {
      case 'advanced': score += 30; break;
      case 'intermediate': score += 15; break;
      case 'beginner': score -= 10; break;
    }
    
    // Income factor
    switch (formData.annual_income_range) {
      case 'above_50l': score += 20; break;
      case '25l_to_50l': score += 15; break;
      case '10l_to_25l': score += 10; break;
      case '5l_to_10l': score += 5; break;
      case 'below_5l': score -= 5; break;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const errors = {};
    if (!formData.demat_account_id) errors.demat_account_id = 'Demat Account ID is required';
    if (!formData.broker) errors.broker = 'Please select your broker';
    if (!formData.trading_experience) errors.trading_experience = 'Please select your trading experience';
    if (!formData.annual_income_range) errors.annual_income_range = 'Please select your income range';
    if (!formData.request_reason?.trim()) errors.request_reason = 'Please provide a reason for your request';
    if (!formData.consent_given) errors.consent_given = 'You must provide consent to proceed';
    
    // Validate Demat Account format
    if (formData.demat_account_id && !validateDematAccount(formData.demat_account_id)) {
      errors.demat_account_id = 'Please enter a valid Demat Account ID (8-16 alphanumeric characters)';
    }
    
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const requestData = {
        user_id: user.id,
        user_name: user.display_name,
        user_email: user.email,
        demat_account_id: formData.demat_account_id.toUpperCase(),
        broker: formData.broker,
        consent_given: formData.consent_given,
        request_reason: formData.request_reason.trim(),
        trading_experience: formData.trading_experience,
        annual_income_range: formData.annual_income_range,
        risk_score: calculateRiskScore(),
        status: 'pending'
      };
      
      await PledgeAccessRequest.create(requestData);
      
      toast.success('Pledge access request submitted successfully! We will review your application and respond within 2-3 business days.');
      
      onRequestSubmitted?.();
      onClose();
      
      // Reset form
      setFormData({
        demat_account_id: '',
        broker: '',
        request_reason: '',
        trading_experience: '',
        annual_income_range: '',
        consent_given: false
      });
      setValidationErrors({});
      
    } catch (error) {
      console.error('Error submitting access request:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-t-lg"></div>
          <div className="relative z-10">
            <DialogTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                <Shield className="w-6 h-6 text-white" />
              </div>
              Request Pledge Access
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Complete this form to request access to pledge trading features. All information is secure and confidential.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Demat Account Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Account Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="demat_account_id" className="text-sm font-medium text-gray-700">
                  Demat Account ID *
                </Label>
                <Input
                  id="demat_account_id"
                  type="text"
                  value={formData.demat_account_id}
                  onChange={(e) => handleInputChange('demat_account_id', e.target.value)}
                  placeholder="e.g., 1201234567890123"
                  className={`bg-white/80 backdrop-blur-sm ${validationErrors.demat_account_id ? 'border-red-300' : 'border-gray-200'}`}
                  maxLength={16}
                />
                {validationErrors.demat_account_id ? (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.demat_account_id}
                  </div>
                ) : formData.demat_account_id && validateDematAccount(formData.demat_account_id) && (
                  <div className="flex items-center gap-1 text-green-600 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Valid Demat Account ID format
                  </div>
                )}
                <p className="text-xs text-gray-500">Enter your 8-16 character Demat Account ID</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="broker" className="text-sm font-medium text-gray-700">
                  Broker *
                </Label>
                <Select value={formData.broker} onValueChange={(value) => handleInputChange('broker', value)}>
                  <SelectTrigger className={`bg-white/80 backdrop-blur-sm ${validationErrors.broker ? 'border-red-300' : 'border-gray-200'}`}>
                    <SelectValue placeholder="Select your broker" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg">
                    <SelectItem value="zerodha">Zerodha</SelectItem>
                    <SelectItem value="upstox">Upstox</SelectItem>
                    <SelectItem value="angel_broking">Angel Broking</SelectItem>
                    <SelectItem value="icicidirect">ICICI Direct</SelectItem>
                    <SelectItem value="hdfcsec">HDFC Securities</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.broker && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.broker}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Trading Profile */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800">Trading Profile</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trading_experience" className="text-sm font-medium text-gray-700">
                  Trading Experience *
                </Label>
                <Select value={formData.trading_experience} onValueChange={(value) => handleInputChange('trading_experience', value)}>
                  <SelectTrigger className={`bg-white/80 backdrop-blur-sm ${validationErrors.trading_experience ? 'border-red-300' : 'border-gray-200'}`}>
                    <SelectValue placeholder="Select experience level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg">
                    <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                    <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.trading_experience && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.trading_experience}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="annual_income_range" className="text-sm font-medium text-gray-700">
                  Annual Income Range *
                </Label>
                <Select value={formData.annual_income_range} onValueChange={(value) => handleInputChange('annual_income_range', value)}>
                  <SelectTrigger className={`bg-white/80 backdrop-blur-sm ${validationErrors.annual_income_range ? 'border-red-300' : 'border-gray-200'}`}>
                    <SelectValue placeholder="Select income range" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-lg">
                    <SelectItem value="below_5l">Below ₹5 lakhs</SelectItem>
                    <SelectItem value="5l_to_10l">₹5-10 lakhs</SelectItem>
                    <SelectItem value="10l_to_25l">₹10-25 lakhs</SelectItem>
                    <SelectItem value="25l_to_50l">₹25-50 lakhs</SelectItem>
                    <SelectItem value="above_50l">Above ₹50 lakhs</SelectItem>
                  </SelectContent>
                </Select>
                {validationErrors.annual_income_range && (
                  <div className="flex items-center gap-1 text-red-600 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    {validationErrors.annual_income_range}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Request Reason */}
          <div className="space-y-2">
            <Label htmlFor="request_reason" className="text-sm font-medium text-gray-700">
              Reason for Request *
            </Label>
            <Textarea
              id="request_reason"
              value={formData.request_reason}
              onChange={(e) => handleInputChange('request_reason', e.target.value)}
              placeholder="Please explain why you want access to pledge trading features..."
              className={`bg-white/80 backdrop-blur-sm ${validationErrors.request_reason ? 'border-red-300' : 'border-gray-200'} min-h-[100px]`}
              rows={4}
            />
            {validationErrors.request_reason && (
              <div className="flex items-center gap-1 text-red-600 text-xs">
                <AlertCircle className="w-3 h-3" />
                {validationErrors.request_reason}
              </div>
            )}
          </div>

          {/* Consent Section */}
          <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 space-y-4">
            <h3 className="font-semibold text-lg text-gray-800 flex items-center gap-2">
              <Lock className="w-5 h-5 text-orange-600" />
              Consent & Agreement
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="consent"
                  checked={formData.consent_given}
                  onChange={(e) => handleInputChange('consent_given', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                  I understand and consent to the following:
                  <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-gray-600">
                    <li>My trading activities will be executed on my behalf through the pledge system</li>
                    <li>I am responsible for maintaining adequate funds in my trading account</li>
                    <li>I understand the risks associated with algorithmic and automated trading</li>
                    <li>I authorize the platform to execute trades as per my pledge commitments</li>
                  </ul>
                </label>
              </div>
              {validationErrors.consent_given && (
                <div className="flex items-center gap-1 text-red-600 text-xs">
                  <AlertCircle className="w-3 h-3" />
                  {validationErrors.consent_given}
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="hover:bg-gray-50"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 px-8"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Submit Request
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}