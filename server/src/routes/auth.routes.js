import { Router } from 'express';
import { register, login, logout, me } from '../modules/auth/auth.controller.js';
import { requireAuth } from '../modules/auth/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../validation/validate.js';
import { authSchemas } from '../validation/schemas.js';

const router = Router();

router.post('/register', authRateLimiter, validate(authSchemas.register), register);
router.post('/login', authRateLimiter, validate(authSchemas.login), login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
