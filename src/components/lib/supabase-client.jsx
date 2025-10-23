import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://qtrypzzcjebvfcihiynt.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-anon-key-here';

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