import express from 'express';
import { JobController } from '../controllers/job.controller';

const router = express.Router();

/**
 * GET /api/jobs/:jobId
 * Get job status
 */
router.get('/:jobId', JobController.getJobStatus);

/**
 * GET /api/jobs
 * Get all jobs (with optional user filtering)
 */
router.get('/', JobController.getAllJobs);

export default router;
