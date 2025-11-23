/**
 * Universal Module Interface
 * All processing modules must implement this interface
 */

export interface FileMeta {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  metadata?: {
    pageCount?: number;
    duration?: number;
    dimensions?: { width: number; height: number };
    frameCount?: number;
    [key: string]: any;
  };
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: any;
}

export interface ExecutionContext {
  requestId: string;
  userId?: string;
  stepNumber: number;
  totalSteps: number;
  workDir: string;
  updateProgress: (progress: number, message: string) => Promise<void>;
}

export interface ExecutionResult {
  success: boolean;
  outputPath: string;
  metadata?: any;
  duration: number;
  costUnits: number;
  logs?: string[];
  error?: string;
}

export interface ActionCapability {
  description: string;
  inputTypes: string[];      // MIME types accepted
  outputType: string;        // MIME type produced
  options: {                 // JSON Schema for options
    type: 'object';
    properties: {
      [key: string]: any;
    };
    required?: string[];
  };
  sync: boolean;             // Can run synchronously?
  estimatedDuration: number; // Seconds for typical file
}

export interface ModuleCapabilities {
  actions: {
    [actionName: string]: ActionCapability;
  };
}

/**
 * Base interface that all processing modules must implement
 */
export interface ProcessingModule {
  /**
   * Module metadata
   */
  readonly name: string;           // e.g., "pdf.split"
  readonly category: string;       // e.g., "pdf"
  readonly version: string;        // e.g., "1.0.0"
  readonly description: string;

  /**
   * Get module capabilities (available actions and options)
   */
  capabilities(): ModuleCapabilities;

  /**
   * Validate input options before execution
   */
  validate(options: any, fileMeta: FileMeta): ValidationResult;

  /**
   * Execute the processing action
   * @param inputPath - Path to input file
   * @param options - User-provided options
   * @param context - Execution context with progress callback
   * @returns Execution result with output path
   */
  execute(
    inputPath: string,
    action: string,
    options: any,
    context: ExecutionContext
  ): Promise<ExecutionResult>;

  /**
   * Cleanup temporary files
   */
  cleanup(paths: string[]): Promise<void>;

  /**
   * Estimate cost units for this operation
   * Used for internal monitoring and quota tracking
   */
  estimateCost(action: string, options: any, fileMeta: FileMeta): number;
}
