import React, { useState } from "react";
import { Pledge, User } from "@/api/entities";
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
import { Star, Target, TrendingUp, Clock } from "lucide-react";

export default function PledgeModal({ open, onClose, stockSymbol, userVote, onPledgeComplete }) {
  const [pledgeData, setPledgeData] = useState({
    quantity: "",
    target_price: "",
    current_price: "",
    amount_committed: "",
    confidence_level: 3,
    notes: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userVote) return;

    setIsSubmitting(true);
    try {
      const user = await User.me();
      const finalPledgeData = {
        user_id: user.id,
        stock_symbol: stockSymbol,
        pledge_type: userVote,
        quantity: parseInt(pledgeData.quantity),
        target_price: parseFloat(pledgeData.target_price),
        current_price: parseFloat(pledgeData.current_price),
        amount_committed: parseFloat(pledgeData.amount_committed),
        confidence_level: parseInt(pledgeData.confidence_level),
        notes: pledgeData.notes,
        status: 'active'
      };
      
      await Pledge.create(finalPledgeData);
      onPledgeComplete();
      
      // Reset form
      setPledgeData({
        quantity: "",
        target_price: "",
        current_price: "",
        amount_committed: "",
        confidence_level: 3,
        notes: ""
      });
    } catch (error) {
      console.error("Error creating pledge:", error);
      alert("Failed to create pledge. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateAmount = () => {
    const quantity = parseFloat(pledgeData.quantity);
    const price = parseFloat(pledgeData.target_price);
    if (quantity && price) {
      const amount = quantity * price;
      setPledgeData(prev => ({...prev, amount_committed: amount.toString()}));
    }
  };

  if (!userVote) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Make Market Commitment
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{stockSymbol}</Badge>
            <Badge className={`${
              userVote === 'buy' ? 'bg-green-100 text-green-800' :
              userVote === 'sell' ? 'bg-red-100 text-red-800' :
              'bg-orange-100 text-orange-800'
            }`}>
              {userVote.toUpperCase()} Decision
            </Badge>
            <Badge variant="outline" className="bg-purple-50 text-purple-700">
              <Clock className="w-3 h-3 mr-1" />
              Today's Session
            </Badge>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={pledgeData.quantity}
                onChange={(e) => {
                  setPledgeData({...pledgeData, quantity: e.target.value});
                  setTimeout(calculateAmount, 100);
                }}
                placeholder="100"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Number of shares</p>
            </div>
            
            <div>
              <Label htmlFor="target_price">Target Price (₹)</Label>
              <Input
                id="target_price"
                type="number"
                step="0.01"
                value={pledgeData.target_price}
                onChange={(e) => {
                  setPledgeData({...pledgeData, target_price: e.target.value});
                  setTimeout(calculateAmount, 100);
                }}
                placeholder="2500.00"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Expected price</p>
            </div>
          </div>

          <div>
            <Label htmlFor="current_price">Current Market Price (₹)</Label>
            <Input
              id="current_price"
              type="number"
              step="0.01"
              value={pledgeData.current_price}
              onChange={(e) => setPledgeData({...pledgeData, current_price: e.target.value})}
              placeholder="2456.75"
              required
            />
          </div>

          <div>
            <Label htmlFor="amount_committed">Total Commitment (₹)</Label>
            <Input
              id="amount_committed"
              type="number"
              value={pledgeData.amount_committed}
              onChange={(e) => setPledgeData({...pledgeData, amount_committed: e.target.value})}
              placeholder="250000"
              required
            />
            <p className="text-xs text-slate-500 mt-1">Auto-calculated or manual entry</p>
          </div>

          <div>
            <Label htmlFor="confidence_level">Confidence Level</Label>
            <Select
              value={pledgeData.confidence_level.toString()}
              onValueChange={(value) => setPledgeData({...pledgeData, confidence_level: parseInt(value)})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[1,2,3,4,5].map(rating => (
                  <SelectItem key={rating} value={rating.toString()}>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array(rating).fill(0).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span>{rating} Star{rating > 1 ? 's' : ''}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Strategy Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={pledgeData.notes}
              onChange={(e) => setPledgeData({...pledgeData, notes: e.target.value})}
              placeholder="Your strategy and reasoning..."
              rows={3}
            />
          </div>

          {/* Pledge Summary */}
          <div className="p-4 bg-purple-50 rounded-lg space-y-2 text-sm">
            <h4 className="font-semibold text-purple-900 flex items-center gap-2">
              <Target className="w-4 h-4" />
              Commitment Summary
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Stock:</span>
                <span className="font-semibold">{stockSymbol}</span>
              </div>
              <div className="flex justify-between">
                <span>Action:</span>
                <span className="font-semibold capitalize">{userVote}</span>
              </div>
              <div className="flex justify-between">
                <span>Quantity:</span>
                <span className="font-semibold">{pledgeData.quantity || 0} shares</span>
              </div>
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-semibold">₹{pledgeData.target_price || 0}</span>
              </div>
            </div>
            <div className="flex justify-between border-t pt-2 font-bold text-purple-800">
              <span>Total Commitment:</span>
              <span>₹{parseFloat(pledgeData.amount_committed || 0).toLocaleString()}</span>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Target className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Creating...' : 'Commit Pledge'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}