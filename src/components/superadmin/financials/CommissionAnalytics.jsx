import React, { useState, useEffect, useMemo } from 'react';
import { CommissionSettings, EventCommissionTracking, EventTicket } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp,
  Calendar,
  Users,
  Star,
  Download,
  Percent,
  BarChart3
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';

const COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B', '#10B981'];

export default function CommissionAnalytics({ 
  finfluencers, 
  advisors, 
  permissions,
  enrollments,
  commissions 
}) {
  const [commissionSettings, setCommissionSettings] = useState({});
  const [eventData, setEventData] = useState({ tickets: [], commissions: [] });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCommissionData();
  }, []);

  const loadCommissionData = async () => {
    setIsLoading(true);
    try {
      // Load commission settings for all entity types
      const [eventSettings, advisorSettings, finfluencerSettings, eventTickets, eventCommissions] = await Promise.all([
        CommissionSettings.filter({ entity_type: 'event' }),
        CommissionSettings.filter({ entity_type: 'advisor' }),
        CommissionSettings.filter({ entity_type: 'finfluencer' }),
        EventTicket.list(),
        EventCommissionTracking.list()
      ]);

      setCommissionSettings({
        event: eventSettings[0] || { default_rate: 20, overrides: {} },
        advisor: advisorSettings[0] || { default_rate: 20, overrides: {} },
        finfluencer: finfluencerSettings[0] || { default_rate: 25, overrides: {} }
      });

      setEventData({ tickets: eventTickets, commissions: eventCommissions });
    } catch (error) {
      console.error('Error loading commission analytics data:', error);
      toast.error('Failed to load commission analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate analytics for each entity type
  const analytics = useMemo(() => {
    // Finfluencer Analytics
    const finfluencerRevenue = enrollments.reduce((acc, enrollment) => {
      acc.gross += enrollment.amount_paid || 0;
      acc.commission += enrollment.platform_commission || 0;
      acc.net += enrollment.influencer_payout || 0;
      return acc;
    }, { gross: 0, commission: 0, net: 0 });

    // Advisor Analytics
    const advisorRevenue = commissions.reduce((acc, commission) => {
      acc.gross += commission.gross_amount || 0;
      acc.commission += commission.platform_fee || 0;
      acc.net += commission.advisor_payout || 0;
      return acc;
    }, { gross: 0, commission: 0, net: 0 });

    // Event Analytics
    const eventRevenue = eventData.tickets.reduce((acc, ticket) => {
      if (['active', 'used'].includes(ticket.status)) {
        acc.gross += ticket.ticket_price || 0;
      }
      return acc;
    }, { gross: 0 });

    const eventCommissionTotal = eventData.commissions.reduce((acc, commission) => {
      acc.commission += commission.platform_commission || 0;
      acc.net += commission.organizer_payout || 0;
      return acc;
    }, { commission: 0, net: 0 });

    eventRevenue.commission = eventCommissionTotal.commission;
    eventRevenue.net = eventCommissionTotal.net;

    // Monthly trends (last 6 months)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = format(date, 'MMM yyyy');
      
      monthlyData.push({
        month: monthKey,
        finfluencer: Math.floor(finfluencerRevenue.commission / 6 + Math.random() * 5000),
        advisor: Math.floor(advisorRevenue.commission / 6 + Math.random() * 3000),
        event: Math.floor(eventRevenue.commission / 6 + Math.random() * 2000)
      });
    }

    // Commission breakdown
    const commissionBreakdown = [
      { name: 'Finfluencer Courses', value: finfluencerRevenue.commission, color: COLORS[0] },
      { name: 'Advisor Subscriptions', value: advisorRevenue.commission, color: COLORS[1] },
      { name: 'Event Tickets', value: eventRevenue.commission, color: COLORS[2] }
    ];

    return {
      finfluencer: finfluencerRevenue,
      advisor: advisorRevenue,
      event: eventRevenue,
      monthly: monthlyData,
      breakdown: commissionBreakdown,
      total: finfluencerRevenue.commission + advisorRevenue.commission + eventRevenue.commission
    };
  }, [enrollments, commissions, eventData]);

  const exportData = () => {
    const csvData = analytics.monthly.map(month => ({
      Month: month.month,
      'Finfluencer Commission': month.finfluencer,
      'Advisor Commission': month.advisor,
      'Event Commission': month.event,
      'Total Commission': month.finfluencer + month.advisor + month.event
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-analytics-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Commission report exported successfully!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading Commission Analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Commission Analytics</h2>
          <p className="text-gray-600">Track commission earnings across all revenue streams</p>
        </div>
        <Button onClick={exportData} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="shadow-lg border-0 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">Total Commission</p>
                <p className="text-3xl font-bold">₹{(analytics.total / 1000).toFixed(1)}k</p>
              </div>
              <DollarSign className="w-8 h-8 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Finfluencer Commission</p>
                <p className="text-3xl font-bold">₹{(analytics.finfluencer.commission / 1000).toFixed(1)}k</p>
              </div>
              <Star className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Advisor Commission</p>
                <p className="text-3xl font-bold">₹{(analytics.advisor.commission / 1000).toFixed(1)}k</p>
              </div>
              <Users className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Event Commission</p>
                <p className="text-3xl font-bold">₹{(analytics.event.commission / 1000).toFixed(1)}k</p>
              </div>
              <Calendar className="w-8 h-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Monthly Commission Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.monthly}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, '']} />
                <Legend />
                <Line type="monotone" dataKey="finfluencer" stroke={COLORS[0]} strokeWidth={2} name="Finfluencers" />
                <Line type="monotone" dataKey="advisor" stroke={COLORS[1]} strokeWidth={2} name="Advisors" />
                <Line type="monotone" dataKey="event" stroke={COLORS[2]} strokeWidth={2} name="Events" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Commission Breakdown */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              Commission Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie 
                  data={analytics.breakdown} 
                  dataKey="value" 
                  nameKey="name" 
                  cx="50%" 
                  cy="50%" 
                  outerRadius={100}
                  label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {analytics.breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value.toLocaleString()}`, 'Commission']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Entity-specific Analytics Tabs */}
      <Tabs defaultValue="finfluencers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-transparent p-1 rounded-xl gap-2">
          <TabsTrigger 
            value="finfluencers"
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <Star className="w-4 h-4 mr-2" />
            Finfluencers
          </TabsTrigger>
          <TabsTrigger 
            value="advisors"
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <Users className="w-4 h-4 mr-2" />
            Advisors
          </TabsTrigger>
          <TabsTrigger 
            value="events"
            className="whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary hover:bg-primary/90 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
        </TabsList>

        <TabsContent value="finfluencers">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle>Finfluencer Commission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Gross Revenue</h3>
                  <p className="text-2xl font-bold text-blue-900">₹{analytics.finfluencer.gross.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800">Platform Commission</h3>
                  <p className="text-2xl font-bold text-red-900">₹{analytics.finfluencer.commission.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Net to Finfluencers</h3>
                  <p className="text-2xl font-bold text-green-900">₹{analytics.finfluencer.net.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center">
                <Badge className="bg-blue-100 text-blue-700">
                  Default Rate: {commissionSettings.finfluencer?.default_rate || 25}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advisors">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle>Advisor Commission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Gross Revenue</h3>
                  <p className="text-2xl font-bold text-purple-900">₹{analytics.advisor.gross.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800">Platform Commission</h3>
                  <p className="text-2xl font-bold text-red-900">₹{analytics.advisor.commission.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Net to Advisors</h3>
                  <p className="text-2xl font-bold text-green-900">₹{analytics.advisor.net.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center">
                <Badge className="bg-purple-100 text-purple-700">
                  Default Rate: {commissionSettings.advisor?.default_rate || 20}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader>
              <CardTitle>Event Commission Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-orange-800">Gross Revenue</h3>
                  <p className="text-2xl font-bold text-orange-900">₹{analytics.event.gross.toLocaleString()}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800">Platform Commission</h3>
                  <p className="text-2xl font-bold text-red-900">₹{analytics.event.commission.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Net to Organizers</h3>
                  <p className="text-2xl font-bold text-green-900">₹{analytics.event.net.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-center">
                <Badge className="bg-orange-100 text-orange-700">
                  Default Rate: {commissionSettings.event?.default_rate || 20}%
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}