import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { RateLimitError } from '../types/errors';
import { logger } from '../config/logger';

// Rate limit configuration
const rateLimitConfig = {
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  standardHeaders: true,
  legacyHeaders: false,
};

// Custom error handler for rate limiting
const rateLimitErrorHandler = (req: Request, res: Response) => {
  logger.warn('Rate limit exceeded:', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    method: req.method,
  });

  const error = new RateLimitError('Too many requests, please try again later');
  
  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      retryAfter: Math.ceil(rateLimitConfig.windowMs / 1000),
      requestId: req.headers['x-request-id'] as string || 'unknown',
    },
  });
};

// General rate limiter
export const generalRateLimit = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.maxRequests,
  message: rateLimitErrorHandler,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path.startsWith('/health');
  },
});

// Strict rate limiter for authentication endpoints
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: rateLimitErrorHandler,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
  skipSuccessfulRequests: true, // Don't count successful auth attempts
});

// Moderate rate limiter for content creation
export const createContentRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 posts/comments per minute
  message: rateLimitErrorHandler,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
});

// Lenient rate limiter for read operations
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: rateLimitErrorHandler,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
});

// Very strict rate limiter for password reset
export const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: rateLimitErrorHandler,
  standardHeaders: rateLimitConfig.standardHeaders,
  legacyHeaders: rateLimitConfig.legacyHeaders,
});

// API key based rate limiting (for future API key implementation)
export const createApiKeyRateLimit = (maxRequests: number, windowMs: number) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    message: rateLimitErrorHandler,
    standardHeaders: rateLimitConfig.standardHeaders,
    legacyHeaders: rateLimitConfig.legacyHeaders,
  keyGenerator: (req: Request): string => {
    // Use API key if available, otherwise fall back to IP
    return (req.headers['x-api-key'] as string) || req.ip || 'unknown';
  },
  });
};

// Dynamic rate limiting based on user role
export const createUserRoleRateLimit = (
  limits: { [role: string]: { max: number; windowMs: number } }
) => {
  return rateLimit({
    windowMs: 60 * 1000, // Default window
    max: (req: Request) => {
      const user = (req as any).user;
      if (user && user.user_metadata?.role && limits[user.user_metadata.role]) {
        return limits[user.user_metadata.role].max;
      }
      return limits.default?.max || 60; // Default limit
    },
    message: rateLimitErrorHandler,
    standardHeaders: rateLimitConfig.standardHeaders,
    legacyHeaders: rateLimitConfig.legacyHeaders,
  });
};

// Sliding window rate limiter (more sophisticated)
export const createSlidingWindowRateLimit = (maxRequests: number, windowMs: number) => {
  const requestCounts = new Map<string, number[]>();

  return (req: Request, res: Response, next: () => void) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const windowStart = now - windowMs;

    // Get or create request timestamps for this IP
    let timestamps = requestCounts.get(key) || [];
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (timestamps.length >= maxRequests) {
      logger.warn('Sliding window rate limit exceeded:', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        requestCount: timestamps.length,
        limit: maxRequests,
      });

      return rateLimitErrorHandler(req, res);
    }

    // Add current request timestamp
    timestamps.push(now);
    requestCounts.set(key, timestamps);

    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance to clean up
      for (const [ip, times] of requestCounts.entries()) {
        const validTimes = times.filter(time => time > windowStart);
        if (validTimes.length === 0) {
          requestCounts.delete(ip);
        } else {
          requestCounts.set(ip, validTimes);
        }
      }
    }

    next();
  };
};

// Rate limiting middleware with custom logic
export const smartRateLimit = (req: Request, res: Response, next: () => void) => {
  const isAuthenticated = !!(req as any).user;
  const userRole = (req as any).user?.user_metadata?.role || 'anonymous';
  
  // Different limits based on authentication and role
  let limit = 60; // Default
  
  if (userRole === 'admin') {
    limit = 1000;
  } else if (userRole === 'moderator') {
    limit = 500;
  } else if (isAuthenticated) {
    limit = 200;
  }

  // Apply the appropriate rate limit
  const dynamicRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: limit,
    message: rateLimitErrorHandler,
    standardHeaders: true,
    legacyHeaders: false,
  });

  dynamicRateLimit(req, res, next);
};