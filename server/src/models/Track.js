import mongoose from 'mongoose';

const trackSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    default: 'New Track'
  },
  type: {
    type: String,
    enum: ['audio'],
    default: 'audio'
  },
  color: {
    type: String,
    default: 'bg-purple-500'
  },
  order: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

trackSchema.index({ roomId: 1, order: 1 });

export default mongoose.model('Track', trackSchema);
