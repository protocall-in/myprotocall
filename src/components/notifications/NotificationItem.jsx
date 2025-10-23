
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  TrendingUp, 
  UserCheck, 
  Mail,
  BookUser,
  Star,
  DollarSign,
  Users,
  TrendingDown
} from 'lucide-react';
import { format } from 'date-fns';

const getNotificationIcon = (category) => {
  switch (category) {
    case 'security':
      return AlertTriangle;
    case 'admin_pick':
      return Star;
    case 'pledge_update':
      return TrendingUp;
    case 'poll_result':
      return CheckCircle;
    case 'event_reminder':
      return Info;
    case 'new_message':
      return Mail;
    case 'achievement':
      return UserCheck;
    case 'advisor_post':
      return BookUser;
    case 'price_alert':
      return TrendingUp;
    case 'profit_alert':
      return DollarSign;
    case 'loss_alert':
      return TrendingDown;
    case 'consensus_alert':
      return Users;
    default:
      return Info;
  }
};

const getNotificationColor = (category, priority) => {
  if (priority === 'critical') return 'text-red-600 bg-red-50';
  if (priority === 'important') return 'text-blue-600 bg-blue-50';
  
  switch (category) {
    case 'security':
      return 'text-red-600 bg-red-50';
    case 'admin_pick':
      return 'text-purple-600 bg-purple-50';
    case 'advisor_post':
      return 'text-green-600 bg-green-50';
    case 'price_alert':
      return 'text-blue-600 bg-blue-50';
    case 'profit_alert':
      return 'text-green-600 bg-green-50';
    case 'loss_alert':
      return 'text-red-600 bg-red-50';
    case 'consensus_alert':
      return 'text-purple-600 bg-purple-50';
    default:
      return 'text-slate-600 bg-slate-50';
  }
};

export default function NotificationItem({ notification, onMarkAsRead }) {
  const Icon = getNotificationIcon(notification.category);
  const colorClass = getNotificationColor(notification.category, notification.priority);

  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    
    // Navigate if there's a link
    if (notification.link_url) {
      window.location.href = notification.link_url;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
        notification.is_read 
          ? 'bg-white border-slate-200' 
          : 'bg-blue-50 border-blue-200 shadow-sm'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className={`text-sm font-medium truncate ${
              notification.is_read ? 'text-slate-700' : 'text-slate-900'
            }`}>
              {notification.title}
            </h4>
            
            {!notification.is_read && (
              <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
            )}
          </div>
          
          <p className={`text-xs mt-1 line-clamp-2 ${
            notification.is_read ? 'text-slate-500' : 'text-slate-600'
          }`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-slate-400">
              {format(new Date(notification.created_date), 'MMM d, h:mm a')}
            </p>
            
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${
                notification.priority === 'critical' ? 'border-red-200 text-red-700' :
                notification.priority === 'important' ? 'border-blue-200 text-blue-700' :
                'border-slate-200 text-slate-600'
              }`}
            >
              {notification.category.replace('_', ' ')}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
