import React, { useState, useEffect, useMemo } from 'react';
import { User, Notification as NotificationEntity } from '@/api/entities'; // FIXED: Renamed to avoid conflict
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, Settings, Inbox, AlertTriangle, BellOff, ExternalLink } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import NotificationItem from './NotificationItem';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- NOTIFICATION TOGGLE ---
const NOTIFICATIONS_ENABLED = true;

export default function NotificationPanel() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);

  // Check notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(window.Notification.permission); // FIXED: Use window.Notification
    }
  }, []);

  useEffect(() => {
    if (!NOTIFICATIONS_ENABLED) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();
    
    const fetchUserAndNotifications = async () => {
      try {
        setError(null);
        
        const currentUser = await User.me().catch((error) => {
          if (isMounted && !abortController.signal.aborted && !/aborted/i.test(error.message) && !/canceled/i.test(error.message)) {
            console.warn("User not authenticated for notifications:", error.message);
          }
          return null;
        });
        
        if (!isMounted || abortController.signal.aborted) return;
        setUser(currentUser);
        
        if (currentUser) {
          await new Promise(resolve => setTimeout(resolve, 500));
          
          if (!isMounted || abortController.signal.aborted) return;
          
          // FIXED: Use NotificationEntity instead of Notification
          const fetchedNotifications = await NotificationEntity.filter(
            { user_id: currentUser.id }, 
            '-created_date', 
            50
          ).catch((error) => {
            if (isMounted && !abortController.signal.aborted && !/aborted/i.test(error.message) && !/canceled/i.test(error.message)) {
              if (error.message?.includes('404') || error.message?.includes('not found')) {
                console.warn("Notification entity not found - this is expected if notifications aren't set up yet");
                return [];
              } else if (error.message?.includes('401') || error.message?.includes('unauthorized')) {
                throw new Error('Authentication required');
              } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
                throw new Error('Network connection issue');
              } else {
                console.error("Error fetching notifications:", error);
                throw new Error('Unable to load notifications');
              }
            }
            return [];
          });
          
          if (isMounted && !abortController.signal.aborted) {
            setNotifications(fetchedNotifications);
          }
        }
      } catch (error) {
        if (isMounted && !abortController.signal.aborted && !/aborted/i.test(error.message) && !/canceled/i.test(error.message)) {
          console.error("Error in notification panel:", error);
          setError(error.message || 'Unable to load notifications');
        }
      } finally {
        if (isMounted && !abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    fetchUserAndNotifications();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, []);

  const unreadCount = useMemo(() => {
    if (!NOTIFICATIONS_ENABLED || error) return 0;
    return notifications.filter(n => n.status === 'unread').length;
  }, [notifications, error]);

  const handleMarkAsRead = async (id) => {
    if (!user || error) return;
    
    try {
      await NotificationEntity.update(id, { status: 'read' }); // FIXED: Use NotificationEntity
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    } catch (error) {
      if (!/aborted/i.test(error.message)) {
        toast.error("Failed to mark as read.");
      }
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user || error) return;
    
    const unreadIds = notifications.filter(n => n.status === 'unread').map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      // FIXED: Use NotificationEntity
      await Promise.all(unreadIds.map(id => NotificationEntity.update(id, { status: 'read' })));
      setNotifications(prev => prev.map(n => ({ ...n, status: 'read' })));
      toast.success("All notifications marked as read.");
    } catch (error) {
      if (!/aborted/i.test(error.message)) {
        toast.error("Failed to mark all as read.");
      }
    }
  };

  const handleEnableNotifications = async () => {
    // FIXED: Use window.Notification for browser API
    if (typeof window === 'undefined' || !('Notification' in window)) {
      toast.error('Push notifications are not supported in this browser.');
      return;
    }

    // Check current permission
    const currentPermission = window.Notification.permission;

    if (currentPermission === 'denied') {
      // Permission was previously denied, show instructions
      setShowPermissionDialog(true);
      return;
    }

    if (currentPermission === 'granted') {
      toast.success('Notifications are already enabled!');
      return;
    }

    // Request permission
    try {
      const permission = await window.Notification.requestPermission(); // FIXED: Use window.Notification
      setNotificationPermission(permission);

      if (permission === 'granted') {
        toast.success('Notifications enabled successfully!');
        
        // Show a test notification using browser API
        new window.Notification('Protocol Notifications', {
          body: 'You will now receive notifications about your pledges and updates.',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else if (permission === 'denied') {
        setShowPermissionDialog(true);
      } else {
        toast.info('Notification permission request dismissed.');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Failed to request notification permission.');
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'alert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Handle disabled state
  if (!NOTIFICATIONS_ENABLED) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 cursor-not-allowed">
        <Bell className="w-5 h-5 text-slate-400" />
        <span>Notifications disabled by admin.</span>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-500 cursor-not-allowed">
        <AlertTriangle className="w-5 h-5 text-slate-400" />
        <span>Notifications are currently unavailable.</span>
      </div>
    );
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                {unreadCount}
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 md:w-96 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                {/* Notification Permission Toggle */}
                {notificationPermission !== 'granted' && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleEnableNotifications}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <BellOff className="w-4 h-4 mr-1" />
                    Enable Push
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" onClick={handleMarkAllAsRead} disabled={unreadCount === 0}>
                  <CheckCheck className="w-4 h-4 mr-1" />
                  Mark all read
                </Button>
              </div>
            </div>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-2">
            {isLoading ? (
              <div className="space-y-2 p-2">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                <Inbox className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <h4 className="font-semibold">No notifications yet</h4>
                <p className="text-sm text-slate-500">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notification => (
                  <div 
                    key={notification.id}
                    onClick={() => handleMarkAsRead(notification.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                      notification.status === 'read' 
                        ? 'bg-white border-slate-200' 
                        : 'bg-blue-50 border-blue-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`text-sm font-medium truncate ${
                            notification.status === 'read' ? 'text-slate-700' : 'text-slate-900'
                          }`}>
                            {notification.title || 'Notification'}
                          </h4>
                          
                          {notification.status === 'unread' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        
                        <p className={`text-xs mt-1 line-clamp-2 ${
                          notification.status === 'read' ? 'text-slate-500' : 'text-slate-600'
                        }`}>
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-slate-400">
                            {new Date(notification.created_date).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                            })}
                          </p>
                          
                          <span className={`text-xs px-2 py-1 rounded-full border capitalize ${getTypeColor(notification.type)}`}>
                            {notification.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Permission Denied Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Enable Notifications in Browser
            </DialogTitle>
            <DialogDescription className="text-left space-y-4 pt-4">
              <p>Notifications are currently blocked in your browser. To enable them:</p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-blue-900">For Chrome/Edge:</h4>
                <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                  <li>Click the lock icon 🔒 in the address bar</li>
                  <li>Click "Site settings"</li>
                  <li>Find "Notifications" and set to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-purple-900">For Firefox:</h4>
                <ol className="text-sm text-purple-800 space-y-1 list-decimal list-inside">
                  <li>Click the lock icon 🔒 in the address bar</li>
                  <li>Click "Connection secure" → "More information"</li>
                  <li>Go to "Permissions" tab</li>
                  <li>Uncheck "Use Default" for Notifications</li>
                  <li>Select "Allow"</li>
                </ol>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <h4 className="font-semibold text-green-900">For Safari:</h4>
                <ol className="text-sm text-green-800 space-y-1 list-decimal list-inside">
                  <li>Go to Safari → Settings</li>
                  <li>Click "Websites" → "Notifications"</li>
                  <li>Find this site and set to "Allow"</li>
                </ol>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    setShowPermissionDialog(false);
                    toast.info('Please follow the instructions above to enable notifications.');
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Got it!
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}