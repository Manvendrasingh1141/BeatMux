/**
 * socketService.js
 * Singleton Socket.IO client instance.
 * Always connect to the same origin — Vite's dev proxy forwards /socket.io to the backend.
 * In production, point to the actual server URL via an env var.
 */

import { io } from 'socket.io-client';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || '/';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SERVER_URL, {
      autoConnect:  false,
      transports:   ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay:    1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect',         () => console.log('[Socket] connected:', socket.id));
    socket.on('disconnect', (r) => console.log('[Socket] disconnected:', r));
    socket.on('connect_error',   (e) => console.error('[Socket] error:', e.message));
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Call this when the user leaves a room and we want a clean slate. */
export function destroySocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
