import { base44 } from '@/api/base44Client';

/**
 * Enhanced base44 client with additional utility methods
 */

// Batch operations
export const batchOperations = {
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

// Safe API calls with retry logic
export const safeApiCall = async (apiCall, retries = 3, delay = 1000) => {
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

// Query builder helper
export const createQueryBuilder = (entityName) => ({
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

export default {
  base44,
  batch: batchOperations,
  safeCall: safeApiCall,
  query: createQueryBuilder
};