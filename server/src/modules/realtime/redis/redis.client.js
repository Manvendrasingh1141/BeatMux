import { createClient } from 'redis';
import crypto from 'crypto';

export const SERVER_ID = process.env.SERVER_INSTANCE_ID || crypto.randomUUID();
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const pubClient = createClient({ url: redisUrl });
export const subClient = createClient({ url: redisUrl });

pubClient.on('error', (err) => console.error('[Redis Pub] Error', err));
subClient.on('error', (err) => console.error('[Redis Sub] Error', err));

let isConnected = false;

export const connectRedis = async () => {
  if (isConnected) return;
  try {
    await pubClient.connect();
    await subClient.connect();
    isConnected = true;
    console.log(`[Redis] Connected (Server ID: ${SERVER_ID})`);
  } catch (err) {
    console.error('[Redis] Failed to connect', err);
  }
};

export const closeRedis = async () => {
  if (!isConnected) return;
  await pubClient.quit();
  await subClient.quit();
  isConnected = false;
  console.log('[Redis] Disconnected gracefully');
};

export const getRedisStatus = () => {
  return isConnected && pubClient.isReady && subClient.isReady ? 'connected' : 'disconnected';
};
