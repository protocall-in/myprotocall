import { useState, useEffect, useCallback, useRef } from 'react';
import { Notification } from '@/api/entities';

export const usePageNotifications = (userId, page) => {
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const loadAttemptRef = useRef(0);
  const abortControllerRef = useRef(null);
  const lastLoadTimeRef = useRef(0);

  const loadCount = useCallback(async () => {
    // Don't load if no user or page
    if (!userId || !page) {
      setCount(0);
      setIsLoading(false);
      return;
    }

    // Prevent loading more than once per 10 seconds
    const now = Date.now();
    if (now - lastLoadTimeRef.current < 10000) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (isLoading) {
      return;
    }

    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    loadAttemptRef.current += 1;
    
    // Add very long staggered delay based on page to prevent rate limiting
    const pageDelays = {
      'wallet': 5000,
      'payout': 7000,
      'report': 9000,
      'transaction': 11000,
      'allocation': 13000,
      'investor': 15000,
      'withdrawal': 17000
    };
    const delay = pageDelays[page] || 5000;

    try {
      setIsLoading(true);
      
      // Add staggered delay based on page type
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Check if still mounted
      if (!isMountedRef.current) return;
      
      lastLoadTimeRef.current = Date.now();
      
      const notifications = await Notification.filter({
        user_id: userId,
        page: page,
        status: 'unread'
      }).catch((err) => {
        // Silently handle aborted requests and rate limits
        if (err.message === 'Request aborted' || err.message?.includes('Rate limit') || err.message?.includes('429')) {
          return [];
        }
        throw err;
      });
      
      if (isMountedRef.current) {
        setCount(notifications.length);
      }
    } catch (error) {
      // Silently handle errors - don't spam console or show to user
      if (isMountedRef.current) {
        setCount(0);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  }, [userId, page, isLoading]);

  useEffect(() => {
    isMountedRef.current = true;
    
    // Initial load with very long delay
    const timeout = setTimeout(() => {
      if (isMountedRef.current) {
        loadCount();
      }
    }, 10000); // Wait 10 seconds before first load
    
    // Refresh every 3 minutes instead of 2 minutes
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        loadCount();
      }
    }, 180000); // 3 minutes
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(timeout);
      clearInterval(interval);
      // Abort any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadCount]);

  const markAsRead = useCallback(async () => {
    if (!userId || !page || count === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!isMountedRef.current) return;
      
      const unreadNotifications = await Notification.filter({
        user_id: userId,
        page: page,
        status: 'unread'
      }).catch((err) => {
        if (err.message === 'Request aborted' || err.message?.includes('Rate limit')) {
          return [];
        }
        throw err;
      });

      if (!isMountedRef.current) return;

      // Mark all as read in very small batches with very long delays
      for (let i = 0; i < unreadNotifications.length; i += 1) {
        if (!isMountedRef.current) break;
        
        const notification = unreadNotifications[i];
        await Notification.update(notification.id, { status: 'read' }).catch(() => {});
        
        // Wait 2 seconds between each update
        if (i + 1 < unreadNotifications.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      if (isMountedRef.current) {
        setCount(0);
      }
    } catch (error) {
      // Silently handle errors
    }
  }, [userId, page, count]);

  return { count, isLoading, refresh: loadCount, markAsRead };
};