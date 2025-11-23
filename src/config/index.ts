import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  // Server
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3000',

  // File Upload
  maxFileSize: process.env.MAX_FILE_SIZE || '100MB',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  tempDir: path.resolve(process.env.TEMP_DIR || './temp'),
  outputDir: path.resolve(process.env.OUTPUT_DIR || './outputs'),

  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
  },

  // Security
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],

  // File Retention
  fileRetentionHours: parseInt(process.env.FILE_RETENTION_HOURS || '24', 10),

  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // External APIs
  externalApis: {
    removeBgApiKey: process.env.REMOVE_BG_API_KEY,
    deeplApiKey: process.env.DEEPL_API_KEY,
    googleTranslateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
  },

  // Workers
  workerConcurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
};

export default config;
