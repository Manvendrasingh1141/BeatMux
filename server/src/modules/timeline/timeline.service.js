import Room from '../../models/Room.js';
import Track from '../../models/Track.js';
import Clip from '../../models/Clip.js';
import AudioAsset from '../../models/AudioAsset.js';

export const getTimelineSnapshot = async (roomId) => {
  const [tracks, clips, room] = await Promise.all([
    Track.find({ roomId }).sort({ order: 1 }),
    Clip.find({ roomId }),
    Room.findById(roomId).select('timelineVersion')
  ]);
  
  return {
    tracks,
    clips,
    timelineVersion: room.timelineVersion
  };
};

export const incrementTimelineVersion = async (roomId) => {
  const room = await Room.findByIdAndUpdate(roomId, { $inc: { timelineVersion: 1 } }, { new: true });
  return room.timelineVersion;
};

// Return a structured timeline service class or object to handle mutations
export const timelineService = {
  createClip: async (roomId, payload) => {
    const { trackId, assetId, startTime, duration, offset, name, color } = payload;
    
    // Validate
    if (startTime < 0 || duration <= 0 || offset < 0) throw new Error("Invalid time parameters");
    const track = await Track.findById(trackId);
    if (!track || track.roomId.toString() !== roomId.toString()) throw new Error("Invalid track");
    const asset = await AudioAsset.findById(assetId);
    if (!asset || asset.roomId.toString() !== roomId.toString()) throw new Error("Invalid asset");
    
    // Create
    const clip = new Clip({
      roomId,
      trackId,
      assetId,
      name: name || asset.originalName,
      startTime,
      duration,
      offset,
      color: color || track.color
    });
    await clip.save();
    
    const newVersion = await incrementTimelineVersion(roomId);
    return { clip, newVersion };
  },

  updateClip: async (roomId, payload) => {
    const { clipId, changes } = payload;
    
    const clip = await Clip.findById(clipId);
    if (!clip || clip.roomId.toString() !== roomId.toString()) throw new Error("Invalid clip");
    
    const allowedFields = ['startTime', 'duration', 'offset', 'trackId', 'name', 'color'];
    for (const key of allowedFields) {
      if (changes[key] !== undefined) {
        clip[key] = changes[key];
      }
    }
    
    // Validation
    if (clip.startTime < 0 || clip.duration <= 0 || clip.offset < 0) throw new Error("Invalid time parameters");
    if (changes.trackId) {
      const track = await Track.findById(changes.trackId);
      if (!track || track.roomId.toString() !== roomId.toString()) throw new Error("Invalid track");
    }
    
    await clip.save();
    const newVersion = await incrementTimelineVersion(roomId);
    
    return { clip, newVersion };
  },

  deleteClip: async (roomId, payload) => {
    const { clipId } = payload;
    const clip = await Clip.findByIdAndDelete(clipId);
    if (!clip || clip.roomId.toString() !== roomId.toString()) throw new Error("Invalid clip");
    
    const newVersion = await incrementTimelineVersion(roomId);
    return { clipId, newVersion };
  },

  createTrack: async (roomId, payload) => {
    const { name, color, order } = payload;
    const track = new Track({
      roomId,
      name: name || 'New Track',
      color: color || 'bg-purple-500',
      order: order || 0
    });
    await track.save();
    
    const newVersion = await incrementTimelineVersion(roomId);
    return { track, newVersion };
  },

  deleteTrack: async (roomId, payload) => {
    const { trackId } = payload;
    const track = await Track.findByIdAndDelete(trackId);
    if (!track || track.roomId.toString() !== roomId.toString()) throw new Error("Invalid track");
    
    // Delete all clips for this track
    await Clip.deleteMany({ trackId });
    
    const newVersion = await incrementTimelineVersion(roomId);
    return { trackId, newVersion };
  }
};
