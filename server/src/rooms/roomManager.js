/**
 * roomManager.js
 * In-memory store for all active rooms.
 * No database — pure Map for hackathon MVP.
 *
 * Room shape:
 * {
 *   roomId:    string,
 *   ownerId:   string,        // socketId of the creator
 *   users:     Map<socketId, User>,
 *   state:     RoomState,
 *   createdAt: number,
 * }
 *
 * User shape:
 * {
 *   id:          string,   // generated user ID
 *   socketId:    string,
 *   displayName: string,
 *   isOwner:     boolean,
 *   joinedAt:    number,
 *   activity:    string,   // e.g. "Editing drums"
 * }
 */

import { createRoomState } from '../state/roomState.js';

// ─── In-memory store ──────────────────────────────────────────────────────────
const rooms = new Map(); // roomId → Room

// ─── ID generators ────────────────────────────────────────────────────────────
const ROOM_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1 (ambiguous)

function generateRoomId() {
  let id;
  let attempts = 0;
  do {
    let suffix = '';
    for (let i = 0; i < 6; i++) {
      suffix += ROOM_CHARS[Math.floor(Math.random() * ROOM_CHARS.length)];
    }
    id = `BM-${suffix}`;
    attempts++;
    if (attempts > 1000) throw new Error('Could not generate a unique Room ID');
  } while (rooms.has(id));
  return id;
}

function generateUserId() {
  return `user_${Math.random().toString(36).substring(2, 9)}`;
}

// ─── Room operations ──────────────────────────────────────────────────────────

/**
 * Create a brand-new room and add the creator as the owner.
 * Returns { room, user }.
 */
export function createRoom(socketId, displayName) {
  const roomId = generateRoomId();
  const userId = generateUserId();

  const user = {
    id: userId,
    socketId,
    displayName: displayName.trim(),
    isOwner: true,
    joinedAt: Date.now(),
    activity: 'Online',
  };

  const room = {
    roomId,
    ownerId: socketId,
    users: new Map([[socketId, user]]),
    state: createRoomState(),
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  return { room, user };
}

/**
 * Join an existing room.
 * Returns { room, user } or throws if room not found.
 */
export function joinRoom(socketId, roomId, displayName) {
  const room = rooms.get(roomId);
  if (!room) {
    throw new Error(`Room "${roomId}" does not exist.`);
  }

  const userId = generateUserId();
  const user = {
    id: userId,
    socketId,
    displayName: displayName.trim(),
    isOwner: false,
    joinedAt: Date.now(),
    activity: 'Online',
  };

  room.users.set(socketId, user);
  return { room, user };
}

/**
 * Remove a user from whichever room they are in.
 * If they were the owner and there are others, transfer ownership.
 * If the room is now empty, delete it.
 * Returns { roomId, users } or null if the socket wasn't in any room.
 */
export function leaveRoom(socketId) {
  for (const [roomId, room] of rooms) {
    if (!room.users.has(socketId)) continue;

    room.users.delete(socketId);

    // Transfer ownership if needed
    if (room.ownerId === socketId && room.users.size > 0) {
      const newOwnerEntry = room.users.values().next().value;
      newOwnerEntry.isOwner = true;
      room.ownerId = newOwnerEntry.socketId;
    }

    // Remove empty rooms
    if (room.users.size === 0) {
      rooms.delete(roomId);
      return { roomId, users: [] };
    }

    return { roomId, users: serializeUsers(room) };
  }
  return null; // Socket wasn't in any room
}

/**
 * Find which room a socket is currently in.
 * Returns the room or null.
 */
export function getRoomBySocket(socketId) {
  for (const room of rooms.values()) {
    if (room.users.has(socketId)) return room;
  }
  return null;
}

export function getRoomById(roomId) {
  return rooms.get(roomId) || null;
}

// ─── State mutations ──────────────────────────────────────────────────────────

export function updateStep(roomId, trackKey, stepIndex, value) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.pattern[trackKey][stepIndex] = value;
  return true;
}

export function updateBpm(roomId, bpm) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.bpm = bpm;
  return true;
}

export function updateQuantize(roomId, quantize) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.quantize = quantize;
  return true;
}

export function updatePatternBank(roomId, patternBank) {
  const room = rooms.get(roomId);
  if (!room) return false;
  
  const oldBank = room.state.patternBank;
  if (oldBank !== patternBank) {
    // Save current pattern to old bank
    if (room.state.patternBanks) {
      room.state.patternBanks[oldBank] = structuredClone(room.state.pattern);
    }
    
    // Switch bank
    room.state.patternBank = patternBank;
    
    // Load new pattern
    if (room.state.patternBanks) {
      let newPat = room.state.patternBanks[patternBank];
      if (!newPat || Object.keys(newPat).length === 0) {
        // empty pattern - initialize it
        const TOTAL_STEPS = 16;
        const tracks = room.state.tracks || [
          { key: 'kick' }, { key: 'snare' }, { key: 'closedHat' }, { key: 'openHat' }
        ];
        newPat = {};
        tracks.forEach(t => { newPat[t.key] = Array(TOTAL_STEPS).fill(false); });
        room.state.patternBanks[patternBank] = newPat;
      }
      room.state.pattern = structuredClone(newPat);
    }
  }
  return room.state.pattern;
}

export function updateResolution(roomId, resolution) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.resolution = resolution;
  return true;
}

export function updatePlayback(roomId, isPlaying, serverTimestamp = null) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.isPlaying = isPlaying;
  if (isPlaying) {
    room.state.startTime = serverTimestamp;
  } else {
    room.state.startTime = null;
  }
  return true;
}

export function updatePattern(roomId, pattern) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.pattern = structuredClone(pattern);
  return true;
}

export function updateMuted(roomId, trackKey, value) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.muted[trackKey] = value;
  return true;
}

export function updateSoloed(roomId, trackKey, value) {
  const room = rooms.get(roomId);
  if (!room) return false;
  room.state.soloed[trackKey] = value;
  return true;
}

export function updateTrackVolume(roomId, trackKey, volume) {
  const room = rooms.get(roomId);
  if (!room) return false;
  if (!room.state.volumes) room.state.volumes = {};
  room.state.volumes[trackKey] = volume;
  return true;
}

export function updateUserActivity(roomId, socketId, activity) {
  const room = rooms.get(roomId);
  if (!room) return;
  const user = room.users.get(socketId);
  if (user) user.activity = activity;
}

// ─── Serialization ────────────────────────────────────────────────────────────

/** Convert users Map to a plain array safe to send over the wire. */
export function serializeUsers(room) {
  return Array.from(room.users.values()).map((u) => ({
    id:          u.id,
    socketId:    u.socketId,
    displayName: u.displayName,
    isOwner:     u.isOwner,
    activity:    u.activity,
    joinedAt:    u.joinedAt,
  }));
}

/** Serialize full room state (without internal Map) for sending to clients. */
export function serializeRoomState(room) {
  return {
    roomId:  room.roomId,
    users:   serializeUsers(room),
    state:   { ...structuredClone(room.state), tracks: room.state.tracks || null },
  };
}

/** Diagnostic: how many rooms are active. */
export function getRoomCount() {
  return rooms.size;
}
