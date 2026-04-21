import { Request, Response, NextFunction } from 'express';
import {
  securityHeaders,
  suspiciousRequestDetector,
  validateUserAgent,
  requestFrequencyAnalyzer,
  contentSecurityPolicy,
} from '../../src/middleware/security';
import { ForbiddenError } from '../../src/types/errors';

// Mock Express request and response objects
const mockRequest = (overrides = {}) => ({
  ip: '127.0.0.1',
  path: '/api/test',
  method: 'GET',
  url: '/api/test',
  body: {},
  query: {},
  get: jest.fn().mockReturnValue('Mozilla/5.0'),
  headers: {},
  ...overrides,
} as unknown as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.setHeader = jest.fn();
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as NextFunction;

describe('Security Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('securityHeaders', () => {
    it('should set all security headers', () => {
      const req = mockRequest();
      const res = mockResponse();

      securityHeaders(req, res, mockNext);

      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(res.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
      expect(res.setHeader).toHaveBeenCalledWith('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('contentSecurityPolicy', () => {
    it('should set Content-Security-Policy header', () => {
      const req = mockRequest();
      const res = mockResponse();

      contentSecurityPolicy(req, res, mockNext);

      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Security-Policy',
        expect.stringContaining("default-src 'self'")
      );
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('suspiciousRequestDetector', () => {
    it('should pass normal requests', () => {
      const req = mockRequest({
        url: '/api/posts',
        body: { title: 'Normal Post' },
        query: { page: '1' },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).not.toThrow();
      
      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect path traversal attempts', () => {
      const req = mockRequest({
        url: '/api/../../etc/passwd',
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should detect XSS attempts in URL', () => {
      const req = mockRequest({
        url: '/api/test?search=<script>alert("xss")</script>',
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should detect XSS attempts in body', () => {
      const req = mockRequest({
        body: { content: '<script>malicious()</script>' },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should detect SQL injection attempts', () => {
      const req = mockRequest({
        query: { id: "1 UNION SELECT * FROM users" },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should detect JavaScript protocol attempts', () => {
      const req = mockRequest({
        body: { url: 'javascript:alert("xss")' },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should detect event handler injection', () => {
      const req = mockRequest({
        body: { content: 'Hello <img onload="malicious()">' },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });
  });

  describe('validateUserAgent', () => {
    it('should pass requests with valid user agents', () => {
      const req = mockRequest();
      req.get = jest.fn().mockReturnValue('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
      const res = mockResponse();

      validateUserAgent(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle requests without user agent', () => {
      const req = mockRequest();
      req.get = jest.fn().mockReturnValue(undefined);
      const res = mockResponse();

      // Should not throw, just log warning
      validateUserAgent(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should detect bot user agents', () => {
      const req = mockRequest();
      req.get = jest.fn().mockReturnValue('Googlebot/2.1');
      const res = mockResponse();

      validateUserAgent(req, res, mockNext);

      expect(mockNext).toHaveBeenCalled();
      // Should still pass but log the bot detection
    });

    it('should detect crawler user agents', () => {
      const botAgents = [
        'Mozilla/5.0 (compatible; bingbot/2.0)',
        'facebookexternalhit/1.1',
        'Twitterbot/1.0',
        'LinkedInBot/1.0',
      ];

      botAgents.forEach(userAgent => {
        const req = mockRequest();
        req.get = jest.fn().mockReturnValue(userAgent);
        const res = mockResponse();

        validateUserAgent(req, res, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('requestFrequencyAnalyzer', () => {
    it('should pass normal request frequencies', () => {
      const analyzer = requestFrequencyAnalyzer(10);
      const req = mockRequest();
      const res = mockResponse();

      // Should not throw for first request
      expect(() => {
        analyzer(req, res, mockNext);
      }).not.toThrow();

      expect(mockNext).toHaveBeenCalled();
    });

    it('should block high frequency requests', () => {
      const analyzer = requestFrequencyAnalyzer(2); // Allow only 2 requests per second
      const req = mockRequest();
      const res = mockResponse();

      // First two requests should pass
      analyzer(req, res, mockNext);
      analyzer(req, res, mockNext);

      // Third request should be blocked
      expect(() => {
        analyzer(req, res, mockNext);
      }).toThrow(ForbiddenError);
    });

    it('should reset frequency counter after time window', (done) => {
      const analyzer = requestFrequencyAnalyzer(1);
      const req = mockRequest();
      const res = mockResponse();

      // First request should pass
      analyzer(req, res, mockNext);

      // Wait for time window to reset (1100ms to be safe)
      setTimeout(() => {
        // Should be able to make another request
        expect(() => {
          analyzer(req, res, mockNext);
        }).not.toThrow();
        done();
      }, 1100);
    });

    it('should track requests per IP separately', () => {
      const analyzer = requestFrequencyAnalyzer(1);
      const req1 = mockRequest({ ip: '192.168.1.1' });
      const req2 = mockRequest({ ip: '192.168.1.2' });
      const res = mockResponse();

      // Both IPs should be able to make one request
      analyzer(req1, res, mockNext);
      analyzer(req2, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle malformed request objects', () => {
      const req = {} as Request;
      const res = mockResponse();

      // Should not crash on malformed requests
      expect(() => {
        securityHeaders(req, res, mockNext);
      }).not.toThrow();
    });

    it('should handle requests with null/undefined properties', () => {
      const req = mockRequest({
        url: null,
        body: null,
        query: null,
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).not.toThrow();
    });

    it('should handle deeply nested objects in request body', () => {
      const req = mockRequest({
        body: {
          user: {
            profile: {
              bio: 'Normal bio content',
              nested: {
                data: 'More normal content',
              },
            },
          },
        },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).not.toThrow();
    });

    it('should handle arrays in request data', () => {
      const req = mockRequest({
        body: {
          tags: ['javascript', 'react', 'node.js'],
          categories: ['tech', 'programming'],
        },
      });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).not.toThrow();
    });

    it('should handle very long URLs without crashing', () => {
      const longUrl = '/api/test?' + 'a'.repeat(10000);
      const req = mockRequest({ url: longUrl });
      const res = mockResponse();

      expect(() => {
        suspiciousRequestDetector(req, res, mockNext);
      }).not.toThrow();
    });
  });
});