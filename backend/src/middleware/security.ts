import { Request, Response, NextFunction } from 'express';
import { ValidationError, ForbiddenError } from '../types/errors';
import { logger } from '../config/logger';

// Security headers middleware
export const securityHeaders = (_req: Request, res: Response, next: NextFunction): void => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy (Feature Policy)
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  next();
};

// Request size limiter
export const requestSizeLimiter = (maxSize: number = 10 * 1024 * 1024) => { // 10MB default
  return (req: Request, _res: Response, next: NextFunction): void => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    
    if (contentLength > maxSize) {
      logger.warn('Request size exceeded:', {
        ip: req.ip,
        path: req.path,
        contentLength,
        maxSize,
      });
      
      throw new ValidationError('Request payload too large');
    }
    
    next();
  };
};

// IP whitelist middleware
export const ipWhitelist = (allowedIPs: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const clientIP = req.ip || 'unknown';
    
    if (!allowedIPs.includes(clientIP)) {
      logger.warn('Unauthorized IP access attempt:', {
        ip: clientIP,
        path: req.path,
        method: req.method,
      });
      
      throw new ForbiddenError('Access denied from this IP address');
    }
    
    next();
  };
};

// Request method restriction
export const allowedMethods = (methods: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!methods.includes(req.method)) {
      logger.warn('Method not allowed:', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      
      res.status(405).json({
        success: false,
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed`,
        },
      });
      return;
    }
    
    next();
  };
};

// Suspicious request detector
export const suspiciousRequestDetector = (req: Request, _res: Response, next: NextFunction): void => {
  const suspiciousPatterns = [
    /\.\./,           // Path traversal
    /<script/i,       // XSS attempts
    /union.*select/i, // SQL injection
    /javascript:/i,   // JavaScript protocol
    /vbscript:/i,     // VBScript protocol
    /onload=/i,       // Event handlers
    /onerror=/i,      // Error handlers
  ];

  const checkString = `${req.url} ${JSON.stringify(req.body)} ${JSON.stringify(req.query)}`;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(checkString)) {
      logger.error('Suspicious request detected:', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
        method: req.method,
        pattern: pattern.source,
        body: req.body,
        query: req.query,
      });
      
      throw new ForbiddenError('Suspicious request detected');
    }
  }
  
  next();
};

// User agent validation
export const validateUserAgent = (req: Request, _res: Response, next: NextFunction): void => {
    const userAgent = req.get('User-Agent') || '';
  
  if (!userAgent) {
    logger.warn('Request without User-Agent:', {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    
    // You might want to block requests without User-Agent in production
    // throw new ForbiddenError('User-Agent header required');
  }
  
  // Check for suspicious user agents
  const suspiciousAgents = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
  ];
  
  if (userAgent) {
    for (const pattern of suspiciousAgents) {
      if (pattern.test(userAgent)) {
        logger.info('Bot/crawler detected:', {
          ip: req.ip,
          userAgent,
          path: req.path,
        });
        
        // You might want to apply different rate limits for bots
        break;
      }
    }
  }
  
  next();
};

// Request frequency analyzer (simple implementation)
const requestHistory = new Map<string, number[]>();

export const requestFrequencyAnalyzer = (
  maxRequestsPerSecond: number = 10
) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    const secondAgo = now - 1000;
    
    // Get or create request history for this IP
    let history = requestHistory.get(key) || [];
    
    // Remove requests older than 1 second
    history = history.filter(timestamp => timestamp > secondAgo);
    
    // Check if too many requests in the last second
    if (history.length >= maxRequestsPerSecond) {
      logger.warn('High request frequency detected:', {
        ip: req.ip,
        path: req.path,
        requestCount: history.length,
        limit: maxRequestsPerSecond,
      });
      
      throw new ForbiddenError('Request frequency too high');
    }
    
    // Add current request
    history.push(now);
    requestHistory.set(key, history);
    
    // Clean up old entries periodically
    if (Math.random() < 0.1) { // 10% chance
      for (const [ipKey, times] of requestHistory.entries()) {
        const validTimes = times.filter(time => time > secondAgo);
        if (validTimes.length === 0) {
          requestHistory.delete(ipKey);
        } else {
          requestHistory.set(ipKey, validTimes);
        }
      }
    }
    
    next();
  };
};

// Content Security Policy middleware
export const contentSecurityPolicy = (_req: Request, res: Response, next: NextFunction): void => {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  res.setHeader('Content-Security-Policy', csp);
  next();
};

// API versioning enforcement
export const enforceApiVersion = (supportedVersions: string[] = ['v1']) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const version = (req.headers['api-version'] as string) || 'v1';
    
    if (!supportedVersions.includes(version)) {
      logger.warn('Unsupported API version requested:', {
        version,
        ip: req.ip,
        path: req.path,
      });
      
      res.status(400).json({
        success: false,
        error: {
          code: 'UNSUPPORTED_API_VERSION',
          message: `API version ${version} is not supported`,
          supportedVersions,
        },
      });
      return;
    }
    
    // Add version to request for use in routes
    (req as any).apiVersion = version;
    next();
  };
};

// Request logging with security info
export const securityLogger = (req: Request, _res: Response, next: NextFunction): void => {
  const securityInfo = {
    ip: req.ip,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    referer: req.get('Referer'),
    origin: req.get('Origin'),
    timestamp: new Date().toISOString(),
  };
  
  // Log suspicious activity
  if (req.path.includes('..') || req.path.includes('<script')) {
    logger.warn('Potentially malicious request:', securityInfo);
  }
  
  // Add security info to request for other middleware
  (req as any).securityInfo = securityInfo;
  
  next();
};

// Honeypot middleware (fake endpoints to catch bots)
export const honeypot = (path: string = '/admin') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith(path)) {
      logger.error('Honeypot triggered:', {
        ip: req.ip,
        path: req.path,
        userAgent: req.get('User-Agent'),
        method: req.method,
      });
      
      // Log this IP for potential blocking
      // In production, you might want to add this IP to a blacklist
      
      // Return fake success to not alert the attacker
      res.status(200).json({ success: true });
      return;
    }
    
    next();
  };
};