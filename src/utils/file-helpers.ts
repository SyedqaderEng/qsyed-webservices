import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import config from '../config';

export class FileHelpers {
  /**
   * Ensure a directory exists, create if it doesn't
   */
  static async ensureDir(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Generate a unique file ID
   */
  static generateFileId(): string {
    return uuidv4();
  }

  /**
   * Get file extension from filename
   */
  static getFileExtension(filename: string): string {
    return path.extname(filename).toLowerCase();
  }

  /**
   * Parse file size string (e.g., "100MB") to bytes
   */
  static parseFileSize(sizeStr: string): number {
    const units: Record<string, number> = {
      B: 1,
      KB: 1024,
      MB: 1024 * 1024,
      GB: 1024 * 1024 * 1024,
    };

    const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*([A-Z]+)$/i);
    if (!match) return 0;

    const [, size, unit] = match;
    return parseFloat(size) * (units[unit.toUpperCase()] || 1);
  }

  /**
   * Format bytes to human-readable size
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * Clean up old files based on retention policy
   */
  static async cleanupOldFiles(): Promise<void> {
    const dirs = [config.uploadDir, config.tempDir, config.outputDir];
    const maxAge = config.fileRetentionHours * 60 * 60 * 1000; // Convert to milliseconds
    const now = Date.now();

    for (const dir of dirs) {
      try {
        await FileHelpers.ensureDir(dir);
        const files = await fs.readdir(dir);

        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);

          if (now - stats.mtimeMs > maxAge) {
            await fs.unlink(filePath);
            console.log(`Cleaned up old file: ${filePath}`);
          }
        }
      } catch (error) {
        console.error(`Error cleaning up directory ${dir}:`, error);
      }
    }
  }

  /**
   * Delete a file safely
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
    }
  }

  /**
   * Copy a file
   */
  static async copyFile(source: string, destination: string): Promise<void> {
    await fs.copyFile(source, destination);
  }

  /**
   * Check if file exists
   */
  static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file info
   */
  static async getFileInfo(filePath: string) {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
    };
  }
}
