import { Request, Response, NextFunction } from 'express';
import { requireAuth, optionalAuth, requireAdmin, requireRole } from '../../../src/middleware/auth';
import { UnauthorizedError, ForbiddenError } from '../../../src/types/errors';
import { mockSupabaseClient } from '../../helpers/testHelpers';

// Mock Supabase
jest.mock('../../../src/config/supabase', () => ({
  supabase: mockSupabaseClient,
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockReq = {
      headers: {},
      user: undefined,
      accessToken: undefined,
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      path: '/test',
    };
    mockRes = {};
    mockNext = jest.fn();
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { firstName: 'Test', lastName: 'User' },
      };

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('valid-token');
      expect(mockReq.user).toBe(mockUser);
      expect(mockReq.accessToken).toBe('valid-token');
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject request without authorization header', async () => {
      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockReq.user).toBeUndefined();
    });

    it('should reject request with invalid token format', async () => {
      mockReq.headers = { authorization: 'InvalidFormat token' };

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      expect(mockReq.user).toBeUndefined();
    });

    it('should handle Supabase errors gracefully', async () => {
      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockSupabaseClient.auth.getUser.mockRejectedValue(new Error('Network error'));

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('optionalAuth', () => {
    it('should authenticate user with valid token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
      };

      mockReq.headers = { authorization: 'Bearer valid-token' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBe(mockUser);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication when no token provided', async () => {
      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should continue without authentication when token is invalid', async () => {
      mockReq.headers = { authorization: 'Bearer invalid-token' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      await optionalAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockReq.user).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin user', async () => {
      mockReq.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        app_metadata: { role: 'admin' },
      } as any;

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow user with admin role in user_metadata', async () => {
      mockReq.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        user_metadata: { role: 'admin' },
      } as any;

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow user with admin in roles array', async () => {
      mockReq.user = {
        id: 'admin-123',
        email: 'admin@example.com',
        app_metadata: { roles: ['user', 'admin'] },
      } as any;

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject non-admin user', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { role: 'user' },
      } as any;

      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });

    it('should reject unauthenticated request', async () => {
      await requireAdmin(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
    });
  });

  describe('requireRole', () => {
    it('should allow user with matching role', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { role: 'moderator' },
      } as any;

      const middleware = requireRole('moderator');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow user with role in roles array', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'user@example.com',
        app_metadata: { roles: ['user', 'moderator'] },
      } as any;

      const middleware = requireRole('moderator');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should reject user without matching role', async () => {
      mockReq.user = {
        id: 'user-123',
        email: 'user@example.com',
        user_metadata: { role: 'user' },
      } as any;

      const middleware = requireRole('moderator');
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('Bearer token extraction', () => {
    it('should extract token from Authorization header', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockReq.headers = { authorization: 'Bearer my-access-token' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('my-access-token');
      expect(mockReq.accessToken).toBe('my-access-token');
    });

    it('should handle authorization header with extra spaces', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      mockReq.headers = { authorization: 'Bearer   token-with-spaces   ' };
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      await requireAuth(mockReq as Request, mockRes as Response, mockNext);

      expect(mockSupabaseClient.auth.getUser).toHaveBeenCalledWith('token-with-spaces');
    });
  });
});