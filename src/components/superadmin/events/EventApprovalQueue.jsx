
import React, { useState } from 'react';
import { Event } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Calendar,
  MapPin,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye, // Eye is already imported
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EventBulkActions from './EventBulkActions';

export default function EventApprovalQueue({ events, onUpdate }) {
  const [selectedEvents, setSelectedEvents] = useState([]);
  
  const pendingEvents = events.filter(e => e.status === 'pending_approval');

  const handleSelectEvent = (event, checked) => {
    if (checked) {
      setSelectedEvents([...selectedEvents, event]);
    } else {
      setSelectedEvents(selectedEvents.filter(e => e.id !== event.id));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedEvents([...pendingEvents]);
    } else {
      setSelectedEvents([]);
    }
  };

  const handleBulkApprove = async (events, adminNotes) => {
    const promises = events.map(event =>
      Event.update(event.id, {
        status: 'approved',
        admin_notes: adminNotes || event.admin_notes
      })
    );
    await Promise.all(promises);
    onUpdate();
  };

  const handleBulkReject = async (events, adminNotes) => {
    const promises = events.map(event =>
      Event.update(event.id, {
        status: 'rejected',
        admin_notes: adminNotes
      })
    );
    await Promise.all(promises);
    onUpdate();
  };

  const handleBulkDelete = async (events) => {
    const promises = events.map(event => Event.delete(event.id));
    await Promise.all(promises);
    onUpdate();
  };

  const handleBulkExport = (events) => {
    const csvContent = [
      ['Title', 'Organizer', 'Date', 'Location', 'Capacity', 'Price', 'Status'].join(','),
      ...events.map(e => [
        e.title,
        e.organizer_name,
        format(new Date(e.event_date), 'dd/MM/yyyy'),
        e.location,
        e.capacity || 'Unlimited',
        e.is_premium ? e.ticket_price : 'Free',
        e.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const allSelected = pendingEvents.length > 0 && selectedEvents.length === pendingEvents.length;
  const someSelected = selectedEvents.length > 0 && selectedEvents.length < pendingEvents.length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-600" />
              Pending Approvals ({pendingEvents.length})
            </CardTitle>
            
            {pendingEvents.length > 0 && (
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600 data-[state=checked]:border-0"
                />
                <span className="text-sm text-slate-600">
                  Select All
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {pendingEvents.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-semibold text-slate-700">All caught up!</p>
              <p className="text-sm text-slate-500 mt-1">No events pending approval</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingEvents.map(event => {
                const isSelected = selectedEvents.some(e => e.id === event.id);
                
                return (
                  <div
                    key={event.id}
                    className={`border rounded-xl p-4 transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-md'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectEvent(event, checked)}
                        className="mt-1 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-blue-600 data-[state=checked]:to-purple-600 data-[state=checked]:border-0"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-semibold text-slate-900 mb-1">
                              {event.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2">
                              {event.description}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {event.is_premium && (
                              <Badge className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-0">
                                Premium
                              </Badge>
                            )}
                            {event.is_featured && (
                              <Badge className="bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border-0">
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {format(new Date(event.event_date), 'dd MMM yyyy')}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600 truncate">
                              {event.location}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              Capacity: {event.capacity || 'Unlimited'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              {event.is_premium ? `₹${event.ticket_price?.toLocaleString()}` : 'Free'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-600">
                              Organizer: <span className="font-medium">{event.organizer_name}</span>
                            </span>
                          </div>

                          {/* Updated action buttons to match the outline's aesthetic */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost" // Changed to ghost variant
                              size="sm"
                              onClick={() => {
                                // This would open EventDetailsModal
                                toast.info('Event details modal');
                              }}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-xl transition-all duration-300" // Updated classes
                            >
                              <Eye className="w-4 h-4" /> {/* Removed text 'View' and mr-1 */}
                            </Button>

                            <Button
                              variant="ghost" // Changed to ghost variant
                              size="sm"
                              onClick={async () => {
                                await Event.update(event.id, { status: 'approved' });
                                toast.success('Event approved');
                                onUpdate();
                              }}
                              className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded-xl transition-all duration-300" // Updated classes
                            >
                              <CheckCircle className="w-4 h-4" /> {/* Removed text 'Approve' and mr-1 */}
                            </Button>

                            <Button
                              variant="ghost" // Changed to ghost variant
                              size="sm"
                              onClick={async () => {
                                await Event.update(event.id, { 
                                  status: 'rejected',
                                  admin_notes: 'Rejected from quick action'
                                });
                                toast.success('Event rejected');
                                onUpdate();
                              }}
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-xl transition-all duration-300" // Updated classes
                            >
                              <XCircle className="w-4 h-4" /> {/* Removed text 'Reject' and mr-1 */}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <EventBulkActions
        selectedEvents={selectedEvents}
        onClearSelection={() => setSelectedEvents([])}
        onBulkApprove={handleBulkApprove}
        onBulkReject={handleBulkReject}
        onBulkDelete={handleBulkDelete}
        onBulkExport={handleBulkExport}
      />
    </>
  );
}
