import express from 'express';

const router = express.Router();

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export default router;
