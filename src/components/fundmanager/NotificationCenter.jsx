import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Settings, Filter, Loader2, CheckCheck, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Notification, NotificationSetting } from '@/api/entities';
import { toast } from 'sonner';

export default function NotificationCenter({ user, onSettingsClick }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');

  const loadNotifications = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const allNotifications = await Notification.filter({ user_id: user.id }, '-created_date', 50).catch(() => []);
      setNotifications(allNotifications);
      
      const unread = allNotifications.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      // Don't show error toast for rate limit errors
      if (!error.message?.includes('Rate limit')) {
        toast.error('Failed to load notifications');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Load notifications only when panel is opened
      if (showPanel) {
        loadNotifications();
      }
      
      // Reduce auto-refresh frequency to 2 minutes to avoid rate limiting
      const interval = setInterval(() => {
        if (showPanel) {
          loadNotifications();
        }
      }, 120000); // 2 minutes
      
      return () => clearInterval(interval);
    }
  }, [user, showPanel, loadNotifications]);

  const handleMarkAsRead = async (notificationId) => {
    try {
      await Notification.update(notificationId, { status: 'read' });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, status: 'read' } : n)
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      if (!error.message?.includes('Rate limit')) {
        toast.error('Failed to mark notification as read');
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => n.status === 'unread');
      
      // Process in batches to avoid rate limiting
      for (let i = 0; i < unreadNotifications.length; i += 3) {
        const batch = unreadNotifications.slice(i, i + 3);
        await Promise.all(
          batch.map(n => Notification.update(n.id, { status: 'read' }).catch(() => {}))
        );
        // Add delay between batches
        if (i + 3 < unreadNotifications.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      setNotifications(prev => 
        prev.map(n => ({ ...n, status: 'read' }))
      );
      
      setUnreadCount(0);
      
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      if (!error.message?.includes('Rate limit')) {
        toast.error('Failed to mark all notifications as read');
      }
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await Notification.delete(notificationId);
      
      const deletedNotification = notifications.find(n => n.id === notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (deletedNotification?.status === 'unread') {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.success('Notification deleted');
    } catch (error) {
      console.error('Error deleting notification:', error);
      if (!error.message?.includes('Rate limit')) {
        toast.error('Failed to delete notification');
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'info':
        return '📢';
      case 'warning':
        return '⚠️';
      case 'alert':
        return '🚨';
      default:
        return '📬';
    }
  };

  const getNotificationCategory = (message) => {
    if (message.includes('wallet') || message.includes('credited')) return 'wallet';
    if (message.includes('investment') || message.includes('requested investment')) return 'investment';
    if (message.includes('withdrawal')) return 'withdrawal';
    if (message.includes('registration') || message.includes('New investor')) return 'registration';
    return 'other';
  };

  const filteredNotifications = activeFilter === 'all' 
    ? notifications 
    : notifications.filter(n => getNotificationCategory(n.message) === activeFilter);

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative p-2 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6 text-slate-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 min-w-[20px] flex items-center justify-center bg-red-500 text-white text-xs px-1 animate-pulse">
            {unreadCount}
          </Badge>
        )}
      </button>

      {showPanel && (
        <Card className="absolute right-0 mt-2 w-[480px] max-h-[700px] shadow-2xl border-0 z-50 overflow-hidden">
          <CardHeader className="border-b border-slate-200 pb-3 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Center
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white">{unreadCount} new</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPanel(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mt-3 flex-wrap">
              {[
                { key: 'all', label: 'All', count: notifications.length },
                { key: 'wallet', label: 'Wallet', count: notifications.filter(n => getNotificationCategory(n.message) === 'wallet').length },
                { key: 'investment', label: 'Investments', count: notifications.filter(n => getNotificationCategory(n.message) === 'investment').length },
                { key: 'withdrawal', label: 'Withdrawals', count: notifications.filter(n => getNotificationCategory(n.message) === 'withdrawal').length },
                { key: 'registration', label: 'Registrations', count: notifications.filter(n => getNotificationCategory(n.message) === 'registration').length },
              ].map((filter) => (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setActiveFilter(filter.key)}
                  className={activeFilter === filter.key ? 'bg-blue-600' : ''}
                >
                  {filter.label}
                  {filter.count > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {filter.count}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0 max-h-[550px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Bell className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredNotifications.map((notification) => {
                  const meta = notification.meta ? JSON.parse(notification.meta) : {};
                  const isUnread = notification.status === 'unread';
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-50 transition-colors ${
                        isUnread ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h4 className={`font-semibold text-sm ${isUnread ? 'text-blue-900' : 'text-slate-900'}`}>
                                {notification.title}
                                {isUnread && (
                                  <Badge className="ml-2 bg-blue-500 text-white text-xs">New</Badge>
                                )}
                              </h4>
                              <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                                {notification.message}
                              </p>
                              
                              {/* Action Details */}
                              {meta.action && (
                                <div className="mt-2 p-2 bg-slate-100 rounded-lg text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    {meta.investor_code && (
                                      <div>
                                        <span className="text-slate-500">Investor:</span>
                                        <span className="font-mono font-semibold text-slate-900 ml-1">
                                          {meta.investor_code}
                                        </span>
                                      </div>
                                    )}
                                    {meta.amount && (
                                      <div>
                                        <span className="text-slate-500">Amount:</span>
                                        <span className="font-semibold text-green-600 ml-1">
                                          ₹{meta.amount.toLocaleString('en-IN')}
                                        </span>
                                      </div>
                                    )}
                                    {meta.payment_method && (
                                      <div>
                                        <span className="text-slate-500">Method:</span>
                                        <span className="font-semibold text-slate-900 ml-1 uppercase">
                                          {meta.payment_method}
                                        </span>
                                      </div>
                                    )}
                                    {meta.fund_plan_name && (
                                      <div className="col-span-2">
                                        <span className="text-slate-500">Plan:</span>
                                        <span className="font-semibold text-slate-900 ml-1">
                                          {meta.fund_plan_name}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-xs text-slate-400 whitespace-nowrap">
                                🕐 {formatTimeAgo(notification.created_date)}
                              </span>
                              
                              <div className="flex gap-1">
                                {isUnread && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handleMarkAsRead(notification.id)}
                                    title="Mark as read"
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => handleDeleteNotification(notification.id)}
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>

          <div className="border-t border-slate-200 p-3 bg-slate-50 flex justify-between items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={onSettingsClick}
              className="text-xs text-slate-600"
            >
              <Settings className="w-4 h-4 mr-1" />
              Notification Settings
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadNotifications}
              className="text-xs text-blue-600"
            >
              Refresh
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}