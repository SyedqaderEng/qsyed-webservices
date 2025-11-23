import { Request, Response } from 'express';
import { ApiResponse, JobStatus } from '../types';
import { AppError } from '../middleware/error-handler';
import { QueueManager } from '../queue/queue-manager';

interface StatusResponse {
  requestId: string;
  status: 'queued' | 'processing' | 'ocr' | 'converting' | 'finalizing' | 'done' | 'failed';
  progress: number;
  currentStep: string;
  fileToken?: string; // Download token when status is 'done'
  errorMessage?: string;
}

export class StatusController {
  /**
   * Get processing status by requestId
   * Frontend polls this every 2 seconds
   */
  static async getStatus(
    req: Request,
    res: Response<ApiResponse<StatusResponse>>
  ) {
    try {
      const { requestId } = req.params;

      // Get job status (requestId is the same as jobId internally)
      const jobStatus = await QueueManager.getJobStatus(requestId);

      if (!jobStatus) {
        throw new AppError(404, `Request '${requestId}' not found`);
      }

      // Map internal status to frontend-expected status
      const status = StatusController.mapStatus(jobStatus.status, jobStatus.currentStep);

      // Prepare response in frontend format
      const response: StatusResponse = {
        requestId,
        status,
        progress: jobStatus.progress || 0,
        currentStep: jobStatus.currentStep || '',
      };

      // Add fileToken when processing is done
      if (status === 'done' && jobStatus.outputFileId) {
        response.fileToken = jobStatus.outputFileId;
      }

      // Add error message if failed
      if (status === 'failed' && jobStatus.errorMessage) {
        response.errorMessage = jobStatus.errorMessage;
      }

      res.json({
        success: true,
        data: response,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Failed to fetch status');
    }
  }

  /**
   * Map internal job status to frontend-expected status
   * Frontend expects: queued → processing → ocr → converting → finalizing → done
   */
  private static mapStatus(
    internalStatus: string,
    currentStep?: string
  ): 'queued' | 'processing' | 'ocr' | 'converting' | 'finalizing' | 'done' | 'failed' {
    // Direct mappings
    if (internalStatus === 'queued') return 'queued';
    if (internalStatus === 'failed') return 'failed';
    if (internalStatus === 'done' || internalStatus === 'completed') return 'done';

    // Map based on current step for processing states
    if (internalStatus === 'processing') {
      if (!currentStep) return 'processing';

      const step = currentStep.toLowerCase();

      if (step.includes('ocr') || step.includes('scanning') || step.includes('recogni')) {
        return 'ocr';
      }
      if (step.includes('convert') || step.includes('generat') || step.includes('creat')) {
        return 'converting';
      }
      if (step.includes('final') || step.includes('saving') || step.includes('writing')) {
        return 'finalizing';
      }

      return 'processing';
    }

    // Fallback
    return 'processing';
  }
}
