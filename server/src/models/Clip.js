import mongoose from 'mongoose';

const clipSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  trackId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true,
    index: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AudioAsset',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  startTime: {
    type: Number,
    required: true,
    default: 0
  },
  duration: {
    type: Number,
    required: true,
    default: 1
  },
  offset: {
    type: Number,
    required: true,
    default: 0
  },
  color: {
    type: String,
    default: 'bg-purple-500'
  }
}, { timestamps: true });

clipSchema.index({ roomId: 1, trackId: 1 });
clipSchema.index({ roomId: 1, startTime: 1 });

export default mongoose.model('Clip', clipSchema);
