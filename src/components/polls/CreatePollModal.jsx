
import React, { useState } from "react";
import { Poll } from "@/api/entities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Crown, Shield } from "lucide-react";
import { toast } from 'sonner';

export default function CreatePollModal({ open, onClose, room, user, onCreatePoll }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    stock_symbol: room?.stock_symbol || "",
    poll_type: "buy_sell_hold",
    expires_at: null,
    is_premium: false,
    target_price: "",
    confidence_score: 3
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate title when stock symbol or poll type changes
  React.useEffect(() => {
    if (open && room?.stock_symbol) {
      // Reset form when modal opens with room data
      setFormData(prev => ({
        ...prev,
        stock_symbol: room.stock_symbol,
        title: generateDefaultTitle(room.stock_symbol, prev.poll_type)
      }));
    }
  }, [open, room?.stock_symbol]);

  // Generate default poll questions based on stock symbol and poll type
  const generateDefaultTitle = (stockSymbol, pollType) => {
    if (!stockSymbol) return "";
    
    switch (pollType) {
      case "buy_sell_hold":
        return `What's your trading view on ${stockSymbol}?`;
      case "sentiment":
        return `What's the market sentiment for ${stockSymbol}?`;
      case "price_target":
        return `Will ${stockSymbol} hit the target price?`;
      case "advisor_recommendation":
        return `Should you consider ${stockSymbol} for your portfolio?`;
      case "pledge_poll":
        return `Ready to pledge on ${stockSymbol}?`;
      default:
        return `What's your view on ${stockSymbol}?`;
    }
  };

  // Update title when poll type changes
  React.useEffect(() => {
    if (formData.stock_symbol && formData.poll_type) {
      const defaultTitle = generateDefaultTitle(formData.stock_symbol, formData.poll_type);
      setFormData(prev => ({ ...prev, title: defaultTitle }));
    }
  }, [formData.poll_type, formData.stock_symbol]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.stock_symbol.trim()) {
      toast.error("Please provide both a poll question and stock symbol!");
      return;
    }

    setIsSubmitting(true);

    try {
      const pollData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        stock_symbol: formData.stock_symbol.trim().toUpperCase(),
        poll_type: formData.poll_type,
        chatroom_id: room?.id || null,
        creation_source: room ? "chatroom" : "admin_panel",
        expires_at: formData.expires_at ? formData.expires_at.toISOString() : null,
        is_premium: formData.is_premium,
        is_active: true, // Explicitly set to active
        created_by_admin: user?.app_role === 'admin' || user?.app_role === 'super_admin',
        created_by_role: user?.app_role,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        confidence_score: parseInt(formData.confidence_score)
      };

      console.log("Creating poll with data:", pollData); // Debug log

      await onCreatePoll(pollData);
      
      // Reset form on success
      setFormData({
        title: "",
        description: "",
        stock_symbol: room?.stock_symbol || "",
        poll_type: "buy_sell_hold",
        expires_at: null,
        is_premium: false,
        target_price: "",
        confidence_score: 3
      });
    } catch (error) {
      console.error("Submission error in modal:", error);
      toast.error("Failed to create poll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Poll</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Stock Symbol */}
          <div>
            <Label htmlFor="stock_symbol">Stock Symbol *</Label>
            <Input
              id="stock_symbol"
              value={formData.stock_symbol}
              onChange={(e) => setFormData({...formData, stock_symbol: e.target.value.toUpperCase()})}
              placeholder="e.g., RELIANCE, TCS, WIPRO"
              required
              disabled={!!room?.stock_symbol}
            />
            {room?.stock_symbol && (
              <p className="text-xs text-slate-500 mt-1">
                Stock symbol is set from the chat room
              </p>
            )}
          </div>

          {/* Poll Type */}
          <div>
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
                <SelectItem value="sentiment">Market Sentiment</SelectItem>
                <SelectItem value="price_target">Price Target</SelectItem>
                <SelectItem value="advisor_recommendation">Advisor Recommendation</SelectItem>
                <SelectItem value="pledge_poll">Pledge Poll</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Poll Question */}
          <div>
            <Label htmlFor="title">Poll Question *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="Auto-generated based on stock and poll type..."
              required
            />
            <p className="text-xs text-slate-500 mt-1">
              This will appear as the poll description below the stock symbol
            </p>
          </div>
          
          {/* Description */}
          <div>
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Add context, analysis, or reasoning..."
              rows={3}
            />
          </div>

          {/* Target Price (conditional) */}
          {(formData.poll_type === "price_target" || formData.poll_type === "advisor_recommendation") && (
            <div>
              <Label htmlFor="target_price">Target Price (₹)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                value={formData.target_price}
                onChange={(e) => setFormData({...formData, target_price: e.target.value})}
                placeholder="Expected price target"
              />
            </div>
          )}

          {/* Confidence Score */}
          <div>
            <Label htmlFor="confidence_score">Confidence Level</Label>
            <Select
              value={formData.confidence_score.toString()}
              onValueChange={(value) => setFormData({...formData, confidence_score: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">⭐ Low Confidence</SelectItem>
                <SelectItem value="2">⭐⭐ Fair Confidence</SelectItem>
                <SelectItem value="3">⭐⭐⭐ Good Confidence</SelectItem>
                <SelectItem value="4">⭐⭐⭐⭐ High Confidence</SelectItem>
                <SelectItem value="5">⭐⭐⭐⭐⭐ Very High Confidence</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date */}
          <div>
            <Label>Poll Expires (Optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.expires_at ? format(formData.expires_at, 'PPP') : 'Set expiry date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.expires_at}
                  onSelect={(date) => setFormData({...formData, expires_at: date})}
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Premium Poll Toggle */}
          {user && ['admin', 'super_admin', 'advisor'].includes(user.app_role) && (
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Crown className="w-4 h-4 text-purple-600" />
                <Label htmlFor="is_premium" className="font-medium">Premium Poll</Label>
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Only
                </Badge>
              </div>
              <Switch
                id="is_premium"
                checked={formData.is_premium}
                onCheckedChange={(checked) => setFormData({...formData, is_premium: checked})}
              />
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700">
              {isSubmitting ? "Creating..." : "Create Poll"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
