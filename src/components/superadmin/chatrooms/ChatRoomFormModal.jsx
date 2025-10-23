
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Save, X, MessageSquare, Vote } from 'lucide-react';
import { toast } from 'sonner';
import CreatePollModal from '../../polls/CreatePollModal';
import { Poll } from '@/api/entities';

export default function ChatRoomFormModal({ open, onClose, room, onSave, user }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    room_type: 'general',
    stock_symbol: '',
    is_premium: false,
    required_plan: 'basic',
    admin_only_post: false
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatePollModal, setShowCreatePollModal] = useState(false);
  
  // Track if name was manually edited by admin
  const isNameManuallyEdited = useRef(false);

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name || '',
        description: room.description || '',
        room_type: room.room_type || 'general',
        stock_symbol: room.stock_symbol || '',
        is_premium: room.is_premium || false,
        required_plan: room.required_plan || 'basic',
        admin_only_post: room.admin_only_post || false
      });
      // For existing rooms, consider name as manually set
      isNameManuallyEdited.current = true;
    } else {
      // Reset for new room
      setFormData({
        name: '',
        description: '',
        room_type: 'general',
        stock_symbol: '',
        is_premium: false,
        required_plan: 'basic',
        admin_only_post: false
      });
      isNameManuallyEdited.current = false;
    }
  }, [room, open]);

  // Reset manual edit flag when room type changes for new rooms
  useEffect(() => {
    if (!room) { // Only for new rooms
      isNameManuallyEdited.current = false;
    }
  }, [formData.room_type, room]);

  // Auto-fill room name for stock-specific rooms with ONLY stock symbol
  useEffect(() => {
    // Only auto-fill for new rooms (not when editing existing rooms) and if name hasn't been manually edited
    if (!room && formData.room_type === "stock_specific" && formData.stock_symbol.trim() && !isNameManuallyEdited.current) {
      setFormData(prev => ({
        ...prev,
        name: formData.stock_symbol.toUpperCase()
      }));
    }
  }, [formData.room_type, formData.stock_symbol, room]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    
    // Mark as manually edited if admin changes it to something different than auto-filled value
    if (!room && formData.room_type === "stock_specific" && newName !== formData.stock_symbol.toUpperCase()) {
      isNameManuallyEdited.current = true;
    } else if (!room && formData.room_type !== "stock_specific" && newName.trim() !== '') {
      // If it's a new room and not stock-specific, any typing makes it manual
      isNameManuallyEdited.current = true;
    } else if (!room && newName.trim() === '') {
      // If the user clears the name field for a new room, we can reset the manual edit flag
      // to potentially allow auto-fill if they then pick a stock_specific type.
      isNameManuallyEdited.current = false;
    }
    
    setFormData({...formData, name: newName});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Room name is required');
      return;
    }

    // Validation: stock_symbol is required for stock_specific rooms
    if (formData.room_type === "stock_specific" && !formData.stock_symbol.trim()) {
      toast.error('Stock symbol is required for stock-specific rooms');
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formData);
    } catch (error) {
      console.error('Error saving room:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePoll = async (pollData) => {
    if (!room) {
      toast.error('Please save the chat room first before creating a poll');
      return;
    }

    try {
      const newPoll = await Poll.create({
        ...pollData,
        chatroom_id: room.id,
        creation_source: 'chatroom',
        is_active: true,
        created_by_admin: true,
        created_by_role: user?.app_role || 'admin'
      });

      toast.success(`Poll "${newPoll.title}" created successfully!`);
      setShowCreatePollModal(false);
    } catch (error) {
      console.error('Error creating poll from chat room modal:', error);
      toast.error('Failed to create poll');
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-cyan-600" />
              {room ? 'Edit Chat Room' : 'Create New Chat Room'}
            </DialogTitle>
            <DialogDescription>
              {room 
                ? 'Update the chat room details and settings' 
                : 'Create a new chat room for your community'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Basic Information</h3>
                {room && (
                  <Badge variant="outline" className="text-xs">
                    Room ID: {room.id?.slice(-8)}
                  </Badge>
                )}
              </div>

              <div>
                <Label htmlFor="room_type">Room Type</Label>
                <Select
                  value={formData.room_type}
                  onValueChange={(value) => setFormData({ ...formData, room_type: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Discussion</SelectItem>
                    <SelectItem value="stock_specific">Stock Specific</SelectItem>
                    <SelectItem value="sector">Sector Based</SelectItem>
                    <SelectItem value="admin">Admin Room</SelectItem>
                    <SelectItem value="premium_admin">Premium Admin Room</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="stock_symbol">
                  Stock Symbol {formData.room_type === 'stock_specific' && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="stock_symbol"
                  value={formData.stock_symbol}
                  onChange={(e) => setFormData({ ...formData, stock_symbol: e.target.value.toUpperCase() })}
                  placeholder="e.g., RELIANCE, TCS, INFY"
                  className="mt-1"
                  required={formData.room_type === 'stock_specific'}
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.room_type === 'stock_specific' 
                    ? 'Required: Stock symbol for this room'
                    : 'Optional: Associate this room with a specific stock'
                  }
                </p>
              </div>

              <div>
                <Label htmlFor="name">Room Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleNameChange} // Use the new handler
                  placeholder="Enter room name..."
                  className="mt-1"
                  required
                />
                {formData.room_type === 'stock_specific' && !room && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Tip: Room name will auto-fill with stock symbol unless manually changed.
                  </p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of the room purpose..."
                  className="mt-1 h-20"
                />
              </div>
            </div>

            {/* Room Configuration */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-700">Room Configuration</h3>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="is_premium" className="font-medium">Premium Room</Label>
                  <p className="text-xs text-slate-600 mt-1">
                    Requires subscription to access
                  </p>
                </div>
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_premium: checked })}
                />
              </div>

              {formData.is_premium && (
                <div>
                  <Label htmlFor="required_plan">Required Plan</Label>
                  <Select
                    value={formData.required_plan}
                    onValueChange={(value) => setFormData({ ...formData, required_plan: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic (Free)</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                      <SelectItem value="vip">VIP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg">
                <div className="flex-1">
                  <Label htmlFor="admin_only_post" className="font-medium">Admin Only Posting</Label>
                  <p className="text-xs text-slate-600 mt-1">
                    Only admins and advisors can send messages
                  </p>
                </div>
                <Switch
                  id="admin_only_post"
                  checked={formData.admin_only_post}
                  onCheckedChange={(checked) => setFormData({ ...formData, admin_only_post: checked })}
                />
              </div>
            </div>

            {/* Poll Creation Section - Only show for existing rooms */}
            {room && (
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Vote className="w-4 h-4 text-blue-600" />
                      Poll Management
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Create polls for this chat room
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreatePollModal(true)}
                    className="bg-gradient-to-r from-blue-50 to-purple-50 hover:from-blue-100 hover:to-purple-100 border-blue-200"
                  >
                    <Vote className="w-4 h-4 mr-2" />
                    Create Poll
                  </Button>
                </div>
                
                {!formData.stock_symbol && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      💡 Tip: Set a stock symbol for this room to create stock-specific polls more easily
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSaving}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : room ? 'Update Room' : 'Create Room'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Poll Modal */}
      {room && (
        <CreatePollModal
          open={showCreatePollModal}
          onClose={() => setShowCreatePollModal(false)}
          room={room}
          user={user}
          onCreatePoll={handleCreatePoll}
        />
      )}
    </>
  );
}
