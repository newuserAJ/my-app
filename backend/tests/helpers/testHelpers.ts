import request from 'supertest';
import { Express } from 'express';

// Mock user data
export const mockUsers = {
  user1: {
    id: 'user-1-uuid-test',
    email: 'user1@test.com',
    firstName: 'Test',
    lastName: 'User1',
    password: 'TestPassword123!',
  },
  user2: {
    id: 'user-2-uuid-test',
    email: 'user2@test.com',
    firstName: 'Test',
    lastName: 'User2',
    password: 'TestPassword456!',
  },
  admin: {
    id: 'admin-uuid-test',
    email: 'admin@test.com',
    firstName: 'Admin',
    lastName: 'User',
    password: 'AdminPassword789!',
    role: 'admin',
  },
};

// Mock post data
export const mockPosts = {
  post1: {
    id: 'post-1-uuid-test',
    title: 'Test Post 1',
    content: 'This is test content for post 1',
    excerpt: 'Test excerpt 1',
    slug: 'test-post-1',
    status: 'published' as const,
    authorId: mockUsers.user1.id,
  },
  post2: {
    id: 'post-2-uuid-test',
    title: 'Test Post 2 Draft',
    content: 'This is test content for post 2',
    excerpt: 'Test excerpt 2',
    slug: 'test-post-2-draft',
    status: 'draft' as const,
    authorId: mockUsers.user1.id,
  },
};

// Mock comment data
export const mockComments = {
  comment1: {
    id: 'comment-1-uuid-test',
    content: 'This is a test comment',
    postId: mockPosts.post1.id,
    authorId: mockUsers.user2.id,
  },
  reply1: {
    id: 'reply-1-uuid-test',
    content: 'This is a reply to comment 1',
    postId: mockPosts.post1.id,
    authorId: mockUsers.user1.id,
    parentId: 'comment-1-uuid-test',
  },
};

// Authentication helpers
export class AuthHelper {
  static async registerUser(app: Express, userData: any) {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
    
    return response;
  }

  static async loginUser(app: Express, email: string, password: string) {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password });
    
    return response;
  }

  static async getAuthToken(app: Express, email: string, password: string): Promise<string> {
    const loginResponse = await this.loginUser(app, email, password);
    return loginResponse.body.data.session.access_token;
  }

  static getAuthHeader(token: string) {
    return { Authorization: `Bearer ${token}` };
  }
}

// Database helpers
export class DatabaseHelper {
  static async cleanupTestData() {
    // In a real implementation, you'd clean up test data from the database
    // This could involve deleting test users, posts, comments, etc.
    console.log('Cleaning up test data...');
  }

  static async seedTestData() {
    // In a real implementation, you'd seed the database with test data
    console.log('Seeding test data...');
  }
}

// API response helpers
export class ApiHelper {
  static expectSuccessResponse(response: any, statusCode: number = 200) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(true);
    return response.body.data;
  }

  static expectErrorResponse(response: any, statusCode: number, errorCode?: string) {
    expect(response.status).toBe(statusCode);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    
    if (errorCode) {
      expect(response.body.error.code).toBe(errorCode);
    }
    
    return response.body.error;
  }

  static expectValidationError(response: any) {
    return this.expectErrorResponse(response, 400, 'VALIDATION_ERROR');
  }

  static expectUnauthorizedError(response: any) {
    return this.expectErrorResponse(response, 401, 'UNAUTHORIZED');
  }

  static expectForbiddenError(response: any) {
    return this.expectErrorResponse(response, 403, 'FORBIDDEN');
  }

  static expectNotFoundError(response: any) {
    return this.expectErrorResponse(response, 404, 'RECORD_NOT_FOUND');
  }
}

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    verifyOtp: jest.fn(),
    updateUser: jest.fn(),
    admin: {
      listUsers: jest.fn(),
    },
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
  })),
  rpc: jest.fn(),
};

// Test data generators
export class TestDataGenerator {
  static generateUser(overrides: any = {}) {
    return {
      email: `test${Date.now()}@example.com`,
      firstName: 'Test',
      lastName: 'User',
      password: 'TestPassword123!',
      ...overrides,
    };
  }

  static generatePost(authorId: string, overrides: any = {}) {
    const timestamp = Date.now();
    return {
      title: `Test Post ${timestamp}`,
      content: `Test content for post ${timestamp}`,
      excerpt: `Test excerpt ${timestamp}`,
      slug: `test-post-${timestamp}`,
      status: 'published' as const,
      authorId,
      ...overrides,
    };
  }

  static generateComment(postId: string, authorId: string, overrides: any = {}) {
    return {
      content: `Test comment ${Date.now()}`,
      postId,
      authorId,
      ...overrides,
    };
  }
}

// Error simulation helpers
export class ErrorSimulator {
  static networkError() {
    return new Error('Network error');
  }

  static databaseError() {
    return new Error('Database connection failed');
  }

  static validationError(field: string) {
    return {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details: [{ field, message: `${field} is required` }],
    };
  }
}