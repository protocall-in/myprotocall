import { useState, useEffect, useCallback, useRef } from 'react';
import { PledgeSession, Pledge, PledgeExecutionRecord } from '@/api/entities';

/**
 * ✅ IMPROVED: Smart polling with adaptive intervals
 * Polls more frequently when activity is detected
 */
export function useRealTimePledgeUpdates(userId, initialSessions = [], baseInterval = 30000) {
  const [sessions, setSessions] = useState(initialSessions);
  const [pledgeStats, setPledgeStats] = useState({});
  const [executionUpdates, setExecutionUpdates] = useState({});
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [error, setError] = useState(null);
  const [activityLevel, setActivityLevel] = useState('low'); // low, medium, high
  
  const pollIntervalRef = useRef(null);
  const lastPollTime = useRef(0);
  const lastDataHash = useRef(null);

  // ✅ Calculate polling interval based on activity
  const getCurrentPollInterval = useCallback(() => {
    switch (activityLevel) {
      case 'high': return 10000; // 10 seconds
      case 'medium': return 20000; // 20 seconds
      default: return baseInterval; // 30 seconds
    }
  }, [activityLevel, baseInterval]);

  // ✅ Detect activity level based on data changes
  const detectActivityLevel = useCallback((newData) => {
    const dataHash = JSON.stringify({
      sessionCount: newData.sessions?.length || 0,
      pledgeCount: newData.pledges?.length || 0,
      executingCount: newData.executions?.filter(e => e.status === 'executing').length || 0
    });

    if (lastDataHash.current && lastDataHash.current !== dataHash) {
      setActivityLevel('high');
      // Gradually decrease activity level
      setTimeout(() => setActivityLevel('medium'), 30000);
      setTimeout(() => setActivityLevel('low'), 60000);
    }

    lastDataHash.current = dataHash;
  }, []);

  // ✅ Fetch session stats with caching
  const fetchSessionStats = useCallback(async (sessionId) => {
    const cacheKey = `session_stats_${sessionId}`;
    const cached = sessionStorage.getItem(cacheKey);
    
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < 30000) {
        return data;
      }
    }

    try {
      const sessionPledges = await Pledge.filter({ session_id: sessionId });
      const stats = {
        unique_pledgers_count: new Set(sessionPledges.map(p => p.demat_account_id)).size,
        total_pledges: sessionPledges.length,
        total_pledge_value: sessionPledges.reduce((sum, p) => sum + (p.qty * (p.price_target || 0)), 0),
        buy_pledges_count: sessionPledges.filter(p => p.side === 'buy').length,
        sell_pledges_count: sessionPledges.filter(p => p.side === 'sell').length,
        latest_pledges: sessionPledges.slice(-5).reverse()
      };

      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: stats,
        timestamp: Date.now()
      }));

      return stats;
    } catch (error) {
      console.warn('Error fetching session stats:', error);
      return null;
    }
  }, []);

  // ✅ Main polling function
  const pollUpdates = useCallback(async () => {
    if (!isPolling) return;

    const now = Date.now();
    const minInterval = 10000; // Minimum 10 seconds between polls

    if (now - lastPollTime.current < minInterval) {
      return;
    }

    lastPollTime.current = now;
    setError(null);

    try {
      const activeSessions = await PledgeSession.filter({ status: 'active' }, '-created_date');
      
      if (activeSessions.length === 0) {
        setSessions([]);
        setPledgeStats({});
        return;
      }

      const statsPromises = activeSessions.map(session => 
        fetchSessionStats(session.id).then(stats => ({
          sessionId: session.id,
          stats
        }))
      );

      const statsResults = await Promise.all(statsPromises);
      
      const newPledgeStats = {};
      statsResults.forEach(({ sessionId, stats }) => {
        if (stats) {
          newPledgeStats[sessionId] = stats;
        }
      });

      const enhancedSessions = activeSessions.map(session => ({
        ...session,
        ...newPledgeStats[session.id]
      }));

      // ✅ Detect activity level
      detectActivityLevel({
        sessions: enhancedSessions,
        pledges: Object.values(newPledgeStats).flatMap(s => s.latest_pledges || []),
        executions: []
      });

      setSessions(enhancedSessions);
      setPledgeStats(newPledgeStats);
      setLastUpdate(Date.now());

      console.log(`📡 Polled updates (activity: ${activityLevel})`);
    } catch (error) {
      console.error('Polling error:', error);
      setError('Failed to fetch updates');
    }
  }, [isPolling, fetchSessionStats, activityLevel, detectActivityLevel]);

  // ✅ Start polling with adaptive intervals
  useEffect(() => {
    if (!isPolling) return;

    pollUpdates();

    pollIntervalRef.current = setInterval(() => {
      pollUpdates();
    }, getCurrentPollInterval());

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isPolling, pollUpdates, getCurrentPollInterval]);

  const refresh = useCallback(async () => {
    lastPollTime.current = 0;
    return pollUpdates();
  }, [pollUpdates]);

  const pausePolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const resumePolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  const enablePolling = useCallback(() => {
    setIsPolling(true);
  }, []);

  return {
    sessions,
    pledgeStats,
    executionUpdates,
    lastUpdate,
    isPolling,
    error,
    activityLevel,
    refresh,
    pausePolling,
    resumePolling,
    enablePolling
  };
}

export function requestNotificationPermission() {
  if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'default') {
    return window.Notification.requestPermission();
  }
  return Promise.resolve(typeof window !== 'undefined' && 'Notification' in window ? window.Notification.permission : 'denied');
}