import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * Custom SDK wrapper that adds real-time capabilities and enhanced features
 * to the base44 SDK
 * 
 * NOTE: Supabase integration is prepared but requires @supabase/supabase-js package
 * For now, this provides optimistic updates without real-time sync
 */

class CustomSDK {
  constructor() {
    this.base44 = base44;
    this.subscriptions = new Map();
  }

  // ✅ Enhanced entity operations with optimistic updates
  entities = {
    // Wrap base44 entity methods
    get: (entityName) => ({
      ...base44.entities[entityName],

      // Create with optimistic update
      createOptimistic: async (data, optimisticCallback = null) => {
        const tempId = `temp-${Date.now()}`;
        
        if (optimisticCallback) {
          optimisticCallback({ ...data, id: tempId, _optimistic: true });
        }

        try {
          const result = await base44.entities[entityName].create(data);
          return result;
        } catch (error) {
          console.error(`Error creating ${entityName}:`, error);
          if (optimisticCallback) {
            optimisticCallback({ id: tempId, _rollback: true });
          }
          throw error;
        }
      },

      // Update with optimistic update
      updateOptimistic: async (id, updates, optimisticCallback = null) => {
        if (optimisticCallback) {
          optimisticCallback({ id, ...updates, _optimistic: true });
        }

        try {
          const result = await base44.entities[entityName].update(id, updates);
          return result;
        } catch (error) {
          console.error(`Error updating ${entityName}:`, error);
          if (optimisticCallback) {
            optimisticCallback({ id, _rollback: true });
          }
          throw error;
        }
      },

      // Delete with optimistic update
      deleteOptimistic: async (id, optimisticCallback = null) => {
        if (optimisticCallback) {
          optimisticCallback({ id, _deleted: true, _optimistic: true });
        }

        try {
          const result = await base44.entities[entityName].delete(id);
          return result;
        } catch (error) {
          console.error(`Error deleting ${entityName}:`, error);
          if (optimisticCallback) {
            optimisticCallback({ id, _rollback: true });
          }
          throw error;
        }
      }
    })
  };

  // ✅ Batch operations
  batch = {
    create: async (entityName, records) => {
      return base44.entities[entityName].bulkCreate(records);
    },

    update: async (entityName, updates) => {
      return Promise.all(
        updates.map(({ id, data }) => base44.entities[entityName].update(id, data))
      );
    },

    delete: async (entityName, ids) => {
      return Promise.all(
        ids.map(id => base44.entities[entityName].delete(id))
      );
    }
  };

  // ✅ Safe API calls with retry logic
  safeCall = async (apiCall, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await apiCall();
      } catch (error) {
        if (i === retries - 1) throw error;
        
        if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
          await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
        } else {
          throw error;
        }
      }
    }
  };

  // ✅ Query builder helper
  query = (entityName) => ({
    filter: (conditions) => base44.entities[entityName].filter(conditions),
    list: (sortBy = '-created_date', limit = 100) => base44.entities[entityName].list(sortBy, limit),
    get: async (id) => {
      const items = await base44.entities[entityName].list();
      return items.find(item => item.id === id);
    },
    count: async (conditions = {}) => {
      const items = await base44.entities[entityName].filter(conditions);
      return items.length;
    }
  });

  // ✅ Cleanup all subscriptions
  cleanup = () => {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
    console.log('✅ All subscriptions cleaned up');
  };
}

// Export singleton instance
export const customSDK = new CustomSDK();
export default customSDK;