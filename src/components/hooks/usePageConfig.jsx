import { useContext, useCallback } from 'react';
import { FeatureConfigContext } from '../context/FeatureConfigProvider';

export function usePageConfig() {
  const context = useContext(FeatureConfigContext);
  
  if (!context) {
    throw new Error('usePageConfig must be used within a FeatureConfigProvider');
  }

  const { features, isLoading } = context;

  // Get page config by route path
  const getPageByRoute = useCallback((routePath) => {
    if (!features || !Array.isArray(features)) return null;
    return features.find(f => 
      f.module_type === 'page' && 
      f.route_path === routePath
    );
  }, [features]);

  // Get page config by key
  const getPageByKey = useCallback((featureKey) => {
    if (!features || !Array.isArray(features)) return null;
    return features.find(f => 
      f.module_type === 'page' && 
      f.feature_key === featureKey
    );
  }, [features]);

  // Check if page is accessible to current user
  const canAccessPage = useCallback((pageConfig, user, isSubscribed) => {
    if (!pageConfig) return false;

    // Check visibility rule
    switch (pageConfig.visibility_rule) {
      case 'public':
        return true;
      case 'authenticated':
        return !!user;
      case 'subscribed_user':
        return !!user && isSubscribed;
      case 'admin_only':
        return user && ['admin', 'super_admin'].includes(user.app_role);
      case 'super_admin_only':
        return user && user.app_role === 'super_admin';
      default:
        return !!user;
    }
  }, []);

  // Get all visible pages for navigation
  const getVisiblePages = useCallback((user, isSubscribed) => {
    if (!features || !Array.isArray(features)) return [];
    
    return features
      .filter(f => 
        f.module_type === 'page' && 
        f.visible_to_users === true &&
        f.status !== 'disabled' &&
        canAccessPage(f, user, isSubscribed)
      )
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [features, canAccessPage]);

  return {
    getPageByRoute,
    getPageByKey,
    canAccessPage,
    getVisiblePages,
    isLoading
  };
}