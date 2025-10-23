
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Save, X, Clock, Moon, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PledgeSession } from '@/api/entities';
import { Switch } from '@/components/ui/switch';

// Helper for API calls with timeout
const apiCallWithTimeout = async (apiCallFn, timeoutMs = 15000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout - the server is taking too long to respond.')), timeoutMs)
  );

  return Promise.race([
    apiCallFn(),
    timeoutPromise
  ]);
};

export default function PledgeSessionFormModal({ open, onClose, onSuccess, sessionToEdit }) {
  const [formData, setFormData] = useState({
    stock_symbol: '',
    stock_name: '',
    description: '',
    execution_reason: '',
    is_advisor_recommended: false,
    is_analyst_certified: false,
    session_start: null,
    session_end: null,
    session_mode: 'buy_only',
    execution_rule: 'session_end',
    allow_amo: true,
    convenience_fee_type: 'flat',
    convenience_fee_amount: '',
    min_qty: 1,
    max_qty: '',
    capacity: '',
    status: 'draft',
  });

  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('15:30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null); // State to hold submission errors

  useEffect(() => {
    if (sessionToEdit) {
      const startDate = sessionToEdit.session_start ? new Date(sessionToEdit.session_start) : null;
      const endDate = sessionToEdit.session_end ? new Date(sessionToEdit.session_end) : null;

      setFormData({
        stock_symbol: sessionToEdit.stock_symbol || '',
        stock_name: sessionToEdit.stock_name || '',
        description: sessionToEdit.description || '',
        execution_reason: sessionToEdit.execution_reason || '',
        is_advisor_recommended: sessionToEdit.is_advisor_recommended || false,
        is_analyst_certified: sessionToEdit.is_analyst_certified || false,
        session_start: startDate,
        session_end: endDate,
        session_mode: sessionToEdit.session_mode || 'buy_only',
        execution_rule: sessionToEdit.execution_rule || 'session_end',
        allow_amo: sessionToEdit.allow_amo !== undefined ? sessionToEdit.allow_amo : true,
        convenience_fee_type: sessionToEdit.convenience_fee_type || 'flat',
        convenience_fee_amount: sessionToEdit.convenience_fee_amount || '',
        min_qty: sessionToEdit.min_qty || 1,
        max_qty: sessionToEdit.max_qty || '',
        capacity: sessionToEdit.capacity || '',
        status: sessionToEdit.status || 'draft',
      });

      if (startDate) {
        setStartTime(format(startDate, 'HH:mm'));
      } else {
        setStartTime('09:00'); // Default if no start date
      }
      if (endDate) {
        setEndTime(format(endDate, 'HH:mm'));
      } else {
        setEndTime('15:30'); // Default if no end date
      }
    } else {
      // Set default date to today
      const today = new Date();
      const defaultStart = new Date(today);
      defaultStart.setHours(9, 0, 0, 0); // 9:00 AM
      
      const defaultEnd = new Date(today);
      defaultEnd.setHours(15, 30, 0, 0); // 3:30 PM

      setFormData({
        stock_symbol: '',
        stock_name: '',
        description: '',
        execution_reason: '',
        is_advisor_recommended: false,
        is_analyst_certified: false,
        session_start: defaultStart, // Default to today 9:00 AM
        session_end: defaultEnd, // Default to today 3:30 PM
        session_mode: 'buy_only',
        execution_rule: 'session_end',
        allow_amo: true,
        convenience_fee_type: 'flat',
        convenience_fee_amount: '',
        min_qty: 1,
        max_qty: '',
        capacity: '',
        status: 'draft',
      });

      setStartTime('09:00');
      setEndTime('15:30');
    }
    // Reset error when modal opens/closes
    setSubmitError(null);
  }, [sessionToEdit, open]);

  // Combine date and time
  const combineDateAndTime = (date, time) => {
    if (!date || !time) return date;
    
    const [hours, minutes] = time.split(':');
    const combined = new Date(date);
    combined.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    return combined;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.stock_symbol || !formData.stock_name) {
      toast.error('Stock Symbol and Company Name are required.');
      return;
    }
    if (!formData.session_start || !formData.session_end) {
      toast.error('Session Start and End dates are required.');
      return;
    }
    if (!formData.convenience_fee_amount) {
      toast.error('Convenience fee amount is required.');
      return;
    }
    if (isNaN(parseFloat(formData.convenience_fee_amount))) {
        toast.error('Convenience fee amount must be a valid number.');
        return;
    }

    setIsSubmitting(true);
    setSubmitError(null); // Clear previous errors

    try {
      const finalStartDate = combineDateAndTime(formData.session_start, startTime);
      const finalEndDate = combineDateAndTime(formData.session_end, endTime);

      let sessionData = {
        stock_symbol: formData.stock_symbol.toUpperCase(),
        stock_name: formData.stock_name,
        description: formData.description,
        execution_reason: formData.execution_reason,
        is_advisor_recommended: formData.is_advisor_recommended,
        is_analyst_certified: formData.is_analyst_certified,
        session_start: finalStartDate.toISOString(),
        session_end: finalEndDate.toISOString(),
        session_mode: formData.session_mode,
        execution_rule: formData.execution_rule,
        allow_amo: formData.allow_amo,
        convenience_fee_type: formData.convenience_fee_type,
        convenience_fee_amount: parseFloat(formData.convenience_fee_amount),
        min_qty: parseInt(formData.min_qty) || 1,
        max_qty: formData.max_qty ? parseInt(formData.max_qty) : null,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        status: formData.status,
      };

      if (!sessionToEdit) {
        sessionData = {
          ...sessionData,
          created_by: 'current_admin_id', // Replace with actual admin ID
          total_pledges: 0,
          total_pledge_value: 0,
          buy_pledges_count: 0,
          sell_pledges_count: 0,
          buy_pledges_value: 0,
          sell_pledges_value: 0,
        };
      } else {
         // When editing, preserve existing pledge statistics if they're not explicitly changed in form
         sessionData = {
          ...sessionData,
          total_pledges: sessionToEdit.total_pledges || 0,
          total_pledge_value: sessionToEdit.total_pledge_value || 0,
          buy_pledges_count: sessionToEdit.buy_pledges_count || 0,
          sell_pledges_count: sessionToEdit.sell_pledges_count || 0,
          buy_pledges_value: sessionToEdit.buy_pledges_value || 0,
          sell_pledges_value: sessionToEdit.sell_pledges_value || 0,
         }
      }

      let result;
      if (sessionToEdit) {
        result = await apiCallWithTimeout(
          () => PledgeSession.update(sessionToEdit.id, sessionData)
        );
        toast.success('Session updated successfully!');
      } else {
        result = await apiCallWithTimeout(
          () => PledgeSession.create(sessionData)
        );
        toast.success('Session created successfully!');
      }

      onSuccess?.(result); // Pass the result to onSuccess
      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
      
      let errorMessage = `Failed to ${sessionToEdit ? 'update' : 'create'} session. `;
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The server is taking too long to respond. Please try again.';
      } else if (error.message?.includes('Network Error') || error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage += 'Network error. Please check your internet connection and try again.';
      } else if (error.response?.data?.message) {
        errorMessage += error.response.data.message;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'An unexpected error occurred. Please try again.';
      }
      
      setSubmitError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false); // Always stop loading state
    }
  };

  // Handle modal close - reset submitting state if still submitting
  const handleClose = () => {
    if (isSubmitting) {
      toast.warning('Please wait for the save operation to complete.');
      return;
    }
    setSubmitError(null); // Clear any error messages when closing
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {sessionToEdit ? 'Edit Pledge Session' : 'Create New Pledge Session'}
          </DialogTitle>
          <DialogDescription>
            Configure the pledge session parameters. All times are in IST (Indian Standard Time).
          </DialogDescription>
        </DialogHeader>

        {/* Show error banner if submission failed */}
        {submitError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Save Failed</p>
                <p className="text-sm text-red-700 mt-1">{submitError}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stock Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock_symbol">Stock Symbol *</Label>
              <Input
                id="stock_symbol"
                placeholder="e.g., RELIANCE"
                value={formData.stock_symbol}
                onChange={(e) => setFormData({ ...formData, stock_symbol: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div>
              <Label htmlFor="stock_name">Company Name *</Label>
              <Input
                id="stock_name"
                placeholder="e.g., Reliance Industries Ltd"
                value={formData.stock_name}
                onChange={(e) => setFormData({ ...formData, stock_name: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe this pledge session..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          {/* Execution Reason */}
          <div>
            <Label htmlFor="execution_reason">Execution Reason</Label>
            <Textarea
              id="execution_reason"
              placeholder="Why is this stock being executed? (market conditions, analyst insights, etc.)"
              value={formData.execution_reason}
              onChange={(e) => setFormData({ ...formData, execution_reason: e.target.value })}
              rows={2}
            />
          </div>

          {/* Session Dates with Time Picker */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Session Start *</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.session_start ? format(formData.session_start, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.session_start}
                      onSelect={(date) => setFormData({ ...formData, session_start: date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="pl-8 w-32"
                  />
                </div>
              </div>
            </div>
            <div>
              <Label>Session End *</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.session_end ? format(formData.session_end, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.session_end}
                      onSelect={(date) => setFormData({ ...formData, session_end: date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))} // Disable past dates
                    />
                  </PopoverContent>
                </Popover>
                <div className="relative">
                  <Clock className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="pl-8 w-32"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Session Settings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="session_mode">Session Mode</Label>
              <Select
                value={formData.session_mode}
                onValueChange={(value) => setFormData({ ...formData, session_mode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_only">Buy Only</SelectItem>
                  <SelectItem value="sell_only">Sell Only</SelectItem>
                  <SelectItem value="buy_sell_cycle">Buy & Sell Cycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="execution_rule">Execution Rule</Label>
              <Select
                value={formData.execution_rule}
                onValueChange={(value) => setFormData({ ...formData, execution_rule: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate</SelectItem>
                  <SelectItem value="session_end">Session End</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status and AMO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Session Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="executing">Executing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Set to "Active" to allow users to create pledges
              </p>
            </div>

            <div>
              <Label htmlFor="allow_amo" className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" />
                Allow AMO (After Market Orders)
              </Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  id="allow_amo"
                  checked={formData.allow_amo}
                  onCheckedChange={(checked) => setFormData({ ...formData, allow_amo: checked })}
                />
                <span className="text-sm text-gray-600">
                  {formData.allow_amo ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Orders placed outside market hours will execute at next market open
              </p>
            </div>
          </div>

          {/* Convenience Fee */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="convenience_fee_type">Fee Type</Label>
              <Select
                value={formData.convenience_fee_type}
                onValueChange={(value) => setFormData({ ...formData, convenience_fee_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  <SelectItem value="percent">Percentage (%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="convenience_fee_amount">Fee Amount *</Label>
              <Input
                id="convenience_fee_amount"
                type="number"
                step="0.01"
                placeholder={formData.convenience_fee_type === 'flat' ? 'e.g., 100' : 'e.g., 2.5'}
                value={formData.convenience_fee_amount}
                onChange={(e) => setFormData({ ...formData, convenience_fee_amount: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Quantity Limits */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="min_qty">Min Quantity</Label>
              <Input
                id="min_qty"
                type="number"
                placeholder="e.g., 1"
                value={formData.min_qty}
                onChange={(e) => setFormData({ ...formData, min_qty: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="max_qty">Max Quantity</Label>
              <Input
                id="max_qty"
                type="number"
                placeholder="Optional"
                value={formData.max_qty}
                onChange={(e) => setFormData({ ...formData, max_qty: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="capacity">Max Pledges</Label>
              <Input
                id="capacity"
                type="number"
                placeholder="Optional"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              />
            </div>
          </div>

          {/* Certification Flags */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="is_advisor_recommended">SEBI Advisor Recommended</Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  id="is_advisor_recommended"
                  checked={formData.is_advisor_recommended}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_advisor_recommended: checked })}
                />
                <span className="text-sm text-gray-600">
                  {formData.is_advisor_recommended ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
            <div>
              <Label htmlFor="is_analyst_certified">Analyst Certified</Label>
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  id="is_analyst_certified"
                  checked={formData.is_analyst_certified}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_analyst_certified: checked })}
                />
                <span className="text-sm text-gray-600">
                  {formData.is_analyst_certified ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="min-w-[100px]"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {sessionToEdit ? 'Update Session' : 'Create Session'}
                </>
              )}
            </Button>
          </div>

          {/* Show saving status message */}
          {isSubmitting && (
            <div className="text-center py-2">
              <p className="text-sm text-gray-600 animate-pulse">
                Saving session... This may take up to 15 seconds.
              </p>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
