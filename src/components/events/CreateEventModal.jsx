
import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Event } from "@/api/entities";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, AlertCircle, Info } from 'lucide-react';
import { createPageUrl } from '@/utils';

export default function CreateEventModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    location: "",
    capacity: "",
    is_premium: false,
    ticket_price: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canCreatePaidEvent = useMemo(() => {
    if (!user) return false;
    // Only approved entities, verified organizers, and admins can create paid events
    const allowedRoles = ['admin', 'super_admin', 'advisor', 'finfluencer', 'educator'];
    return allowedRoles.includes(user.app_role);
  }, [user]);

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!user) {
      toast.error('You must be logged in to create an event');
      return;
    }

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

    // Validation for premium event if current user cannot create paid events
    if (formData.is_premium && !canCreatePaidEvent) {
      toast.error('You need to be a verified organizer to create paid events. Please apply to become a professional organizer.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        event_date: formData.event_date,
        location: formData.location.trim(),
        organizer_id: user.id,
        organizer_name: user.display_name || user.full_name || 'Event Organizer',
        status: 'pending_approval', // All events need approval first
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        is_premium: formData.is_premium,
        ticket_price: formData.is_premium ? parseFloat(formData.ticket_price) || 0 : 0
      };

      await Event.create(eventData);
      
      toast.success('Event created successfully! It will be reviewed by admins before going live.');
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onClose) {
        onClose();
      }
      
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
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
          
          {/* Paid Event Section */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="is_premium" 
                  checked={formData.is_premium} 
                  onCheckedChange={(checked) => {
                    if (checked && !canCreatePaidEvent) {
                      // Don't allow checking if user can't create paid events
                      toast.error('Paid events are only available for verified organizers');
                      return;
                    }
                    setFormData({...formData, is_premium: checked, ticket_price: checked ? formData.ticket_price : 0});
                  }}
                  disabled={!canCreatePaidEvent}
                />
                <Label htmlFor="is_premium" className={!canCreatePaidEvent ? 'text-slate-400' : ''}>
                  Premium Event (Paid Tickets)
                </Label>
              </div>
              {!canCreatePaidEvent && (
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Crown className="w-3 h-3 mr-1" />
                  Verified Only
                </Badge>
              )}
            </div>
            
            {!canCreatePaidEvent && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-800">
                  <strong>Want to create paid events?</strong> Apply to become a verified organizer to unlock:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Create paid events with ticket sales</li>
                    <li>Earn 80% revenue from tickets</li>
                    <li>Access to organizer dashboard</li>
                    <li>Advanced analytics & check-in system</li>
                  </ul>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-blue-600 font-semibold mt-2"
                    onClick={() => window.location.href = createPageUrl('BecomeOrganizer')}
                  >
                    Apply Now →
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            {canCreatePaidEvent && formData.is_premium && (
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
                <p className="text-xs text-slate-500 mt-1">
                  Platform takes 20% commission. You'll earn ₹{(formData.ticket_price * 0.8).toFixed(2)} per ticket.
                </p>
              </div>
            )}
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Note:</strong> Your event will be submitted for admin approval before going live. You'll be notified once it's approved.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? 'Creating...' : 'Submit for Approval'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
