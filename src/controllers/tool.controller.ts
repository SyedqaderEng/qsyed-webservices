import { Request, Response } from 'express';
import { ApiResponse, ToolDefinition } from '../types';
import { AppError } from '../middleware/error-handler';
import { QueueManager } from '../queue/queue-manager';
import { ToolRegistry } from '../services/tool-registry';

export class ToolController {
  /**
   * Get all available tools
   */
  static async getAllTools(req: Request, res: Response<ApiResponse<ToolDefinition[]>>) {
    try {
      const category = req.query.category as string | undefined;
      const tools = ToolRegistry.getAllTools(category);

      res.json({
        success: true,
        data: tools,
      });
    } catch (error: any) {
      throw new AppError(500, error.message || 'Failed to fetch tools');
    }
  }

  /**
   * Get tool details
   */
  static async getToolDetails(req: Request, res: Response<ApiResponse<ToolDefinition>>) {
    try {
      const { toolId } = req.params;
      const tool = ToolRegistry.getTool(toolId);

      if (!tool) {
        throw new AppError(404, `Tool '${toolId}' not found`);
      }

      res.json({
        success: true,
        data: tool,
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Failed to fetch tool details');
    }
  }

  /**
   * Process files with a tool
   */
  static async processTool(req: Request, res: Response<ApiResponse<{ jobId: string }>>) {
    try {
      const { toolId } = req.params;
      const { fileIds, settings = {}, userId } = req.body;

      // Validate tool exists
      const tool = ToolRegistry.getTool(toolId);
      if (!tool) {
        throw new AppError(404, `Tool '${toolId}' not found`);
      }

      // Validate file IDs
      if (!fileIds || (Array.isArray(fileIds) ? fileIds.length === 0 : !fileIds)) {
        throw new AppError(400, 'No file IDs provided');
      }

      // Convert single fileId to array
      const fileIdArray = Array.isArray(fileIds) ? fileIds : [fileIds];

      // Validate multiple files requirement
      if (tool.multipleFiles && fileIdArray.length < 2) {
        throw new AppError(400, `Tool '${toolId}' requires multiple files`);
      }

      // Add job to queue
      const jobId = await QueueManager.addJob(toolId, fileIdArray, settings, userId);

      res.json({
        success: true,
        data: { jobId },
        message: 'Processing job created successfully',
      });
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Failed to create processing job');
    }
  }
}
