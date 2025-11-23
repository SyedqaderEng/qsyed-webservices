import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import config from '../config';
import { ProcessingJob, JobStatus } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Redis connection
const connection = new IORedis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null,
});

// Create processing queue
export const processingQueue = new Queue('file-processing', { connection });

export class QueueManager {
  /**
   * Add a job to the processing queue
   */
  static async addJob(
    toolId: string,
    fileIds: string[],
    settings: any,
    userId?: string
  ): Promise<string> {
    const jobId = uuidv4();

    const jobData: ProcessingJob = {
      jobId,
      toolId,
      fileIds,
      settings,
      userId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing...',
    };

    await processingQueue.add(jobId, jobData, {
      jobId,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });

    return jobId;
  }

  /**
   * Get job status
   */
  static async getJobStatus(jobId: string): Promise<JobStatus | null> {
    const job = await processingQueue.getJob(jobId);
    if (!job) return null;

    const state = await job.getState();
    const data = job.data as ProcessingJob;

    let status: JobStatus['status'] = 'pending';
    if (state === 'completed') status = 'completed';
    else if (state === 'failed') status = 'failed';
    else if (state === 'active') status = 'processing';

    const downloadUrl = data.outputPath
      ? `${config.apiBaseUrl}/api/download/${path.basename(data.outputPath)}`
      : undefined;

    return {
      jobId,
      status,
      progress: data.progress,
      currentStep: data.currentStep,
      downloadUrl,
      outputFileId: data.outputPath ? path.basename(data.outputPath) : undefined,
      errorMessage: data.errorMessage,
      createdAt: new Date(job.timestamp),
      completedAt: job.finishedOn ? new Date(job.finishedOn) : undefined,
    };
  }

  /**
   * Update job progress
   */
  static async updateJobProgress(
    jobId: string,
    progress: number,
    currentStep: string
  ): Promise<void> {
    const job = await processingQueue.getJob(jobId);
    if (!job) return;

    const data = job.data as ProcessingJob;
    data.progress = progress;
    data.currentStep = currentStep;
    data.status = 'processing';

    await job.updateData(data);
    await job.updateProgress(progress);
  }

  /**
   * Mark job as completed
   */
  static async completeJob(jobId: string, outputPath: string): Promise<void> {
    const job = await processingQueue.getJob(jobId);
    if (!job) return;

    const data = job.data as ProcessingJob;
    data.status = 'completed';
    data.progress = 100;
    data.currentStep = 'Completed';
    data.outputPath = outputPath;

    await job.updateData(data);
  }

  /**
   * Mark job as failed
   */
  static async failJob(jobId: string, errorMessage: string): Promise<void> {
    const job = await processingQueue.getJob(jobId);
    if (!job) return;

    const data = job.data as ProcessingJob;
    data.status = 'failed';
    data.errorMessage = errorMessage;

    await job.updateData(data);
  }

  /**
   * Get all jobs for a user
   */
  static async getUserJobs(userId: string, limit = 50): Promise<JobStatus[]> {
    const jobs = await processingQueue.getJobs(['completed', 'failed', 'active', 'waiting']);

    const userJobs = jobs
      .filter((job) => (job.data as ProcessingJob).userId === userId)
      .slice(0, limit);

    return Promise.all(userJobs.map((job) => this.getJobStatus(job.id!))) as Promise<JobStatus[]>;
  }
}

import path from 'path';
