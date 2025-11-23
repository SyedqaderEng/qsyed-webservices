/**
 * Universal Tools API Routes
 * Single endpoint for all 300+ tools
 */

import { Router } from 'express';
import { ToolsController } from '../../controllers/v2/tools.controller';

const router = Router();

/**
 * GET /api/tools
 * List all available tools
 */
router.get('/', ToolsController.listTools);

/**
 * GET /api/tools/categories
 * Get all tool categories
 */
router.get('/categories', ToolsController.getCategories);

/**
 * GET /api/tools/category/:category
 * Get tools by category
 */
router.get('/category/:category', ToolsController.getToolsByCategory);

/**
 * GET /api/tools/search
 * Search tools by keyword
 */
router.get('/search', ToolsController.searchTools);

/**
 * GET /api/tools/:toolName
 * Get specific tool details
 */
router.get('/:toolName', ToolsController.getToolInfo);

/**
 * POST /api/tools/run
 * Execute a tool (the universal endpoint for all 300+ tools)
 *
 * Body:
 * {
 *   "toolName": "pdf_split",
 *   "fileId": "f-abc123" | ["f-abc123", "f-def456"],
 *   "params": { "pagesPerFile": 5 },
 *   "batch": false
 * }
 */
router.post('/run', ToolsController.runTool);

/**
 * POST /api/tools/pipeline
 * Execute a pipeline of multiple tools
 *
 * Body:
 * {
 *   "fileId": "f-abc123",
 *   "tools": [
 *     { "toolName": "pdf_split", "params": {...} },
 *     { "toolName": "pdf_compress", "params": {...} }
 *   ]
 * }
 */
router.post('/pipeline', ToolsController.runPipeline);

/**
 * GET /api/tools/recommend/:fileId
 * Get recommended tools for a file
 */
router.get('/recommend/:fileId', ToolsController.getRecommendedTools);

export default router;
