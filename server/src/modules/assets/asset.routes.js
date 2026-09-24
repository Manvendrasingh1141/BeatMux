import multer from 'multer';
import { Router } from 'express';
import { requestUploadUrl, completeUpload, getAssets, uploadLocal } from './asset.controller.js';
import { requireAuth } from '../auth/auth.middleware.js';
import { assetUploadRateLimiter } from '../../middleware/rateLimiter.js';
import { validate } from '../../validation/validate.js';
import { assetSchemas } from '../../validation/schemas.js';

const upload = multer({ dest: 'uploads/' });
const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post('/upload-url', assetUploadRateLimiter, validate(assetSchemas.requestUpload), requestUploadUrl);
router.post('/upload', assetUploadRateLimiter, upload.single('file'), uploadLocal);
router.post('/:assetId/complete', completeUpload);
router.get('/', getAssets);

export default router;
