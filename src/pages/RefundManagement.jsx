import React, { useState, useEffect } from 'react';
import { RefundRequest, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  RotateCcw,
  Search,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  IndianRupee,
  Filter,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import ProcessRefundModal from '../components/superadmin/refunds/ProcessRefundModal';
import RefundDetailsModal from '../components/superadmin/refunds/RefundDetailsModal';

export default function RefundManagementPage() {
  const [refunds, setRefunds] = useState([]);
  const [filteredRefunds, setFilteredRefunds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterRefunds();
  }, [refunds, searchTerm, typeFilter, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [currentUser, allRefunds] = await Promise.all([
        User.me(),
        RefundRequest.list('-created_date')
      ]);

      setUser(currentUser);
      setRefunds(allRefunds);
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast.error('Failed to load refund data');
    } finally {
      setIsLoading(false);
    }
  };

  const filterRefunds = () => {
    let filtered = [...refunds];

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(refund =>
        refund.user_name?.toLowerCase().includes(searchLower) ||
        refund.user_email?.toLowerCase().includes(searchLower) ||
        refund.original_transaction_id?.toLowerCase().includes(searchLower) ||
        refund.id?.toLowerCase().includes(searchLower)
      );
    }

    // Transaction type filter
    if (typeFilter && typeFilter !== 'all') {
      filtered = filtered.filter(refund => refund.transaction_type === typeFilter);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(refund => refund.status === statusFilter);
    }

    setFilteredRefunds(filtered);
  };

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    processed: refunds.filter(r => r.status === 'processed').length,
    failed: refunds.filter(r => r.status === 'failed').length,
    totalAmount: refunds
      .filter(r => r.status === 'processed')
      .reduce((sum, r) => sum + (r.refund_amount || 0), 0)
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      processing: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: RotateCcw },
      processed: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      failed: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      rejected: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle }
    };

    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;

    return (
      <Badge className={`${statusConfig.color} border flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTransactionTypeBadge = (type) => {
    const config = {
      subscription: { label: 'Subscription', color: 'bg-purple-100 text-purple-800' },
      event_ticket: { label: 'Event Ticket', color: 'bg-blue-100 text-blue-800' },
      course_enrollment: { label: 'Course', color: 'bg-green-100 text-green-800' },
      advisor_subscription: { label: 'Advisor Plan', color: 'bg-orange-100 text-orange-800' },
      pledge_payment: { label: 'Pledge', color: 'bg-pink-100 text-pink-800' },
      wallet_topup: { label: 'Wallet', color: 'bg-indigo-100 text-indigo-800' }
    };

    const typeConfig = config[type] || { label: type, color: 'bg-gray-100 text-gray-800' };

    return (
      <Badge className={`${typeConfig.color} border-0`}>
        {typeConfig.label}
      </Badge>
    );
  };

  const handleProcessRefund = (refund) => {
    setSelectedRefund(refund);
    setShowProcessModal(true);
  };

  const handleViewDetails = (refund) => {
    setSelectedRefund(refund);
    setShowDetailsModal(true);
  };

  const exportRefunds = () => {
    const csv = [
      ['Date', 'User', 'Email', 'Transaction ID', 'Type', 'Amount', 'Status', 'Gateway'].join(','),
      ...filteredRefunds.map(r => [
        format(new Date(r.created_date), 'yyyy-MM-dd'),
        r.user_name || 'N/A',
        r.user_email || 'N/A',
        r.original_transaction_id,
        r.transaction_type,
        r.refund_amount,
        r.status,
        r.payment_gateway || 'N/A'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `refunds_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    toast.success('Refunds exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
                Refund Management
              </h1>
              <p className="text-slate-600 mt-1">Track and process refunds across all platform services</p>
            </div>
            <Button
              onClick={exportRefunds}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Refunds</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <RotateCcw className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-yellow-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Refunds</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Processed</p>
                  <p className="text-3xl font-bold text-slate-900">{stats.processed}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Amount</p>
                  <p className="text-3xl font-bold text-slate-900">
                    ₹{stats.totalAmount.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <IndianRupee className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-md">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Search by user, transaction ID, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full md:w-64">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="subscription">Subscriptions</SelectItem>
                  <SelectItem value="event_ticket">Event Tickets</SelectItem>
                  <SelectItem value="course_enrollment">Courses</SelectItem>
                  <SelectItem value="advisor_subscription">Advisor Plans</SelectItem>
                  <SelectItem value="pledge_payment">Pledges</SelectItem>
                  <SelectItem value="wallet_topup">Wallet</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="processed">Processed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Refunds Table */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>User</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRefunds.length > 0 ? (
                    filteredRefunds.map((refund) => (
                      <TableRow key={refund.id} className="hover:bg-slate-50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                              {refund.user_name?.charAt(0)?.toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{refund.user_name || 'Unknown'}</p>
                              <p className="text-xs text-slate-500">{refund.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="px-2 py-1 bg-slate-100 rounded text-xs">
                            {refund.original_transaction_id?.slice(-12) || 'N/A'}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getTransactionTypeBadge(refund.transaction_type)}
                        </TableCell>
                        <TableCell>
                          <span className="font-semibold text-slate-900">
                            ₹{(refund.refund_amount || 0).toLocaleString('en-IN')}
                          </span>
                          {refund.refund_type === 'partial' && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Partial
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(refund.status)}</TableCell>
                        <TableCell>
                          <span className="text-sm text-slate-600">
                            {format(new Date(refund.created_date), 'dd MMM yyyy')}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewDetails(refund)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            {refund.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleProcessRefund(refund)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                Process
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <div className="flex flex-col items-center justify-center text-slate-500">
                          <RotateCcw className="w-12 h-12 mb-4 opacity-20" />
                          <p className="font-medium">No refunds found</p>
                          <p className="text-sm mt-1">Try adjusting your filters</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {showProcessModal && selectedRefund && (
        <ProcessRefundModal
          refund={selectedRefund}
          currentUser={user}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedRefund(null);
          }}
          onSuccess={() => {
            loadData();
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
          onProcess={() => {
            setShowDetailsModal(false);
            setShowProcessModal(true);
          }}
        />
      )}
    </div>
  );
}