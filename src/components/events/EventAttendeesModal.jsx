import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  Mail,
  User,
  CheckCircle,
  Clock,
  X,
  Download
} from 'lucide-react';
import { format } from 'date-fns';

export default function EventAttendeesModal({ event, attendees, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredAttendees = attendees.filter(attendee => {
    const matchesSearch = attendee.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attendee.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || attendee.rsvp_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const config = {
      yes: { color: 'bg-green-100 text-green-800', label: 'Confirmed', icon: CheckCircle },
      maybe: { color: 'bg-yellow-100 text-yellow-800', label: 'Maybe', icon: Clock },
      no: { color: 'bg-red-100 text-red-800', label: 'Not Attending', icon: X },
      waitlist: { color: 'bg-gray-100 text-gray-800', label: 'Waitlisted', icon: Clock }
    };
    const { color, label, icon: Icon } = config[status] || config.maybe;
    return (
      <Badge className={`${color} border-0 flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {label}
      </Badge>
    );
  };

  const exportAttendees = () => {
    const csvContent = [
      ['Name', 'Email', 'RSVP Status', 'Confirmed', 'RSVP Date'].join(','),
      ...filteredAttendees.map(attendee => [
        attendee.user_name || 'N/A',
        attendee.user_email || 'N/A', 
        attendee.rsvp_status,
        attendee.confirmed ? 'Yes' : 'No',
        format(new Date(attendee.created_date), 'yyyy-MM-dd HH:mm')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title}_attendees.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const stats = {
    total: attendees.length,
    confirmed: attendees.filter(a => a.rsvp_status === 'yes').length,
    maybe: attendees.filter(a => a.rsvp_status === 'maybe').length,
    declined: attendees.filter(a => a.rsvp_status === 'no').length
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Event Attendees: {event.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              <div className="text-sm text-slate-600">Total RSVPs</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{stats.confirmed}</div>
              <div className="text-sm text-green-600">Confirmed</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-700">{stats.maybe}</div>
              <div className="text-sm text-yellow-600">Maybe</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.declined}</div>
              <div className="text-sm text-red-600">Declined</div>
            </div>
          </div>

          {/* Filters and Export */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search attendees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="yes">Confirmed</option>
                <option value="maybe">Maybe</option>
                <option value="no">Declined</option>
                <option value="waitlist">Waitlisted</option>
              </select>
            </div>
            <Button
              onClick={exportAttendees}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>

          {/* Attendees List */}
          <div className="border rounded-lg overflow-hidden">
            {filteredAttendees.length > 0 ? (
              <div className="divide-y">
                {filteredAttendees.map((attendee) => (
                  <div key={attendee.id} className="p-4 hover:bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <div className="font-medium text-slate-800">
                            {attendee.user_name || 'Anonymous User'}
                          </div>
                          {attendee.user_email && (
                            <div className="text-sm text-slate-600 flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {attendee.user_email}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-1">
                            RSVP'd on {format(new Date(attendee.created_date), 'PPp')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(attendee.rsvp_status)}
                        {attendee.confirmed && (
                          <Badge className="bg-blue-100 text-blue-800 border-0">
                            Admin Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {searchTerm || statusFilter !== 'all' ? 'No matching attendees' : 'No RSVPs yet'}
                </h3>
                <p className="text-slate-500">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Attendees will appear here as they RSVP to your event'
                  }
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {stats.confirmed > 0 && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={() => {
                  // TODO: Implement email functionality
                  alert('Email functionality will be implemented in the next phase');
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email Confirmed Attendees
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}