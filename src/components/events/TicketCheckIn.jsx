import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Search, QrCode, Users, Clock, Download } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TicketCheckIn({ event, open, onClose, onUpdate }) {
  const [ticketId, setTicketId] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [checkedInList, setCheckedInList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (open) {
      loadCheckInData();
    }
  }, [open, event.id]);

  const loadCheckInData = async () => {
    try {
      setIsLoading(true);
      const [attendeesData, ticketsData] = await Promise.all([
        base44.entities.EventAttendee.filter({ event_id: event.id }),
        base44.entities.EventTicket.filter({ event_id: event.id, status: 'active' })
      ]);

      setAttendees(attendeesData);
      setTickets(ticketsData);
      setCheckedInList(attendeesData.filter(a => a.confirmed));
    } catch (error) {
      console.error('Error loading check-in data:', error);
      toast.error('Failed to load check-in data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!ticketId.trim()) {
      toast.error('Please enter a ticket ID');
      return;
    }
    
    setIsChecking(true);
    
    try {
      // Find ticket by ID or last 8 characters
      const ticket = tickets.find(t => 
        t.id === ticketId || t.id.slice(-8).toUpperCase() === ticketId.toUpperCase()
      );
      
      if (!ticket) {
        toast.error('Ticket not found');
        setTicketInfo({ error: 'Ticket not found' });
        return;
      }
      
      if (ticket.status === 'used') {
        toast.warning('Ticket already checked in');
        setTicketInfo({ ...ticket, alreadyUsed: true });
        return;
      }
      
      if (ticket.status !== 'active') {
        toast.error(`Ticket status: ${ticket.status}`);
        setTicketInfo({ ...ticket, invalidStatus: true });
        return;
      }
      
      // Mark ticket as used
      await base44.entities.EventTicket.update(ticket.id, { status: 'used' });
      
      // Mark attendee as confirmed
      const attendee = attendees.find(a => a.user_id === ticket.user_id);
      if (attendee) {
        await base44.entities.EventAttendee.update(attendee.id, { confirmed: true });
      }
      
      toast.success('Check-in successful!');
      setTicketInfo({ ...ticket, checkedIn: true });
      
      // Reload data
      await loadCheckInData();
      if (onUpdate) onUpdate();
      
      // Clear form after 2 seconds
      setTimeout(() => {
        setTicketId('');
        setTicketInfo(null);
      }, 2000);
      
    } catch (error) {
      console.error('Error checking in:', error);
      toast.error('Failed to check in ticket');
    } finally {
      setIsChecking(false);
    }
  };

  const handleReset = () => {
    setTicketId('');
    setTicketInfo(null);
  };

  const exportAttendanceCSV = () => {
    const headers = ['Name', 'Email', 'Ticket ID', 'Check-in Time', 'Status'];
    const rows = attendees.map(attendee => {
      const ticket = tickets.find(t => t.user_id === attendee.user_id);
      return [
        attendee.user_name || 'Unknown',
        attendee.user_email || 'N/A',
        ticket ? ticket.id.slice(-8).toUpperCase() : 'N/A',
        attendee.confirmed ? format(new Date(attendee.updated_date), 'dd/MM/yyyy HH:mm') : 'Not checked in',
        attendee.confirmed ? 'Checked In' : 'Pending'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.title.replace(/[^a-z0-9]/gi, '_')}_attendance.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Attendance report exported');
  };

  const stats = {
    totalRSVPs: attendees.length,
    checkedIn: checkedInList.length,
    pending: attendees.length - checkedInList.length,
    rate: attendees.length > 0 ? ((checkedInList.length / attendees.length) * 100).toFixed(1) : 0
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <QrCode className="w-6 h-6 text-blue-600" />
            Ticket Check-In: {event.title}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Real-time Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-5 h-5 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-slate-900">{stats.totalRSVPs}</p>
                  <p className="text-xs text-slate-600">Total RSVPs</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-5 h-5 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{stats.checkedIn}</p>
                  <p className="text-xs text-slate-600">Checked In</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-5 h-5 mx-auto mb-2 text-orange-600" />
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-xs text-slate-600">Pending</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4 text-center">
                  <QrCode className="w-5 h-5 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-purple-600">{stats.rate}%</p>
                  <p className="text-xs text-slate-600">Attendance Rate</p>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-3 gap-2 bg-transparent p-0">
                <TabsTrigger value="manual" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl">
                  Manual Check-In
                </TabsTrigger>
                <TabsTrigger value="scanner" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl">
                  QR Scanner
                </TabsTrigger>
                <TabsTrigger value="list" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white rounded-xl">
                  Attendance List
                </TabsTrigger>
              </TabsList>

              {/* Manual Check-In */}
              <TabsContent value="manual" className="space-y-4 mt-4">
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
                  <CardContent className="p-6">
                    <label className="text-sm font-medium mb-2 block text-slate-700">
                      Enter Ticket ID (last 8 characters)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., A1B2C3D4"
                        value={ticketId}
                        onChange={(e) => setTicketId(e.target.value.toUpperCase())}
                        onKeyPress={(e) => e.key === 'Enter' && handleCheckIn()}
                        className="uppercase text-lg font-mono"
                        autoFocus
                      />
                      <Button 
                        onClick={handleCheckIn} 
                        disabled={isChecking}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Search className="w-4 h-4 mr-2" />
                        Check In
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Ticket Information Display */}
                {ticketInfo && (
                  <Card className={`${
                    ticketInfo.error ? 'bg-red-50 border-red-200' :
                    ticketInfo.alreadyUsed ? 'bg-yellow-50 border-yellow-200' :
                    ticketInfo.invalidStatus ? 'bg-orange-50 border-orange-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <CardContent className="p-6">
                      {ticketInfo.error ? (
                        <div className="flex items-center gap-2 text-red-700">
                          <XCircle className="w-5 h-5" />
                          <span className="font-semibold">{ticketInfo.error}</span>
                        </div>
                      ) : ticketInfo.alreadyUsed ? (
                        <div>
                          <div className="flex items-center gap-2 text-yellow-700 mb-2">
                            <XCircle className="w-5 h-5" />
                            <span className="font-semibold">Already Checked In</span>
                          </div>
                          <p className="text-sm text-yellow-600">
                            Ticket ID: {ticketInfo.id.slice(-8).toUpperCase()}
                          </p>
                        </div>
                      ) : ticketInfo.invalidStatus ? (
                        <div>
                          <div className="flex items-center gap-2 text-orange-700 mb-2">
                            <XCircle className="w-5 h-5" />
                            <span className="font-semibold">Invalid Ticket Status</span>
                          </div>
                          <p className="text-sm text-orange-600">
                            Status: {ticketInfo.status}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2 text-green-700 mb-3">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Check-In Successful!</span>
                          </div>
                          <div className="space-y-1 text-sm text-green-700">
                            <p>Ticket ID: {ticketInfo.id.slice(-8).toUpperCase()}</p>
                            <p>Amount Paid: ₹{ticketInfo.ticket_price?.toLocaleString()}</p>
                            <p>Purchase Date: {format(new Date(ticketInfo.purchased_date || ticketInfo.created_date), 'dd/MM/yyyy')}</p>
                            <p className="font-semibold text-green-800 mt-2">✓ Attendee has been marked as checked in</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* QR Scanner Tab */}
              <TabsContent value="scanner" className="space-y-4 mt-4">
                <Card>
                  <CardContent className="p-12 text-center">
                    <QrCode className="w-24 h-24 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">QR Code Scanner</h3>
                    <p className="text-slate-600 mb-6">
                      Scan ticket QR codes for instant check-in
                    </p>
                    <Button
                      onClick={() => toast.info('QR Scanner functionality coming soon!')}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Activate Scanner
                    </Button>
                    <p className="text-xs text-slate-500 mt-4">
                      Requires camera access for QR code scanning
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Attendance List */}
              <TabsContent value="list" className="space-y-4 mt-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Real-Time Attendance</h3>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={exportAttendanceCSV}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Report
                  </Button>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {attendees.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No attendees yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    attendees.map((attendee) => {
                      const ticket = tickets.find(t => t.user_id === attendee.user_id);
                      return (
                        <Card key={attendee.id} className={attendee.confirmed ? 'border-green-200 bg-green-50' : ''}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                                  {(attendee.user_name || 'U')[0].toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-900">{attendee.user_name || 'Unknown'}</p>
                                  <p className="text-xs text-slate-500">
                                    {ticket ? `Ticket: ${ticket.id.slice(-8).toUpperCase()}` : 'No ticket'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {attendee.confirmed ? (
                                  <Badge className="bg-green-100 text-green-700">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Checked In
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}