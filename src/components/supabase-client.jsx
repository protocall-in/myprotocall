import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Note: Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://ltkabzdyzfvkwyevqicu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0a2FiemR5emZ2a3d5ZXZxaWN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDU3NTAsImV4cCI6MjA3NjcyMTc1MH0.aSvWY8905K3-i2-v0fiCYtaUStPApmsXpe3p4IRf-0k';

// Create Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Real-time subscription helpers
export const subscribeToTable = (tableName, callback, filter = null) => {
  const channel = supabase
    .channel(`${tableName}-changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: tableName,
        ...(filter && { filter })
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Subscribe to specific record updates
export const subscribeToRecord = (tableName, recordId, callback) => {
  return subscribeToTable(
    tableName,
    callback,
    `id=eq.${recordId}`
  );
};

// Subscribe to user-specific records
export const subscribeToUserRecords = (tableName, userId, callback) => {
  return subscribeToTable(
    tableName,
    callback,
    `user_id=eq.${userId}`
  );
};

// Presence tracking for real-time collaboration
export const createPresenceChannel = (channelName, userId, metadata = {}) => {
  const channel = supabase.channel(channelName, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  channel
    .on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      console.log('Presence sync:', presenceState);
    })
    .on('presence', { event: 'join' }, ({ newPresences }) => {
      console.log('User joined:', newPresences);
    })
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      console.log('User left:', leftPresences);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          online_at: new Date().toISOString(),
          ...metadata
        });
      }
    });

  return channel;
};

// Broadcast messages (like Socket.io emit)
export const createBroadcastChannel = (channelName) => {
  const channel = supabase.channel(channelName);

  const broadcast = (event, payload) => {
    channel.send({
      type: 'broadcast',
      event,
      payload
    });
  };

  const subscribe = (event, callback) => {
    channel.on('broadcast', { event }, callback).subscribe();
  };

  return {
    broadcast,
    subscribe,
    channel
  };
};

export default supabase;