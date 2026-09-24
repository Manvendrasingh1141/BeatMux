import mongoose from 'mongoose';

const AudioAssetSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true, index: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: { type: String, required: true },
  storageKey: { type: String, required: true, unique: true },
  mimeType: { type: String, required: true },
  size: { type: Number, required: true },
  duration: { type: Number, required: true }, // in seconds
  sampleRate: { type: Number },
  channels: { type: Number },
  waveformStatus: { type: String, enum: ['UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED'], default: 'UPLOADING' },
  waveformKey: { type: String } // Storage key for waveform JSON
}, { timestamps: true });

AudioAssetSchema.index({ roomId: 1, createdAt: -1 });
AudioAssetSchema.index({ ownerId: 1 });

export default mongoose.model('AudioAsset', AudioAssetSchema);
