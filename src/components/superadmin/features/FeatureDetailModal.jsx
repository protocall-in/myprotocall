import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, ExternalLink, Calendar, Flag, Eye, EyeOff, FileText } from 'lucide-react';
import { FEATURE_REGISTRY } from '../../features/FeatureRegistry';

export default function FeatureDetailModal({ feature, onClose, onEdit }) {
  const IconComponent = FEATURE_REGISTRY[feature.feature_key]?.icon || null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'placeholder': return 'bg-purple-100 text-purple-800';
      case 'deprecated': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-4">
            {IconComponent && (
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-8 h-8 text-purple-600" />
              </div>
            )}
            <div className="flex-1">
              <DialogTitle className="text-2xl">{feature.feature_name}</DialogTitle>
              <DialogDescription className="mt-1">
                {feature.description || 'No description provided'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status & Visibility */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(feature.status)}>
              {feature.status === 'live' ? 'Live' :
               feature.status === 'partial' ? 'Partial' :
               feature.status === 'placeholder' ? 'Coming Soon' :
               'Deprecated'}
            </Badge>
            <Badge variant="outline" className="bg-slate-100">
              {feature.tier === 'basic' ? 'Basic' :
               feature.tier === 'premium' ? 'Premium' :
               'VIP Elite'}
            </Badge>
            {feature.visible_to_users ? (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                <Eye className="w-3 h-3 mr-1" />
                Visible to Users
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-gray-50 text-gray-700">
                <EyeOff className="w-3 h-3 mr-1" />
                Hidden from Users
              </Badge>
            )}
          </div>

          {/* Release Info */}
          {(feature.release_quarter || feature.release_date) && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Calendar className="w-4 h-4" />
              <span>Release: {feature.release_quarter || feature.release_date}</span>
            </div>
          )}

          {/* Priority */}
          {feature.priority > 0 && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Flag className="w-4 h-4" />
              <span>Priority: {feature.priority}</span>
            </div>
          )}

          {/* URLs */}
          {feature.page_url && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <ExternalLink className="w-4 h-4" />
              <span>Page URL: </span>
              <code className="px-2 py-1 bg-slate-100 rounded text-xs">{feature.page_url}</code>
            </div>
          )}

          {feature.documentation_url && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <FileText className="w-4 h-4" />
              <a href={feature.documentation_url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                View Documentation
              </a>
            </div>
          )}

          {/* Developer Notes */}
          {feature.developer_notes && (
            <div className="p-4 bg-slate-50 rounded-lg">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">Developer Notes</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{feature.developer_notes}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onEdit}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Feature
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}