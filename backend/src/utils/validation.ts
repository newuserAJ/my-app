import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ValidationError, ErrorDetails } from '../types/errors';

// Common validation schemas
export const commonSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  uuid: z.string().uuid('Invalid UUID format'),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format'),
  positiveInteger: z.number().int().positive('Must be a positive integer'),
  nonNegativeInteger: z.number().int().min(0, 'Must be a non-negative integer'),
};

// Pagination schema
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Auth schemas
export const authSchemas = {
  register: z.object({
    email: commonSchemas.email,
    password: commonSchemas.password,
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  }),
  
  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password is required'),
  }),
  
  changePassword: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: commonSchemas.password,
  }),
  
  resetPassword: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: commonSchemas.password,
  }),
  
  forgotPassword: z.object({
    email: commonSchemas.email,
  }),
};

// User profile schemas
export const userSchemas = {
  updateProfile: z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name too long').optional(),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long').optional(),
    phoneNumber: commonSchemas.phoneNumber.optional(),
    bio: z.string().max(500, 'Bio too long').optional(),
    avatar: commonSchemas.url.optional(),
  }),
};

// Generic validation middleware factory
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      // Validate the request body, query, and params
      const validatedData = schema.parse({
        ...req.body,
        ...req.query,
        ...req.params,
      });
      
      // Replace req properties with validated data
      Object.assign(req.body, validatedData);
      Object.assign(req.query, validatedData);
      Object.assign(req.params, validatedData);
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetails[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'received' in err ? err.received : undefined,
        }));
        
        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Body validation middleware
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetails[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'received' in err ? err.received : undefined,
        }));
        
        next(new ValidationError('Request body validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Query validation middleware
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.query);
      req.query = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetails[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'received' in err ? err.received : undefined,
        }));
        
        next(new ValidationError('Query parameters validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Params validation middleware
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.params);
      req.params = validatedData;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const details: ErrorDetails[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          value: 'received' in err ? err.received : undefined,
        }));
        
        next(new ValidationError('Route parameters validation failed', details));
      } else {
        next(error);
      }
    }
  };
};

// Sanitization utilities
export const sanitize = {
  // Remove HTML tags and dangerous characters
  string: (input: string): string => {
    return input
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/[<>\"'&]/g, '') // Remove dangerous characters
      .trim();
  },
  
  // Sanitize email
  email: (email: string): string => {
    return email.toLowerCase().trim();
  },
  
  // Sanitize phone number
  phoneNumber: (phone: string): string => {
    return phone.replace(/[^\d+]/g, '');
  },
  
  // Sanitize search query
  searchQuery: (query: string): string => {
    return query
      .replace(/[^\w\s-]/g, '') // Keep only alphanumeric, spaces, and hyphens
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()
      .substring(0, 100); // Limit length
  },
};

// Request sanitization middleware
export const sanitizeRequest = (req: Request, _res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  
  // Sanitize query
  if (req.query && typeof req.query === 'object') {
    sanitizeObject(req.query);
  }
  
  next();
};

function sanitizeObject(obj: any): void {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Basic sanitization for strings
        obj[key] = obj[key].trim();
        
        // Specific sanitization based on field name
        if (key.toLowerCase().includes('email')) {
          obj[key] = sanitize.email(obj[key]);
        } else if (key.toLowerCase().includes('phone')) {
          obj[key] = sanitize.phoneNumber(obj[key]);
        } else if (key.toLowerCase().includes('search') || key.toLowerCase().includes('query')) {
          obj[key] = sanitize.searchQuery(obj[key]);
        } else {
          obj[key] = sanitize.string(obj[key]);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        sanitizeObject(obj[key]);
      } else if (Array.isArray(obj[key])) {
        obj[key].forEach((item: any, index: number) => {
          if (typeof item === 'string') {
            obj[key][index] = sanitize.string(item);
          } else if (typeof item === 'object' && item !== null) {
            sanitizeObject(item);
          }
        });
      }
    }
  }
}