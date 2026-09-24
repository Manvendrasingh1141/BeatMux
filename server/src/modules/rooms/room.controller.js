import { sendSuccess, sendError } from '../../utils/response.js';
import * as roomService from './room.service.js';

export const createRoom = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;
    
    const room = await roomService.createRoomForUser(userId, name);
    sendSuccess(res, { room }, 201);
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const getRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await roomService.getRoomByCode(roomCode);
    
    if (!room) {
      return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);
    }

    // Authorization: User must be a member to see full room data (or we let anyone see it to join?)
    // Prompt says: "This endpoint should NOT expose private/internal information unnecessarily."
    // But for join page, they need basic info before joining. Let's return public info if not joined, and full if joined.
    // Actually, prompt says "Authenticated users only" and "GET /api/rooms/:roomCode Get room information... return: roomCode, name, owner, member count, maxMembers, current user's role, settings, createdAt"
    
    const isMember = room.members.some(m => m.userId._id.toString() === req.user.id);
    const role = isMember ? room.members.find(m => m.userId._id.toString() === req.user.id).role : null;

    const responseData = {
      roomCode: room.roomCode,
      name: room.name,
      owner: room.ownerId,
      memberCount: room.members.length,
      maxMembers: room.maxMembers,
      role: role,
      settings: room.settings,
      createdAt: room.createdAt,
      members: isMember ? room.members : [] // only expose full member list if already a member
    };

    sendSuccess(res, { room: responseData });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user.id;
    const rooms = await roomService.getUserRooms(userId);
    sendSuccess(res, { rooms });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const joinRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;

    let room = await roomService.getRoomByCode(roomCode);
    if (!room) {
      return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);
    }

    if (room.status !== 'active') {
      return sendError(res, 'Room is no longer active', 'ROOM_ARCHIVED', 403);
    }

    const isMember = room.members.some(m => m.userId._id.toString() === userId);
    if (isMember) {
      return sendError(res, 'You are already a member', 'ALREADY_MEMBER', 409);
    }

    if (room.members.length >= room.maxMembers) {
      return sendError(res, 'Room is full', 'ROOM_FULL', 403);
    }

    room = await roomService.joinRoomUser(room, userId);
    room = await roomService.getRoomByCode(roomCode); // re-fetch to get populated fields

    sendSuccess(res, { room });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};

export const leaveRoom = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const userId = req.user.id;

    const room = await roomService.getRoomByCode(roomCode);
    if (!room) {
      return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);
    }

    const member = room.members.find(m => m.userId._id.toString() === userId);
    if (!member) {
      return sendError(res, 'Not a member of this room', 'NOT_ROOM_MEMBER', 403);
    }

    if (member.role === 'host') {
      const otherMembers = room.members.filter(m => m.userId._id.toString() !== userId);
      if (otherMembers.length > 0) {
        return sendError(res, 'Host cannot leave while other members are present', 'HOST_CANNOT_LEAVE', 403);
      }
    }

    await roomService.leaveRoomUser(room, userId);
    sendSuccess(res, { message: 'Left room successfully' });
  } catch (error) {
    sendError(res, 'Internal server error', 'SERVER_ERROR', 500);
  }
};
