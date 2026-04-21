import {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ErrorCode,
} from '../../src/types/errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with all properties', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error message',
        400,
        [{ field: 'email', message: 'Invalid email' }],
        true
      );

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Test error message');
      expect(error.statusCode).toBe(400);
      expect(error.details).toHaveLength(1);
      expect(error.details![0].field).toBe('email');
      expect(error.isOperational).toBe(true);
      expect(error.name).toBe('AppError');
    });

    it('should use default values', () => {
      const error = new AppError(
        ErrorCode.INTERNAL_SERVER_ERROR,
        'Server error'
      );

      expect(error.statusCode).toBe(500);
      expect(error.details).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });

    it('should have proper stack trace', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error'
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });

    it('should serialize to JSON correctly', () => {
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error',
        400,
        [{ field: 'email', message: 'Invalid email' }]
      );

      const json = error.toJSON();
      expect(json.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(400);
      expect(json.details).toHaveLength(1);
    });

    it('should include stack in development', () => {
      process.env.NODE_ENV = 'development';
      
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error'
      );

      const json = error.toJSON();
      expect(json.stack).toBeDefined();
    });

    it('should exclude stack in production', () => {
      process.env.NODE_ENV = 'production';
      
      const error = new AppError(
        ErrorCode.VALIDATION_ERROR,
        'Test error'
      );

      const json = error.toJSON();
      expect(json.stack).toBeUndefined();

      // Reset to test environment
      process.env.NODE_ENV = 'test';
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with correct defaults', () => {
      const error = new ValidationError('Invalid input');

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.message).toBe('Invalid input');
      expect(error.statusCode).toBe(400);
      expect(error instanceof AppError).toBe(true);
    });

    it('should include details when provided', () => {
      const details = [
        { field: 'email', message: 'Invalid email format' },
        { field: 'password', message: 'Password too weak' },
      ];

      const error = new ValidationError('Validation failed', details);

      expect(error.details).toEqual(details);
      expect(error.details).toHaveLength(2);
    });
  });

  describe('UnauthorizedError', () => {
    it('should create unauthorized error with correct defaults', () => {
      const error = new UnauthorizedError();

      expect(error.code).toBe(ErrorCode.UNAUTHORIZED);
      expect(error.message).toBe('Unauthorized access');
      expect(error.statusCode).toBe(401);
    });

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Custom unauthorized message');

      expect(error.message).toBe('Custom unauthorized message');
    });
  });

  describe('ForbiddenError', () => {
    it('should create forbidden error with correct defaults', () => {
      const error = new ForbiddenError();

      expect(error.code).toBe(ErrorCode.FORBIDDEN);
      expect(error.message).toBe('Access forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should accept custom message', () => {
      const error = new ForbiddenError('Custom forbidden message');

      expect(error.message).toBe('Custom forbidden message');
    });
  });

  describe('NotFoundError', () => {
    it('should create not found error with correct defaults', () => {
      const error = new NotFoundError();

      expect(error.code).toBe(ErrorCode.RECORD_NOT_FOUND);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
    });

    it('should accept custom resource name', () => {
      const error = new NotFoundError('User');

      expect(error.message).toBe('User not found');
    });
  });

  describe('ConflictError', () => {
    it('should create conflict error with correct properties', () => {
      const error = new ConflictError('Duplicate email address');

      expect(error.code).toBe(ErrorCode.DUPLICATE_RECORD);
      expect(error.message).toBe('Duplicate email address');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create rate limit error with correct defaults', () => {
      const error = new RateLimitError();

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED);
      expect(error.message).toBe('Rate limit exceeded');
      expect(error.statusCode).toBe(429);
    });

    it('should accept custom message', () => {
      const error = new RateLimitError('Too many login attempts');

      expect(error.message).toBe('Too many login attempts');
    });
  });

  describe('Error Code Enum', () => {
    it('should have all expected error codes', () => {
      expect(ErrorCode.UNAUTHORIZED).toBe('UNAUTHORIZED');
      expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN');
      expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR');
      expect(ErrorCode.RECORD_NOT_FOUND).toBe('RECORD_NOT_FOUND');
      expect(ErrorCode.INTERNAL_SERVER_ERROR).toBe('INTERNAL_SERVER_ERROR');
      expect(ErrorCode.RATE_LIMIT_EXCEEDED).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Inheritance Chain', () => {
    it('should maintain proper inheritance chain', () => {
      const validationError = new ValidationError('Test');
      const unauthorizedError = new UnauthorizedError('Test');

      expect(validationError instanceof AppError).toBe(true);
      expect(validationError instanceof Error).toBe(true);
      expect(unauthorizedError instanceof AppError).toBe(true);
      expect(unauthorizedError instanceof Error).toBe(true);
    });

    it('should be distinguishable by instanceof', () => {
      const validationError = new ValidationError('Test');
      const unauthorizedError = new UnauthorizedError('Test');

      expect(validationError instanceof ValidationError).toBe(true);
      expect(validationError instanceof UnauthorizedError).toBe(false);
      expect(unauthorizedError instanceof UnauthorizedError).toBe(true);
      expect(unauthorizedError instanceof ValidationError).toBe(false);
    });
  });
});