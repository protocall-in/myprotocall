import React, { createContext, useState, useEffect } from 'react';
import { EntityConfig, User } from '@/api/entities';

export const EntityConfigContext = createContext(undefined);

export function EntityConfigProvider({ children }) {
  const [configs, setConfigs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadConfigs = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Check if user is admin before loading configs
        const user = await User.me().catch(() => null);
        
        if (!user || (user.app_role !== 'admin' && user.app_role !== 'super_admin')) {
          // Non-admin users don't need entity configs
          if (isMounted) {
            setConfigs([]);
            setIsLoading(false);
          }
          return;
        }

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const fetchedConfigs = await EntityConfig.list().catch(() => []);
        
        if (isMounted) {
          setConfigs(Array.isArray(fetchedConfigs) ? fetchedConfigs : []);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load entity configurations:', err);
          setError(err);
          setConfigs([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadConfigs();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = {
    configs,
    isLoading,
    error,
    refresh: () => {}, // No-op for now
  };

  return (
    <EntityConfigContext.Provider value={value}>
      {children}
    </EntityConfigContext.Provider>
  );
}