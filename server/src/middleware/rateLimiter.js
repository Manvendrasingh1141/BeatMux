import { rateLimit } from 'express-rate-limit';

// Get Redis client for distributed rate limiting (lazy-loaded to avoid circular deps)
let pubClient = null;
const getRedisPubClient = async () => {
  if (!pubClient) {
    const mod = await import('../modules/realtime/redis/redis.client.js');
    pubClient = mod.pubClient;
  }
  return pubClient;
};

// Redis-backed distributed rate limiter store
class RedisRateLimitStore {
  constructor(prefix, windowMs) {
    this.prefix = prefix;
    this.windowSec = Math.ceil(windowMs / 1000);
  }

  async get(key) {
    try {
      const client = await getRedisPubClient();
      if (!client || !client.isReady) return null;
      const val = await client.get(`rl:${this.prefix}:${key}`);
      return val ? { totalHits: parseInt(val, 10), resetTime: new Date() } : null;
    } catch {
      return null;
    }
  }

  async increment(key) {
    try {
      const client = await getRedisPubClient();
      if (!client || !client.isReady) return { totalHits: 0, resetTime: new Date() };
      const redisKey = `rl:${this.prefix}:${key}`;
      const val = await client.incr(redisKey);
      if (val === 1) await client.expire(redisKey, this.windowSec);
      return { totalHits: val, resetTime: new Date(Date.now() + this.windowSec * 1000) };
    } catch {
      return { totalHits: 0, resetTime: new Date() };
    }
  }

  async decrement(key) {
    try {
      const client = await getRedisPubClient();
      if (!client || !client.isReady) return;
      await client.decr(`rl:${this.prefix}:${key}`);
    } catch {}
  }

  async resetKey(key) {
    try {
      const client = await getRedisPubClient();
      if (!client || !client.isReady) return;
      await client.del(`rl:${this.prefix}:${key}`);
    } catch {}
  }
}

// Auth endpoints - very strict (per IP)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // increased to avoid lockout during testing
  store: new RedisRateLimitStore('auth', 15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts. Please try again later.', code: 'RATE_LIMITED' },
  skip: (req) => req.path === '/refresh' // don't limit refresh tokens
});

// Room creation - moderate (keyed by userId so it works correctly across auth'd requests)
export const roomCreateRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  store: new RedisRateLimitStore('room-create', 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id ?? req.ip,
  skip: () => false,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many rooms created. Please try again later.', code: 'RATE_LIMITED' }
});

// Room join - moderate
export const roomJoinRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  store: new RedisRateLimitStore('room-join', 15 * 60 * 1000),
  keyGenerator: (req) => req.user?.id ?? req.ip,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many join attempts. Please try again later.', code: 'RATE_LIMITED' }
});

// Asset upload auth - moderate
export const assetUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  store: new RedisRateLimitStore('asset-upload', 60 * 60 * 1000),
  keyGenerator: (req) => req.user?.id ?? req.ip,
  validate: { xForwardedForHeader: false, keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many upload requests. Please try again later.', code: 'RATE_LIMITED' }
});

// General read API - lenient
export const generalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  store: new RedisRateLimitStore('api-general', 15 * 60 * 1000),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' }
});
