
import React, { useState, useEffect, useRef } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateRoomModal({ open, onClose, onCreateRoom }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    room_type: "general",
    stock_symbol: ""
  });
  
  // Track if name was manually edited by user
  const isNameManuallyEdited = useRef(false);

  // Reset manual edit flag when modal opens/closes or room type changes
  useEffect(() => {
    if (open) {
      isNameManuallyEdited.current = false;
    }
  }, [open]);

  useEffect(() => {
    isNameManuallyEdited.current = false;
  }, [formData.room_type]);

  // Auto-fill room name for stock-specific rooms with ONLY stock symbol
  useEffect(() => {
    if (formData.room_type === "stock_specific" && formData.stock_symbol.trim() && !isNameManuallyEdited.current) {
      setFormData(prev => ({
        ...prev,
        name: formData.stock_symbol.toUpperCase()
      }));
    }
  }, [formData.room_type, formData.stock_symbol]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    
    // Mark as manually edited if user changes it to something different than auto-filled value
    if (formData.room_type === "stock_specific" && newName !== formData.stock_symbol.toUpperCase()) {
      isNameManuallyEdited.current = true;
    }
    
    setFormData({...formData, name: newName});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation: stock_symbol is required for stock_specific rooms
    if (formData.room_type === "stock_specific" && !formData.stock_symbol.trim()) {
      alert("Stock symbol is required for stock-specific rooms");
      return;
    }
    
    onCreateRoom(formData);
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      room_type: "general",
      stock_symbol: ""
    });
    isNameManuallyEdited.current = false;
  };

  // Get room type subheading
  const getRoomTypeSubheading = () => {
    switch (formData.room_type) {
      case "stock_specific":
        return "Stock Specific";
      case "general":
        return "General Discussion";
      case "sector":
        return "Sector Discussion";
      default:
        return null;
    }
  };

  const subheading = getRoomTypeSubheading();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat Room</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="room_type">Room Type</Label>
            <Select
              value={formData.room_type}
              onValueChange={(value) => setFormData({...formData, room_type: value})}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select room type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Discussion</SelectItem>
                <SelectItem value="stock_specific">Stock Specific</SelectItem>
                <SelectItem value="sector">Sector Discussion</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.room_type === "stock_specific" && (
            <div>
              <Label htmlFor="stock_symbol">Stock Symbol *</Label>
              <Input
                id="stock_symbol"
                value={formData.stock_symbol}
                onChange={(e) => setFormData({...formData, stock_symbol: e.target.value.toUpperCase()})}
                placeholder="e.g., RELIANCE, TCS"
                className="mt-1"
                required
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="name">Room Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={handleNameChange}
              placeholder="Enter room name..."
              className="mt-1"
              required
            />
            {subheading && (
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                {subheading}
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the room purpose..."
              className="mt-1"
              rows={3}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:border-blue-300 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Create Room
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
