// Type definitions for the file processing platform

export interface UploadedFile {
  fileId: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: Date;
}

export interface JobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  currentStep?: string;
  downloadUrl?: string;
  outputFileId?: string;
  errorMessage?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface ToolSettings {
  [key: string]: any;
}

export interface ProcessingJob {
  jobId: string;
  toolId: string;
  fileIds: string[];
  settings: ToolSettings;
  userId?: string;
  status: JobStatus['status'];
  progress: number;
  currentStep: string;
  outputPath?: string;
  errorMessage?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  acceptedFormats: string[];
  multipleFiles: boolean;
  settings: ToolSettingDefinition[];
}

export type ToolCategory =
  | 'pdf'
  | 'word'
  | 'excel'
  | 'image'
  | 'video'
  | 'audio'
  | 'archive'
  | 'utility';

export interface ToolSettingDefinition {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  label: string;
  default?: any;
  required?: boolean;
  options?: Array<{ value: any; label: string }>;
  min?: number;
  max?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
