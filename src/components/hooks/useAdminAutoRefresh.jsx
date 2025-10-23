import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Hook for auto-refreshing admin panel data
 * Provides manual refresh, auto-refresh toggle, and change detection
 */
export function useAdminAutoRefresh(fetchFunction, intervalMs = 30000, options = {}) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(options.autoStart !== false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [changeCount, setChangeCount] = useState(0);
  const [hasNewData, setHasNewData] = useState(false);

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    
    try {
      const newData = await fetchFunction();
      
      // Detect changes
      const hasChanges = JSON.stringify(newData) !== JSON.stringify(data);
      
      setData(newData);
      setLastRefreshTime(new Date());
      
      if (hasChanges && data !== null) {
        setChangeCount(prev => prev + 1);
        setHasNewData(true);
        
        if (!silent && options.showChangeNotification) {
          toast.info('New data available!', {
            duration: 2000,
            action: {
              label: 'Dismiss',
              onClick: () => setHasNewData(false)
            }
          });
        }
      }
      
      return newData;
    } catch (error) {
      console.error('Auto-refresh error:', error);
      if (!silent) {
        toast.error('Failed to refresh data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, data, options.showChangeNotification]);

  // Auto-refresh effect
  useEffect(() => {
    let intervalId;

    if (isAutoRefreshEnabled && intervalMs > 0) {
      intervalId = setInterval(() => {
        refresh(true); // Silent refresh
      }, intervalMs);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isAutoRefreshEnabled, intervalMs, refresh]);

  // Initial load
  useEffect(() => {
    refresh(false);
  }, []);

  const toggleAutoRefresh = () => {
    setIsAutoRefreshEnabled(prev => !prev);
    toast.success(
      isAutoRefreshEnabled ? 'Auto-refresh disabled' : 'Auto-refresh enabled'
    );
  };

  const clearNewDataFlag = () => setHasNewData(false);

  return {
    data,
    isLoading,
    isAutoRefreshEnabled,
    lastRefreshTime,
    changeCount,
    hasNewData,
    refresh: () => refresh(false),
    toggleAutoRefresh,
    clearNewDataFlag
  };
}