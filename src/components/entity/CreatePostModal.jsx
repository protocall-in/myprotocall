
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
import { FileText, TrendingUp } from 'lucide-react';
import { toast } from "sonner";

export default function CreatePostModal({ open, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    post_type: 'recommendation',
    stock_symbol: '',
    recommendation_type: '',
    target_price: '',
    stop_loss: '',
    time_horizon: 'medium_term'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.post_type === 'recommendation' && !formData.stock_symbol) {
      toast.error('Stock symbol is required for recommendations');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        target_price: formData.target_price ? parseFloat(formData.target_price) : null,
        stop_loss: formData.stop_loss ? parseFloat(formData.stop_loss) : null
      });
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Create Advisory Post
          </DialogTitle>
          <DialogDescription>
            Share your market insights and recommendations with your subscribers
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Post Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
              placeholder="Enter post title"
              required
            />
          </div>

          <div>
            <Label>Post Type *</Label>
            <Select value={formData.post_type} onValueChange={(value) => setFormData(prev => ({...prev, post_type: value}))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommendation">Stock Recommendation</SelectItem>
                <SelectItem value="market_analysis">Market Analysis</SelectItem>
                <SelectItem value="educational">Educational Content</SelectItem>
                <SelectItem value="update">Market Update</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.post_type === 'recommendation' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stock_symbol">Stock Symbol *</Label>
                  <Input
                    id="stock_symbol"
                    value={formData.stock_symbol}
                    onChange={(e) => setFormData(prev => ({...prev, stock_symbol: e.target.value.toUpperCase()}))}
                    placeholder="e.g., RELIANCE, TCS"
                    required
                  />
                </div>
                <div>
                  <Label>Recommendation Type *</Label>
                  <Select value={formData.recommendation_type} onValueChange={(value) => setFormData(prev => ({...prev, recommendation_type: value}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select recommendation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                      <SelectItem value="hold">Hold</SelectItem>
                      <SelectItem value="watch">Watch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="target_price">Target Price (₹)</Label>
                  <Input
                    id="target_price"
                    type="number"
                    step="0.01"
                    value={formData.target_price}
                    onChange={(e) => setFormData(prev => ({...prev, target_price: e.target.value}))}
                    placeholder="Target price"
                  />
                </div>
                <div>
                  <Label htmlFor="stop_loss">Stop Loss (₹)</Label>
                  <Input
                    id="stop_loss"
                    type="number"
                    step="0.01"
                    value={formData.stop_loss}
                    onChange={(e) => setFormData(prev => ({...prev, stop_loss: e.target.value}))}
                    placeholder="Stop loss price"
                  />
                </div>
              </div>

              <div>
                <Label>Time Horizon</Label>
                <Select value={formData.time_horizon} onValueChange={(value) => setFormData(prev => ({...prev, time_horizon: value}))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="short_term">Short Term (1-3 months)</SelectItem>
                    <SelectItem value="medium_term">Medium Term (3-12 months)</SelectItem>
                    <SelectItem value="long_term">Long Term (1+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({...prev, content: e.target.value}))}
              placeholder="Write your detailed analysis and rationale..."
              className="h-32"
              required
            />
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-1" />
              <div>
                <h4 className="font-semibold text-blue-800 mb-1">Publishing Guidelines</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Provide clear rationale for your recommendations</li>
                  <li>• Include relevant technical and fundamental analysis</li>
                  <li>• Always mention risk factors and disclaimers</li>
                  <li>• Posts are immediately visible to your subscribers</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
