import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import { UnauthorizedError, ForbiddenError } from '../types/errors';
import { logger } from '../config/logger';

// Extend Express Request interface to include user and accessToken
declare global {
  namespace Express {
    interface Request {
      user?: User;
      accessToken?: string;
    }
  }
}

/**
 * Extract Bearer token from Authorization header
 */
const getBearerToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.slice('Bearer '.length).trim();
};

/**
 * Middleware to require authentication
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = getBearerToken(req);
    
    if (!accessToken) {
      throw new UnauthorizedError('Missing Bearer token');
    }
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !data.user) {
      logger.warn('Invalid access token used:', {
        error: error?.message,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        path: req.path,
      });
      
      throw new UnauthorizedError(error?.message || 'Invalid access token');
    }
    
    // Attach user and token to request
    req.user = data.user;
    req.accessToken = accessToken;
    
    logger.debug('User authenticated successfully:', {
      userId: data.user.id,
      email: data.user.email,
      path: req.path,
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to optionally authenticate (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken = getBearerToken(req);
    
    if (!accessToken) {
      // No token provided, continue without authentication
      next();
      return;
    }
    
    // Verify token with Supabase
    const { data, error } = await supabase.auth.getUser(accessToken);
    
    if (!error && data.user) {
      // Valid token, attach user to request
      req.user = data.user;
      req.accessToken = accessToken;
    }
    
    // Continue regardless of token validity
    next();
  } catch (error) {
    // Log error but don't fail the request
    logger.warn('Optional auth failed:', error);
    next();
  }
};

/**
 * Middleware to require admin role
 */
export const requireAdmin = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }
    
    // Check if user has admin role (you'll need to implement role checking based on your schema)
    const userMetadata = req.user.user_metadata || {};
    const appMetadata = req.user.app_metadata || {};
    
    const isAdmin = 
      userMetadata.role === 'admin' || 
      appMetadata.role === 'admin' ||
      appMetadata.roles?.includes('admin');
    
    if (!isAdmin) {
      logger.warn('Unauthorized admin access attempt:', {
        userId: req.user.id,
        email: req.user.email,
        path: req.path,
      });
      
      throw new ForbiddenError('Admin access required');
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require specific role
 */
export const requireRole = (requiredRole: string) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      const userMetadata = req.user.user_metadata || {};
      const appMetadata = req.user.app_metadata || {};
      
      const userRole = userMetadata.role || appMetadata.role;
      const userRoles = appMetadata.roles || [];
      
      const hasRole = userRole === requiredRole || userRoles.includes(requiredRole);
      
      if (!hasRole) {
        logger.warn('Unauthorized role access attempt:', {
          userId: req.user.id,
          email: req.user.email,
          requiredRole,
          userRole,
          userRoles,
          path: req.path,
        });
        
        throw new ForbiddenError(`Role '${requiredRole}' required`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user owns resource
 */
export const requireOwnership = (userIdPath: string = 'userId') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      
      // Extract user ID from params, body, or query
      const resourceUserId = 
        req.params[userIdPath] || 
        req.body[userIdPath] || 
        req.query[userIdPath];
      
      if (!resourceUserId) {
        throw new ForbiddenError('Resource ownership cannot be verified');
      }
      
      if (req.user.id !== resourceUserId) {
        logger.warn('Unauthorized ownership access attempt:', {
          userId: req.user.id,
          resourceUserId,
          path: req.path,
        });
        
        throw new ForbiddenError('You can only access your own resources');
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};