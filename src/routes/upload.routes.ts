import express from 'express';
import { uploadSingle, uploadMultiple } from '../middleware/upload';
import { UploadController } from '../controllers/upload.controller';

const router = express.Router();

/**
 * POST /api/upload
 * Upload a single file
 */
router.post('/', uploadSingle, UploadController.uploadSingle);

/**
 * POST /api/upload/multiple
 * Upload multiple files
 */
router.post('/multiple', uploadMultiple, UploadController.uploadMultiple);

export default router;
