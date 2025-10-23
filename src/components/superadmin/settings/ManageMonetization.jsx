import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Percent, AlertCircle, TrendingUp, Megaphone, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ManageMonetization({ settings, onChange, onSaveSpecificSettings }) {
  const [localSettings, setLocalSettings] = useState({
    global_commission_rate: settings?.global_commission_rate || '20',
    global_minimum_payout_threshold: settings?.global_minimum_payout_threshold || '500',
    ad_cpc_rate: settings?.ad_cpc_rate || '5',
    ad_weekly_fee: settings?.ad_weekly_fee || '1000',
    ad_monthly_fee: settings?.ad_monthly_fee || '3500',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings({
      global_commission_rate: settings?.global_commission_rate || '20',
      global_minimum_payout_threshold: settings?.global_minimum_payout_threshold || '500',
      ad_cpc_rate: settings?.ad_cpc_rate || '5',
      ad_weekly_fee: settings?.ad_weekly_fee || '1000',
      ad_monthly_fee: settings?.ad_monthly_fee || '3500',
    });
  }, [settings]);

  // UPDATED: Immediately save refund toggle to database
  const handleRefundToggle = async (checked) => {
    try {
      const newValue = checked.toString();
      
      // Update parent state
      onChange({ subscription_refund_enabled: newValue });
      
      // Save immediately to database
      await onSaveSpecificSettings({ subscription_refund_enabled: newValue });
      
      toast.success(checked ? 'Subscription refunds enabled' : 'Subscription refunds disabled');
    } catch (error) {
      console.error('Error updating refund setting:', error);
      toast.error('Failed to update refund setting');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const commissionRate = parseFloat(localSettings.global_commission_rate);
      const payoutThreshold = parseFloat(localSettings.global_minimum_payout_threshold);
      const adCpcRate = parseFloat(localSettings.ad_cpc_rate);
      const adWeeklyFee = parseFloat(localSettings.ad_weekly_fee);
      const adMonthlyFee = parseFloat(localSettings.ad_monthly_fee);

      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        toast.error('Commission rate must be between 0 and 100');
        setIsSaving(false);
        return;
      }

      if (isNaN(payoutThreshold) || payoutThreshold < 0) {
        toast.error('Minimum payout threshold must be a positive number');
        setIsSaving(false);
        return;
      }
      
      if (isNaN(adCpcRate) || isNaN(adWeeklyFee) || isNaN(adMonthlyFee) || adCpcRate < 0 || adWeeklyFee < 0 || adMonthlyFee < 0) {
        toast.error('Ad prices must be positive numbers');
        setIsSaving(false);
        return;
      }

      onChange(localSettings);
      toast.success('Global monetization settings updated successfully!');
    } catch (error) {
      console.error('Error saving monetization settings:', error);
      toast.error('Failed to save monetization settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-800">Global Monetization Settings</h4>
            <p className="text-sm text-blue-700 mt-1">
              These settings apply globally across Events, Finfluencers, Advisors, and Ad Campaigns. Individual modules can have custom rates.
            </p>
          </div>
        </div>
      </div>

      {/* Creator Commission */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-green-600" />
            Creator Commission & Payouts
          </CardTitle>
          <CardDescription>
            Default commission and payout rules for Finfluencers and Advisors.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="global_commission_rate">Global Commission Rate (%)</Label>
            <Input
              id="global_commission_rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={localSettings.global_commission_rate}
              onChange={(e) => handleInputChange('global_commission_rate', e.target.value)}
              placeholder="e.g., 20"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="global_minimum_payout_threshold">Min. Payout Threshold (₹)</Label>
            <Input
              id="global_minimum_payout_threshold"
              type="number"
              min="0"
              step="1"
              value={localSettings.global_minimum_payout_threshold}
              onChange={(e) => handleInputChange('global_minimum_payout_threshold', e.target.value)}
              placeholder="e.g., 500"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Ad Campaign Pricing */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-purple-600" />
            Ad Campaign Pricing
          </CardTitle>
          <CardDescription>
            Set the fixed prices for different ad campaign billing models.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="ad_cpc_rate">CPC Rate (₹ per click)</Label>
            <Input
              id="ad_cpc_rate"
              type="number"
              min="0"
              step="0.1"
              value={localSettings.ad_cpc_rate}
              onChange={(e) => handleInputChange('ad_cpc_rate', e.target.value)}
              placeholder="e.g., 5"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="ad_weekly_fee">Weekly Fee (₹)</Label>
            <Input
              id="ad_weekly_fee"
              type="number"
              min="0"
              step="100"
              value={localSettings.ad_weekly_fee}
              onChange={(e) => handleInputChange('ad_weekly_fee', e.target.value)}
              placeholder="e.g., 1000"
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="ad_monthly_fee">Monthly Fee (₹)</Label>
            <Input
              id="ad_monthly_fee"
              type="number"
              min="0"
              step="100"
              value={localSettings.ad_monthly_fee}
              onChange={(e) => handleInputChange('ad_monthly_fee', e.target.value)}
              placeholder="e.g., 3500"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Refund Settings Section */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <RotateCcw className="w-5 h-5" />
            Refund Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200">
            <div>
              <Label className="text-sm font-semibold text-gray-800">Enable Subscription Refunds</Label>
              <p className="text-xs text-gray-500 mt-1">
                Allow users to request refunds for subscription plans. When disabled, the "Request Refund" button will be hidden on Subscription page only.
              </p>
              <p className="text-xs text-orange-600 mt-1 font-medium">
                Note: Event, Course, and Advisor subscription refunds remain unaffected.
              </p>
            </div>
            <div className="ml-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.subscription_refund_enabled === 'true' || settings.subscription_refund_enabled === true}
                  onChange={(e) => handleRefundToggle(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
          </div>

          {(settings.subscription_refund_enabled === 'false' || settings.subscription_refund_enabled === false) && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-yellow-800">
                  <p className="font-semibold">Subscription refunds are currently disabled</p>
                  <p className="mt-1">Users cannot request refunds for subscription plans. Enable this to show the "Request Refund" button.</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
        >
          {isSaving ? 'Saving...' : 'Save Monetization Settings'}
        </Button>
      </div>
    </div>
  );
}