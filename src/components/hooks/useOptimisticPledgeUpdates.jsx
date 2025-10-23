import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Custom hook for optimistic UI updates with rollback on error
 * Provides real-time feel without WebSockets
 */
export function useOptimisticPledgeUpdates(initialData, entityType = 'pledge') {
  const [data, setData] = useState(initialData);
  const rollbackRef = useRef(null);

  // ✅ Optimistic update - changes UI immediately
  const optimisticUpdate = useCallback((id, updates, successMessage = null) => {
    // Store current state for rollback
    rollbackRef.current = data;

    // Update UI immediately
    setData(prev => {
      if (Array.isArray(prev)) {
        return prev.map(item => 
          item.id === id ? { ...item, ...updates } : item
        );
      } else {
        return prev.id === id ? { ...prev, ...updates } : prev;
      }
    });

    if (successMessage) {
      toast.success(successMessage);
    }

    console.log(`⚡ Optimistic update applied for ${entityType} ${id}`);
  }, [data, entityType]);

  // ✅ Rollback on error
  const rollback = useCallback((errorMessage = 'Operation failed') => {
    if (rollbackRef.current) {
      setData(rollbackRef.current);
      rollbackRef.current = null;
      toast.error(errorMessage);
      console.log(`↩️ Rolled back ${entityType} update`);
    }
  }, [entityType]);

  // ✅ Confirm update with fresh data from server
  const confirmUpdate = useCallback((freshData) => {
    setData(freshData);
    rollbackRef.current = null;
    console.log(`✅ Confirmed ${entityType} update with server data`);
  }, [entityType]);

  // ✅ Add new item optimistically
  const optimisticAdd = useCallback((newItem, successMessage = null) => {
    rollbackRef.current = data;

    setData(prev => {
      if (Array.isArray(prev)) {
        return [newItem, ...prev];
      }
      return prev;
    });

    if (successMessage) {
      toast.success(successMessage);
    }

    console.log(`⚡ Optimistically added ${entityType}`);
  }, [data, entityType]);

  // ✅ Remove item optimistically
  const optimisticRemove = useCallback((id, successMessage = null) => {
    rollbackRef.current = data;

    setData(prev => {
      if (Array.isArray(prev)) {
        return prev.filter(item => item.id !== id);
      }
      return prev;
    });

    if (successMessage) {
      toast.success(successMessage);
    }

    console.log(`⚡ Optimistically removed ${entityType} ${id}`);
  }, [data, entityType]);

  return {
    data,
    setData,
    optimisticUpdate,
    optimisticAdd,
    optimisticRemove,
    rollback,
    confirmUpdate
  };
}