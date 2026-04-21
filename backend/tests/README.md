# Testing Documentation

## Overview

This backend project includes comprehensive testing coverage with unit tests, integration tests, and security testing.

## Test Structure

```
tests/
├── setup.ts              # Test configuration and global setup
├── utils/
│   └── testHelpers.ts     # Utility functions and test data generators
├── unit/                  # Unit tests for individual components
│   ├── validation.test.ts # Validation logic tests
│   ├── errors.test.ts     # Error handling tests
│   └── security.test.ts   # Security middleware tests
└── integration/           # Integration tests for API endpoints
    ├── auth.test.ts       # Authentication API tests
    └── posts.test.ts      # Posts API tests
```

## Test Types

### Unit Tests
- Test individual functions and components in isolation
- Mock external dependencies
- Focus on business logic and edge cases
- Located in `tests/unit/`

### Integration Tests
- Test complete API endpoints
- Mock database and external services
- Test request/response cycle
- Located in `tests/integration/`

### Security Tests
- Test for common vulnerabilities (XSS, SQL injection, etc.)
- Validate security middleware
- Test rate limiting and authentication
- Integrated into unit and integration tests

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

### CI Mode (for continuous integration)
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- Located in `jest.config.js`
- Configured for TypeScript support
- Coverage thresholds: 70% for all metrics
- Timeout: 30 seconds for integration tests

### Environment Variables
- Test environment uses `.env.test`
- Separate from development and production configs
- Mock values for external services

### Global Setup
- `tests/setup.ts` provides global test utilities
- Mock console methods to reduce noise
- Global test data generators available via `testUtils`

## Writing Tests

### Test Data Generation
Use the provided test helpers for consistent test data:

```typescript
import { TestData } from '../utils/testHelpers';

const user = TestData.user();
const post = TestData.post({ author_id: user.id });
```

### Validation Testing
```typescript
import { ValidationHelpers } from '../utils/testHelpers';

// Test validation errors
ValidationHelpers.expectValidationError(response, 'email');

// Test authentication errors
ValidationHelpers.expectAuthError(response);

// Test successful responses
ValidationHelpers.expectSuccessResponse(response, 201);
```

### Mocking External Services
```typescript
// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

// Mock database services
jest.mock('../../src/lib/database', () => ({
  PostService: {
    getById: jest.fn(),
    create: jest.fn(),
  },
}));
```

### Testing Security
```typescript
import { SecurityUtils } from '../utils/testHelpers';

// Test XSS protection
const maliciousInput = SecurityUtils.generateMaliciousInput('xss');
const response = await request(app)
  .post('/api/posts')
  .send({ title: maliciousInput });

expect(response.status).toBe(400);
```

## Coverage Requirements

The project maintains a minimum coverage threshold of 70% for:
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Coverage Reports
- HTML report: `coverage/lcov-report/index.html`
- LCOV format: `coverage/lcov.info`
- JSON summary: `coverage/coverage-summary.json`

## Continuous Integration

### GitHub Actions
- Runs on Node.js 18.x and 20.x
- Executes linting, type checking, and tests
- Uploads coverage to Codecov
- Security auditing with npm audit

### Test Commands in CI
```bash
# Pre-test checks
npm run lint
npm run type-check

# Run tests with coverage
npm run test:ci
```

## Best Practices

### 1. Test Naming
- Descriptive test names: `should return 404 for non-existent post`
- Group related tests with `describe` blocks
- Use consistent naming patterns

### 2. Test Organization
- One test file per source file for unit tests
- One test file per API route for integration tests
- Keep tests focused and isolated

### 3. Mocking Strategy
- Mock external dependencies (database, APIs)
- Use real logic for internal functions
- Prefer dependency injection for easier testing

### 4. Test Data
- Use test data generators for consistency
- Avoid hardcoded values where possible
- Create realistic test scenarios

### 5. Assertions
- Use specific assertions over generic ones
- Test both positive and negative cases
- Verify error conditions and edge cases

## Common Test Patterns

### Testing API Endpoints
```typescript
describe('POST /api/posts', () => {
  beforeEach(() => {
    // Setup mocks
    jest.clearAllMocks();
  });

  it('should create post successfully', async () => {
    // Arrange
    const mockUser = TestData.user();
    const postData = { title: 'Test Post', content: 'Content' };
    
    // Act
    const response = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${mockUser.token}`)
      .send(postData);
    
    // Assert
    expect(response.status).toBe(201);
    expect(response.body.data.post.title).toBe('Test Post');
  });
});
```

### Testing Middleware
```typescript
describe('authMiddleware', () => {
  it('should pass with valid token', async () => {
    const req = MockExpress.request();
    const res = MockExpress.response();
    const next = MockExpress.next;
    
    // Setup mock return value
    supabase.auth.getUser.mockResolvedValue({
      data: { user: TestData.user() },
      error: null,
    });
    
    await requireAuth(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
  });
});
```

### Testing Error Conditions
```typescript
it('should handle database errors gracefully', async () => {
  const mockError = new Error('Database connection failed');
  PostService.getById.mockRejectedValue(mockError);
  
  const response = await request(app)
    .get('/api/posts/invalid-id');
  
  expect(response.status).toBe(500);
  expect(response.body.error.code).toBe('INTERNAL_SERVER_ERROR');
});
```

## Debugging Tests

### Running Single Test
```bash
npx jest tests/unit/validation.test.ts
```

### Running with Debug Output
```bash
DEBUG=* npm test
```

### VS Code Integration
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

## Performance Testing

### Response Time Testing
```typescript
import { PerformanceUtils } from '../utils/testHelpers';

it('should respond within 100ms', async () => {
  const { result, executionTime } = await PerformanceUtils.measureExecutionTime(
    () => request(app).get('/api/posts')
  );
  
  expect(result.status).toBe(200);
  PerformanceUtils.expectResponseTime(executionTime, 100);
});
```

## Security Testing

### Input Validation Testing
```typescript
const maliciousInputs = SecurityUtils.maliciousPayloads.xss;

maliciousInputs.forEach(payload => {
  it(`should reject XSS payload: ${payload}`, async () => {
    const response = await request(app)
      .post('/api/posts')
      .send({ title: payload });
    
    expect(response.status).toBe(400);
  });
});
```

## Maintenance

### Updating Tests
- Keep tests up to date with API changes
- Update mocks when external services change
- Review and update test data generators periodically

### Test Performance
- Monitor test execution time
- Optimize slow tests
- Use `--detectOpenHandles` to find hanging tests

### Dependencies
- Keep testing dependencies updated
- Review and update Jest configuration as needed
- Monitor for security vulnerabilities in test dependencies