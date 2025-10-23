
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  UserPlus,
  XCircle,
  TrendingUp,
  Lock,
  Settings
} from 'lucide-react';
import { Event, EventAttendee, Notification } from '@/api/entities';
import { toast } from 'sonner';

export default function EventCapacityManager({ event, attendees, onUpdate }) {
  const [capacity, setCapacity] = useState(event?.capacity || 0);
  const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWaitlistModal, setShowWaitlistModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const confirmedAttendees = attendees.filter(a => a.rsvp_status === 'yes');
  const waitlistAttendees = attendees.filter(a => a.rsvp_status === 'waitlist');
  const capacityUsed = confirmedAttendees.length;
  const capacityPercent = capacity > 0 ? (capacityUsed / capacity) * 100 : 0;
  const availableSpots = capacity > 0 ? Math.max(0, capacity - capacityUsed) : Infinity;
  const isFull = capacity > 0 && capacityUsed >= capacity;

  const getCapacityStatus = () => {
    if (capacityPercent >= 100) return { color: 'bg-red-600', text: 'Full', icon: Lock };
    if (capacityPercent >= 80) return { color: 'bg-orange-600', text: 'Almost Full', icon: AlertTriangle };
    if (capacityPercent >= 50) return { color: 'bg-yellow-600', text: 'Filling Up', icon: TrendingUp };
    return { color: 'bg-green-600', text: 'Available', icon: CheckCircle };
  };

  const capacityStatus = getCapacityStatus();
  const StatusIcon = capacityStatus.icon;

  const handleUpdateCapacity = async () => {
    if (capacity < 0) {
      toast.error('Capacity cannot be negative');
      return;
    }

    if (capacity > 0 && capacity < capacityUsed) {
      toast.error(`Capacity cannot be less than current attendees (${capacityUsed})`);
      return;
    }

    setIsProcessing(true);
    try {
      await Event.update(event.id, {
        capacity: capacity || null,
        auto_close_when_full: autoCloseEnabled,
        waitlist_enabled: waitlistEnabled
      });

      // If auto-close is enabled and event is full, update status
      if (autoCloseEnabled && isFull) {
        await Event.update(event.id, {
          status: 'completed' // or 'closed' based on your status enum
        });
        toast.info('Event automatically closed due to capacity');
      }

      toast.success('Capacity settings updated successfully');
      setShowSettingsModal(false);
      await onUpdate();
    } catch (error) {
      console.error('Error updating capacity:', error);
      toast.error('Failed to update capacity settings');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePromoteFromWaitlist = async (attendee) => {
    if (isFull && !waitlistEnabled) {
      toast.error('Event is at full capacity');
      return;
    }

    setIsProcessing(true);
    try {
      // Update attendee status from waitlist to yes
      await EventAttendee.update(attendee.id, {
        rsvp_status: 'yes',
        confirmed: true
      });

      // Send notification to user
      await Notification.create({
        user_id: attendee.user_id,
        title: '🎉 You\'re In! Spot Confirmed',
        message: `Great news! A spot has opened up for "${event.title}" on ${new Date(event.event_date).toLocaleDateString()}. Your registration is now confirmed!`,
        type: 'info',
        page: 'general',
        status: 'unread'
      });

      toast.success(`${attendee.user_name} promoted from waitlist`);
      await onUpdate();
    } catch (error) {
      console.error('Error promoting from waitlist:', error);
      toast.error('Failed to promote attendee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFromWaitlist = async (attendee) => {
    setIsProcessing(true);
    try {
      await EventAttendee.update(attendee.id, {
        rsvp_status: 'no'
      });

      await Notification.create({
        user_id: attendee.user_id,
        title: 'Waitlist Status Update',
        message: `You have been removed from the waitlist for "${event.title}". Please contact support if you have questions.`,
        type: 'alert',
        page: 'general',
        status: 'unread'
      });

      toast.success('Attendee removed from waitlist');
      await onUpdate();
    } catch (error) {
      console.error('Error removing from waitlist:', error);
      toast.error('Failed to remove attendee');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPromote = async (count) => {
    if (waitlistAttendees.length === 0) {
      toast.error('No one on waitlist');
      return;
    }

    const spotsAvailable = availableSpots;
    const toPromote = Math.min(count || spotsAvailable, waitlistAttendees.length, spotsAvailable);

    if (toPromote === 0) {
      toast.error('No available spots');
      return;
    }

    setIsProcessing(true);
    try {
      const attendeesToPromote = waitlistAttendees.slice(0, toPromote);
      
      await Promise.all(
        attendeesToPromote.map(attendee =>
          EventAttendee.update(attendee.id, {
            rsvp_status: 'yes',
            confirmed: true
          })
        )
      );

      // Send notifications
      await Promise.all(
        attendeesToPromote.map(attendee =>
          Notification.create({
            user_id: attendee.user_id,
            title: '🎉 You\'re In! Spot Confirmed',
            message: `Great news! A spot has opened up for "${event.title}". Your registration is now confirmed!`,
            type: 'info',
            page: 'general',
            status: 'unread'
          })
        )
      );

      toast.success(`${toPromote} attendees promoted from waitlist`);
      setShowWaitlistModal(false);
      await onUpdate();
    } catch (error) {
      console.error('Error bulk promoting:', error);
      toast.error('Failed to promote attendees');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!event) return null;

  return (
    <div className="space-y-6">
      {/* Capacity Overview Card */}
      <Card className="shadow-lg border-0 bg-gradient-to-r from-slate-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-600" />
              Event Capacity Management
            </CardTitle>
            <Button
              onClick={() => setShowSettingsModal(true)}
              variant="outline"
              className="border-2 border-blue-400 text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Capacity */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Current Capacity</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {capacityUsed} / {capacity || '∞'}
                  </p>
                </div>
                <div className={`w-16 h-16 rounded-full ${capacityStatus.color} bg-opacity-20 flex items-center justify-center`}>
                  <StatusIcon className={`w-8 h-8 ${capacityStatus.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
              
              {capacity > 0 && (
                <>
                  <Progress value={capacityPercent} className="h-3 mb-2" />
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>{capacityPercent.toFixed(1)}% Full</span>
                    <Badge className={capacityStatus.color}>
                      {capacityStatus.text}
                    </Badge>
                  </div>
                </>
              )}
            </div>

            {/* Available Spots */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Available Spots</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">
                    {capacity > 0 ? availableSpots : '∞'}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-green-600" />
                </div>
              </div>
              {isFull && (
                <Badge className="bg-red-100 text-red-800 w-full justify-center">
                  <Lock className="w-3 h-3 mr-1" />
                  Event Full
                </Badge>
              )}
            </div>

            {/* Waitlist */}
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Waitlist</p>
                  <p className="text-3xl font-bold text-orange-600 mt-1">
                    {waitlistAttendees.length}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </div>
              {waitlistAttendees.length > 0 && (
                <Button
                  onClick={() => setShowWaitlistModal(true)}
                  variant="outline"
                  size="sm"
                  className="w-full border-orange-400 text-orange-700 hover:bg-orange-50"
                >
                  Manage Waitlist
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Capacity Settings Modal */}
      <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Capacity Settings</DialogTitle>
            <DialogDescription>
              Configure event capacity, auto-close, and waitlist settings
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Capacity Input */}
            <div>
              <Label className="text-base font-semibold mb-2 block">Event Capacity</Label>
              <Input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                placeholder="Enter max capacity (0 for unlimited)"
                min="0"
                className="h-12 text-lg"
              />
              <p className="text-sm text-gray-500 mt-2">
                Current attendees: {capacityUsed}. Set to 0 for unlimited capacity.
              </p>
            </div>

            {/* Auto-Close Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <Label className="text-base font-semibold">Auto-Close When Full</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Automatically close registrations when capacity is reached
                </p>
              </div>
              <Switch
                checked={autoCloseEnabled}
                onCheckedChange={setAutoCloseEnabled}
                disabled={capacity === 0}
              />
            </div>

            {/* Waitlist Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <Label className="text-base font-semibold">Enable Waitlist</Label>
                <p className="text-sm text-gray-600 mt-1">
                  Allow users to join waitlist when event is full
                </p>
              </div>
              <Switch
                checked={waitlistEnabled}
                onCheckedChange={setWaitlistEnabled}
                disabled={capacity === 0}
              />
            </div>

            {/* Warning Messages */}
            {capacity > 0 && capacity < capacityUsed && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-red-800">Capacity Error</p>
                    <p className="text-sm text-red-700">
                      Capacity cannot be less than current attendees ({capacityUsed})
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isFull && autoCloseEnabled && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-800">Event Will Be Closed</p>
                    <p className="text-sm text-yellow-700">
                      This event is at full capacity and will be automatically closed
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSettingsModal(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateCapacity}
              disabled={isProcessing || (capacity > 0 && capacity < capacityUsed)}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white"
            >
              {isProcessing ? 'Updating...' : 'Save Settings'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Waitlist Management Modal */}
      <Dialog open={showWaitlistModal} onOpenChange={setShowWaitlistModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Clock className="w-6 h-6 text-orange-600" />
              Waitlist Management
            </DialogTitle>
            <DialogDescription>
              {waitlistAttendees.length} people waiting • {availableSpots} spots available
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Bulk Actions */}
            {availableSpots > 0 && waitlistAttendees.length > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-green-800">Spots Available!</p>
                    <p className="text-sm text-green-700">
                      Promote up to {Math.min(availableSpots, waitlistAttendees.length)} people from waitlist
                    </p>
                  </div>
                  <Button
                    onClick={() => handleBulkPromote(availableSpots)}
                    disabled={isProcessing}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Promote Next {Math.min(availableSpots, waitlistAttendees.length)}
                  </Button>
                </div>
              </div>
            )}

            {/* Waitlist Table */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Joined Waitlist</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {waitlistAttendees.map((attendee, index) => (
                    <tr key={attendee.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-mono">
                          #{index + 1}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{attendee.user_name}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">
                        {new Date(attendee.created_date).toLocaleDateString()} at{' '}
                        {new Date(attendee.created_date).toLocaleTimeString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePromoteFromWaitlist(attendee)}
                            disabled={isProcessing || (isFull && availableSpots === 0)}
                            className="border-green-400 text-green-700 hover:bg-green-50"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Promote
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveFromWaitlist(attendee)}
                            disabled={isProcessing}
                            className="border-red-400 text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Remove
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {waitlistAttendees.length === 0 && (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No one on the waitlist</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowWaitlistModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
