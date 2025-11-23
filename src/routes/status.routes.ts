import express from 'express';
import { StatusController } from '../controllers/status.controller';

const router = express.Router();

/**
 * GET /api/status/:requestId
 * Get processing status (polled by frontend every 2 seconds)
 *
 * Frontend expects exact states: queued → processing → ocr → converting → finalizing → done
 */
router.get('/:requestId', StatusController.getStatus);

export default router;
