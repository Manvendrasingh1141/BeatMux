import Room from '../../models/Room.js';
import crypto from 'crypto';

const generateRoomCode = async () => {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    code = crypto.randomBytes(3).toString('hex').toUpperCase();
    const existing = await Room.findOne({ roomCode: code });
    if (!existing) {
      isUnique = true;
    }
  }
  return code;
};

export const createRoomForUser = async (userId, name) => {
  const roomCode = await generateRoomCode();
  
  const room = await Room.create({
    roomCode,
    name: name || 'My Jam Session',
    ownerId: userId,
    members: [{ userId, role: 'host' }]
  });

  return room;
};

export const getRoomByCode = async (roomCode) => {
  return await Room.findOne({ roomCode, status: 'active' }).populate('ownerId', 'username avatar').populate('members.userId', 'username avatar');
};

export const getUserRooms = async (userId) => {
  return await Room.find({ 
    status: 'active',
    $or: [{ ownerId: userId }, { 'members.userId': userId }]
  }).sort({ updatedAt: -1 }).populate('ownerId', 'username');
};

export const joinRoomUser = async (room, userId) => {
  room.members.push({ userId, role: 'editor' });
  await room.save();
  return room;
};

export const leaveRoomUser = async (room, userId) => {
  room.members = room.members.filter(m => m.userId.toString() !== userId.toString());
  await room.save();
  return room;
};
