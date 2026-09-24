import { pubClient, SERVER_ID } from './redis.client.js';
import { publishRoomEvent } from './redis.pubsub.js';
import { WS_EVENTS } from '../websocket.protocol.js';

export const incrementUserPresence = async (roomCode, user) => {
  if (!pubClient.isReady) return;
  const presenceKey = `realtime:presence:${roomCode}`;
  
  try {
    const userIdStr = user._id.toString();
    const count = await pubClient.hIncrBy(presenceKey, userIdStr, 1);
    
    // If count was 0 -> 1, they are newly joining this room globally
    if (count === 1) {
      const presencePayload = {
        user: {
          id: userIdStr,
          username: user.username,
          avatar: user.avatar,
          status: 'online'
        }
      };
      
      // Store user details for late joiners (store JSON string)
      await pubClient.hSet(`${presenceKey}:details`, userIdStr, JSON.stringify(presencePayload.user));
      
      await publishRoomEvent(roomCode, WS_EVENTS.USER_JOINED, presencePayload);
    }
    
    // Set a room TTL just to clean up dangling rooms if server crashes
    await pubClient.expire(presenceKey, 86400); // 24 hours
    await pubClient.expire(`${presenceKey}:details`, 86400);
  } catch(err) {
    console.error('[Redis Presence] increment error:', err);
  }
};

export const decrementUserPresence = async (roomCode, userId) => {
  if (!pubClient.isReady) return;
  const presenceKey = `realtime:presence:${roomCode}`;
  
  try {
    const count = await pubClient.hIncrBy(presenceKey, userId, -1);
    
    if (count <= 0) {
      await pubClient.hDel(presenceKey, userId);
      await pubClient.hDel(`${presenceKey}:details`, userId);
      
      await publishRoomEvent(roomCode, WS_EVENTS.USER_LEFT, { userId });
    }
  } catch(err) {
    console.error('[Redis Presence] decrement error:', err);
  }
};

export const getRoomPresence = async (roomCode) => {
  if (!pubClient.isReady) return [];
  const presenceKey = `realtime:presence:${roomCode}`;
  
  try {
    const usersMap = await pubClient.hGetAll(`${presenceKey}:details`);
    return Object.values(usersMap).map(u => JSON.parse(u));
  } catch(err) {
    console.error('[Redis Presence] get error:', err);
    return [];
  }
};
