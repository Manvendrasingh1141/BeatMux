import { wsClient } from '../../../realtime/websocket.client';
import { useTimelineStore } from '../../timeline/store/timeline.store';

// Helper to generate a unique mutation ID
export const generateMutationId = () => {
  if (window.PerfMonitor) window.PerfMonitor.incMutation();
  return `mut_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const sendClipCreate = (payload) => {
  const clientMutationId = generateMutationId();
  wsClient.send('TIMELINE_CLIP_CREATE', { ...payload, clientMutationId });
  return clientMutationId;
};

export const sendClipUpdate = (clipId, changes) => {
  const clientMutationId = generateMutationId();
  wsClient.send('TIMELINE_CLIP_UPDATE', { clipId, changes, clientMutationId });
  return clientMutationId;
};

export const sendClipDelete = (clipId) => {
  const clientMutationId = generateMutationId();
  wsClient.send('TIMELINE_CLIP_DELETE', { clipId, clientMutationId });
  return clientMutationId;
};

export const sendTrackCreate = (payload) => {
  const clientMutationId = generateMutationId();
  wsClient.send('TIMELINE_TRACK_CREATE', { ...payload, clientMutationId });
  return clientMutationId;
};

export const sendTrackDelete = (trackId) => {
  const clientMutationId = generateMutationId();
  wsClient.send('TIMELINE_TRACK_DELETE', { trackId, clientMutationId });
  return clientMutationId;
};

// Queue to hold optimistic mutations waiting for ACK
export const pendingMutations = new Map();

// Hook up listener to WS client
export const setupTimelineSyncListeners = () => {
  // ACKs
  wsClient.subscribe('TIMELINE_MUTATION_ACK', (payload) => {
    pendingMutations.delete(payload.clientMutationId);
    useTimelineStore.getState().setVersion(payload.serverVersion);
  });

  wsClient.subscribe('TIMELINE_MUTATION_REJECTED', (payload) => {
    console.error("Mutation rejected:", payload.reason);
    // Ideally rollback state using previous state stored in pendingMutations
    pendingMutations.delete(payload.clientMutationId);
    
    // Quick fallback: Request full sync
    wsClient.send('TIMELINE_SYNC_REQUEST', { lastKnownVersion: 0 }); // forces reload
  });

  // Remote events
  wsClient.subscribe('TIMELINE_CLIP_CREATED', (payload) => {
    useTimelineStore.getState().addClipRemote(payload.clip, payload.serverVersion);
  });

  wsClient.subscribe('TIMELINE_CLIP_UPDATED', (payload) => {
    const { clipId, ...changes } = payload.clip; 
    // payload.clip is actually the full updated clip document from the server
    useTimelineStore.getState().updateClipRemote(payload.clip._id, payload.clip, payload.serverVersion);
  });

  wsClient.subscribe('TIMELINE_CLIP_DELETED', (payload) => {
    useTimelineStore.getState().removeClipRemote(payload.clipId, payload.serverVersion);
  });

  wsClient.subscribe('TIMELINE_TRACK_CREATED', (payload) => {
    useTimelineStore.getState().addTrackRemote(payload.track, payload.serverVersion);
  });

  wsClient.subscribe('TIMELINE_TRACK_DELETED', (payload) => {
    useTimelineStore.getState().removeTrackRemote(payload.trackId, payload.serverVersion);
  });

  // Sync logic
  wsClient.subscribe('TIMELINE_SYNC_REQUIRED', async () => {
    import('../../../realtime/websocket.store.js').then(({ useWebSocketStore }) => {
      useWebSocketStore.getState().setSyncState('SYNCING');
    });
    
    // Need to refetch timeline via HTTP
    const roomId = useTimelineStore.getState().roomId;
    if (roomId) {
      await useTimelineStore.getState().fetchTimeline(roomId);
      
      import('../../../realtime/websocket.store.js').then(({ useWebSocketStore }) => {
        useWebSocketStore.getState().setSyncState('SYNCED');
      });
    }
  });

  wsClient.subscribe('TIMELINE_SYNC_OK', () => {
    import('../../../realtime/websocket.store.js').then(({ useWebSocketStore }) => {
      useWebSocketStore.getState().setSyncState('SYNCED');
    });
  });
};
