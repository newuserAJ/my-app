import { config } from 'dotenv';
import { join } from 'path';

// Load test environment variables
config({ path: join(__dirname, '..', '.env.test') });

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods during tests to reduce noise
const originalConsole = { ...console };

beforeEach(() => {
  // Suppress console output during tests unless explicitly needed
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  // Restore console methods
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  // Helper to create test users
  createTestUser: () => ({
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    user_metadata: {
      firstName: 'John',
      lastName: 'Doe',
    },
    app_metadata: {
      role: 'user',
    },
    created_at: new Date().toISOString(),
    email_confirmed_at: new Date().toISOString(),
  }),
  
  // Helper to create test posts
  createTestPost: () => ({
    id: '123e4567-e89b-12d3-a456-426614174001',
    title: 'Test Post',
    content: 'This is a test post content.',
    slug: 'test-post',
    status: 'published' as const,
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
  
  // Helper to create test comments
  createTestComment: () => ({
    id: '123e4567-e89b-12d3-a456-426614174002',
    content: 'This is a test comment.',
    post_id: '123e4567-e89b-12d3-a456-426614174001',
    author_id: '123e4567-e89b-12d3-a456-426614174000',
    status: 'approved' as const,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }),
};

// Type declarations for global test utilities
declare global {
  var testUtils: {
    createTestUser: () => any;
    createTestPost: () => any;
    createTestComment: () => any;
  };
}

export {};