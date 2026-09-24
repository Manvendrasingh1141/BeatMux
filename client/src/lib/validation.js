// Centralized client-side validation utilities

export const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/mp4', 'audio/webm', 'audio/x-m4a'
];

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'webm'];
export const MAX_AUDIO_SIZE_MB = 200;
export const MAX_AUDIO_SIZE_BYTES = MAX_AUDIO_SIZE_MB * 1024 * 1024;

export const validators = {
  required: (val) => !val || val.toString().trim() === '' ? 'This field is required' : null,
  email: (val) => {
    if (!val) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) ? null : 'Enter a valid email address';
  },
  minLength: (min) => (val) => val && val.length < min ? `Must be at least ${min} characters` : null,
  maxLength: (max) => (val) => val && val.length > max ? `Must be at most ${max} characters` : null,
  pattern: (regex, msg) => (val) => val && !regex.test(val) ? msg : null,
  min: (min) => (val) => val !== '' && val !== undefined && Number(val) < min ? `Must be at least ${min}` : null,
  max: (max) => (val) => val !== '' && val !== undefined && Number(val) > max ? `Must be at most ${max}` : null,
  numeric: (val) => val !== undefined && isNaN(Number(val)) ? 'Must be a number' : null,
};

export const validateAuth = {
  username: (val) => {
    if (!val || val.trim() === '') return 'Username is required';
    if (val.length < 2) return 'Username must be at least 2 characters';
    if (val.length > 30) return 'Username must be at most 30 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(val)) return 'Only letters, numbers, and underscores allowed';
    return null;
  },
  email: (val) => {
    if (!val || val.trim() === '') return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Enter a valid email address';
    return null;
  },
  password: (val) => {
    if (!val) return 'Password is required';
    if (val.length < 6) return 'Password must be at least 6 characters';
    if (val.length > 128) return 'Password too long';
    return null;
  },
  confirmPassword: (pass, confirm) => {
    if (!confirm) return 'Please confirm your password';
    if (pass !== confirm) return 'Passwords do not match';
    return null;
  }
};

export const validateRoom = {
  name: (val) => {
    if (!val || val.trim() === '') return 'Room name is required';
    if (val.trim().length < 1) return 'Room name is required';
    if (val.length > 60) return 'Room name must be at most 60 characters';
    return null;
  },
  code: (val) => {
    if (!val || val.trim() === '') return 'Room code is required';
    if (!/^[A-Z0-9]{4,12}$/.test(val.toUpperCase())) return 'Room code must be 4-12 letters/numbers';
    return null;
  }
};

export const validateAudioFile = (file) => {
  if (!file) return 'Please select a file';
  
  // Check MIME type
  const mimeOk = SUPPORTED_AUDIO_TYPES.includes(file.type);
  // Also check extension as a fallback (browser may report wrong MIME for some formats)
  const ext = file.name.split('.').pop()?.toLowerCase();
  const extOk = AUDIO_EXTENSIONS.includes(ext);
  
  if (!mimeOk && !extOk) {
    return `Unsupported file type. Allowed: ${AUDIO_EXTENSIONS.join(', ')}`;
  }
  
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    return `File too large. Maximum size: ${MAX_AUDIO_SIZE_MB}MB`;
  }
  
  if (file.size === 0) return 'File is empty';
  
  return null;
};

export const validateBpm = (val) => {
  const n = Number(val);
  if (isNaN(n)) return 'BPM must be a number';
  if (n < 20) return 'BPM must be at least 20';
  if (n > 300) return 'BPM must be at most 300';
  return null;
};

export const validateVolume = (val) => {
  const n = Number(val);
  if (isNaN(n)) return 'Volume must be a number';
  if (n < 0) return 'Volume cannot be negative';
  if (n > 1) return 'Volume cannot exceed 1';
  return null;
};

export const validatePan = (val) => {
  const n = Number(val);
  if (isNaN(n)) return 'Pan must be a number';
  if (n < -1) return 'Pan cannot be less than -1';
  if (n > 1) return 'Pan cannot exceed 1';
  return null;
};

export const validateClipTiming = ({ startTime, duration, offset }) => {
  const errors = {};
  if (startTime === undefined || startTime < 0) errors.startTime = 'Start time must be >= 0';
  if (!duration || duration < 0.01) errors.duration = 'Duration must be > 0';
  if (offset === undefined || offset < 0) errors.offset = 'Offset must be >= 0';
  return Object.keys(errors).length > 0 ? errors : null;
};
