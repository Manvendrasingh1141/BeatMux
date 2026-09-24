import mongoose from 'mongoose';
import AudioAsset from '../../models/AudioAsset.js';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export const requestUploadUrl = async (roomId, ownerId, originalName, mimeType, size) => {
  const assetId = new mongoose.Types.ObjectId();
  const folder = `syncwave/${roomId}`;
  const publicId = assetId.toString();

  const { StorageService } = await import('../storage/storage.service.js');
  const signatureData = StorageService.generateUploadSignature(folder, publicId);

  const storageKey = `${folder}/${publicId}`;
  
  const asset = await AudioAsset.create({
    _id: assetId,
    roomId,
    ownerId,
    originalName,
    storageKey,
    mimeType,
    size,
    duration: 0,
    waveformStatus: 'UPLOADING'
  });

  return { asset, signatureData };
};

export const processAssetComplete = async (assetId, duration) => {
  const asset = await AudioAsset.findById(assetId);
  if (!asset) throw new Error('Asset not found');

  // Skip actual waveform generation for now since file is on Cloudinary
  // In a real system, we'd trigger a background job to download/process or use Cloudinary's waveform generation.
  asset.duration = duration || 10; 
  asset.sampleRate = 44100;
  asset.channels = 2;

  // We can use Cloudinary's audio waveform generation (e.g., .png or .json if supported)
  // For now, mark it READY without a local waveform JSON.
  asset.waveformStatus = 'READY';
  await asset.save();

  return asset;
};

export const getAssetsByRoom = async (roomId, { limit = 50, page = 1 } = {}) => {
  const skip = (page - 1) * limit;
  return await AudioAsset.find({ roomId })
    .select('_id originalName duration size mimeType waveformStatus waveformKey storageKey createdAt')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

export const getAssetById = async (assetId) => {
  return await AudioAsset.findById(assetId);
};

export const processLocalUpload = async (roomId, ownerId, file) => {
  const assetId = new mongoose.Types.ObjectId();
  const storageKey = file.filename; // multer generated name
  
  const asset = await AudioAsset.create({
    _id: assetId,
    roomId,
    ownerId,
    originalName: file.originalname,
    storageKey: storageKey,
    mimeType: file.mimetype,
    size: file.size,
    duration: 10,
    waveformStatus: 'READY'
  });

  return asset;
};
