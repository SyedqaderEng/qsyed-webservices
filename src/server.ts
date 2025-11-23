import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config';
import { errorHandler } from './middleware/error-handler';
import { FileHelpers } from './utils/file-helpers';
import { startWorker } from './workers/tool-processor';
import { loadModules } from './core/loader/module.loader';

// Import routes
import uploadRoutes from './routes/upload.routes';
import processRoutes from './routes/process.routes';
import statusRoutes from './routes/status.routes';
import toolRoutes from './routes/tool.routes';
import jobRoutes from './routes/job.routes';
import downloadRoutes from './routes/download.routes';
import healthRoutes from './routes/health.routes';
import previewRoutes from './routes/preview.routes';
import debugRoutes from './routes/debug.routes';

const app = express();

// ⭐ CORS MUST BE FIRST - Before helmet and other middleware
const allowedOrigins = config.nodeEnv === 'development'
  ? ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001', 'http://localhost:5174']
  : config.allowedOrigins;

// Enable CORS with dynamic origin
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || config.nodeEnv === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type', 'Content-Disposition'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Handle preflight requests explicitly
app.options('*', cors());

// Helmet AFTER CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes (Frontend-compatible endpoints)
app.use('/api/upload', uploadRoutes);        // POST /api/upload
app.use('/api/process', processRoutes);      // POST /api/process
app.use('/api/status', statusRoutes);        // GET /api/status/:requestId
app.use('/api/download', downloadRoutes);    // GET /api/download/:fileToken
app.use('/api/tools', toolRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/preview', previewRoutes);
app.use('/api/debug', debugRoutes);

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

    // Load processing modules
    loadModules();

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
