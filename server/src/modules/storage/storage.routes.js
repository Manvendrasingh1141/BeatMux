import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import AudioAsset from '../../models/AudioAsset.js';

const router = Router();

// Handle raw byte upload without multer
router.put('/upload/:uploadId', async (req, res) => {
  try {
    const asset = await AudioAsset.findById(req.params.uploadId);
    if (!asset) return res.status(404).json({ error: 'Not found' });
    
    const fullPath = path.resolve('uploads', path.dirname(asset.storageKey));
    fs.mkdirSync(fullPath, { recursive: true });
    
    const filePath = path.resolve('uploads', asset.storageKey);
    const writeStream = fs.createWriteStream(filePath);
    
    req.pipe(writeStream);
    
    req.on('end', async () => {
      asset.waveformStatus = 'UPLOADED';
      await asset.save();
      res.json({ success: true });
    });

    req.on('error', (err) => {
      console.error('Upload stream error:', err);
      res.status(500).json({ error: err.message });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// To serve waveforms statically
router.get('/waveforms/:assetId', async (req, res) => {
  try {
    const asset = await AudioAsset.findById(req.params.assetId);
    if (!asset || !asset.waveformKey) return res.status(404).json({ error: 'Not found' });
    
    const waveformPath = path.resolve('uploads', asset.waveformKey);
    res.sendFile(waveformPath);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// To serve raw audio statically
router.get('/audio/:assetId', async (req, res) => {
  try {
    const asset = await AudioAsset.findById(req.params.assetId);
    if (!asset || !asset.storageKey) return res.status(404).json({ error: 'Not found' });
    
    res.redirect(302, `/uploads/${asset.storageKey}`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
