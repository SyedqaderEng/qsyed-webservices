import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import { AppError } from '../middleware/error-handler';
import { QueueManager } from '../queue/queue-manager';
import { ToolRegistry } from '../services/tool-registry';

interface ProcessRequest {
  fileId: string;
  tool: string;
  options?: Record<string, any>;
  userId?: string;
}

interface ProcessResponse {
  jobId: string;
  status: string;
  tool: string;
  fileId: string;
}

export class ProcessController {
  /**
   * Process a file with the specified tool
   * Matches frontend API expectations
   */
  static async processFile(
    req: Request<{}, {}, ProcessRequest>,
    res: Response<ApiResponse<ProcessResponse>>
  ) {
    try {
      const { fileId, tool, options = {}, userId } = req.body;

      // Validate request
      if (!fileId) {
        throw new AppError(400, 'fileId is required');
      }

      if (!tool) {
        throw new AppError(400, 'tool name is required');
      }

      // Map frontend tool names to backend tool IDs
      const toolId = ProcessController.mapToolName(tool);

      // Validate tool exists
      const toolDefinition = ToolRegistry.getTool(toolId);
      if (!toolDefinition) {
        throw new AppError(404, `Tool '${tool}' not found. Available tools can be listed at GET /api/tools`);
      }

      // Map frontend "options" to backend "settings"
      const settings = ProcessController.mapOptions(tool, options);

      // Add job to queue
      const jobId = await QueueManager.addJob(toolId, [fileId], settings, userId);

      res.json({
        success: true,
        data: {
          jobId,
          status: 'queued',
          tool: toolId,
          fileId,
        },
        message: `Processing started for ${tool}`,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Failed to process file');
    }
  }

  /**
   * Map frontend tool names to backend tool IDs
   * Handles variations like "pdf-to-word" -> "pdf_to_word"
   */
  private static mapToolName(toolName: string): string {
    // Convert kebab-case to snake_case
    return toolName.replace(/-/g, '_');
  }

  /**
   * Map frontend options to backend settings
   * Handles field name variations
   */
  private static mapOptions(tool: string, options: Record<string, any>): Record<string, any> {
    const settings: Record<string, any> = {};

    // Map common option variations
    const fieldMap: Record<string, string> = {
      'ocrEnabled': 'ocr',
      'ocrLanguage': 'ocrLanguage',
      'preserveLayout': 'preserveLayout',
      'outputFormat': 'outputFormat',
      'password': 'password',
    };

    // Map each option
    for (const [frontendKey, backendKey] of Object.entries(fieldMap)) {
      if (options[frontendKey] !== undefined) {
        settings[backendKey] = options[frontendKey];
      }
    }

    // Pass through any unmapped options
    for (const [key, value] of Object.entries(options)) {
      if (!fieldMap[key] && settings[key] === undefined) {
        settings[key] = value;
      }
    }

    return settings;
  }
}
