import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, FileText, Star, BookOpen, User } from 'lucide-react';

const getStatusConfig = (status) => {
  const configs = {
    pending: { 
      color: 'bg-yellow-100 text-yellow-800', 
      label: 'Pending' 
    },
    pending_approval: { 
      color: 'bg-yellow-100 text-yellow-800', 
      label: 'Pending' 
    },
    approved: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Active' 
    },
    active: { 
      color: 'bg-green-100 text-green-800', 
      label: 'Active' 
    },
    rejected: { 
      color: 'bg-red-100 text-red-800', 
      label: 'Rejected' 
    },
    suspended: { 
      color: 'bg-gray-100 text-gray-800', 
      label: 'Suspended' 
    },
    inactive: { 
      color: 'bg-gray-100 text-gray-800', 
      label: 'Inactive' 
    }
  };
  return configs[status] || { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
};

const getActionIcon = (actionType) => {
  const icons = {
    'Documents': FileText,
    'Portfolio': Star,
    'Courses': BookOpen,
    'Profile': User,
    'View': Eye
  };
  return icons[actionType] || Eye;
};

export default function EntityCard({ 
  entity, 
  entityType,
  onView, 
  onAction,
  actionButtonLabel = 'View',
  statusField = 'status',
  showQuickActions = true
}) {
  const statusConfig = getStatusConfig(entity[statusField]);
  const ActionIcon = getActionIcon(actionButtonLabel);
  
  // Get profile image with fallbacks
  const getProfileImage = () => {
    if (entity.profile_image_url) return entity.profile_image_url;
    if (entity.user?.profile_image_url) return entity.user.profile_image_url;
    
    const email = entity.user?.email || entity.email || entity.display_name;
    return `https://avatar.vercel.sh/${email}.png`;
  };

  // Get display name with fallbacks
  const getDisplayName = () => {
    return entity.display_name || 
           entity.user?.display_name || 
           entity.name || 
           `${entityType} ${entity.id?.slice(-6) || 'Unknown'}`;
  };

  // Get email with fallbacks  
  const getEmail = () => {
    return entity.user?.email || entity.email || 'No email available';
  };

  // Get role/type display
  const getRoleDisplay = () => {
    if (entity.type) return entity.type;
    if (entityType) return entityType;
    return entity.user?.app_role || 'User';
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md overflow-hidden">
      <CardContent className="p-0">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={getProfileImage()}
                alt={getDisplayName()}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-sm"
              />
              <div>
                <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {getDisplayName()}
                </h3>
                <p className="text-sm text-slate-600">{getEmail()}</p>
              </div>
            </div>
            <Badge className={`${statusConfig.color} border-0`}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {getRoleDisplay()}
              </Badge>
              {entity.verified && (
                <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                  Verified
                </Badge>
              )}
              {entity.sebi_registered && (
                <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                  SEBI
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {entity.follower_count !== undefined && `${entity.follower_count} followers`}
                {entity.success_rate !== undefined && `${entity.success_rate}% success`}
              </p>
            </div>
          </div>

          {/* Bio/Description */}
          {entity.bio && (
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">
              {entity.bio}
            </p>
          )}

          {/* Specializations/Tags */}
          {entity.specialization && entity.specialization.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-1">
                {entity.specialization.slice(0, 3).map((spec, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {entity.specialization.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{entity.specialization.length - 3}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {showQuickActions && (
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView?.(entity)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-1" />
                Review
              </Button>
              
              {onAction && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAction?.(entity)}
                  className="flex-1"
                >
                  <ActionIcon className="w-4 h-4 mr-1" />
                  {actionButtonLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}