import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { errorHandler } from './middleware/error-handler';
import { FileHelpers } from './utils/file-helpers';
import { startWorker } from './workers/tool-processor';

// Import routes
import uploadRoutes from './routes/upload.routes';
import toolRoutes from './routes/tool.routes';
import jobRoutes from './routes/job.routes';
import downloadRoutes from './routes/download.routes';
import healthRoutes from './routes/health.routes';
import previewRoutes from './routes/preview.routes';

const app = express();

// Middleware
app.use(helmet());

// ⭐ CORS Configuration - MUST be before other middleware
app.use(cors({
  origin: config.nodeEnv === 'development'
    ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001']
    : config.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  maxAge: 86400, // 24 hours
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/upload', uploadRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/download', downloadRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/preview', previewRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    name: 'Qsyed Web Services API',
    version: '1.0.0',
    description: 'File processing platform with 192 tools',
    categories: [
      'PDF (35 tools)',
      'Word (25 tools)',
      'Excel/CSV (30 tools)',
      'Image (30 tools)',
      'Video (20 tools)',
      'Audio (15 tools)',
      'Archive (12 tools)',
      'Utility (25 tools)',
    ],
    endpoints: {
      upload: '/api/upload',
      tools: '/api/tools',
      jobs: '/api/jobs',
      download: '/api/download',
      health: '/api/health',
    },
    documentation: '/api-docs',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize directories
async function initializeDirectories() {
  await FileHelpers.ensureDir(config.uploadDir);
  await FileHelpers.ensureDir(config.tempDir);
  await FileHelpers.ensureDir(config.outputDir);
}

// Cleanup old files periodically (every hour)
setInterval(() => {
  FileHelpers.cleanupOldFiles().catch(console.error);
}, 60 * 60 * 1000);

// Start server
async function startServer() {
  try {
    // Initialize directories
    await initializeDirectories();

    // Start worker
    startWorker();

    // Start Express server
    app.listen(config.port, () => {
      console.log(`🚀 Server running on port ${config.port}`);
      console.log(`📁 Upload directory: ${config.uploadDir}`);
      console.log(`⚙️  Environment: ${config.nodeEnv}`);
      console.log(`🔧 Worker concurrency: ${config.workerConcurrency}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
