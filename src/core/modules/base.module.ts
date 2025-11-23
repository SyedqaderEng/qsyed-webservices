/**
 * Base Module Class
 * Provides common functionality for all processing modules
 */

import fs from 'fs/promises';
import {
  ProcessingModule,
  FileMeta,
  ValidationResult,
  ExecutionContext,
  ExecutionResult,
  ModuleCapabilities,
} from '../interfaces/module.interface';

export abstract class BaseModule implements ProcessingModule {
  abstract readonly name: string;
  abstract readonly category: string;
  abstract readonly version: string;
  abstract readonly description: string;

  /**
   * Get module capabilities - must be implemented by subclass
   */
  abstract capabilities(): ModuleCapabilities;

  /**
   * Execute the action - must be implemented by subclass
   */
  abstract execute(
    inputPath: string,
    action: string,
    options: any,
    context: ExecutionContext
  ): Promise<ExecutionResult>;

  /**
   * Validate options against action schema
   */
  validate(options: any, fileMeta: FileMeta): ValidationResult {
    const capabilities = this.capabilities();

    // Basic validation - subclasses can override for custom validation
    for (const [actionName, actionDef] of Object.entries(capabilities.actions)) {
      // Check MIME type
      if (!actionDef.inputTypes.includes(fileMeta.mimeType)) {
        return {
          valid: false,
          error: `Invalid file type. Expected one of: ${actionDef.inputTypes.join(', ')}, got: ${fileMeta.mimeType}`,
        };
      }

      // Check required options
      const schema = actionDef.options;
      if (schema.required) {
        for (const required of schema.required) {
          if (options[required] === undefined) {
            return {
              valid: false,
              error: `Missing required option: ${required}`,
              details: { field: required },
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Cleanup temporary files
   */
  async cleanup(paths: string[]): Promise<void> {
    for (const filePath of paths) {
      try {
        await fs.unlink(filePath);
      } catch (error) {
        // Ignore errors - file might not exist
        console.warn(`Failed to cleanup file: ${filePath}`, error);
      }
    }
  }

  /**
   * Estimate cost units - default implementation, can be overridden
   */
  estimateCost(action: string, options: any, fileMeta: FileMeta): number {
    // Default cost estimation based on file size
    const sizeMB = fileMeta.size / (1024 * 1024);
    return Math.max(1, Math.ceil(sizeMB * 0.5)); // 0.5 units per MB
  }

  /**
   * Validate file exists and is readable
   */
  protected async validateFile(filePath: string): Promise<void> {
    try {
      await fs.access(filePath, fs.constants.R_OK);
      const stats = await fs.stat(filePath);
      if (stats.size === 0) {
        throw new Error('File is empty');
      }
    } catch (error: any) {
      throw new Error(`File validation failed: ${error.message}`);
    }
  }

  /**
   * Get file size in bytes
   */
  protected async getFileSize(filePath: string): Promise<number> {
    const stats = await fs.stat(filePath);
    return stats.size;
  }

  /**
   * Helper to update progress
   */
  protected async updateProgress(
    context: ExecutionContext,
    progress: number,
    message: string
  ): Promise<void> {
    await context.updateProgress(progress, message);
  }
}
