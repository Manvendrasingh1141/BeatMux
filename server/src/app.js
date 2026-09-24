import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import mongoose from 'mongoose';
import connectDB from './utils/connectDB.js';
import roomRoutes from './modules/rooms/room.routes.js';
import { generalApiRateLimiter } from './middleware/rateLimiter.js';

const app = express();
app.set('trust proxy', 1); // Trust Nginx load balancer

await connectDB();

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Apply general rate limiter globally, but skip health check endpoints
app.use((req, res, next) => {
  if (req.path.startsWith('/health/')) return next();
  return generalApiRateLimiter(req, res, next);
});

import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/auth', authRoutes);

// Fix: asset routes need to be nested under room.
import assetRoutes from './modules/assets/asset.routes.js';
roomRoutes.use('/:roomCode/assets', assetRoutes);
app.use('/api/rooms', roomRoutes);

import storageRoutes from './modules/storage/storage.routes.js';
app.use('/api/storage', storageRoutes);

import timelineRoutes from './modules/timeline/timeline.routes.js';
app.use('/api/timeline', timelineRoutes);

app.get('/health/live', (req, res) => {
  res.status(200).json({ status: 'ok', liveness: true });
});

app.get('/health/ready', async (req, res) => {
  const { SERVER_ID, getRedisStatus } = await import('./modules/realtime/redis/redis.client.js');
  const redisOk = getRedisStatus() === 'connected';
  const dbOk = mongoose.connection.readyState === 1; // 1 = connected
  
  if (!redisOk || !dbOk) {
    return res.status(503).json({
      status: 'error',
      serverId: SERVER_ID,
      redis: redisOk ? 'connected' : 'disconnected',
      database: dbOk ? 'connected' : 'disconnected'
    });
  }

  res.status(200).json({ 
    status: 'ok',
    serverId: SERVER_ID,
    redis: 'connected',
    database: 'connected'
  });
});

export default app;
