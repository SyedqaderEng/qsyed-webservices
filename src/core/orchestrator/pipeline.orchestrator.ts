/**
 * Pipeline Orchestrator
 * Core engine for executing multi-step processing pipelines
 */

import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { moduleRegistry } from '../registry/module.registry';
import {
  Pipeline,
  PipelineRequest,
  PipelineStep,
  PipelineStepExecution,
  PipelineStatus,
  PipelineResult,
} from '../interfaces/pipeline.interface';
import { FileMeta, ExecutionContext } from '../interfaces/module.interface';
import config from '../../config';

export class PipelineOrchestrator {
  private workDir: string;
  private requestsMap: Map<string, PipelineRequest> = new Map();

  constructor(workDir?: string) {
    this.workDir = workDir || path.join(config.tempDir, 'pipelines');
  }

  /**
   * Create a new pipeline request
   */
  async createRequest(
    pipeline: Pipeline,
    fileMeta: FileMeta,
    userId?: string
  ): Promise<PipelineRequest> {
    const requestId = `req-${uuidv4()}`;

    // Validate pipeline
    const validation = moduleRegistry.validatePipeline(pipeline.pipeline, fileMeta);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    // Calculate estimates
    const estimatedDuration = moduleRegistry.estimatePipelineDuration(pipeline.pipeline);
    const estimatedCost = moduleRegistry.estimatePipelineCost(pipeline.pipeline, fileMeta);

    // Check if can run sync
    const canRunSync =
      pipeline.preferSync &&
      moduleRegistry.canRunSync(pipeline.pipeline, estimatedDuration);

    // Create pipeline request
    const request: PipelineRequest = {
      requestId,
      userId,
      fileId: pipeline.fileId,
      pipeline: pipeline.pipeline,
      status: 'queued',
      currentStep: 0,
      totalSteps: pipeline.pipeline.length,
      progress: 0,
      steps: pipeline.pipeline.map((step, index) => ({
        step: index + 1,
        module: step.module,
        action: step.action,
        status: 'pending',
      })),
      createdAt: new Date(),
    };

    // Store request
    this.requestsMap.set(requestId, request);

    console.log(
      `[Orchestrator] Created request ${requestId}: ${pipeline.pipeline.length} steps, estimated ${estimatedDuration}s, ${estimatedCost} units`
    );

    return request;
  }

  /**
   * Execute a pipeline
   */
  async execute(requestId: string, inputPath: string): Promise<PipelineRequest> {
    const request = this.requestsMap.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    console.log(`[Orchestrator] Starting execution of request ${requestId}`);

    const startTime = Date.now();
    request.status = 'processing';
    request.startedAt = new Date();

    // Create work directory for this request
    const requestWorkDir = path.join(this.workDir, requestId);
    await fs.mkdir(requestWorkDir, { recursive: true });

    let currentInputPath = inputPath;
    let currentStepNumber = 1;

    try {
      // Execute each step in sequence
      for (const pipelineStep of request.pipeline) {
        const stepExecution = request.steps[currentStepNumber - 1];
        stepExecution.status = 'processing';
        stepExecution.startedAt = new Date();

        request.currentStep = currentStepNumber;
        this.updateProgress(requestId, this.calculateProgress(currentStepNumber, request.totalSteps), `Processing step ${currentStepNumber}/${request.totalSteps}`);

        console.log(
          `[Orchestrator] ${requestId} - Step ${currentStepNumber}/${request.totalSteps}: ${pipelineStep.module}.${pipelineStep.action}`
        );

        // Execute module
        const stepStartTime = Date.now();
        const module = moduleRegistry.get(pipelineStep.module);

        if (!module) {
          throw new Error(`Module not found: ${pipelineStep.module}`);
        }

        // Create execution context
        const context: ExecutionContext = {
          requestId,
          userId: request.userId,
          stepNumber: currentStepNumber,
          totalSteps: request.totalSteps,
          workDir: requestWorkDir,
          updateProgress: async (progress: number, message: string) => {
            stepExecution.progress = progress;
            const overallProgress = this.calculateProgress(currentStepNumber, request.totalSteps, progress);
            this.updateProgress(requestId, overallProgress, message);
          },
        };

        // Execute the module
        const result = await module.execute(
          currentInputPath,
          pipelineStep.action,
          pipelineStep.options,
          context
        );

        const stepDuration = Date.now() - stepStartTime;

        if (!result.success) {
          throw new Error(result.error || 'Module execution failed');
        }

        // Update step execution
        stepExecution.status = 'completed';
        stepExecution.completedAt = new Date();
        stepExecution.duration = stepDuration;
        stepExecution.costUnits = result.costUnits;
        stepExecution.progress = 100;

        console.log(
          `[Orchestrator] ${requestId} - Step ${currentStepNumber} completed in ${stepDuration}ms (${result.costUnits} units)`
        );

        // Use output as input for next step
        currentInputPath = result.outputPath;
        currentStepNumber++;
      }

      // Pipeline completed successfully
      const totalDuration = Date.now() - startTime;

      // Generate file token for download
      const fileToken = `tok-${uuidv4()}`;
      const outputFilename = this.generateOutputFilename(request);

      request.status = 'completed';
      request.completedAt = new Date();
      request.totalDuration = totalDuration;
      request.progress = 100;
      request.result = {
        fileToken,
        downloadUrl: `/api/download/${fileToken}`,
        filename: outputFilename,
        size: await this.getFileSize(currentInputPath),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      };

      // Store final output with token
      // TODO: Move to object storage and generate signed URL
      // For now, copy to output directory
      const outputPath = path.join(config.outputDir, `${fileToken}-${outputFilename}`);
      await fs.copyFile(currentInputPath, outputPath);

      console.log(
        `[Orchestrator] ${requestId} completed successfully in ${totalDuration}ms`
      );

      return request;
    } catch (error: any) {
      // Pipeline failed
      const totalDuration = Date.now() - startTime;
      const failedStep = request.steps[currentStepNumber - 1];

      if (failedStep) {
        failedStep.status = 'failed';
        failedStep.error = error.message;
        failedStep.completedAt = new Date();
      }

      request.status = 'failed';
      request.completedAt = new Date();
      request.totalDuration = totalDuration;
      request.error = {
        code: 'PIPELINE_EXECUTION_ERROR',
        message: error.message,
        step: currentStepNumber,
        module: request.pipeline[currentStepNumber - 1]?.module,
        action: request.pipeline[currentStepNumber - 1]?.action,
      };

      console.error(
        `[Orchestrator] ${requestId} failed at step ${currentStepNumber}: ${error.message}`
      );

      throw error;
    } finally {
      // Cleanup intermediate files
      try {
        await fs.rm(requestWorkDir, { recursive: true, force: true });
      } catch (error) {
        console.warn(`Failed to cleanup work directory: ${requestWorkDir}`);
      }
    }
  }

  /**
   * Get request status
   */
  getStatus(requestId: string): PipelineRequest | undefined {
    return this.requestsMap.get(requestId);
  }

  /**
   * Cancel a request
   */
  async cancel(requestId: string): Promise<void> {
    const request = this.requestsMap.get(requestId);
    if (!request) {
      throw new Error(`Request not found: ${requestId}`);
    }

    if (request.status === 'completed' || request.status === 'failed') {
      throw new Error(`Cannot cancel ${request.status} request`);
    }

    request.status = 'cancelled';
    request.completedAt = new Date();

    console.log(`[Orchestrator] Request ${requestId} cancelled`);
  }

  /**
   * Update progress
   */
  private updateProgress(requestId: string, progress: number, message?: string): void {
    const request = this.requestsMap.get(requestId);
    if (request) {
      request.progress = Math.min(100, Math.max(0, progress));
      // In real implementation, this would update database and notify via websocket
      console.log(`[Orchestrator] ${requestId} progress: ${progress}% - ${message || ''}`);
    }
  }

  /**
   * Calculate overall progress based on current step
   */
  private calculateProgress(
    currentStep: number,
    totalSteps: number,
    stepProgress: number = 0
  ): number {
    const completedSteps = currentStep - 1;
    const completedProgress = (completedSteps / totalSteps) * 100;
    const currentStepProgress = (stepProgress / totalSteps);
    return Math.floor(completedProgress + currentStepProgress);
  }

  /**
   * Generate output filename based on pipeline
   */
  private generateOutputFilename(request: PipelineRequest): string {
    const lastStep = request.pipeline[request.pipeline.length - 1];
    const module = moduleRegistry.get(lastStep.module);

    if (module) {
      const capabilities = module.capabilities();
      const action = capabilities.actions[lastStep.action];
      if (action) {
        const ext = this.getExtensionFromMimeType(action.outputType);
        return `processed-output${ext}`;
      }
    }

    return 'processed-output.bin';
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const map: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/zip': '.zip',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'video/mp4': '.mp4',
      'audio/mpeg': '.mp3',
      'text/plain': '.txt',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    };
    return map[mimeType] || '';
  }

  /**
   * Get file size
   */
  private async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Cleanup old requests (for testing)
   */
  cleanup(): void {
    this.requestsMap.clear();
  }
}

// Export singleton instance
export const pipelineOrchestrator = new PipelineOrchestrator();
