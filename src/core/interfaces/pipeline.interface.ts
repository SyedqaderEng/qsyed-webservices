/**
 * Pipeline Processing Interfaces
 */

export interface PipelineStep {
  module: string;      // e.g., "pdf.split"
  action: string;      // e.g., "keepPages"
  options: any;        // Module-specific options
}

export interface Pipeline {
  fileId: string;
  pipeline: PipelineStep[];
  preferSync?: boolean;
  notify?: {
    webhook?: string;
    email?: string;
  };
}

export type PipelineStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';

export interface PipelineStepExecution {
  step: number;
  module: string;
  action: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  duration?: number;
  costUnits?: number;
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface PipelineResult {
  fileToken: string;
  downloadUrl: string;
  filename: string;
  size: number;
  expiresAt: Date;
}

export interface PipelineRequest {
  requestId: string;
  userId?: string;
  fileId: string;
  pipeline: PipelineStep[];
  status: PipelineStatus;
  currentStep: number;
  totalSteps: number;
  progress: number;
  steps: PipelineStepExecution[];
  result?: PipelineResult;
  error?: {
    code: string;
    message: string;
    step?: number;
    module?: string;
    action?: string;
    details?: any;
  };
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  totalDuration?: number;
}
