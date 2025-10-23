
import React, { useState, useEffect, useCallback } from 'react';
import { AlertConfiguration } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, Bell } from 'lucide-react';
import { toast } from 'sonner';

const defaultAlertTypes = [
  {
    alert_type: 'poll_high_engagement',
    description: 'Alert when a poll receives unusually high participation',
    threshold_value: 1000,
    severity: 'warning',
    is_enabled: true, // default to enabled for new configs
    email_enabled: true,
    push_enabled: false
  },
  {
    alert_type: 'poll_anomaly',
    description: 'Alert when votes are heavily skewed in one direction',
    threshold_value: 0.9,
    severity: 'critical',
    is_enabled: true,
    email_enabled: true,
    push_enabled: true
  },
  {
    alert_type: 'poll_premium_conversion',
    description: 'Alert for high premium poll conversion rates',
    threshold_value: 0.15,
    severity: 'info',
    is_enabled: true,
    email_enabled: false,
    push_enabled: false
  },
  {
    alert_type: 'poll_flagged',
    description: 'Alert when users flag polls for inappropriate content',
    threshold_value: 1,
    severity: 'critical',
    is_enabled: true,
    email_enabled: true,
    push_enabled: true
  },
  {
    alert_type: 'pledge_near_target',
    description: 'Alert when pledge reaches near completion',
    threshold_value: 0.8,
    severity: 'info',
    is_enabled: true,
    email_enabled: false,
    push_enabled: false
  },
  {
    alert_type: 'pledge_target_achieved',
    description: 'Alert when pledge target is successfully met',
    threshold_value: 1.0,
    severity: 'warning',
    is_enabled: true,
    email_enabled: true,
    push_enabled: false
  },
  {
    alert_type: 'pledge_low_participation',
    description: 'Alert for pledges with low participation near deadline',
    threshold_value: 0.3,
    severity: 'warning',
    is_enabled: true,
    email_enabled: true,
    push_enabled: false
  },
  {
    alert_type: 'pledge_expired',
    description: 'Alert when pledges expire without meeting target',
    threshold_value: 1,
    severity: 'info',
    is_enabled: true,
    email_enabled: false,
    push_enabled: false
  }
];

export default function ManageAlertSettings({ settings, onChange }) {
  const [alertConfigs, setAlertConfigs] = useState([]);
  const [configsByType, setConfigsByType] = useState({}); // New state to easily access configs by type
  const [isLoading, setIsLoading] = useState(true);

  const loadAlertConfigs = useCallback(async () => {
    try {
      const configs = await AlertConfiguration.list().catch(err => {
          if (err.message !== 'Request aborted') {
              console.error("Error loading alert configurations:", err);
              toast.error("Failed to load alert configurations.");
          }
          return []; // Return empty array on request aborted or other fetch errors
      });
      return configs;
    } catch (error) {
       // This catch block would handle errors from AlertConfiguration.list() that are not caught by the .catch() on the promise
       console.error("Error loading alert configurations:", error);
       toast.error("Failed to load alert configurations.");
       return [];
    }
  }, []); // No dependencies for useCallback as AlertConfiguration.list is stable

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    const fetchData = async () => {
        let currentConfigs = await loadAlertConfigs();
        
        // Create missing configurations
        const existingTypes = new Set(currentConfigs.map(c => c.alert_type));
        const missingConfigs = defaultAlertTypes.filter(d => !existingTypes.has(d.alert_type));
        
        if (missingConfigs.length > 0) {
            try {
                await Promise.all(
                  missingConfigs.map(config => AlertConfiguration.create(config))
                );
                // Reload to get the complete list including newly created ones
                currentConfigs = await loadAlertConfigs();
            } catch (createError) {
                console.error('Error creating default alert configurations:', createError);
                toast.error('Failed to create default alert configurations.');
            }
        }

        if (isMounted) {
            setAlertConfigs(currentConfigs);
            const configsMap = currentConfigs.reduce((acc, config) => {
              acc[config.alert_type] = config;
              return acc;
            }, {});
            setConfigsByType(configsMap);
            setIsLoading(false);
        }
    };
    
    fetchData();

    return () => {
      isMounted = false;
    };
  }, [loadAlertConfigs]); // defaultAlertTypes is now a global constant, no longer a dependency

  const handleConfigUpdate = async (configId, updates) => {
    try {
      await AlertConfiguration.update(configId, updates);
      setAlertConfigs(prev => prev.map(config => {
        if (config.id === configId) {
          const updated = { ...config, ...updates };
          // Also update the configsByType map
          setConfigsByType(prevMap => ({
            ...prevMap,
            [updated.alert_type]: updated
          }));
          return updated;
        }
        return config;
      }));
      toast.success('Alert configuration updated');
    } catch (error) {
      console.error('Error updating configuration:', error);
      toast.error('Failed to update configuration');
    }
  };

  const alertTypeLabels = {
    poll_high_engagement: 'High Engagement Poll',
    poll_anomaly: 'Vote Anomaly Detection',
    poll_premium_conversion: 'Premium Conversion',
    poll_flagged: 'Flagged Content',
    pledge_near_target: 'Near Target Achievement',
    pledge_target_achieved: 'Target Achieved',
    pledge_low_participation: 'Low Participation',
    pledge_expired: 'Expired Pledge'
  };

  const severityColors = {
    info: 'bg-blue-100 text-blue-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800'
  };

  if (isLoading) {
    return <div className="text-center p-8">Loading alert configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
        <div className="flex items-start gap-3">
          <Bell className="w-5 h-5 text-blue-600 mt-1" />
          <div>
            <h4 className="font-semibold text-blue-800">Alert Configuration</h4>
            <p className="text-sm text-blue-700">
              Configure thresholds and settings for automated alerts. Changes take effect immediately.
            </p>
          </div>
        </div>
      </div>

      {/* Poll Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Poll Alert Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertConfigs.filter(config => config.alert_type.startsWith('poll_')).map(config => (
            <div key={config.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{alertTypeLabels[config.alert_type]}</h4>
                  <p className="text-sm text-slate-600">{config.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={severityColors[config.severity]}>
                    {config.severity}
                  </Badge>
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={(enabled) => 
                      handleConfigUpdate(config.id, { is_enabled: enabled })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Threshold Value</label>
                  <Input
                    type="number"
                    step={config.alert_type.includes('anomaly') || config.alert_type.includes('conversion') || config.alert_type.includes('participation') ? "0.01" : "1"}
                    value={config.threshold_value}
                    onChange={(e) => 
                      handleConfigUpdate(config.id, { threshold_value: parseFloat(e.target.value) })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {config.alert_type.includes('engagement') && 'Number of votes'}
                    {config.alert_type.includes('anomaly') && 'Percentage (0.9 = 90%)'}
                    {config.alert_type.includes('conversion') && 'Conversion rate (0.15 = 15%)'}
                    {config.alert_type.includes('flagged') && 'Number of flags'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.email_enabled}
                      onCheckedChange={(enabled) => 
                        handleConfigUpdate(config.id, { email_enabled: enabled })
                      }
                    />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.push_enabled}
                      onCheckedChange={(enabled) => 
                        handleConfigUpdate(config.id, { push_enabled: enabled })
                      }
                    />
                    <span className="text-sm">Push</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Pledge Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pledge Alert Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alertConfigs.filter(config => config.alert_type.startsWith('pledge_')).map(config => (
            <div key={config.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{alertTypeLabels[config.alert_type]}</h4>
                  <p className="text-sm text-slate-600">{config.description}</p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge className={severityColors[config.severity]}>
                    {config.severity}
                  </Badge>
                  <Switch
                    checked={config.is_enabled}
                    onCheckedChange={(enabled) => 
                      handleConfigUpdate(config.id, { is_enabled: enabled })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Threshold Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={config.threshold_value}
                    onChange={(e) => 
                      handleConfigUpdate(config.id, { threshold_value: parseFloat(e.target.value) })
                    }
                    className="mt-1"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {(config.alert_type.includes('near_target') || config.alert_type.includes('target_achieved') || config.alert_type.includes('participation')) && 'Percentage (0.8 = 80%)'}
                    {config.alert_type.includes('expired') && 'Auto-trigger (always 1)'}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.email_enabled}
                      onCheckedChange={(enabled) => 
                        handleConfigUpdate(config.id, { email_enabled: enabled })
                      }
                    />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.push_enabled}
                      onCheckedChange={(enabled) => 
                        handleConfigUpdate(config.id, { push_enabled: enabled })
                      }
                    />
                    <span className="text-sm">Push</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Global Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Global Alert Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Default Email Recipients</label>
              <Input
                placeholder="admin@protocol.com, alerts@protocol.com"
                value={settings.alert_email_recipients || ''}
                onChange={(e) => onChange({ alert_email_recipients: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Alert Retention Days</label>
              <Input
                type="number"
                placeholder="90"
                value={settings.alert_retention_days || '90'}
                onChange={(e) => onChange({ alert_retention_days: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Switch
              checked={settings.enable_alert_digest === 'true'}
              onCheckedChange={(enabled) => onChange({ enable_alert_digest: enabled.toString() })}
            />
            <label className="text-sm font-medium">Send Daily Alert Digest Email</label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
