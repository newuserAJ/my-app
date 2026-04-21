import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../types/errors';
import { logger } from '../config/logger';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.headers['x-request-id'] as string || 'unknown';
  
  // Log the error
  logger.error('Error occurred:', {
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name,
    },
    request: {
      id: requestId,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: (req as any).user?.id,
    },
  });

  // Handle known application errors
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId,
      },
    };
    
    res.status(error.statusCode).json(response);
    return;
  }

  // Handle validation errors from external libraries
  if (error.name === 'ValidationError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.message,
        requestId,
      },
    };
    
    res.status(400).json(response);
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.INVALID_TOKEN,
        message: 'Invalid token',
        requestId,
      },
    };
    
    res.status(401).json(response);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token has expired',
        requestId,
      },
    };
    
    res.status(401).json(response);
    return;
  }

  // Handle Supabase errors
  if (error.message?.includes('supabase') || error.message?.includes('database')) {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: ErrorCode.DATABASE_ERROR,
        message: 'Database operation failed',
        requestId,
      },
    };
    
    res.status(500).json(response);
    return;
  }

  // Default to 500 server error
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_SERVER_ERROR,
      message: process.env.NODE_ENV === 'production' 
        ? 'Internal server error' 
        : error.message,
      requestId,
    },
  };
  
  res.status(500).json(response);
};

// Async error handler wrapper
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.RECORD_NOT_FOUND,
      message: `Route ${req.method} ${req.path} not found`,
      requestId: req.headers['x-request-id'] as string || 'unknown',
    },
  };
  
  res.status(404).json(response);
};

// Unhandled rejection handler
export const handleUnhandledRejection = (): void => {
  process.on('unhandledRejection', (reason: any) => {
    logger.error('Unhandled Rejection:', reason);
    process.exit(1);
  });
};

// Uncaught exception handler
export const handleUncaughtException = (): void => {
  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
};