import React, { createContext, useState, useEffect, useCallback } from 'react';
import { FeatureConfig } from '@/api/entities';

export const FeatureConfigContext = createContext(null);

export function FeatureConfigProvider({ children }) {
  const [features, setFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFeatures = useCallback(async (signal) => {
    try {
      setIsLoading(true);
      
      if (signal?.aborted) {
        return;
      }

      // Fetch all feature configs from database
      const fetchedFeatures = await FeatureConfig.list().catch(() => []);
      
      if (signal?.aborted) {
        return;
      }

      setFeatures(fetchedFeatures);
      setError(null);
    } catch (err) {
      if (err.name !== 'AbortError' && !err.message?.includes('aborted') && !signal?.aborted) {
        console.error('Error loading feature configs:', err);
        setError(err);
      }
      
      if (!signal?.aborted) {
        setFeatures([]);
      }
    } finally {
      if (!signal?.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    loadFeatures(abortController.signal);
    
    return () => {
      abortController.abort();
    };
  }, [loadFeatures]);

  // Get feature by key
  const getFeatureByKey = useCallback((featureKey) => {
    return features.find(f => f.feature_key === featureKey);
  }, [features]);

  // Get all features for a specific tier (including inherited features)
  const getFeaturesByTier = useCallback((tier) => {
    // Return features matching this tier
    return features.filter(f => f.tier === tier);
  }, [features]);

  // Get visible features for a tier
  const getVisibleFeaturesByTier = useCallback((tier) => {
    return features.filter(f => f.tier === tier && f.visible_to_users);
  }, [features]);

  // Get all features visible to users
  const getVisibleFeatures = useCallback(() => {
    return features.filter(f => f.visible_to_users);
  }, [features]);

  // Get feature display name
  const getFeatureName = useCallback((featureKey) => {
    const feature = getFeatureByKey(featureKey);
    return feature ? feature.feature_name : featureKey;
  }, [getFeatureByKey]);

  // Get feature status for badge display
  const getFeatureStatus = useCallback((featureKey) => {
    const feature = getFeatureByKey(featureKey);
    if (!feature) return null;
    
    // Return badge info based on status
    if (feature.status === 'placeholder') {
      return { type: 'coming_soon', label: 'Coming Soon' };
    } else if (feature.status === 'partial') {
      return { type: 'partial', label: 'Partial' };
    }
    return null; // No badge for 'live' status
  }, [getFeatureByKey]);

  // Check if feature is visible
  const isFeatureVisible = useCallback((featureKey) => {
    const feature = getFeatureByKey(featureKey);
    return feature ? feature.visible_to_users : false;
  }, [getFeatureByKey]);

  // Check if feature belongs to EXACTLY this tier (NO inheritance)
  const isFeatureInTier = useCallback((featureKey, planTier) => {
    const feature = getFeatureByKey(featureKey);
    if (!feature) return false;
    
    // Normalize tier names to lowercase for comparison
    const featureTier = (feature.tier || '').toLowerCase();
    const targetTier = (planTier || '').toLowerCase();
    
    // EXACT MATCH ONLY - no inheritance
    // Features show ONLY in their designated tier
    return featureTier === targetTier;
  }, [getFeatureByKey]);

  // Check if feature should be shown for a specific plan (visibility + exact tier match)
  const shouldShowFeatureForPlan = useCallback((featureKey, planTier) => {
    return isFeatureVisible(featureKey) && isFeatureInTier(featureKey, planTier);
  }, [isFeatureVisible, isFeatureInTier]);

  const value = {
    features,
    isLoading,
    error,
    getFeatureByKey,
    getFeaturesByTier,
    getVisibleFeaturesByTier,
    getVisibleFeatures,
    getFeatureName,
    getFeatureStatus,
    isFeatureVisible,
    isFeatureInTier,
    shouldShowFeatureForPlan,
    refreshFeatures: () => {
      const controller = new AbortController();
      loadFeatures(controller.signal);
      return () => controller.abort();
    }
  };

  return (
    <FeatureConfigContext.Provider value={value}>
      {children}
    </FeatureConfigContext.Provider>
  );
}