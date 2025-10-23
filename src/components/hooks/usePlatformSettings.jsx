import { useState, useEffect } from 'react';
import { PlatformSetting, User } from '@/api/entities';

const defaultSettings = {
  commissionRate: 25,
  pledgeEnabled: true,
  advisorApprovalRequired: true,
  support_email: 'support@protocol.in',
  support_phone: '+91-80-4567-8900',
  site_name: 'Protocol',
  social_link_twitter: '#',
  social_link_linkedin: '#',
  social_link_instagram: '#',
  social_link_youtube: '#',
  ad_cpc_rate: 5,
  ad_weekly_fee: 1000,
  ad_monthly_fee: 3500,
  subscription_refund_enabled: true,
};

export const usePlatformSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      try {
        // Check if user is admin before loading settings
        const user = await User.me().catch(() => null);
        
        if (!user || (user.app_role !== 'admin' && user.app_role !== 'super_admin')) {
          // Non-admin users use default settings
          if (isMounted) {
            setSettings(defaultSettings);
            setUsingDefaults(true);
            setIsLoading(false);
          }
          return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const fetchedSettings = await PlatformSetting.list().catch(() => []);
        
        if (!isMounted) return;
        
        if (fetchedSettings.length === 0) {
          setUsingDefaults(true);
          setSettings(defaultSettings);
        } else {
          const settingsMap = fetchedSettings.reduce((acc, setting) => {
            if (setting.setting_value === 'true') {
              acc[setting.setting_key] = true;
            } else if (setting.setting_value === 'false') {
              acc[setting.setting_key] = false;
            } else if (!isNaN(setting.setting_value) && setting.setting_value !== '') {
              acc[setting.setting_key] = Number(setting.setting_value);
            } else {
              acc[setting.setting_key] = setting.setting_value;
            }
            return acc;
          }, {});

          setSettings({ ...defaultSettings, ...settingsMap });
          setUsingDefaults(false);
        }
      } catch (error) {
        // Handle errors gracefully
        if (isMounted) {
          console.warn('Error loading platform settings, using defaults:', error);
          setUsingDefaults(true);
          setSettings(defaultSettings);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, [refreshKey]);

  const refreshSettings = () => {
    setRefreshKey(prev => prev + 1);
  };

  return {
    settings,
    isLoading,
    usingDefaults,
    refreshSettings
  };
};