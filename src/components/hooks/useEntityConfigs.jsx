import { useContext, useCallback } from 'react';
import { EntityConfigContext } from '../context/EntityConfigProvider';

export function useEntityConfigs() {
  const context = useContext(EntityConfigContext);
  if (context === undefined) {
    throw new Error('useEntityConfigs must be used within an EntityConfigProvider');
  }

  const { configs, isLoading, error, refresh } = context;

  const getEnabledConfigs = useCallback(() => {
    try {
      return Array.isArray(configs) ? configs.filter(c => c && c.enabled) : [];
    } catch (error) {
      console.error('Error filtering enabled configs:', error);
      return [];
    }
  }, [configs]);

  const getUserVisibleConfigs = useCallback(() => {
    try {
      return Array.isArray(configs) ? configs.filter(c => c && c.enabled && c.user_visible) : [];
    } catch (error) {
      console.error('Error filtering user visible configs:', error);
      return [];
    }
  }, [configs]);

  const getAdminVisibleConfigs = useCallback(() => {
    try {
      return Array.isArray(configs) ? configs.filter(c => c && c.enabled && c.admin_visible) : [];
    } catch (error) {
      console.error('Error filtering admin visible configs:', error);
      return [];
    }
  }, [configs]);

  const getConfigByEntityName = useCallback((entityName) => {
    try {
      return Array.isArray(configs) ? configs.find(c => c && c.entity_name === entityName) : undefined;
    } catch (error) {
      console.error('Error finding config by entity name:', error);
      return undefined;
    }
  }, [configs]);

  return {
    configs: Array.isArray(configs) ? configs : [],
    isLoading,
    error,
    refresh,
    getEnabledConfigs,
    getUserVisibleConfigs,
    getAdminVisibleConfigs,
    getConfigByEntityName,
  };
}