/**
 * Requests API Routes
 * Track processing job status and results
 */

import { Router } from 'express';
import { RequestsController } from '../../controllers/v2/requests.controller';

const router = Router();

/**
 * GET /api/requests/:requestId
 * Get request status and progress
 */
router.get('/:requestId', RequestsController.getStatus);

/**
 * GET /api/requests/:requestId/logs
 * Get processing logs
 */
router.get('/:requestId/logs', RequestsController.getLogs);

/**
 * DELETE /api/requests/:requestId
 * Cancel a running request
 */
router.delete('/:requestId', RequestsController.cancelRequest);

/**
 * GET /api/requests
 * List all user requests
 */
router.get('/', RequestsController.listRequests);

export default router;
