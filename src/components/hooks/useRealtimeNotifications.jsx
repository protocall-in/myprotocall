import { useState, useEffect, useCallback } from 'react';
import { Notification, User } from '@/api/entities';
import { toast } from 'sonner';

/**
 * Hook for real-time notifications
 * Polls for new notifications and shows toast alerts
 */
export function useRealtimeNotifications(userId, options = {}) {
  const {
    pollInterval = 15000, // 15 seconds
    showToast = true,
    autoMarkAsRead = false,
    categories = [] // Filter by specific categories
  } = options;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastChecked, setLastChecked] = useState(new Date());

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!userId) return;

    try {
      const filters = { user_id: userId, status: 'unread' };
      
      // Add category filter if specified
      if (categories.length > 0) {
        filters.category = { '$in': categories };
      }

      const newNotifications = await Notification.filter(
        filters,
        '-created_date',
        50
      ).catch(() => []);

      // Check for truly new notifications (created after last check)
      const freshNotifications = newNotifications.filter(
        n => new Date(n.created_date) > lastChecked
      );

      if (freshNotifications.length > 0 && showToast && !silent) {
        // Show toast for each new notification (max 3)
        freshNotifications.slice(0, 3).forEach((notif, index) => {
          setTimeout(() => {
            const toastType = notif.type === 'alert' ? 'error' : 
                            notif.type === 'warning' ? 'warning' : 'info';
            
            toast[toastType](notif.title || notif.message, {
              description: notif.title ? notif.message : undefined,
              duration: 5000,
              action: autoMarkAsRead ? {
                label: 'Mark as Read',
                onClick: () => markAsRead(notif.id)
              } : undefined
            });
          }, index * 500); // Stagger toasts
        });

        if (freshNotifications.length > 3) {
          toast.info(`${freshNotifications.length - 3} more notifications`);
        }
      }

      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
      setLastChecked(new Date());

      return newNotifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }, [userId, lastChecked, showToast, autoMarkAsRead, categories]);

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await Notification.update(notificationId, { status: 'read' });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await Promise.all(
        notifications.map(n => Notification.update(n.id, { status: 'read' }))
      );
      setNotifications([]);
      setUnreadCount(0);
      toast.success('All notifications marked as read');
      return true;
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark all as read');
      return false;
    }
  }, [notifications]);

  // Polling effect
  useEffect(() => {
    if (!userId || pollInterval <= 0) return;

    fetchNotifications(false); // Initial fetch

    const intervalId = setInterval(() => {
      fetchNotifications(true); // Silent polling
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [userId, pollInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    lastChecked
  };
}