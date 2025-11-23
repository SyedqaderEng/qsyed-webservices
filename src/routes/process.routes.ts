import express from 'express';
import { ProcessController } from '../controllers/process.controller';

const router = express.Router();

/**
 * POST /api/process
 * Universal processing endpoint that matches frontend expectations
 *
 * Request body:
 * {
 *   "fileId": "abc-123",           // Single file ID
 *   "tool": "pdf-to-word",         // Tool name (maps to toolId)
 *   "options": {                   // Tool-specific options
 *     "outputFormat": "docx",
 *     "ocrEnabled": false,
 *     "preserveLayout": true
 *   }
 * }
 */
router.post('/', ProcessController.processFile);

export default router;
