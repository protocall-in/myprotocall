
import React, { useState, useEffect, useMemo } from 'react';
import { RefundRequest, User, Event, Ticket } from '@/api/entities'; // Added Event and Ticket entities
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RotateCcw, Search, DollarSign, Clock, CheckCircle, XCircle, Eye, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import RefundApprovalModal from './refunds/RefundApprovalModal'; // Not used in the final version of the prompt, but keeping it
import ProcessRefundModal from './refunds/ProcessRefundModal';
import RefundDetailsModal from './refunds/RefundDetailsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Minimal EmptyState component for demonstration if not provided elsewhere
const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
    {Icon && <Icon className="w-12 h-12 mb-4 text-slate-400" />}
    <p className="text-xl font-semibold">{title}</p>
    <p className="text-sm mt-2">{description}</p>
  </div>
);

// Minimal EventRefundApproval component for demonstration
const EventRefundApproval = ({ refund, onUpdate }) => {
  const handleUpdateStatus = async (newStatus) => {
    try {
      // In a real application, you would make an API call to update the refund status
      // For demonstration, we'll just log and simulate success
      console.log(`Updating event refund ${refund.id} to status: ${newStatus}`);
      await refund.update({ status: newStatus }); // Assuming an update method exists on RefundRequest entity
      toast.success(`Event refund for ${refund.user_name} has been ${newStatus}.`);
      onUpdate(); // Reload refunds to reflect changes
    } catch (error) {
      console.error(`Error updating event refund ${refund.id}:`, error);
      toast.error(`Failed to ${newStatus} event refund.`);
    }
  };

  return (
    <Card className="p-4 bg-yellow-50 border-yellow-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-grow">
          <p className="font-semibold text-slate-900">{refund.user_name || 'Unknown User'}</p>
          <p className="text-sm text-slate-600">Email: {refund.user_email}</p>
          <p className="text-sm text-slate-600">Transaction ID: <code className="text-xs bg-slate-100 px-1 rounded">{refund.original_transaction_id?.substring(0, 10)}...</code></p>
          <p className="text-sm text-slate-600">Requested Amount: <span className="font-medium text-slate-800">₹{refund.refund_amount?.toLocaleString()}</span></p>
          <p className="text-sm text-slate-600">Date: {format(new Date(refund.created_date), 'dd MMM yyyy')}</p>
          {refund.notes && <p className="text-sm text-slate-700 mt-2 italic">Notes: {refund.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleUpdateStatus('processing')}>
            Approve & Process
          </Button>
          <Button variant="destructive" size="sm" onClick={() => handleUpdateStatus('rejected')}>
            Reject
          </Button>
        </div>
      </div>
    </Card>
  );
};


export default function RefundManagement({ user }) {
  const [refunds, setRefunds] = useState([]);
  const [eventRefunds, setEventRefunds] = useState([]); // State for event ticket refunds
  // const [filteredRefunds, setFilteredRefunds] = useState([]); // Removed, now using useMemo
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all_refunds'); // State for active tab

  // NEW: State for event filtering
  const [eventFilter, setEventFilter] = useState('all');
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]); // To map ticket_id to event_id for filtering

  const [stats, setStats] = useState({
    totalRefunds: 0,
    pendingRefunds: 0,
    processedRefunds: 0,
    totalAmountRefunded: 0
  });

  useEffect(() => {
    loadRefunds();
    loadEvents(); // Load events on component mount
    loadTickets(); // Load tickets on component mount
  }, []);

  // Removed the old useEffect that called filterRefunds, now using useMemo

  const loadRefunds = async () => {
    setIsLoading(true);
    try {
      const allRefunds = await RefundRequest.list('-created_date');
      setRefunds(allRefunds); // Master list for filtering in 'All Refunds' tab
      setEventRefunds(allRefunds.filter(r => r.transaction_type === 'event_ticket')); // Separate list for 'Event Tickets' tab

      // Calculate stats based on all refunds
      const pending = allRefunds.filter(r => r.status === 'pending').length;
      const processed = allRefunds.filter(r => r.status === 'processed').length;
      const totalAmount = allRefunds
        .filter(r => r.status === 'processed')
        .reduce((sum, r) => sum + (r.refund_amount || 0), 0);

      setStats({
        totalRefunds: allRefunds.length,
        pendingRefunds: pending,
        processedRefunds: processed,
        totalAmountRefunded: totalAmount
      });
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast.error('Failed to load refunds');
    } finally {
      setIsLoading(false);
    }
  };

  // NEW: Function to load events
  const loadEvents = async () => {
    try {
      const eventsData = await Event.list(); // Assuming Event.list() exists
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
      toast.error('Failed to load events for filtering.');
    }
  };

  // NEW: Function to load tickets
  const loadTickets = async () => {
    try {
      const ticketsData = await Ticket.list(); // Assuming Ticket.list() exists
      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('Failed to load tickets for event filtering.');
    }
  };

  // NEW: Memoized filtering logic
  const filteredRefunds = useMemo(() => {
    let filtered = [...refunds];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.transaction_type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // NEW: Event filter logic
    if (eventFilter !== 'all') {
      const eventTickets = tickets.filter(t => t.event_id === eventFilter);
      const ticketIds = eventTickets.map(t => t.id);
      filtered = filtered.filter(r =>
        r.transaction_type === 'event_ticket' && ticketIds.includes(r.related_entity_id)
      );
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.user_name?.toLowerCase().includes(search) ||
        r.user_email?.toLowerCase().includes(search) ||
        r.original_transaction_id?.toLowerCase().includes(search) ||
        // Assuming related_entity_name might exist for search, e.g., course title, event name
        r.related_entity_name?.toLowerCase().includes(search)
      );
    }

    return filtered;
  }, [refunds, searchTerm, typeFilter, statusFilter, eventFilter, tickets]);


  const handleProcessRefund = (refund) => {
    setSelectedRefund(refund);
    setShowProcessModal(true);
  };

  const handleViewDetails = (refund) => {
    setSelectedRefund(refund);
    setShowDetailsModal(true);
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      processing: { color: 'bg-purple-100 text-purple-800', label: 'Processing' },
      processed: { color: 'bg-green-100 text-green-800', label: 'Processed' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' }
    };
    const { color, label } = config[status] || config.pending;
    return <Badge className={`${color} border-0`}>{label}</Badge>;
  };

  const getTypeLabel = (type) => {
    const labels = {
      subscription: 'Platform Subscription',
      event_ticket: 'Event Ticket',
      course_enrollment: 'Course Enrollment',
      advisor_subscription: 'Advisor Subscription',
      pledge_payment: 'Pledge Payment',
      wallet_topup: 'Wallet Top-up'
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-0 bg-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl">Refund Management</CardTitle>
                <p className="text-sm text-slate-600 mt-1">Track and process refunds across all platform services</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Refunds</p>
                <p className="text-3xl font-bold text-blue-900 mt-1">{stats.totalRefunds}</p>
              </div>
              <RotateCcw className="w-10 h-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-50 to-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-900 mt-1">{stats.pendingRefunds}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-50 to-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Processed</p>
                <p className="text-3xl font-bold text-green-900 mt-1">{stats.processedRefunds}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-purple-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Total Refunded</p>
                <p className="text-2xl font-bold text-purple-900 mt-1">₹{stats.totalAmountRefunded.toLocaleString()}</p>
              </div>
              <DollarSign className="w-10 h-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all_refunds">All Refunds</TabsTrigger>
          <TabsTrigger value="event_tickets">Event Ticket Refunds</TabsTrigger>
        </TabsList>

        <TabsContent value="all_refunds" className="space-y-6 mt-6">
          {/* Filters */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search by user, transaction ID, email, or item name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Transaction Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="subscription">Subscriptions</SelectItem>
                    <SelectItem value="event_ticket">Events</SelectItem>
                    <SelectItem value="course_enrollment">Courses</SelectItem>
                    <SelectItem value="advisor_subscription">Advisors</SelectItem>
                    <SelectItem value="pledge_payment">Pledges</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="processed">Processed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                {/* NEW: Event filter */}
                <Select value={eventFilter} onValueChange={setEventFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {events.map(event => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Refunds Table */}
          <Card className="shadow-lg border-0 bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Transaction ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredRefunds.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                          No refund requests found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredRefunds.map((refund) => (
                        <tr key={refund.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{refund.user_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{refund.user_email}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {refund.original_transaction_id?.substring(0, 12)}...
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-700">{getTypeLabel(refund.transaction_type)}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">₹{refund.refund_amount?.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(refund.status)}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-slate-600">
                              {format(new Date(refund.created_date), 'dd MMM yyyy')}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(refund)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {refund.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleProcessRefund(refund)}
                                >
                                  Process
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Event Ticket Refunds Tab */}
        <TabsContent value="event_tickets" className="space-y-6 mt-6">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Event Ticket Refund Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventRefunds.filter(r => r.status === 'approved').length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-orange-800">
                    Pending Admin Review ({eventRefunds.filter(r => r.status === 'approved').length})
                  </h3>
                  {eventRefunds.filter(r => r.status === 'approved').map(refund => (
                    <EventRefundApproval
                      key={refund.id}
                      refund={refund}
                      onUpdate={loadRefunds}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Calendar}
                  title="No Event Refunds Pending Admin Review"
                  description="Event ticket refund requests approved by organizers will appear here for your final approval/rejection."
                />
              )}

              {/* Processed/Rejected Event Refunds */}
              {eventRefunds.filter(r => ['processing', 'processed', 'rejected', 'failed'].includes(r.status)).length > 0 && (
                <div className="mt-8 space-y-4">
                  <h3 className="font-semibold text-gray-700">
                    Processed/Rejected ({eventRefunds.filter(r => ['processing', 'processed', 'rejected', 'failed'].includes(r.status)).length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {eventRefunds.filter(r => ['processing', 'processed', 'rejected', 'failed'].includes(r.status)).map(refund => (
                      <Card key={refund.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-slate-900">{refund.user_name || 'Unknown'}</p>
                            <p className="text-sm text-slate-600">Amount: ₹{refund.refund_amount?.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">Trans ID: {refund.original_transaction_id?.substring(0, 10)}...</p>
                            <div className="mt-2">{getStatusBadge(refund.status)}</div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(refund)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>


      {/* Modals */}
      {showProcessModal && selectedRefund && (
        <ProcessRefundModal
          refund={selectedRefund}
          admin={user}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedRefund(null);
          }}
          onSuccess={() => {
            loadRefunds();
            setShowProcessModal(false);
            setSelectedRefund(null);
          }}
        />
      )}

      {showDetailsModal && selectedRefund && (
        <RefundDetailsModal
          refund={selectedRefund}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRefund(null);
          }}
        />
      )}
    </div>
  );
}
