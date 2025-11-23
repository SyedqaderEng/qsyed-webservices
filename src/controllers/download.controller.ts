import { Request, Response } from 'express';
import path from 'path';
import config from '../config';
import { AppError } from '../middleware/error-handler';
import { FileHelpers } from '../utils/file-helpers';

export class DownloadController {
  /**
   * Download a processed file
   */
  static async downloadFile(req: Request, res: Response) {
    try {
      const { fileId } = req.params;

      // Security: prevent directory traversal
      if (fileId.includes('..') || fileId.includes('/') || fileId.includes('\\')) {
        throw new AppError(400, 'Invalid file ID');
      }

      // Try to find file in output directory
      const filePath = path.join(config.outputDir, fileId);

      // Check if file exists
      if (!(await FileHelpers.fileExists(filePath))) {
        throw new AppError(404, 'File not found');
      }

      // Get file info
      const fileInfo = await FileHelpers.getFileInfo(filePath);

      // Set headers
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${fileId}"`);
      res.setHeader('Content-Length', fileInfo.size);

      // Send file
      res.sendFile(filePath);
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(500, error.message || 'Download failed');
    }
  }
}
