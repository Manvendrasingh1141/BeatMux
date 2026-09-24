import { WebSocketServer } from 'ws';
import { WS_EVENTS, WS_ERRORS } from './websocket.protocol.js';
import { connectionManager } from './connection.manager.js';
import { roomConnectionManager } from './room.connection.manager.js';
import { authenticateWebSocket } from './websocket.auth.js';
import { getRoomByCode } from '../rooms/room.service.js';
import { validateWsPayload } from '../../validation/validate.js';
import { timelineSchemas, transportSchemas } from '../../validation/schemas.js';

const MAX_MESSAGE_SIZE = 64 * 1024; // 64KB max payload size
const RATE_LIMIT_WINDOW_MS = 1000;
const MAX_MESSAGES_PER_WINDOW = 50;

const sendError = (socket, code, message, requestId = null) => {
  if (socket.readyState !== 1) return;
  socket.send(JSON.stringify({
    type: WS_EVENTS.ERROR,
    requestId,
    timestamp: Date.now(),
    payload: { code, message }
  }));
};

export const initWebSocketServer = (server) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // Heartbeat ping interval
  const pingInterval = setInterval(() => {
    wss.clients.forEach((socket) => {
      const data = connectionManager.getConnectionData(socket);
      if (!data) return;

      // If no ping received for 30 seconds, terminate
      if (Date.now() - data.lastPing > 30000) {
        return socket.terminate();
      }

      socket.send(JSON.stringify({ type: WS_EVENTS.PING, timestamp: Date.now() }));
    });
  }, 10000);

  wss.on('close', () => {
    clearInterval(pingInterval);
  });

  wss.on('connection', (socket) => {
    connectionManager.registerConnection(socket);
    let messageCount = 0;
    let windowStart = Date.now();

    socket.on('message', async (rawData) => {
      // Basic size limit
      if (rawData.length > MAX_MESSAGE_SIZE) {
        sendError(socket, WS_ERRORS.MESSAGE_TOO_LARGE, 'Payload too large');
        return;
      }

      // Rate limiting
      const now = Date.now();
      if (now - windowStart > RATE_LIMIT_WINDOW_MS) {
        windowStart = now;
        messageCount = 0;
      }
      messageCount++;
      if (messageCount > MAX_MESSAGES_PER_WINDOW) {
        sendError(socket, WS_ERRORS.RATE_LIMIT_EXCEEDED, 'Too many messages');
        return;
      }

      if (rawData.length > 0) {
         // Rate Limiting: max 100 msgs / sec
         const now = Date.now();
         if (!socket._rateLimit) socket._rateLimit = { count: 0, resetAt: now + 1000 };
         if (now > socket._rateLimit.resetAt) {
           socket._rateLimit.count = 1;
           socket._rateLimit.resetAt = now + 1000;
         } else {
           socket._rateLimit.count++;
           if (socket._rateLimit.count > 100) {
              return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Rate limit exceeded');
           }
         }
      }

      const MAX_PAYLOAD_SIZE = 16 * 1024; // 16KB max per message
      if (rawData.length > MAX_PAYLOAD_SIZE) {
        socket.send(JSON.stringify({
          type: WS_EVENTS.ERROR,
          payload: { code: WS_ERRORS.INVALID_PAYLOAD, message: 'Payload too large' }
        }));
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(rawData.toString());
      } catch (err) {
        return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Invalid JSON');
      }

      const { type, payload, requestId, timestamp } = parsed;
      connectionManager.updatePing(socket); // Any message counts as heartbeat

      if (type === WS_EVENTS.PONG) {
        return; // Handled by updatePing
      }

      if (type === WS_EVENTS.PING) {
        return socket.send(JSON.stringify({
          type: WS_EVENTS.PONG,
          requestId,
          timestamp,
          serverTimestamp: Date.now()
        }));
      }

      const connectionData = connectionManager.getConnectionData(socket);

      // Handle AUTH
      if (type === WS_EVENTS.AUTH) {
        try {
          const user = await authenticateWebSocket(payload?.accessToken);
          connectionManager.authenticateConnection(socket, user);
          return socket.send(JSON.stringify({
            type: WS_EVENTS.AUTH_SUCCESS,
            requestId,
            timestamp: Date.now(),
            payload: { user }
          }));
        } catch (err) {
          return sendError(socket, WS_ERRORS.AUTH_FAILED, 'Authentication failed', requestId);
        }
      }

      // All subsequent messages require auth
      if (!connectionData?.userId) {
        return sendError(socket, WS_ERRORS.UNAUTHORIZED, 'Authentication required', requestId);
      }

      // Handle ROOM_JOIN
      if (type === WS_EVENTS.ROOM_JOIN) {
        const roomCode = payload?.roomCode;
        if (!roomCode) return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Missing roomCode', requestId);

        const room = await getRoomByCode(roomCode);
        if (!room) return sendError(socket, WS_ERRORS.ROOM_NOT_FOUND, 'Room not found', requestId);

        const isMember = room.members.some(m => m.userId._id.toString() === connectionData.userId);
        if (!isMember) return sendError(socket, WS_ERRORS.ROOM_ACCESS_DENIED, 'Not a member of this room', requestId);

        // Success: Join room
        connectionManager.setRoom(socket, roomCode);
        roomConnectionManager.joinRoom(roomCode, socket);

        import('./redis/redis.presence.js').then(async ({ incrementUserPresence, getRoomPresence }) => {
          await incrementUserPresence(roomCode, connectionData.user);
          const presence = await getRoomPresence(roomCode);
          
          let transportState = null;
          import('../transport/transport.manager.js').then(({ getRoomTransport, calculateCurrentPosition }) => {
            const t = getRoomTransport(roomCode);
            transportState = { ...t, position: calculateCurrentPosition(t) };
            socket.send(JSON.stringify({
              type: WS_EVENTS.ROOM_JOINED,
              requestId,
              timestamp: Date.now(),
              payload: { roomCode, user: connectionData.user, presence, transportState }
            }));
          });
        });
        return;
      }

      // Handle Timeline Sync events
      const isTimelineEvent = [
        WS_EVENTS.TIMELINE_CLIP_CREATE, WS_EVENTS.TIMELINE_CLIP_UPDATE, WS_EVENTS.TIMELINE_CLIP_DELETE,
        WS_EVENTS.TIMELINE_TRACK_CREATE, WS_EVENTS.TIMELINE_TRACK_UPDATE, WS_EVENTS.TIMELINE_TRACK_DELETE, WS_EVENTS.TIMELINE_TRACK_REORDER
      ].includes(type);

      if (isTimelineEvent) {
        if (!connectionData.roomCode) return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Not in a room', requestId);
        
        // Ensure user has edit permissions
        import('../rooms/room.service.js').then(async ({ getRoomByCode }) => {
          try {
            const room = await getRoomByCode(connectionData.roomCode);
            if (!room) return;
            const member = room.members.find(m => m.userId._id.toString() === connectionData.userId);
            if (!member || member.role === 'viewer') {
              return sendError(socket, WS_ERRORS.UNAUTHORIZED, 'No edit permission', requestId);
            }
            
            // Delegate to Timeline Service
            const { timelineService } = await import('../timeline/timeline.service.js');
            const { pubClient } = await import('./redis/redis.client.js');
            let result;
            let broadcastType;
            let broadcastPayload = {};
            
            try {
              if (payload.clientMutationId && pubClient && pubClient.isReady) {
                const idempKey = `realtime:idemp:${payload.clientMutationId}`;
                const exists = await pubClient.set(idempKey, "1", { NX: true, EX: 60 });
                if (!exists) {
                   return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Duplicate mutation', requestId);
                }
              }
              if (type === WS_EVENTS.TIMELINE_CLIP_CREATE) {
                const validationErrors = validateWsPayload(payload, timelineSchemas.createClip);
                if (validationErrors) {
                  return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Invalid clip data', requestId);
                }
                result = await timelineService.createClip(room._id, payload);
                broadcastType = WS_EVENTS.TIMELINE_CLIP_CREATED;
                broadcastPayload = { clip: result.clip, serverVersion: result.newVersion };
              } else if (type === WS_EVENTS.TIMELINE_CLIP_UPDATE) {
                result = await timelineService.updateClip(room._id, payload);
                broadcastType = WS_EVENTS.TIMELINE_CLIP_UPDATED;
                broadcastPayload = { clip: result.clip, serverVersion: result.newVersion };
              } else if (type === WS_EVENTS.TIMELINE_CLIP_DELETE) {
                result = await timelineService.deleteClip(room._id, payload);
                broadcastType = WS_EVENTS.TIMELINE_CLIP_DELETED;
                broadcastPayload = { clipId: result.clipId, serverVersion: result.newVersion };
              } else if (type === WS_EVENTS.TIMELINE_TRACK_CREATE) {
                result = await timelineService.createTrack(room._id, payload);
                broadcastType = WS_EVENTS.TIMELINE_TRACK_CREATED;
                broadcastPayload = { track: result.track, serverVersion: result.newVersion };
              } else if (type === WS_EVENTS.TIMELINE_TRACK_DELETE) {
                result = await timelineService.deleteTrack(room._id, payload);
                broadcastType = WS_EVENTS.TIMELINE_TRACK_DELETED;
                broadcastPayload = { trackId: result.trackId, serverVersion: result.newVersion };
              }
              // Add updates/reorder later as needed

              // Send ACK
              socket.send(JSON.stringify({
                type: WS_EVENTS.TIMELINE_MUTATION_ACK,
                requestId,
                timestamp: Date.now(),
                payload: { clientMutationId: payload.clientMutationId, serverVersion: result.newVersion }
              }));

              // Broadcast to ALL so sender's UI also gets the server-confirmed clip ID
              roomConnectionManager.broadcastToRoom(connectionData.roomCode, {
                type: broadcastType,
                timestamp: Date.now(),
                payload: broadcastPayload
              });
              
              import('./redis/redis.pubsub.js').then(({ publishRoomEvent }) => {
                publishRoomEvent(connectionData.roomCode, broadcastType, broadcastPayload);
              });
              
            } catch (err) {
              console.error('Timeline Mutation Failed', err);
              socket.send(JSON.stringify({
                type: WS_EVENTS.TIMELINE_MUTATION_REJECTED,
                requestId,
                timestamp: Date.now(),
                payload: { clientMutationId: payload.clientMutationId, reason: err.message }
              }));
            }
          } catch (e) {
            console.error(e);
          }
        });
        return;
      }
      
      if (type === WS_EVENTS.TIMELINE_SYNC_REQUEST) {
        if (!connectionData.roomCode) return;
        import('../rooms/room.service.js').then(async ({ getRoomByCode }) => {
          const room = await getRoomByCode(connectionData.roomCode);
          if (room) {
            if (payload.lastKnownVersion < room.timelineVersion) {
              socket.send(JSON.stringify({
                type: WS_EVENTS.TIMELINE_SYNC_REQUIRED,
                requestId,
                timestamp: Date.now()
              }));
            } else {
              socket.send(JSON.stringify({
                type: WS_EVENTS.TIMELINE_SYNC_OK,
                requestId,
                timestamp: Date.now()
              }));
            }
          }
        });
        return;
      }
      
      // Handle Transport Sync events
      const isTransportEvent = [
        WS_EVENTS.TRANSPORT_PLAY, WS_EVENTS.TRANSPORT_PAUSE, WS_EVENTS.TRANSPORT_STOP,
        WS_EVENTS.TRANSPORT_SEEK, WS_EVENTS.TRANSPORT_SET_BPM, WS_EVENTS.TRANSPORT_SET_TIME_SIGNATURE
      ].includes(type);

      if (isTransportEvent) {
        if (!connectionData.roomCode) return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Not in a room', requestId);
        
        import('../rooms/room.service.js').then(async ({ getRoomByCode }) => {
          try {
            const room = await getRoomByCode(connectionData.roomCode);
            if (!room) return;
            const member = room.members.find(m => m.userId._id.toString() === connectionData.userId);
            if (!member || member.role === 'viewer') {
              return sendError(socket, WS_ERRORS.UNAUTHORIZED, 'No transport permission', requestId);
            }
            
            import('../transport/transport.manager.js').then(async ({ 
              getRoomTransport, updateRoomTransport, calculateCurrentPosition 
            }) => {
              try {
                if (payload.clientCommandId) {
                  const { pubClient } = await import('./redis/redis.client.js');
                  if (pubClient && pubClient.isReady) {
                    const idempKey = `realtime:idemp:${payload.clientCommandId}`;
                    const exists = await pubClient.set(idempKey, "1", { NX: true, EX: 60 });
                    if (!exists) {
                       return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Duplicate command', requestId);
                    }
                  }
                }
                const transport = getRoomTransport(connectionData.roomCode);
                let updated;
                let broadcastPayload = {};
                
                if (type === WS_EVENTS.TRANSPORT_PLAY) {
                  const position = payload.position !== undefined ? payload.position : transport.position;
                  // Start a bit in the future so clients can sync perfectly.
                  const serverStartTime = Date.now() + 100;
                  updated = updateRoomTransport(connectionData.roomCode, { 
                    status: 'PLAYING', 
                    position, 
                    serverStartTime 
                  });
                  broadcastPayload = { position: updated.position, serverStartTime: updated.serverStartTime, revision: updated.revision };
                  
                } else if (type === WS_EVENTS.TRANSPORT_PAUSE) {
                  // Calculate exact pause position based on authoritative clock
                  const pausePosition = calculateCurrentPosition(transport);
                  updated = updateRoomTransport(connectionData.roomCode, { 
                    status: 'PAUSED', 
                    position: pausePosition,
                    serverStartTime: null
                  });
                  broadcastPayload = { position: updated.position, revision: updated.revision };
                  
                } else if (type === WS_EVENTS.TRANSPORT_STOP) {
                  updated = updateRoomTransport(connectionData.roomCode, { 
                    status: 'STOPPED', 
                    position: 0,
                    serverStartTime: null
                  });
                  broadcastPayload = { position: updated.position, revision: updated.revision };
                  
                } else if (type === WS_EVENTS.TRANSPORT_SEEK) {
                  const validationErrors = validateWsPayload(payload, transportSchemas.seek);
                  if (validationErrors) {
                    return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Invalid seek position', requestId);
                  }
                  const newPosition = Math.max(0, payload.position);
                  const updates = { position: newPosition };
                  if (transport.status === 'PLAYING') {
                    updates.serverStartTime = Date.now() + 100; // Recalculate start for seamless playing seek
                  }
                  updated = updateRoomTransport(connectionData.roomCode, updates);
                  broadcastPayload = { 
                    position: updated.position, 
                    serverStartTime: updated.serverStartTime,
                    revision: updated.revision 
                  };
                  
                } else if (type === WS_EVENTS.TRANSPORT_SET_BPM) {
                  const validationErrors = validateWsPayload(payload, transportSchemas.setBpm);
                  if (validationErrors) {
                    return sendError(socket, WS_ERRORS.INVALID_PAYLOAD, 'Invalid BPM value', requestId);
                  }
                  const newBpm = Math.max(20, Math.min(300, payload.bpm));
                  
                  // if playing, calculate current position so we can anchor it
                  const currentPos = calculateCurrentPosition(transport);
                  const updates = { bpm: newBpm, position: currentPos };
                  
                  if (transport.status === 'PLAYING') {
                    updates.serverStartTime = Date.now() + 100; // Reset start so position is anchored
                  }
                  
                  updated = updateRoomTransport(connectionData.roomCode, updates);
                  broadcastPayload = { 
                    bpm: updated.bpm, 
                    position: updated.position,
                    serverStartTime: updated.serverStartTime,
                    revision: updated.revision 
                  };
                  type = WS_EVENTS.TRANSPORT_BPM_CHANGED;
                }
                
                // ACK
                if (payload.clientCommandId) {
                  socket.send(JSON.stringify({
                    type: WS_EVENTS.TRANSPORT_COMMAND_ACK,
                    requestId,
                    timestamp: Date.now(),
                    payload: { clientCommandId: payload.clientCommandId, revision: updated.revision }
                  }));
                }
                
                const processedAt = Date.now();
                // Broadcast to ALL including sender so sender's audio also syncs
                roomConnectionManager.broadcastToRoom(connectionData.roomCode, {
                  type,
                  timestamp: processedAt,
                  payload: broadcastPayload,
                  _perf: {
                    received: parsed.timestamp,
                    processed: processedAt
                  }
                });
                
                import('./redis/redis.pubsub.js').then(({ publishRoomEvent }) => {
                  publishRoomEvent(connectionData.roomCode, type, broadcastPayload);
                });
                
              } catch(err) {
                 if (payload.clientCommandId) {
                    socket.send(JSON.stringify({
                      type: WS_EVENTS.TRANSPORT_COMMAND_REJECTED,
                      requestId,
                      timestamp: Date.now(),
                      payload: { clientCommandId: payload.clientCommandId, reason: err.message }
                    }));
                 }
              }
            });
          } catch(e) {}
        });
        return;
      }

      // Handle unknown events
      sendError(socket, WS_ERRORS.UNKNOWN_EVENT, 'Unsupported event', requestId);
    });

    socket.on('close', () => {
      const data = connectionManager.unregisterConnection(socket);
      if (data && data.roomCode) {
        roomConnectionManager.leaveRoom(data.roomCode, socket);

        import('./redis/redis.presence.js').then(({ decrementUserPresence }) => {
          decrementUserPresence(data.roomCode, data.userId);
        });
      }
    });

    socket.on('error', (err) => {
      // Don't crash on client socket errors
    });
  });

  return wss;
};
