import { Request, Response } from 'express';
import { User } from '@supabase/supabase-js';

// Test data generators
export const TestData = {
  user: (overrides: Partial<User> = {}): User => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@example.com',
    email_confirmed_at: new Date().toISOString(),
    phone: '',
    confirmed_at: new Date().toISOString(),
    last_sign_in_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email'],
      role: 'user',
    },
    user_metadata: {
      firstName: 'John',
      lastName: 'Doe',
      fullName: 'John Doe',
    },
    identities: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_anonymous: false,
    ...overrides,
  }),

  post: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Post',
    content: 'This is a test post content with plenty of text to test various scenarios.',
    excerpt: 'This is a test post excerpt.',
    slug: 'test-post',
    status: 'published',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    featured_image_url: null,
    tags: ['javascript', 'testing'],
    category: 'technology',
    view_count: 0,
    like_count: 0,
    comment_count: 0,
    is_featured: false,
    seo_title: 'Test Post - SEO Title',
    seo_description: 'Test post SEO description',
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  comment: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174002',
    post_id: '123e4567-e89b-12d3-a456-426614174001',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    parent_id: null,
    content: 'This is a test comment.',
    status: 'approved',
    like_count: 0,
    is_edited: false,
    edited_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  profile: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    first_name: 'John',
    last_name: 'Doe',
    full_name: 'John Doe',
    avatar_url: null,
    phone_number: null,
    bio: 'Test user bio',
    date_of_birth: null,
    location: null,
    website: null,
    is_verified: false,
    is_active: true,
    role: 'user',
    preferences: {},
    metadata: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  category: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174003',
    name: 'Technology',
    slug: 'technology',
    description: 'Technology related posts',
    color: '#3B82F6',
    icon: 'tech-icon',
    is_active: true,
    sort_order: 1,
    parent_id: null,
    post_count: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  tag: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174004',
    name: 'JavaScript',
    slug: 'javascript',
    description: 'JavaScript programming language',
    color: '#F7DF1E',
    is_featured: true,
    post_count: 10,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  like: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174005',
    user_id: '123e4567-e89b-12d3-a456-426614174000',
    target_id: '123e4567-e89b-12d3-a456-426614174001',
    target_type: 'post',
    created_at: new Date().toISOString(),
    ...overrides,
  }),

  follow: (overrides = {}) => ({
    id: '123e4567-e89b-12d3-a456-426614174006',
    follower_id: '123e4567-e89b-12d3-a456-426614174000',
    following_id: '123e4567-e89b-12d3-a456-426614174007',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
};

// Mock Express request and response helpers
export const MockExpress = {
  request: (overrides: Partial<Request> = {}): Partial<Request> => ({
    method: 'GET',
    path: '/api/test',
    url: '/api/test',
    ip: '127.0.0.1',
    body: {},
    query: {},
    params: {},
    headers: {
      'user-agent': 'Mozilla/5.0 Test Browser',
      'content-type': 'application/json',
    },
    get: jest.fn((header: string) => {
      const headers: { [key: string]: string } = {
        'user-agent': 'Mozilla/5.0 Test Browser',
        'content-type': 'application/json',
        ...overrides.headers,
      };
      return headers[header.toLowerCase()];
    }),
    ...overrides,
  }),

  response: (): Partial<Response> => {
    const res: Partial<Response> = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    return res;
  },

  next: jest.fn(),
};

// Database mock helpers
export const DatabaseMocks = {
  // Create a mock that returns different values for different calls
  createSequentialMock: (...returnValues: any[]) => {
    let callCount = 0;
    return jest.fn(() => {
      const value = returnValues[callCount] || returnValues[returnValues.length - 1];
      callCount++;
      return value;
    });
  },

  // Create a mock that resolves to different values
  createAsyncSequentialMock: (...returnValues: any[]) => {
    let callCount = 0;
    return jest.fn(async () => {
      const value = returnValues[callCount] || returnValues[returnValues.length - 1];
      callCount++;
      return Promise.resolve(value);
    });
  },

  // Create a mock that rejects on specific calls
  createFailingMock: (failOnCall: number, error: Error) => {
    let callCount = 0;
    return jest.fn(async () => {
      callCount++;
      if (callCount === failOnCall) {
        throw error;
      }
      return Promise.resolve(null);
    });
  },
};

// Validation helpers
export const ValidationHelpers = {
  expectValidationError: (response: any, field?: string) => {
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    if (field) {
      expect(response.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field })
        ])
      );
    }
  },

  expectAuthError: (response: any) => {
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
  },

  expectForbiddenError: (response: any) => {
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('FORBIDDEN');
  },

  expectNotFoundError: (response: any) => {
    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('RECORD_NOT_FOUND');
  },

  expectRateLimitError: (response: any) => {
    expect(response.status).toBe(429);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  },

  expectSuccessResponse: (response: any, statusCode = 200) => {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
  },
};

// Time utilities
export const TimeUtils = {
  addDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  subtractDays: (date: Date, days: number): Date => {
    const result = new Date(date);
    result.setDate(result.getDate() - days);
    return result;
  },

  addMinutes: (date: Date, minutes: number): Date => {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
  },

  isRecentTimestamp: (timestamp: string, withinSeconds = 60): boolean => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.abs(now.getTime() - time.getTime()) / 1000;
    return diffInSeconds <= withinSeconds;
  },
};

// UUID utilities
export const UUIDUtils = {
  isValidUUID: (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  generateTestUUID: (suffix?: string): string => {
    const base = '123e4567-e89b-12d3-a456-42661417400';
    return suffix ? `${base}${suffix}` : `${base}0`;
  },
};

// Security test utilities
export const SecurityUtils = {
  maliciousPayloads: {
    xss: [
      '<script>alert("xss")</script>',
      'javascript:alert("xss")',
      '<img onerror="alert(1)" src="x">',
      '<svg onload="alert(1)">',
    ],
    sqlInjection: [
      "'; DROP TABLE users; --",
      "1 UNION SELECT * FROM users",
      "admin'--",
      "' OR '1'='1",
    ],
    pathTraversal: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '/etc/shadow',
    ],
    commandInjection: [
      '; cat /etc/passwd',
      '| whoami',
      '&& rm -rf /',
      '`cat /etc/passwd`',
    ],
  },

  // Generate payloads for testing
  generateMaliciousInput: (type: 'xss' | 'sql' | 'path' | 'command') => {
    const payloads = {
      xss: SecurityUtils.maliciousPayloads.xss,
      sql: SecurityUtils.maliciousPayloads.sqlInjection,
      path: SecurityUtils.maliciousPayloads.pathTraversal,
      command: SecurityUtils.maliciousPayloads.commandInjection,
    };
    return payloads[type][Math.floor(Math.random() * payloads[type].length)];
  },
};

// Performance test utilities
export const PerformanceUtils = {
  measureExecutionTime: async <T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> => {
    const startTime = process.hrtime.bigint();
    const result = await fn();
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    return { result, executionTime };
  },

  expectResponseTime: (executionTime: number, maxMs: number) => {
    expect(executionTime).toBeLessThan(maxMs);
  },
};

// Test cleanup utilities
export const CleanupUtils = {
  clearMocks: (...mocks: jest.Mock[]) => {
    mocks.forEach(mock => mock.mockClear());
  },

  resetMocks: (...mocks: jest.Mock[]) => {
    mocks.forEach(mock => mock.mockReset());
  },

  restoreMocks: (...mocks: jest.Mock[]) => {
    mocks.forEach(mock => mock.mockRestore());
  },
};