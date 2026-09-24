/**
 * socketHandlers.js
 * Registers all Socket.IO event listeners for one connected client.
 */

import {
  createRoom,
  joinRoom,
  leaveRoom,
  getRoomBySocket,
  getRoomById,
  updateStep,
  updateBpm,
  updatePlayback,
  updatePattern,
  updateMuted,
  updateSoloed,
  updateTrackVolume,
  updateUserActivity,
  updateQuantize,
  updatePatternBank,
  updateResolution,
  serializeUsers,
  serializeRoomState,
} from '../rooms/roomManager.js';

import {
  validateDisplayName,
  validateRoomId,
  validateStepUpdate,
  validateBpm,
  validatePattern,
  validateTrackKey,
  validateVolume,
} from '../validation/validation.js';

export function registerSocketHandlers(io, socket) {
  const log = (event, data) =>
    console.log(`[${new Date().toLocaleTimeString()}] ${socket.id} → ${event}`, data ?? '');

  // ── room:create ────────────────────────────────────────────────────────────
  socket.on('room:create', ({ displayName } = {}) => {
    log('room:create', { displayName });

    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.valid) {
      socket.emit('room:error', { message: nameCheck.error });
      return;
    }

    try {
      const { room, user } = createRoom(socket.id, displayName);
      socket.join(room.roomId);

      socket.emit('room:created', {
        roomId: room.roomId,
        you:    user,
        state:  serializeRoomState(room),
      });

      console.log(`Room ${room.roomId} created by "${displayName}"`);
    } catch (err) {
      console.error('room:create error:', err);
      socket.emit('room:error', { message: 'Failed to create room. Please try again.' });
    }
  });

  // ── room:join ──────────────────────────────────────────────────────────────
  socket.on('room:join', ({ roomId, displayName } = {}) => {
    log('room:join', { roomId, displayName });

    const nameCheck = validateDisplayName(displayName);
    if (!nameCheck.valid) {
      socket.emit('room:error', { message: nameCheck.error });
      return;
    }

    const idCheck = validateRoomId(roomId);
    if (!idCheck.valid) {
      socket.emit('room:error', { message: idCheck.error });
      return;
    }

    const normalizedId = roomId.trim().toUpperCase();

    try {
      const { room, user } = joinRoom(socket.id, normalizedId, displayName);
      socket.join(normalizedId);

      // Send current full state to the new joiner
      socket.emit('room:joined', {
        roomId: normalizedId,
        you:    user,
        state:  serializeRoomState(room),
      });

      // Notify everyone else in the room
      socket.to(normalizedId).emit('user:joined', {
        user:  user,
        users: serializeUsers(room),
      });

      console.log(`"${displayName}" joined room ${normalizedId}`);
    } catch (err) {
      socket.emit('room:error', { message: err.message });
    }
  });

  // ── chat:send ──────────────────────────────────────────────────────────────
  socket.on('chat:send', ({ text }) => {
    log('chat:send');
    const room = getRoomBySocket(socket.id);
    if (!room || !text || typeof text !== 'string') return;
    
    const user = room.users.get(socket.id);
    if (!user) return;

    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
      userId: user.id,
      displayName: user.displayName,
      text,
      timestamp: Date.now(),
    };

    if (!room.state.messages) room.state.messages = [];
    room.state.messages.push(message);
    
    io.to(room.roomId).emit('chat:message', message);
  });

  // ── room:leave ─────────────────────────────────────────────────────────────
  socket.on('room:leave', () => {
    log('room:leave');
    handleLeave(io, socket);
  });

  // ── disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', (reason) => {
    log('disconnect', reason);
    handleLeave(io, socket);
  });

  // ── sequencer:step ───────────────────────────────────────────────────────────────
  socket.on('sequencer:step', (data = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const check = validateStepUpdate(data);
    if (!check.valid) {
      console.warn(`Invalid sequencer:step from ${socket.id}:`, check.error);
      return;
    }

    const { trackKey, stepIndex, value } = data;
    updateStep(room.roomId, trackKey, stepIndex, value);

    socket.to(room.roomId).emit('sequencer:step', {
      trackKey,
      stepIndex,
      value,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── sequencer:bpm ────────────────────────────────────────────────────────────────
  socket.on('sequencer:bpm', ({ bpm } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const check = validateBpm(bpm);
    if (!check.valid) {
      console.warn(`Invalid sequencer:bpm from ${socket.id}:`, check.error);
      return;
    }

    updateBpm(room.roomId, bpm);

    socket.to(room.roomId).emit('sequencer:bpm', {
      bpm,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── sequencer:play ───────────────────────────────────────────────────────────────
  socket.on('sequencer:play', ({ isPlaying, timestamp } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    if (typeof isPlaying !== 'boolean') return;
    
    // If the client didn't send a timestamp, we assign one.
    // If they did, we respect it so their local timing offsets are consistent.
    const serverTimestamp = timestamp || Date.now();

    updatePlayback(room.roomId, isPlaying, serverTimestamp);

    socket.to(room.roomId).emit('sequencer:play', {
      isPlaying,
      serverTimestamp,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── sequencer:pattern ────────────────────────────────────────────────────────────
  socket.on('sequencer:pattern', ({ pattern } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const check = validatePattern(pattern);
    if (!check.valid) {
      console.warn(`Invalid sequencer:pattern from ${socket.id}:`, check.error);
      return;
    }

    updatePattern(room.roomId, pattern);

    socket.to(room.roomId).emit('sequencer:pattern', {
      pattern,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── track:mute ───────────────────────────────────────────────────────────────
  socket.on('track:mute', ({ trackKey, value } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const check = validateTrackKey(trackKey);
    if (!check.valid || typeof value !== 'boolean') return;

    updateMuted(room.roomId, trackKey, value);

    socket.to(room.roomId).emit('track:mute', {
      trackKey, value,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── track:solo ───────────────────────────────────────────────────────────────
  socket.on('track:solo', ({ trackKey, value } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const check = validateTrackKey(trackKey);
    if (!check.valid || typeof value !== 'boolean') return;

    updateSoloed(room.roomId, trackKey, value);

    socket.to(room.roomId).emit('track:solo', {
      trackKey, value,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── track:volume ───────────────────────────────────────────────────────────────
  socket.on('track:volume', ({ trackKey, volume } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    const keyCheck = validateTrackKey(trackKey);
    const volCheck = validateVolume(volume);
    if (!keyCheck.valid || !volCheck.valid) return;

    updateTrackVolume(room.roomId, trackKey, volume);

    socket.to(room.roomId).emit('track:volume', {
      trackKey, volume,
      userId: room.users.get(socket.id)?.id,
    });
  });

  // ── user:activity ──────────────────────────────────────────────────────────────
  socket.on('user:activity', ({ activity } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room) return;

    if (typeof activity === 'string' && activity.length <= 64) {
      updateUserActivity(room.roomId, socket.id, activity);
      
      io.to(room.roomId).emit('user:activity', {
        users: serializeUsers(room)
      });
    }
  });

  // ── settings:quantize ────────────────────────────────────────────────────────
  socket.on('sequencer:quantize', ({ quantize } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room || typeof quantize !== 'string') return;
    updateQuantize(room.roomId, quantize);
    socket.to(room.roomId).emit('sequencer:quantize', { quantize });
  });

  // ── settings:patternBank ─────────────────────────────────────────────────────
  socket.on('sequencer:patternBank', ({ patternBank } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room || typeof patternBank !== 'string') return;
    const newPattern = updatePatternBank(room.roomId, patternBank);
    
    // Broadcast the new pattern bank to others
    socket.to(room.roomId).emit('sequencer:patternBank', { patternBank });
    
    // Broadcast the updated pattern to everyone including the sender!
    // The sender just told us they changed the bank, but they need the pattern data
    io.to(room.roomId).emit('sequencer:pattern', { pattern: newPattern });
  });

  // ── settings:resolution ──────────────────────────────────────────────────────
  socket.on('sequencer:resolution', ({ resolution } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room || typeof resolution !== 'string') return;
    updateResolution(room.roomId, resolution);
    socket.to(room.roomId).emit('sequencer:resolution', { resolution });
  });

  // ── track:add ─────────────────────────────────────────────────────────────────
  socket.on('track:add', ({ track, pattern, tracks } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room || !track || typeof track.key !== 'string') return;

    // Save into room state
    room.state.tracks   = tracks;
    room.state.pattern  = pattern;
    
    // Add empty row to all other pattern banks
    if (room.state.patternBanks) {
      Object.keys(room.state.patternBanks).forEach(bankKey => {
        if (!room.state.patternBanks[bankKey][track.key]) {
          room.state.patternBanks[bankKey][track.key] = Array(16).fill(false);
        }
      });
    }

    // Broadcast to others (not the sender)
    socket.to(room.roomId).emit('track:add', { track, pattern, tracks });
  });

  // ── track:rename ──────────────────────────────────────────────────────────────
  socket.on('track:rename', ({ trackKey, label } = {}) => {
    const room = getRoomBySocket(socket.id);
    if (!room || typeof trackKey !== 'string' || typeof label !== 'string') return;

    // Update label in persisted tracks
    if (room.state.tracks) {
      room.state.tracks = room.state.tracks.map((t) =>
        t.key === trackKey ? { ...t, label } : t
      );
    }

    socket.to(room.roomId).emit('track:rename', { trackKey, label });
  });
}

// ─── Shared leave logic ───────────────────────────────────────────────────────

function handleLeave(io, socket) {
  const result = leaveRoom(socket.id);
  if (!result) return;

  const { roomId, users } = result;
  socket.leave(roomId);

  // Notify remaining users
  io.to(roomId).emit('user:left', {
    socketId: socket.id,
    users,
  });

  console.log(`Socket ${socket.id} left room ${roomId}. ${users.length} user(s) remaining.`);
}
