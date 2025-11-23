import express from 'express';
import { ToolController } from '../controllers/tool.controller';

const router = express.Router();

/**
 * GET /api/tools
 * Get all available tools
 */
router.get('/', ToolController.getAllTools);

/**
 * GET /api/tools/:toolId
 * Get tool details
 */
router.get('/:toolId', ToolController.getToolDetails);

/**
 * POST /api/tools/:toolId
 * Process files with a tool
 */
router.post('/:toolId', ToolController.processTool);

export default router;
