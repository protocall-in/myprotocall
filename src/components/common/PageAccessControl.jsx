import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, Lock, Sparkles, Crown, ArrowRight } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

export default function PageAccessControl({ pageConfig, user, isSubscribed, reason }) {
  // Determine the type of access issue
  const getAccessType = () => {
    if (!pageConfig) return 'not_found';
    if (pageConfig.status === 'placeholder') return 'coming_soon';
    if (pageConfig.status === 'partial') return 'under_construction';
    if (pageConfig.status === 'disabled') return 'disabled';
    if (reason === 'not_subscribed') return 'subscription_required';
    if (reason === 'not_authenticated') return 'login_required';
    if (reason === 'insufficient_role') return 'admin_only';
    return 'access_denied';
  };

  const accessType = getAccessType();

  const configs = {
    coming_soon: {
      icon: Clock,
      iconColor: 'text-purple-600',
      bgColor: 'from-purple-50 to-blue-50',
      title: 'Coming Soon',
      subtitle: pageConfig?.feature_name || 'This Feature',
      description: pageConfig?.description || 'This page is currently under development and will be available soon.',
      badge: { text: 'In Development', color: 'bg-purple-100 text-purple-800' }
    },
    under_construction: {
      icon: Sparkles,
      iconColor: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-orange-50',
      title: 'Under Construction',
      subtitle: pageConfig?.feature_name || 'This Feature',
      description: 'This page is partially implemented. Some features may not work as expected.',
      badge: { text: 'Partial', color: 'bg-yellow-100 text-yellow-800' }
    },
    disabled: {
      icon: Lock,
      iconColor: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      title: 'Page Unavailable',
      subtitle: pageConfig?.feature_name || 'This Page',
      description: 'This page is currently unavailable. Please check back later.',
      badge: { text: 'Disabled', color: 'bg-red-100 text-red-800' }
    },
    subscription_required: {
      icon: Crown,
      iconColor: 'text-yellow-600',
      bgColor: 'from-yellow-50 to-orange-50',
      title: 'Premium Feature',
      subtitle: pageConfig?.feature_name || 'This Feature',
      description: `This page requires a ${pageConfig?.tier || 'premium'} subscription to access.`,
      badge: { text: `${(pageConfig?.tier || 'premium').toUpperCase()} Required`, color: 'bg-yellow-100 text-yellow-800' },
      action: { text: 'Upgrade Now', url: '/Subscription', icon: Crown }
    },
    login_required: {
      icon: Lock,
      iconColor: 'text-blue-600',
      bgColor: 'from-blue-50 to-purple-50',
      title: 'Login Required',
      subtitle: 'Authentication Needed',
      description: 'You need to be logged in to access this page.',
      action: { text: 'Login', url: '/Dashboard', icon: ArrowRight }
    },
    admin_only: {
      icon: Lock,
      iconColor: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      title: 'Access Denied',
      subtitle: 'Administrator Access Only',
      description: 'This page is restricted to administrators only.',
      badge: { text: 'Admin Only', color: 'bg-red-100 text-red-800' }
    },
    not_found: {
      icon: AlertCircle,
      iconColor: 'text-gray-600',
      bgColor: 'from-gray-50 to-slate-50',
      title: 'Page Not Found',
      subtitle: 'Unknown Page',
      description: 'The page you are looking for could not be found.',
      action: { text: 'Go to Dashboard', url: '/Dashboard', icon: ArrowRight }
    },
    access_denied: {
      icon: Lock,
      iconColor: 'text-red-600',
      bgColor: 'from-red-50 to-pink-50',
      title: 'Access Denied',
      subtitle: 'Insufficient Permissions',
      description: 'You do not have permission to access this page.',
      action: { text: 'Go Back', url: '/Dashboard', icon: ArrowRight }
    }
  };

  const config = configs[accessType] || configs.access_denied;
  const Icon = config.icon;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center p-6`}>
      <Card className="max-w-2xl w-full border-0 shadow-2xl">
        <CardContent className="p-12 text-center">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-white shadow-lg mb-6">
              <Icon className={`w-12 h-12 ${config.iconColor}`} />
            </div>
            
            {config.badge && (
              <Badge className={`${config.badge.color} border-0 mb-4`}>
                {config.badge.text}
              </Badge>
            )}
            
            <h1 className="text-4xl font-bold text-slate-900 mb-2">{config.title}</h1>
            <h2 className="text-2xl font-semibold text-slate-600 mb-4">{config.subtitle}</h2>
            <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">{config.description}</p>
            
            {pageConfig?.release_quarter && (
              <p className="text-sm text-slate-500 mb-6">
                Expected Release: <span className="font-semibold">{pageConfig.release_quarter}</span>
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {config.action && (
              <Link to={createPageUrl(config.action.url.replace('/', ''))}>
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  {config.action.icon && <config.action.icon className="w-5 h-5 mr-2" />}
                  {config.action.text}
                </Button>
              </Link>
            )}
            
            <Link to={createPageUrl('Dashboard')}>
              <Button size="lg" variant="outline">
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Additional Info for Coming Soon */}
          {accessType === 'coming_soon' && pageConfig?.developer_notes && (
            <div className="mt-8 p-4 bg-white rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600">
                <span className="font-semibold">Development Note: </span>
                {pageConfig.developer_notes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}