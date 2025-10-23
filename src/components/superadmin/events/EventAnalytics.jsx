
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { EventTicket, EventCommissionTracking, Event, User, PlatformSetting } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  TrendingUp,
  Users,
  Ticket,
  Calendar,
  Search,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

// Money field candidates to try - moved outside component
const MONEY_FIELDS = ['amount', 'ticket_price', 'price', 'payment_amount', 'paid_amount', 'total_amount', 'net_amount'];

// Success status candidates to try - moved outside component
const SUCCESS_STATUSES = ['paid', 'success', 'completed', 'captured', 'active', 'used', 'confirmed'];

export default function EventAnalytics({ permissions }) {
  const [tickets, setTickets] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [events, setEvents] = useState([]);
  const [users, setUsers] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [debugInfo, setDebugInfo] = useState({});

  const detectAmountField = useCallback((ticketRecord) => {
    for (const field of MONEY_FIELDS) {
      if (ticketRecord[field] && ticketRecord[field] > 0) {
        return { field, value: ticketRecord[field] };
      }
    }
    return { field: null, value: 0 };
  }, []); // MONEY_FIELDS is a constant, so no dependency needed here

  const normalizeAmount = useCallback((amount) => {
    // If amount is very large, assume it's in paise and convert to rupees
    if (amount > 10000) {
      return amount / 100;
    }
    return amount;
  }, []); // No external dependencies

  const isSuccessfulTicket = useCallback((ticket) => {
    return SUCCESS_STATUSES.includes(ticket.status?.toLowerCase());
  }, []); // SUCCESS_STATUSES is a constant, so no dependency needed here

  const loadReportsData = useCallback(async () => {
    setIsLoading(true);
    console.log('🚨 URGENT: Loading Events Reports Data...');
    
    const debug = {
      loadStartTime: new Date().toISOString(),
      errors: [],
      warnings: [],
      dataStats: {}
    };

    try {
      // Fetch all related data in parallel
      console.log('📡 Fetching data from entities...');
      const [ticketsData, commissionsData, eventsData, settingsData] = await Promise.all([
        EventTicket.list('-created_date').catch(err => {
          debug.errors.push(`EventTicket fetch failed: ${err.message}`);
          return [];
        }),
        EventCommissionTracking.list('-created_date').catch(err => {
          debug.errors.push(`EventCommissionTracking fetch failed: ${err.message}`);
          return [];
        }),
        Event.list().catch(err => {
          debug.errors.push(`Event fetch failed: ${err.message}`);
          return [];
        }),
        PlatformSetting.list().catch(err => {
          debug.errors.push(`PlatformSetting fetch failed: ${err.message}`);
          return [];
        })
      ]);

      debug.dataStats = {
        ticketsCount: ticketsData.length,
        commissionsCount: commissionsData.length,
        eventsCount: eventsData.length,
        settingsCount: settingsData.length
      };

      console.log('📊 RAW DATA LOADED:');
      console.log('- Tickets:', ticketsData.length);
      console.log('- Commissions:', commissionsData.length);
      console.log('- Events:', eventsData.length);
      console.log('- Settings:', settingsData.length);

      // Log first few ticket records for field inspection
      console.log('🎫 FIRST 3 TICKET RECORDS:');
      ticketsData.slice(0, 3).forEach((ticket, index) => {
        console.log(`Ticket ${index + 1}:`, ticket);
        console.log(`Available fields:`, Object.keys(ticket));
        
        // Test amount detection
        const amountInfo = detectAmountField(ticket);
        console.log(`Amount detection: field=${amountInfo.field}, value=${amountInfo.value}`);
        console.log(`Status: ${ticket.status}, Is Successful: ${isSuccessfulTicket(ticket)}`);
      });

      // Process platform settings
      const settingsMap = settingsData.reduce((acc, setting) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, {});

      const defaultCommissionRate = parseFloat(settingsMap.events_commission_rate || settingsMap.global_commission_rate || '20') / 100;
      
      console.log('💼 PLATFORM SETTINGS:');
      console.log('- Commission Rate:', defaultCommissionRate);
      console.log('- Settings Map:', settingsMap);

      setPlatformSettings({ ...settingsMap, defaultCommissionRate });

      // Get unique user IDs from tickets
      const userIds = [...new Set(ticketsData.map(ticket => ticket.user_id).filter(Boolean))];
      const usersData = userIds.length > 0 ? await User.filter({ id: { '$in': userIds } }).catch(() => []) : [];

      console.log('👥 USERS DATA:', usersData.length, 'users loaded');

      // Create lookup maps
      const eventsMap = new Map(eventsData.map(event => [event.id, event]));
      const usersMap = new Map(usersData.map(user => [user.id, user]));

      // Enrich tickets with detailed amount analysis
      const enrichedTickets = ticketsData.map(ticket => {
        const amountInfo = detectAmountField(ticket);
        const normalizedAmount = normalizeAmount(amountInfo.value);
        
        return {
          ...ticket,
          event: eventsMap.get(ticket.event_id),
          user: usersMap.get(ticket.user_id),
          detectedAmountField: amountInfo.field,
          detectedAmount: amountInfo.value,
          normalizedAmount: normalizedAmount,
          isSuccessful: isSuccessfulTicket(ticket)
        };
      });

      // Enrich commissions
      const enrichedCommissions = commissionsData.map(commission => ({
        ...commission,
        event: eventsMap.get(commission.event_id)
      }));

      // Calculate gross revenue with detailed logging
      console.log('💰 CALCULATING GROSS REVENUE:');
      const successfulTickets = enrichedTickets.filter(ticket => ticket.isSuccessful);
      console.log(`- Found ${successfulTickets.length} successful tickets out of ${enrichedTickets.length} total`);

      let grossRevenue = 0;
      const revenueBreakdown = [];

      successfulTickets.forEach((ticket, index) => {
        const amount = ticket.normalizedAmount;
        grossRevenue += amount;
        
        const breakdown = {
          ticketId: ticket.id,
          eventTitle: ticket.event?.title || 'Unknown',
          status: ticket.status,
          detectedField: ticket.detectedAmountField,
          rawAmount: ticket.detectedAmount,
          normalizedAmount: amount
        };
        
        revenueBreakdown.push(breakdown);
        
        if (index < 10) { // Log first 10 for debugging
          console.log(`  Ticket ${index + 1}: ₹${amount} (${breakdown.detectedField}=${breakdown.rawAmount}, status=${breakdown.status})`);
        }
      });

      console.log(`💰 TOTAL GROSS REVENUE: ₹${grossRevenue}`);

      // Calculate platform commission
      console.log('🏦 CALCULATING PLATFORM COMMISSION:');
      let platformCommissionTotal = 0;

      if (enrichedCommissions.length > 0) {
        // Use existing commission records
        console.log('- Using existing commission records');
        enrichedCommissions.forEach(commission => {
          const commissionAmount = commission.platform_commission || commission.commission_amount || 0;
          platformCommissionTotal += commissionAmount;
        });
      } else {
        // Calculate on the fly
        console.log('- Calculating commission on the fly');
        platformCommissionTotal = grossRevenue * defaultCommissionRate;
      }

      console.log(`🏦 TOTAL PLATFORM COMMISSION: ₹${platformCommissionTotal} (Rate: ${defaultCommissionRate * 100}%)`);

      // Set all data
      setTickets(enrichedTickets);
      setCommissions(enrichedCommissions);
      setEvents(eventsData);
      setUsers(usersData);

      // Update debug info
      debug.calculations = {
        totalTickets: enrichedTickets.length,
        successfulTickets: successfulTickets.length,
        grossRevenue: grossRevenue,
        platformCommission: platformCommissionTotal,
        commissionRate: defaultCommissionRate,
        revenueBreakdown: revenueBreakdown.slice(0, 10) // First 10 for UI display
      };

      debug.fieldAnalysis = {
        detectedFields: [...new Set(enrichedTickets.map(t => t.detectedAmountField).filter(Boolean))],
        statusDistribution: enrichedTickets.reduce((acc, t) => {
          acc[t.status] = (acc[t.status] || 0) + 1;
          return acc;
        }, {})
      };

    } catch (error) {
      console.error('❌ CRITICAL ERROR loading reports data:', error);
      debug.errors.push(`Critical load error: ${error.message}`);
      toast.error('Critical error loading reports data: ' + error.message);
    } finally {
      debug.loadEndTime = new Date().toISOString();
      setDebugInfo(debug);
      setIsLoading(false);
      console.log('🏁 LOADING COMPLETE. Debug info:', debug);
    }
  }, [detectAmountField, normalizeAmount, isSuccessfulTicket]); // Add useCallback dependencies

  useEffect(() => {
    loadReportsData();
  }, [loadReportsData]); // Now loadReportsData is stable due to useCallback

  // Calculate KPIs with enhanced debugging
  const kpis = useMemo(() => {
    console.log('📊 CALCULATING KPIs FROM STATE...');
    console.log('- Total tickets in state:', tickets.length);
    console.log('- Total commissions in state:', commissions.length);

    // Using isSuccessfulTicket helper from useCallback
    const successfulTickets = tickets.filter(ticket => isSuccessfulTicket(ticket));
    console.log('- Successful tickets for KPI:', successfulTickets.length);

    const grossRevenue = successfulTickets.reduce((sum, ticket) => {
      const amount = ticket.normalizedAmount || 0;
      return sum + amount;
    }, 0);

    let platformCommissionTotal = 0;
    
    if (commissions.length > 0) {
      platformCommissionTotal = commissions.reduce((sum, commission) => {
        return sum + (commission.platform_commission || commission.commission_amount || 0);
      }, 0);
    } else {
      // Calculate on the fly
      const rate = platformSettings.defaultCommissionRate || 0.2;
      platformCommissionTotal = grossRevenue * rate;
    }

    const organizerRevenue = Math.max(0, grossRevenue - platformCommissionTotal);
    const ticketsSold = successfulTickets.length;

    const finalKPIs = {
      grossRevenue,
      platformCommission: platformCommissionTotal,
      organizerRevenue,
      ticketsSold
    };

    console.log('📈 FINAL KPIs:', finalKPIs);
    return finalKPIs;
  }, [tickets, commissions, platformSettings, isSuccessfulTicket]); // Added isSuccessfulTicket to dependencies

  // Filter transactions for the table
  const filteredTransactions = useMemo(() => {
    let filtered = tickets.filter(ticket => 
      SUCCESS_STATUSES.includes(ticket.status?.toLowerCase()) || 
      ['cancelled', 'refunded'].includes(ticket.status?.toLowerCase())
    );

    if (searchTerm) {
      filtered = filtered.filter(ticket =>
        ticket.event?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        default:
          filterDate = null; // Should not happen with current filter options
      }

      if (filterDate) {
        filtered = filtered.filter(ticket => 
          new Date(ticket.purchased_date || ticket.created_date) >= filterDate
        );
      }
    }

    return filtered;
  }, [tickets, searchTerm, statusFilter, dateFilter]); // SUCCESS_STATUSES is a constant, no need in deps

  // Chart data
  const chartData = useMemo(() => {
    const monthlyRevenue = {};
    
    filteredTransactions.forEach(ticket => {
      const date = new Date(ticket.purchased_date || ticket.created_date);
      const month = format(date, 'MMM yyyy');
      const amount = ticket.normalizedAmount || 0;
      
      if (!monthlyRevenue[month]) {
        monthlyRevenue[month] = { month, revenue: 0, tickets: 0 };
      }
      
      monthlyRevenue[month].revenue += amount;
      monthlyRevenue[month].tickets += 1;
    });

    return Object.values(monthlyRevenue).sort((a, b) => 
      new Date(a.month) - new Date(b.month)
    );
  }, [filteredTransactions]);

  const handleRefresh = () => {
    loadReportsData();
    toast.success('Reports data refreshed');
  };

  const handleExport = () => {
    const csvContent = [
      ['Event Title', 'User Name', 'User Email', 'Ticket Price', 'Status', 'Amount Field', 'Purchase Date'].join(','),
      ...filteredTransactions.map(ticket => [
        `"${ticket.event?.title || 'N/A'}"`,
        `"${ticket.user?.display_name || 'N/A'}"`,
        `"${ticket.user?.email || 'N/A'}"`,
        ticket.normalizedAmount || 0,
        ticket.status,
        ticket.detectedAmountField || 'none',
        format(new Date(ticket.purchased_date || ticket.created_date), 'yyyy-MM-dd HH:mm:ss')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `events-reports-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Reports exported successfully');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Events Reports...</p>
          <p className="text-sm text-gray-500 mt-2">Analyzing ticket data and calculating revenue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Events Reports & Analytics</h2>
        <div className="flex items-center gap-3">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Error/Warning Alerts */}
      {debugInfo.errors?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Data Loading Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-red-600 space-y-1">
              {debugInfo.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Gross Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="w-8 h-8 text-green-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-green-700">₹{kpis.grossRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600">From {kpis.ticketsSold} successful tickets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">Platform Commission</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-blue-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-blue-700">₹{kpis.platformCommission.toLocaleString()}</p>
                <p className="text-xs text-blue-600">
                  {((kpis.platformCommission / (kpis.grossRevenue || 1)) * 100).toFixed(1)}% of gross
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-600">Organizer Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-purple-700">₹{kpis.organizerRevenue.toLocaleString()}</p>
                <p className="text-xs text-purple-600">Net to organizers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">Tickets Sold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Ticket className="w-8 h-8 text-orange-500 mr-2" />
              <div>
                <p className="text-2xl font-bold text-orange-700">{kpis.ticketsSold.toLocaleString()}</p>
                <p className="text-xs text-orange-600">Successful purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search events or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Charts */}
      {chartData.length > 0 && (
        <Card className="p-6">
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']} />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transaction History</CardTitle>
            <Badge variant="outline" className="text-sm">
              {filteredTransactions.length} transactions
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium">Event</th>
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Field</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((ticket) => (
                    <tr key={ticket.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{ticket.event?.title || 'Unknown Event'}</p>
                          <p className="text-xs text-gray-500">ID: {ticket.event_id}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{ticket.user?.display_name || 'Unknown User'}</p>
                          <p className="text-xs text-gray-500">{ticket.user?.email}</p>
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-semibold">₹{(ticket.normalizedAmount || 0).toLocaleString()}</p>
                          {ticket.detectedAmount !== ticket.normalizedAmount && (
                            <p className="text-xs text-gray-500">
                              Raw: {ticket.detectedAmount}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-xs">
                          {ticket.detectedAmountField || 'none'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={ticket.isSuccessful ? 'default' : 'secondary'}>
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">
                          {format(new Date(ticket.purchased_date || ticket.created_date), 'MMM d, yyyy HH:mm')}
                        </p>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-500">
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Debug Panel */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm flex items-center">
            <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
            Debug Information & Data Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs space-y-4">
          {/* Basic Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Total Tickets Loaded</p>
              <p className="text-lg">{debugInfo.dataStats?.ticketsCount || 0}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Successful Tickets</p>
              <p className="text-lg">{tickets.filter(t => isSuccessfulTicket(t)).length}</p> {/* Use useCallback version */}
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Calculated Revenue</p>
              <p className="text-lg">₹{kpis.grossRevenue}</p>
            </div>
            <div className="bg-white p-3 rounded">
              <p className="font-semibold">Commission Rate</p>
              <p className="text-lg">{((platformSettings.defaultCommissionRate || 0) * 100).toFixed(1)}%</p>
            </div>
          </div>

          {/* Field Analysis */}
          {debugInfo.fieldAnalysis && (
            <div className="bg-white p-3 rounded">
              <p className="font-semibold mb-2">Detected Amount Fields:</p>
              <div className="flex flex-wrap gap-2">
                {debugInfo.fieldAnalysis.detectedFields.map(field => (
                  <Badge key={field} variant="outline" className="text-xs">{field}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Status Distribution */}
          {debugInfo.fieldAnalysis?.statusDistribution && (
            <div className="bg-white p-3 rounded">
              <p className="font-semibold mb-2">Status Distribution:</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                {Object.entries(debugInfo.fieldAnalysis.statusDistribution).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span>{status}:</span>
                    <span className="font-mono">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue Breakdown Sample */}
          {debugInfo.calculations?.revenueBreakdown && (
            <div className="bg-white p-3 rounded">
              <p className="font-semibold mb-2">Revenue Breakdown (Sample):</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {debugInfo.calculations.revenueBreakdown.map((item, index) => (
                  <div key={index} className="text-xs flex justify-between">
                    <span>{item.eventTitle.substring(0, 30)}...</span>
                    <span>₹{item.normalizedAmount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Load Times */}
          <div className="bg-white p-3 rounded text-xs">
            <p><strong>Load Start:</strong> {debugInfo.loadStartTime}</p>
            <p><strong>Load End:</strong> {debugInfo.loadEndTime}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
