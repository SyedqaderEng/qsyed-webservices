import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Multer errors
  if (err.name === 'MulterError') {
    const multerError = err as any;
    if (multerError.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size exceeds the maximum allowed limit',
      });
    }
    return res.status(400).json({
      success: false,
      error: multerError.message,
    });
  }

  // Default error
  console.error('Unhandled error:', err);
  return res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};
