
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign,
  Settings,
  Users,
  Download,
  TrendingUp,
  AlertCircle,
  Percent
} from
'lucide-react';
import { toast } from 'sonner';
import { CommissionSettings, PlatformSetting, EventCommissionTracking } from '@/api/entities';

// New PayoutTracking Component
const PayoutTracking = ({ globalMinPayout, commissionData, events }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ grossRevenue: 0, platformCommission: 0, netPayout: 0 });

  useEffect(() => {
    if (!commissionData || commissionData.length === 0) {
      setStats({ grossRevenue: 0, platformCommission: 0, netPayout: 0 });
      setIsLoading(false);
      return;
    }

    const grossRevenue = commissionData.reduce((sum, item) => sum + item.gross_revenue, 0);
    const platformCommission = commissionData.reduce((sum, item) => sum + item.platform_commission, 0);
    const netPayout = commissionData.reduce((sum, item) => sum + item.organizer_payout, 0);
    setStats({ grossRevenue, platformCommission, netPayout });
    setIsLoading(false);
  }, [commissionData]);

  const handleExport = () => {
    if (!commissionData || commissionData.length === 0) {
      toast.info('No data to export.');
      return;
    }

    const headers = ['Event Date', 'Event Name', 'Organizer', 'Gross Revenue', 'Platform Commission', 'Net Payout', 'Status'];
    const rows = commissionData.map((item) => {
      const event = events.find((e) => e.id === item.event_id);
      const eventTitle = event ? `"${event.title.replace(/"/g, '""')}"` : 'Unknown Event';
      const organizerName = event ? `"${(event.organizer_name || 'Unknown Organizer').replace(/"/g, '""')}"` : 'Unknown Organizer';
      const eventDate = event ? new Date(event.event_date).toLocaleDateString() : 'N/A';

      return [
        eventDate,
        eventTitle,
        organizerName,
        item.gross_revenue,
        item.platform_commission,
        item.organizer_payout,
        item.payout_status
      ].
      join(',');
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'events_commission_data.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Commission data exported successfully!');
  };

  if (isLoading) return <div className="text-center p-8">Loading payout data...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-medium">Gross Revenue</p>
                    <p className="text-white text-3xl font-bold">₹{stats.grossRevenue.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-xs text-gray-600">Total event revenue generated</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Percent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-medium">Platform Commission</p>
                    <p className="text-white text-3xl font-bold">₹{stats.platformCommission.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-xs text-gray-600">Platform earnings from events</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-white hover:shadow-xl transition-all duration-300 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/90 text-sm font-medium">Net Payout to Organizers</p>
                    <p className="text-white text-3xl font-bold">₹{stats.netPayout.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-white">
              <p className="text-xs text-gray-600">Total organizer earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <p className="text-sm text-gray-600">
          Global Minimum Payout Threshold: <span className="font-bold">₹{parseFloat(globalMinPayout).toFixed(2)}</span>
        </p>
        <Button onClick={handleExport} variant="outline" className="rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Transaction Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent Event Commission Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Event</th>
                  <th className="text-left p-2">Organizer</th>
                  <th className="text-left p-2">Gross Revenue</th>
                  <th className="text-left p-2">Platform Fee</th>
                  <th className="text-left p-2">Net Payout</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.map((item) => {
                  const event = events.find((e) => e.id === item.event_id);
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">
                        <div className="font-medium">{event?.title || 'Unknown Event'}</div>
                        <div className="text-xs text-gray-500">
                          {event ? new Date(event.event_date).toLocaleDateString() : 'N/A'}
                        </div>
                      </td>
                      <td className="p-2">{event?.organizer_name || 'Unknown'}</td>
                      <td className="p-2 font-medium">₹{item.gross_revenue.toFixed(2)}</td>
                      <td className="p-2 text-blue-600">₹{item.platform_commission.toFixed(2)}</td>
                      <td className="p-2 text-green-600">₹{item.organizer_payout.toFixed(2)}</td>
                      <td className="p-2">
                        <Badge className={
                          item.payout_status === 'processed' ? 'bg-green-100 text-green-800' :
                            item.payout_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }>
                          {item.payout_status}
                        </Badge>
                      </td>
                    </tr>);

                })}
              </tbody>
            </table>
            {commissionData.length === 0 &&
              <div className="text-center py-8 text-gray-500">
                No commission data available yet.
              </div>
            }
          </div>
        </CardContent>
      </Card>
    </div>);

};

export default function EventPricingCommission({
  events,
  tickets,
  commissionTracking,
  permissions,
  platformSettings
}) {
  const [moduleCommissionRate, setModuleCommissionRate] = useState('');
  const [individualOverrides, setIndividualOverrides] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const globalCommissionRate = platformSettings?.global_commission_rate || '20';
  const globalMinimumPayout = platformSettings?.global_minimum_payout_threshold || '500';

  useEffect(() => {
    loadCommissionSettings();
  }, []);

  const loadCommissionSettings = async () => {
    setIsLoading(true);
    try {
      // Load event-specific commission settings
      const eventCommissionSettings = await CommissionSettings.filter({ entity_type: 'event' });
      const eventSettings = eventCommissionSettings[0];

      setModuleCommissionRate(eventSettings?.default_rate?.toString() || '');

      // Parse individual overrides
      if (eventSettings?.overrides) {
        try {
          const overrides = typeof eventSettings.overrides === 'string' ?
            JSON.parse(eventSettings.overrides) :
            eventSettings.overrides;
          setIndividualOverrides(overrides || {});
        } catch (error) {
          console.error('Error parsing overrides:', error);
          setIndividualOverrides({});
        }
      }
    } catch (error) {
      console.error('Error loading commission settings:', error);
      toast.error('Failed to load commission settings');
    } finally {
      setIsLoading(false);
    }
  };

  const saveModuleSettings = async () => {
    setIsSaving(true);
    try {
      const rate = parseFloat(moduleCommissionRate);
      if (moduleCommissionRate !== '' && (isNaN(rate) || rate < 0 || rate > 100)) {
        toast.error('Commission rate must be between 0 and 100 or left blank');
        setIsSaving(false);
        return;
      }

      // Check if settings already exist
      const existingSettings = await CommissionSettings.filter({ entity_type: 'event' });
      const settingsData = {
        entity_type: 'event',
        default_rate: moduleCommissionRate === '' ? null : rate,
        minimum_payout_threshold: parseFloat(globalMinimumPayout), // Use global setting
        overrides: JSON.stringify(individualOverrides),
        is_active: true,
        description: 'Commission settings for events module'
      };

      if (existingSettings.length > 0) {
        await CommissionSettings.update(existingSettings[0].id, settingsData);
      } else {
        await CommissionSettings.create(settingsData);
      }

      toast.success('Event module commission settings updated successfully!');
    } catch (error) {
      console.error('Error saving module settings:', error);
      toast.error('Failed to save commission settings');
    } finally {
      setIsSaving(false);
    }
  };

  const updateIndividualOverride = (organizerId, rate) => {
    setIndividualOverrides((prev) => ({
      ...prev,
      [organizerId]: rate === '' ? null : parseFloat(rate)
    }));
  };

  const saveIndividualOverride = async (organizerId) => {
    try {
      const updatedOverrides = { ...individualOverrides };
      if (updatedOverrides[organizerId] === null) {
        delete updatedOverrides[organizerId];
      }

      const existingSettings = await CommissionSettings.filter({ entity_type: 'event' });
      const settingsData = {
        entity_type: 'event',
        default_rate: moduleCommissionRate === '' ? null : parseFloat(moduleCommissionRate),
        minimum_payout_threshold: parseFloat(globalMinimumPayout),
        overrides: JSON.stringify(updatedOverrides),
        is_active: true,
        description: 'Commission settings for events module'
      };

      if (existingSettings.length > 0) {
        await CommissionSettings.update(existingSettings[0].id, settingsData);
      } else {
        await CommissionSettings.create(settingsData);
      }

      setIndividualOverrides(updatedOverrides);
      toast.success('Individual commission override updated');
    } catch (error) {
      console.error('Error updating individual override:', error);
      toast.error('Failed to update individual commission');
    }
  };

  // Get unique event organizers
  const eventOrganizers = useMemo(() => {
    if (!events) return [];
    const uniqueOrganizers = events.reduce((acc, event) => {
      if (event.organizer_id && !acc.find((org) => org.id === event.organizer_id)) {
        acc.push({
          id: event.organizer_id,
          name: event.organizer?.display_name || `Organizer ${event.organizer_id.slice(-6)}`,
          eventCount: events.filter((e) => e.organizer_id === event.organizer_id).length
        });
      }
      return acc;
    }, []);
    return uniqueOrganizers;
  }, [events]);

  if (isLoading) {
    return <div className="text-center p-8">Loading commission settings...</div>;
  }

  return (
    <Tabs defaultValue="settings" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 bg-transparent p-1 rounded-xl gap-2">
        <TabsTrigger
          value="settings"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
        >
          <Settings className="w-4 h-4" />
          Commission Settings
        </TabsTrigger>
        <TabsTrigger
          value="tracking"
          className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-10 px-4 w-full text-sm rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 py-2.5 transition-all duration-300 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 hover:text-white hover:shadow-lg"
        >
          <TrendingUp className="w-4 h-4" />
          Payout Tracking
        </TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-6">
        {/* Global Settings Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-800">Global Settings</h4>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p>Global Commission Rate: <strong>{globalCommissionRate}%</strong></p>
                <p>Global Minimum Payout: <strong>₹{globalMinimumPayout}</strong></p>
                <p className="text-xs">Override these settings below for the Events module.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Module Override Settings */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Events Module Commission Override
            </CardTitle>
            <p className="text-sm text-gray-500">
              Override global commission rate for all events. Leave blank to use global rate ({globalCommissionRate}%).
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 max-w-md">
              <div className="flex-grow">
                <Label htmlFor="module-commission" className="flex items-center gap-1 mb-1">
                  <Percent className="w-4 h-4 text-gray-500" /> Events Commission Rate (%)
                </Label>
                <Input
                  id="module-commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder={`Leave blank for global default (${globalCommissionRate}%)`}
                  value={moduleCommissionRate}
                  onChange={(e) => setModuleCommissionRate(e.target.value)} />

              </div>
              <Button
                onClick={saveModuleSettings}
                disabled={isSaving}
                className="bg-indigo-600 hover:bg-indigo-700">

                {isSaving ? 'Saving...' : 'Save Override'}
              </Button>
            </div>
            {moduleCommissionRate !== '' &&
              <p className="text-xs text-gray-500 mt-2">
                Events will use {moduleCommissionRate}% commission instead of global {globalCommissionRate}%.
              </p>
            }
          </CardContent>
        </Card>

        {/* Individual Organizer Overrides */}
        <Card className="shadow-lg border-0 bg-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Individual Event Organizer Overrides
            </CardTitle>
            <p className="text-sm text-gray-500">
              Set specific commission rates for individual event organizers. These override both global and module settings.
            </p>
          </CardHeader>
          <CardContent>
            {eventOrganizers.length === 0 ?
              <div className="text-center py-8 text-gray-500">
                No event organizers found to set individual overrides.
              </div> :

              <div className="space-y-4">
                {eventOrganizers.map((organizer) => {
                  const currentRate = individualOverrides[organizer.id];
                  const effectiveRate = currentRate ?? (
                    moduleCommissionRate !== '' ? parseFloat(moduleCommissionRate) : parseFloat(globalCommissionRate));

                  return (
                    <div key={organizer.id} className="flex items-end gap-3 border-b pb-4 last:border-b-0 last:pb-0">
                      <div className="flex-grow">
                        <Label htmlFor={`organizer-${organizer.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                          {organizer.name}
                        </Label>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {organizer.eventCount} events
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Current: {effectiveRate}%
                          </Badge>
                        </div>
                        <Input
                          id={`organizer-${organizer.id}`}
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          placeholder={`Leave blank for fallback (${moduleCommissionRate || globalCommissionRate}%)`}
                          value={currentRate === null || currentRate === undefined ? '' : currentRate}
                          onChange={(e) => updateIndividualOverride(organizer.id, e.target.value)}
                          className="mt-1" />

                      </div>
                      <Button
                        onClick={() => saveIndividualOverride(organizer.id)}
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700">

                        Save
                      </Button>
                    </div>);

                })}
              </div>
            }
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="tracking" className="space-y-6">
        <PayoutTracking
          globalMinPayout={globalMinimumPayout}
          commissionData={commissionTracking}
          events={events} />

      </TabsContent>
    </Tabs>);

}
