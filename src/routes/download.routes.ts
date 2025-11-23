import express from 'express';
import { DownloadController } from '../controllers/download.controller';

const router = express.Router();

/**
 * GET /api/download/:fileId
 * Download a processed file
 */
router.get('/:fileId', DownloadController.downloadFile);

export default router;
