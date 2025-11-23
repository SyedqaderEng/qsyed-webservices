/**
 * Universal Files API Routes
 * Handles file upload, preview, and download for all tools
 */

import { Router } from 'express';
import { FilesController } from '../../controllers/v2/files.controller';
import { uploadSingle, uploadMultiple } from '../../middleware/upload';

const router = Router();

/**
 * POST /api/files/upload
 * Upload single or multiple files
 */
router.post('/upload', uploadSingle, FilesController.upload);
router.post('/upload/multiple', uploadMultiple, FilesController.uploadMultiple);

/**
 * GET /api/files/:fileId/preview
 * Get file preview (thumbnails, metadata, page list, etc.)
 */
router.get('/:fileId/preview', FilesController.getPreview);

/**
 * GET /api/files/:fileId/metadata
 * Get file metadata
 */
router.get('/:fileId/metadata', FilesController.getMetadata);

/**
 * GET /api/files/:fileId/download
 * Download original file
 */
router.get('/:fileId/download', FilesController.download);

/**
 * DELETE /api/files/:fileId
 * Delete file
 */
router.delete('/:fileId', FilesController.deleteFile);

export default router;
