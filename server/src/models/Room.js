import mongoose from 'mongoose';

const RoomMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['host', 'editor', 'viewer'], default: 'editor' },
  joinedAt: { type: Date, default: Date.now }
}, { _id: false });

const RoomSettingsSchema = new mongoose.Schema({
  bpm: { type: Number, default: 120 },
  timeSignature: { type: [Number], default: [4, 4] }
}, { _id: false });

const RoomSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [RoomMemberSchema],
    maxMembers: { type: Number, default: 8 },
    status: { type: String, enum: ['active', 'archived'], default: 'active' },
    settings: { type: RoomSettingsSchema, default: () => ({}) },
    timelineVersion: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Add index for members.userId to efficiently query rooms a user has joined
RoomSchema.index({ 'members.userId': 1 });

export default mongoose.model('Room', RoomSchema);
