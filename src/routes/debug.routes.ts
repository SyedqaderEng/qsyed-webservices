import { Router } from 'express';
import { DebugController } from '../controllers/debug.controller';

const router = Router();

// Debug endpoints (only for development)
router.get('/files', DebugController.listUploadedFiles);
router.get('/file/:fileId', DebugController.getFileInfo);

export default router;
