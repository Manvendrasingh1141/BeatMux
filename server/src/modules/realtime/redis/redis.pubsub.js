import { pubClient, subClient, SERVER_ID } from './redis.client.js';
import crypto from 'crypto';
import { roomConnectionManager } from '../room.connection.manager.js';

const processedEvents = new Set();
const MAX_PROCESSED = 5000;
const subscribedRooms = new Set();

export const publishRoomEvent = async (roomId, type, payload) => {
  if (!pubClient.isReady) return;

  const eventId = crypto.randomUUID();
  const message = JSON.stringify({
    eventId,
    roomId,
    originServerId: SERVER_ID,
    type,
    payload,
    timestamp: Date.now()
  });

  // Track locally so we don't process it if it loops back
  processedEvents.add(eventId);
  if (processedEvents.size > MAX_PROCESSED) {
    const first = processedEvents.values().next().value;
    processedEvents.delete(first);
  }

  try {
    await pubClient.publish(`realtime:room:${roomId}`, message);
  } catch (err) {
    console.error('[Redis] Publish Error:', err);
  }
};

export const subscribeToRoom = async (roomId) => {
  if (!subClient.isReady) return;
  if (subscribedRooms.has(roomId)) return; // Already subscribed locally
  
  const channel = `realtime:room:${roomId}`;
  
  try {
    await subClient.subscribe(channel, (message) => {
      try {
        const parsed = JSON.parse(message);
        
        // Skip own events or duplicates
        if (parsed.originServerId === SERVER_ID) return;
        if (processedEvents.has(parsed.eventId)) return;
        
        processedEvents.add(parsed.eventId);
        if (processedEvents.size > MAX_PROCESSED) {
           const first = processedEvents.values().next().value;
           processedEvents.delete(first);
        }

        // Broadcast to local room members
        roomConnectionManager.broadcastToRoom(parsed.roomId, {
          type: parsed.type,
          timestamp: parsed.timestamp,
          payload: parsed.payload
        });
      } catch (err) {
        console.error('[Redis] Message parse error:', err);
      }
    });
    subscribedRooms.add(roomId);
  } catch(err) {
    console.error('[Redis] Subscribe error:', err);
  }
};

export const unsubscribeFromRoom = async (roomId) => {
  if (!subClient.isReady) return;
  
  // Only unsubscribe if no local sockets are left in the room
  const localSockets = roomConnectionManager.getRoomSockets(roomId);
  if (localSockets.size === 0) {
    try {
      await subClient.unsubscribe(`realtime:room:${roomId}`);
      subscribedRooms.delete(roomId);
    } catch(err) {
      console.error('[Redis] Unsubscribe error:', err);
    }
  }
};
