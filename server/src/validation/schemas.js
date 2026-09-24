// Centralized validation schemas for all server-side validation

export const authSchemas = {
  register: {
    username: { required: true, minLength: 2, maxLength: 30, pattern: /^[a-zA-Z0-9_]+$/ },
    email: { required: true, isEmail: true },
    password: { required: true, minLength: 6, maxLength: 128 }
  },
  login: {
    email: { required: true, isEmail: true },
    password: { required: true }
  }
};

export const roomSchemas = {
  create: {
    name: { required: true, minLength: 1, maxLength: 60 }
  },
  join: {
    roomCode: { required: true, minLength: 4, maxLength: 12, pattern: /^[A-Z0-9]+$/ }
  }
};

export const assetSchemas = {
  requestUpload: {
    originalName: { required: true, maxLength: 255 },
    mimeType: { required: true, allowed: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/webm'] },
    size: { required: true, min: 1, max: 200 * 1024 * 1024 } // 200MB max
  }
};

export const timelineSchemas = {
  createClip: {
    trackId: { required: true, isObjectId: true },
    assetId: { required: true, isObjectId: true },
    startTime: { required: true, min: 0 },
    duration: { required: true, min: 0.01 },
    offset: { required: true, min: 0 }
  },
  updateClip: {
    clipId: { required: true, isObjectId: true }
  }
};

export const transportSchemas = {
  seek: {
    position: { required: true, min: 0 }
  },
  setBpm: {
    bpm: { required: true, min: 20, max: 300 }
  }
};

export const mixerSchemas = {
  setVolume: {
    volume: { required: true, min: 0, max: 1 }
  },
  setPan: {
    pan: { required: true, min: -1, max: 1 }
  }
};
