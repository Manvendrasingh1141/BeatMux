import { Router } from 'express';
import { createRoom, getRoom, getUserRooms, joinRoom, leaveRoom } from './room.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { roomCreateRateLimiter, roomJoinRateLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../validation/validate.js';
import { roomSchemas } from '../../validation/schemas.js';

const router = Router();

router.use(requireAuth);

router.post('/', roomCreateRateLimiter, validate(roomSchemas.create), createRoom);
router.get('/', getUserRooms);
router.get('/:roomCode', getRoom);
router.post('/:roomCode/join', roomJoinRateLimiter, joinRoom);
router.post('/:roomCode/leave', leaveRoom);

export default router;
