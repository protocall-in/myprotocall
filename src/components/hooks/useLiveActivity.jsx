import { useState, useEffect } from 'react';
import { PledgeSession, Pledge } from '@/api/entities';

/**
 * Hook to track live user activity on pledge sessions
 * Returns active user count and recent activity
 */
export function useLiveActivity(sessionId, refreshInterval = 30000) {
  const [activityData, setActivityData] = useState({
    activeUsers: 0,
    recentPledges: 0,
    lastActivity: null,
    isLoading: true
  });

  useEffect(() => {
    if (!sessionId) return;

    let isMounted = true;
    let intervalId;

    const fetchActivity = async () => {
      try {
        // Get pledges from last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        
        const recentPledges = await Pledge.filter({
          session_id: sessionId,
          created_date: { '$gte': fiveMinutesAgo }
        }).catch(() => []);

        if (!isMounted) return;

        // Count unique users
        const uniqueUsers = new Set(recentPledges.map(p => p.user_id)).size;

        setActivityData({
          activeUsers: uniqueUsers,
          recentPledges: recentPledges.length,
          lastActivity: recentPledges.length > 0 ? recentPledges[0].created_date : null,
          isLoading: false
        });
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching live activity:', error);
          setActivityData(prev => ({ ...prev, isLoading: false }));
        }
      }
    };

    // Initial fetch
    fetchActivity();

    // Set up polling
    intervalId = setInterval(fetchActivity, refreshInterval);

    return () => {
      isMounted = false;
      if (intervalId) clearInterval(intervalId);
    };
  }, [sessionId, refreshInterval]);

  return activityData;
}