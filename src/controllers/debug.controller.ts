import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import config from '../config';
import { ApiResponse } from '../types';

export class DebugController {
  /**
   * List all uploaded files (for debugging)
   */
  static async listUploadedFiles(req: Request, res: Response<ApiResponse<any>>) {
    try {
      if (config.nodeEnv !== 'development') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Debug endpoints only available in development mode',
          },
        });
      }

      const files = fs.readdirSync(config.uploadDir);

      const fileDetails = files.map((filename) => {
        const filePath = path.join(config.uploadDir, filename);
        const stats = fs.statSync(filePath);

        // Read first 5 bytes to check PDF header
        let isPdf = false;
        let header = '';
        try {
          const buffer = Buffer.alloc(10);
          const fd = fs.openSync(filePath, 'r');
          fs.readSync(fd, buffer, 0, 10, 0);
          fs.closeSync(fd);
          header = buffer.toString('utf8', 0, 10).replace(/[^\x20-\x7E]/g, '.');
          isPdf = header.startsWith('%PDF-');
        } catch (error) {
          // Ignore read errors
        }

        return {
          filename,
          fileId: path.basename(filename, path.extname(filename)),
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
          created: stats.birthtime,
          modified: stats.mtime,
          extension: path.extname(filename),
          isPdf,
          header,
          fullPath: filePath,
        };
      });

      res.json({
        success: true,
        data: {
          uploadDir: config.uploadDir,
          totalFiles: files.length,
          files: fileDetails,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DEBUG_ERROR',
          message: error.message,
        },
      });
    }
  }

  /**
   * Get detailed info about a specific file
   */
  static async getFileInfo(req: Request, res: Response<ApiResponse<any>>) {
    try {
      if (config.nodeEnv !== 'development') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Debug endpoints only available in development mode',
          },
        });
      }

      const { fileId } = req.params;
      const files = fs.readdirSync(config.uploadDir);
      const file = files.find((f) => f.startsWith(fileId));

      if (!file) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'FILE_NOT_FOUND',
            message: `No file found with ID: ${fileId}`,
            details: {
              searchedIn: config.uploadDir,
              availableFiles: files.length,
            },
          },
        });
      }

      const filePath = path.join(config.uploadDir, file);
      const stats = fs.statSync(filePath);

      // Read first 100 bytes
      let header = '';
      let headerHex = '';
      try {
        const buffer = Buffer.alloc(100);
        const fd = fs.openSync(filePath, 'r');
        const bytesRead = fs.readSync(fd, buffer, 0, 100, 0);
        fs.closeSync(fd);

        header = buffer.toString('utf8', 0, bytesRead).substring(0, 50);
        headerHex = buffer.toString('hex', 0, Math.min(20, bytesRead));
      } catch (error: any) {
        header = `Error reading file: ${error.message}`;
      }

      const isPdfByHeader = header.startsWith('%PDF-');
      const isPdfByExt = path.extname(file).toLowerCase() === '.pdf';

      res.json({
        success: true,
        data: {
          filename: file,
          fileId: path.basename(file, path.extname(file)),
          fullPath: filePath,
          size: stats.size,
          sizeFormatted: `${(stats.size / 1024).toFixed(2)} KB`,
          created: stats.birthtime,
          modified: stats.mtime,
          extension: path.extname(file),
          validation: {
            isPdfByExtension: isPdfByExt,
            isPdfByHeader: isPdfByHeader,
            isValid: isPdfByExt && isPdfByHeader,
          },
          header: {
            text: header,
            hex: headerHex,
          },
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'DEBUG_ERROR',
          message: error.message,
        },
      });
    }
  }
}
