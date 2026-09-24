import { sendSuccess, sendError } from '../../utils/response.js';
import * as assetService from './asset.service.js';
import { getRoomByCode } from '../rooms/room.service.js';

export const requestUploadUrl = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomCode } = req.params;
    const { originalName, mimeType, size } = req.body;

    const room = await getRoomByCode(roomCode);
    if (!room) return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);

    const isMember = room.members.some(m => m.userId._id.toString() === userId);
    if (!isMember) return sendError(res, 'Not a member', 'UNAUTHORIZED', 403);

    const result = await assetService.requestUploadUrl(room._id, userId, originalName, mimeType, size);
    sendSuccess(res, result);
  } catch (error) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const completeUpload = async (req, res) => {
  try {
    const { assetId } = req.params;
    const { duration } = req.body;
    const asset = await assetService.processAssetComplete(assetId, duration);
    sendSuccess(res, { asset });
  } catch (error) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const getAssets = async (req, res) => {
  try {
    const { roomCode } = req.params;
    const room = await getRoomByCode(roomCode);
    if (!room) return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);

    const assets = await assetService.getAssetsByRoom(room._id);
    sendSuccess(res, { assets });
  } catch (error) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};

export const uploadLocal = async (req, res) => {
  try {
    const userId = req.user.id;
    const { roomCode } = req.params;
    const file = req.file;

    if (!file) return sendError(res, 'No file uploaded', 'BAD_REQUEST', 400);

    const room = await getRoomByCode(roomCode);
    if (!room) return sendError(res, 'Room not found', 'ROOM_NOT_FOUND', 404);

    const isMember = room.members.some(m => m.userId._id.toString() === userId);
    if (!isMember) return sendError(res, 'Not a member', 'UNAUTHORIZED', 403);

    const asset = await assetService.processLocalUpload(room._id, userId, file);
    sendSuccess(res, { asset });
  } catch (error) {
    sendError(res, error.message, 'SERVER_ERROR', 500);
  }
};
