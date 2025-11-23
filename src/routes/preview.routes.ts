import express from 'express';
import { PreviewController } from '../controllers/preview.controller';

const router = express.Router();

/**
 * Preview and Manipulation Endpoints
 * These endpoints allow viewing and editing files before processing
 */

// PDF Preview
router.get('/pdf/:fileId/info', PreviewController.getPdfInfo);
router.get('/pdf/:fileId/page/:pageNum', PreviewController.getPdfPageImage);
router.get('/pdf/:fileId/thumbnails', PreviewController.getPdfThumbnails);

// Image Preview
router.get('/image/:fileId/info', PreviewController.getImageInfo);
router.get('/image/:fileId/preview', PreviewController.getImagePreview);

// Document Preview (Word, Excel)
router.get('/document/:fileId/info', PreviewController.getDocumentInfo);
router.get('/document/:fileId/preview', PreviewController.getDocumentPreview);

// Video/Audio Preview
router.get('/video/:fileId/info', PreviewController.getVideoInfo);
router.get('/video/:fileId/thumbnail', PreviewController.getVideoThumbnail);
router.get('/audio/:fileId/info', PreviewController.getAudioInfo);
router.get('/audio/:fileId/waveform', PreviewController.getAudioWaveform);

export default router;
