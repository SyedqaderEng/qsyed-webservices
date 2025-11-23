import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import { ProcessingJob } from '../types';
import { QueueManager } from '../queue/queue-manager';

// Import all tool services
import * as PdfService from '../services/pdf';
import * as WordService from '../services/word';
import * as ExcelService from '../services/excel';
import * as ImageService from '../services/image';
import * as VideoService from '../services/video';
import * as AudioService from '../services/audio';
import * as ArchiveService from '../services/archive';
import * as UtilityService from '../services/utility';

// Redis connection
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

/**
 * Process a job based on the tool ID
 */
async function processJob(job: Job<ProcessingJob>) {
  const { jobId, toolId, fileIds, settings } = job.data;

  console.log(`Processing job ${jobId} with tool ${toolId}`);

  try {
    // Update progress
    await QueueManager.updateJobProgress(jobId, 10, 'Starting processing...');

    // Route to appropriate service based on tool ID
    let outputPath: string;

    // PDF Tools
    if (toolId.startsWith('pdf-')) {
      outputPath = await PdfService.processPdfTool(toolId, fileIds, settings, jobId);
    }
    // Word Tools
    else if (toolId.startsWith('word-')) {
      outputPath = await WordService.processWordTool(toolId, fileIds, settings, jobId);
    }
    // Excel Tools
    else if (toolId.startsWith('excel-') || toolId.startsWith('csv-')) {
      outputPath = await ExcelService.processExcelTool(toolId, fileIds, settings, jobId);
    }
    // Image Tools
    else if (toolId.startsWith('image-')) {
      outputPath = await ImageService.processImageTool(toolId, fileIds, settings, jobId);
    }
    // Video Tools
    else if (toolId.startsWith('video-')) {
      outputPath = await VideoService.processVideoTool(toolId, fileIds, settings, jobId);
    }
    // Audio Tools
    else if (toolId.startsWith('audio-')) {
      outputPath = await AudioService.processAudioTool(toolId, fileIds, settings, jobId);
    }
    // Archive Tools
    else if (toolId.startsWith('zip-') || toolId.startsWith('rar-') || toolId.startsWith('7z-') || toolId.startsWith('tar-') || toolId.startsWith('archive-')) {
      outputPath = await ArchiveService.processArchiveTool(toolId, fileIds, settings, jobId);
    }
    // Utility Tools
    else {
      outputPath = await UtilityService.processUtilityTool(toolId, fileIds, settings, jobId);
    }

    // Mark as completed
    await QueueManager.completeJob(jobId, outputPath);
    console.log(`Job ${jobId} completed successfully`);

    return { success: true, outputPath };
  } catch (error: any) {
    console.error(`Job ${jobId} failed:`, error);
    await QueueManager.failJob(jobId, error.message || 'Processing failed');
    throw error;
  }
}

/**
 * Create and start the worker
 */
export function startWorker() {
  const worker = new Worker('file-processing', processJob, {
    connection,
    concurrency: config.workerConcurrency,
  });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('Worker error:', err);
  });

  console.log(`Worker started with concurrency: ${config.workerConcurrency}`);

  return worker;
}
