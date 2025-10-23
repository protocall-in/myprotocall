import React, { useState } from 'react';
import { Event } from '@/api/entities';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function EditEventModal({ event, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: event.title || '',
    description: event.description || '',
    event_date: event.event_date ? event.event_date.slice(0, 16) : '',
    location: event.location || '',
    capacity: event.capacity || '',
    is_premium: event.is_premium || false,
    ticket_price: event.ticket_price || 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    if (!formData.title.trim()) {
      toast.error('Event title is required');
      return;
    }
    
    if (!formData.description.trim()) {
      toast.error('Event description is required');
      return;
    }
    
    if (!formData.event_date) {
      toast.error('Event date and time is required');
      return;
    }
    
    if (!formData.location.trim()) {
      toast.error('Event location is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: formData.event_date,
        location: formData.location.trim(),
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_premium: formData.is_premium,
        ticket_price: formData.is_premium ? parseFloat(formData.ticket_price) || 0 : 0,
        // Reset status to pending approval after edit
        status: 'pending_approval'
      };

      await Event.update(event.id, updateData);
      
      toast.success('Event updated successfully! It will be reviewed again by admins.');
      onSuccess();
      onClose();
      
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error('Failed to update event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input 
              id="title" 
              value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})} 
              placeholder="e.g., RELIANCE Stock Analysis Workshop"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea 
              id="description" 
              value={formData.description} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              placeholder="Describe what your event is about..."
              className="h-24"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="event_date">Date & Time *</Label>
              <Input 
                id="event_date" 
                type="datetime-local" 
                value={formData.event_date} 
                onChange={(e) => setFormData({...formData, event_date: e.target.value})} 
              />
            </div>
            <div>
              <Label htmlFor="capacity">Max Participants</Label>
              <Input 
                id="capacity" 
                type="number" 
                value={formData.capacity} 
                onChange={(e) => setFormData({...formData, capacity: e.target.value})} 
                placeholder="e.g., 50" 
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="location">Location or Meeting URL *</Label>
            <Input 
              id="location" 
              value={formData.location} 
              onChange={(e) => setFormData({...formData, location: e.target.value})} 
              placeholder="e.g., https://zoom.us/j/123456789 or Mumbai, India"
            />
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="is_premium" 
                checked={formData.is_premium} 
                onCheckedChange={(checked) => setFormData({...formData, is_premium: checked})} 
              />
              <Label htmlFor="is_premium">Premium Event (Paid Tickets)</Label>
            </div>
            
            {formData.is_premium && (
              <div>
                <Label htmlFor="ticket_price">Ticket Price (₹)</Label>
                <Input 
                  id="ticket_price" 
                  type="number" 
                  step="0.01"
                  value={formData.ticket_price} 
                  onChange={(e) => setFormData({...formData, ticket_price: e.target.value})} 
                  placeholder="e.g., 299" 
                />
              </div>
            )}
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <p><strong>Important:</strong> After editing, your event will need admin approval again before going live. All existing RSVPs will be preserved.</p>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}