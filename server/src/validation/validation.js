/**
 * validation.js
 * Input validation for all incoming socket events.
 * Returns { valid: boolean, error?: string }
 */

const TRACK_KEYS = new Set(['kick', 'snare', 'closedHat', 'openHat']);

export function validateDisplayName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Display name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Display name cannot be empty.' };
  }
  if (trimmed.length > 32) {
    return { valid: false, error: 'Display name must be 32 characters or fewer.' };
  }
  return { valid: true };
}

export function validateRoomId(roomId) {
  if (!roomId || typeof roomId !== 'string') {
    return { valid: false, error: 'Room ID is required.' };
  }
  // Format: BM-XXXXXX (2 letters, dash, 6 alphanumeric)
  if (!/^BM-[A-Z0-9]{6}$/.test(roomId.trim().toUpperCase())) {
    return { valid: false, error: 'Invalid Room ID format.' };
  }
  return { valid: true };
}

export function validateStepUpdate({ trackKey, stepIndex, value }) {
  if (!TRACK_KEYS.has(trackKey)) {
    return { valid: false, error: `Unknown track key: ${trackKey}` };
  }
  if (typeof stepIndex !== 'number' || stepIndex < 0 || stepIndex > 15 || !Number.isInteger(stepIndex)) {
    return { valid: false, error: 'Step index must be an integer 0–15.' };
  }
  if (typeof value !== 'boolean') {
    return { valid: false, error: 'Step value must be a boolean.' };
  }
  return { valid: true };
}

export function validateBpm(bpm) {
  if (typeof bpm !== 'number' || bpm < 40 || bpm > 240 || !Number.isFinite(bpm)) {
    return { valid: false, error: 'BPM must be a number between 40 and 240.' };
  }
  return { valid: true };
}

export function validatePattern(pattern) {
  if (!pattern || typeof pattern !== 'object') {
    return { valid: false, error: 'Pattern must be an object.' };
  }
  for (const key of TRACK_KEYS) {
    if (!Array.isArray(pattern[key]) || pattern[key].length !== 16) {
      return { valid: false, error: `Track "${key}" must be a boolean array of length 16.` };
    }
    if (!pattern[key].every((v) => typeof v === 'boolean')) {
      return { valid: false, error: `Track "${key}" must contain only booleans.` };
    }
  }
  return { valid: true };
}

export function validateTrackKey(trackKey) {
  if (!TRACK_KEYS.has(trackKey)) {
    return { valid: false, error: `Unknown track key: ${trackKey}` };
  }
  return { valid: true };
}

export function validateVolume(volume) {
  if (typeof volume !== 'number' || volume < 0 || volume > 100 || !Number.isFinite(volume)) {
    return { valid: false, error: 'Volume must be a number between 0 and 100.' };
  }
  return { valid: true };
}
