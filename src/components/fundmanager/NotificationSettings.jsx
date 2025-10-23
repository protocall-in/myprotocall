import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NotificationSetting } from '@/api/entities';
import { toast } from 'sonner';
import { Bell, Mail, Smartphone, Loader2, Save } from 'lucide-react';

const NOTIFICATION_CATEGORIES = [
  {
    category: 'wallet_credit',
    label: 'Wallet Credits',
    description: 'When investors add money to their wallet'
  },
  {
    category: 'investment_request',
    label: 'Investment Requests',
    description: 'When investors request new fund allocations'
  },
  {
    category: 'withdrawal_request',
    label: 'Withdrawal Requests',
    description: 'When investors request fund withdrawals'
  },
  {
    category: 'investor_registration',
    label: 'New Registrations',
    description: 'When new investors register'
  },
  {
    category: 'payout_request',
    label: 'Payout Requests',
    description: 'When investors request wallet payouts'
  },
  {
    category: 'kyc_update',
    label: 'KYC Updates',
    description: 'When investors update their KYC documents'
  },
  {
    category: 'system_alert',
    label: 'System Alerts',
    description: 'Important system notifications and alerts'
  }
];

export default function NotificationSettings({ user, isOpen, onClose }) {
  const [settings, setSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadSettings = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userSettings = await NotificationSetting.filter({ user_id: user.id });
      
      // Create settings map
      const settingsMap = {};
      userSettings.forEach(setting => {
        settingsMap[setting.category] = {
          in_app_enabled: setting.in_app_enabled,
          email_enabled: setting.email_enabled,
          push_enabled: setting.push_enabled
        };
      });

      // Fill in defaults for missing categories
      NOTIFICATION_CATEGORIES.forEach(cat => {
        if (!settingsMap[cat.category]) {
          settingsMap[cat.category] = {
            in_app_enabled: true,
            email_enabled: false,
            push_enabled: false
          };
        }
      });

      setSettings(settingsMap);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      loadSettings();
    }
  }, [isOpen, user, loadSettings]);

  const handleToggle = (category, channel) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: !prev[category]?.[channel]
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each category setting
      await Promise.all(
        Object.entries(settings).map(async ([category, channels]) => {
          // Check if setting exists
          const existing = await NotificationSetting.filter({
            user_id: user.id,
            category: category
          });

          if (existing.length > 0) {
            // Update existing
            await NotificationSetting.update(existing[0].id, {
              in_app_enabled: channels.in_app_enabled,
              email_enabled: channels.email_enabled,
              push_enabled: channels.push_enabled
            });
          } else {
            // Create new
            await NotificationSetting.create({
              user_id: user.id,
              category: category,
              in_app_enabled: channels.in_app_enabled,
              email_enabled: channels.email_enabled,
              push_enabled: channels.push_enabled
            });
          }
        })
      );

      toast.success('Notification settings saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bell className="w-6 h-6 text-blue-600" />
            Notification Preferences
          </DialogTitle>
          <DialogDescription>
            Choose how you want to receive notifications for different events
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {/* Channel Headers */}
            <div className="grid grid-cols-12 gap-4 pb-2 border-b border-slate-200">
              <div className="col-span-6"></div>
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <Bell className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700">In-App</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <Mail className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Email</span>
                </div>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="w-5 h-5 text-green-600 mx-auto mb-1" />
                  <span className="text-xs font-semibold text-slate-700">Push</span>
                </div>
              </div>
            </div>

            {/* Notification Categories */}
            {NOTIFICATION_CATEGORIES.map((cat) => (
              <Card key={cat.category} className="border-slate-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-6">
                      <h4 className="font-semibold text-slate-900">{cat.label}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description}</p>
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <Switch
                        checked={settings[cat.category]?.in_app_enabled || false}
                        onCheckedChange={() => handleToggle(cat.category, 'in_app_enabled')}
                      />
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <Switch
                        checked={settings[cat.category]?.email_enabled || false}
                        onCheckedChange={() => handleToggle(cat.category, 'email_enabled')}
                      />
                    </div>
                    
                    <div className="col-span-2 flex justify-center">
                      <Switch
                        checked={settings[cat.category]?.push_enabled || false}
                        onCheckedChange={() => handleToggle(cat.category, 'push_enabled')}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Quick Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allEnabled = {};
                  NOTIFICATION_CATEGORIES.forEach(cat => {
                    allEnabled[cat.category] = {
                      in_app_enabled: true,
                      email_enabled: true,
                      push_enabled: true
                    };
                  });
                  setSettings(allEnabled);
                }}
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allDisabled = {};
                  NOTIFICATION_CATEGORIES.forEach(cat => {
                    allDisabled[cat.category] = {
                      in_app_enabled: false,
                      email_enabled: false,
                      push_enabled: false
                    };
                  });
                  setSettings(allDisabled);
                }}
              >
                Disable All
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isLoading || isSaving}
            className="bg-gradient-to-r from-blue-600 to-purple-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}