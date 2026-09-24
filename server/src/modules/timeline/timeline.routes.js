import express from 'express';
import { requireAuth } from '../auth/auth.middleware.js';
import { getTimelineSnapshot } from './timeline.service.js';
import { getRoomByCode } from '../rooms/room.service.js';
import Track from '../../models/Track.js';

const router = express.Router();

router.get('/:roomCode', requireAuth, async (req, res) => {
  try {
    const roomCode = req.params.roomCode;
    const room = await getRoomByCode(roomCode);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    // Check membership
    const isMember = room.members.some(m => m.userId._id.toString() === req.user.id);
    if (!isMember) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const snapshot = await getTimelineSnapshot(room._id);

    // Auto-create default tracks if none exist yet
    if (snapshot.tracks.length === 0) {
      const defaultColors = ['#8b5cf6', '#0ea5e9', '#10b981'];
      const defaultTracks = defaultColors.map((color, i) => ({
        roomId: room._id,
        name: `Track ${i + 1}`,
        order: i,
        color,
        volume: 1,
        pan: 0,
        muted: false,
        soloed: false,
      }));
      const created = await Track.insertMany(defaultTracks);
      snapshot.tracks = created.map(t => ({ ...t.toObject(), id: t._id }));
    }

    res.json(snapshot);
  } catch (error) {
    console.error('Error fetching timeline snapshot:', error);
    res.status(500).json({ error: 'Failed to fetch timeline snapshot' });
  }
});

export default router;
