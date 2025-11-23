import { Request, Response } from 'express';
import { ApiResponse, JobStatus } from '../types';
import { AppError } from '../middleware/error-handler';
import { QueueManager } from '../queue/queue-manager';

export class JobController {
  /**
   * Get job status
   */
  static async getJobStatus(req: Request, res: Response<ApiResponse<JobStatus>>) {
    try {
      const { jobId } = req.params;
      const status = await QueueManager.getJobStatus(jobId);

      if (!status) {
        throw new AppError(404, `Job '${jobId}' not found`);
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Failed to fetch job status');
    }
  }

  /**
   * Get all jobs (optionally filtered by user)
   */
  static async getAllJobs(req: Request, res: Response<ApiResponse<JobStatus[]>>) {
    try {
      const userId = req.query.userId as string | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      let jobs: JobStatus[];

      if (userId) {
        jobs = await QueueManager.getUserJobs(userId, limit);
      } else {
        // Return empty array if no userId (for security)
        jobs = [];
      }

      res.json({
        success: true,
        data: jobs,
      });
    } catch (error: any) {
      throw new AppError(500, error.message || 'Failed to fetch jobs');
    }
  }
}
