import { Request, Response } from 'express';
import path from 'path';
import { ApiResponse, UploadedFile } from '../types';
import { AppError } from '../middleware/error-handler';
import { FileHelpers } from '../utils/file-helpers';

export class UploadController {
  /**
   * Upload a single file
   */
  static async uploadSingle(req: Request, res: Response<ApiResponse<UploadedFile>>) {
    try {
      if (!req.file) {
        throw new AppError(400, 'No file uploaded');
      }

      const fileId = path.basename(req.file.filename, path.extname(req.file.filename));

      const uploadedFile: UploadedFile = {
        fileId,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
        uploadedAt: new Date(),
      };

      res.json({
        success: true,
        data: uploadedFile,
        message: 'File uploaded successfully',
      });
    } catch (error: any) {
      throw new AppError(500, error.message || 'Upload failed');
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultiple(req: Request, res: Response<ApiResponse<UploadedFile[]>>) {
    try {
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw new AppError(400, 'No files uploaded');
      }

      const uploadedFiles: UploadedFile[] = req.files.map((file) => {
        const fileId = path.basename(file.filename, path.extname(file.filename));
        return {
          fileId,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: file.path,
          uploadedAt: new Date(),
        };
      });

      res.json({
        success: true,
        data: uploadedFiles,
        message: `${uploadedFiles.length} files uploaded successfully`,
      });
    } catch (error: any) {
      throw new AppError(500, error.message || 'Upload failed');
    }
  }
}
