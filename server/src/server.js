/**
 * server.js
 * BeatMux backend — Express + Socket.IO
 */

import express       from 'express';
import { createServer } from 'http';
import { Server }    from 'socket.io';
import cors          from 'cors';
import { registerSocketHandlers } from './socket/socketHandlers.js';
import { getRoomById, serializeRoomState } from './rooms/roomManager.js';

const app        = express();
const httpServer = createServer(app);

// ── CORS (allow all origins in dev) ──────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Socket.IO ─────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  // Increase ping timeout for stability in dev
  pingTimeout: 60000,
});

io.on('connection', (socket) => {
  console.log(`[+] Socket connected: ${socket.id}  (total: ${io.engine.clientsCount})`);
  registerSocketHandlers(io, socket);
});

// ── REST endpoints ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    sockets:   io.engine.clientsCount,
  });
});

// Check if a room exists before joining (used by the frontend join flow)
app.get('/api/rooms/:roomId', (req, res) => {
  const roomId = req.params.roomId.toUpperCase();
  const room   = getRoomById(roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  res.json({
    roomId:    room.roomId,
    userCount: room.users.size,
    createdAt: room.createdAt,
  });
});

// ── Start ──────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════╗');
  console.log(`  ║  BeatMux Server  →  port ${PORT}       ║`);
  console.log('  ╚══════════════════════════════════════╝');
  console.log('');
});
