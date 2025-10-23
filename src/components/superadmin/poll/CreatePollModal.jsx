
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CreatePollModal({ open, onClose, onCreatePoll, onSubmit }) { // Added onCreatePoll, kept onSubmit for backward compatibility
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    stock_symbol: '',
    chatroom_id: null, // New field added
    poll_type: 'buy_sell_hold',
    expires_at: null, // Kept as null for Date object compatibility with Calendar
    is_premium: false,
    created_by_admin: true,
    target_price: '', // Kept as it's used in the UI
    confidence_score: 3 // Kept as it's used in the UI
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields, ensuring non-empty strings
    if (!formData.title.trim() || !formData.stock_symbol.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Prepare data for submission, including type conversions for backend
      const pollData = {
        ...formData,
        target_price: formData.target_price ? parseFloat(formData.target_price) : undefined,
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null
      };
      
      // Use onCreatePoll if provided, fallback to onSubmit for backward compatibility
      const submitFunction = onCreatePoll || onSubmit;
      if (submitFunction && typeof submitFunction === 'function') {
        await submitFunction(pollData); // Pass the processed pollData
      } else {
        console.error('No valid submit function (onCreatePoll or onSubmit) provided');
        toast.error('Configuration error. Please contact support.');
        setIsSubmitting(false); // Ensure submitting state is reset if no function is found
        return;
      }
      
      // Reset form after successful submission
      setFormData({
        title: '',
        description: '',
        stock_symbol: '',
        chatroom_id: null, // Reset new field
        poll_type: 'buy_sell_hold',
        expires_at: null,
        is_premium: false,
        created_by_admin: true,
        target_price: '',
        confidence_score: 3
      });
      // onClose is typically handled by the parent component after successful submission
      // or can be explicitly called here if desired. Current implementation relies on parent.
    } catch (error) {
      console.error('Error creating poll:', error);
      toast.error('Failed to create poll');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-cyan-600" />
            Create New Poll
          </DialogTitle>
          <DialogDescription>
            Create a new community poll for stock sentiment analysis
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Poll Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Should we buy RELIANCE before earnings?"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="stock_symbol">Stock Symbol *</Label>
              <Input
                id="stock_symbol"
                placeholder="e.g., RELIANCE"
                value={formData.stock_symbol}
                onChange={(e) => setFormData({...formData, stock_symbol: e.target.value.toUpperCase()})}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Poll Description</Label>
            <Textarea
              id="description"
              placeholder="Provide additional context or analysis for this poll..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="poll_type">Poll Type</Label>
              <Select 
                value={formData.poll_type} 
                onValueChange={(value) => setFormData({...formData, poll_type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select poll type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buy_sell_hold">Buy/Sell/Hold</SelectItem>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                  <SelectItem value="price_target">Price Target</SelectItem>
                  <SelectItem value="admin_recommendation">Admin Recommendation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Poll Access</Label>
              <Select 
                value={formData.is_premium ? "premium" : "general"} 
                onValueChange={(value) => setFormData({...formData, is_premium: value === "premium"})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General (Free)</SelectItem>
                  <SelectItem value="premium">Premium Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Confidence Level</Label>
              <Select 
                value={String(formData.confidence_score)} 
                onValueChange={(value) => setFormData({...formData, confidence_score: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Low Confidence</SelectItem>
                  <SelectItem value="2">2 - Moderate</SelectItem>
                  <SelectItem value="3">3 - Good</SelectItem>
                  <SelectItem value="4">4 - High</SelectItem>
                  <SelectItem value="5">5 - Very High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="target_price">Target Price (₹)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                placeholder="e.g., 2500.00"
                value={formData.target_price}
                onChange={(e) => setFormData({...formData, target_price: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Poll Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.expires_at ? format(formData.expires_at, 'PPP') : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.expires_at}
                    onSelect={(date) => setFormData({...formData, expires_at: date})}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-cyan-600 hover:bg-cyan-700"
            >
              {isSubmitting ? 'Creating...' : 'Create Poll'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
