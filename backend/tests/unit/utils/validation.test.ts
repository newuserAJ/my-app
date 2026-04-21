import { z } from 'zod';
import { validate, validateBody, sanitize, authSchemas, commonSchemas } from '../../../src/utils/validation';
import { ValidationError } from '../../../src/types/errors';

describe('Validation Utils', () => {
  describe('commonSchemas', () => {
    describe('email validation', () => {
      it('should validate correct email addresses', () => {
        const validEmails = [
          'test@example.com',
          'user.name@domain.co.uk',
          'test+tag@example.org',
        ];

        validEmails.forEach(email => {
          expect(() => commonSchemas.email.parse(email)).not.toThrow();
        });
      });

      it('should reject invalid email addresses', () => {
        const invalidEmails = [
          'invalid-email',
          'test@',
          '@example.com',
          'test..test@example.com',
        ];

        invalidEmails.forEach(email => {
          expect(() => commonSchemas.email.parse(email)).toThrow();
        });
      });
    });

    describe('password validation', () => {
      it('should validate strong passwords', () => {
        const validPasswords = [
          'Password123',
          'StrongP@ssw0rd',
          'MySecure123',
        ];

        validPasswords.forEach(password => {
          expect(() => commonSchemas.password.parse(password)).not.toThrow();
        });
      });

      it('should reject weak passwords', () => {
        const invalidPasswords = [
          'short',
          'password123', // no uppercase
          'PASSWORD123', // no lowercase
          'Password', // no numbers
          '12345678', // no letters
        ];

        invalidPasswords.forEach(password => {
          expect(() => commonSchemas.password.parse(password)).toThrow();
        });
      });
    });

    describe('UUID validation', () => {
      it('should validate correct UUIDs', () => {
        const validUUIDs = [
          '123e4567-e89b-12d3-a456-426614174000',
          'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        ];

        validUUIDs.forEach(uuid => {
          expect(() => commonSchemas.uuid.parse(uuid)).not.toThrow();
        });
      });

      it('should reject invalid UUIDs', () => {
        const invalidUUIDs = [
          'not-a-uuid',
          '123-456-789',
          '123e4567-e89b-12d3-a456',
        ];

        invalidUUIDs.forEach(uuid => {
          expect(() => commonSchemas.uuid.parse(uuid)).toThrow();
        });
      });
    });
  });

  describe('authSchemas', () => {
    describe('register schema', () => {
      it('should validate correct registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        expect(() => authSchemas.register.parse(validData)).not.toThrow();
      });

      it('should reject incomplete registration data', () => {
        const incompleteData = {
          email: 'test@example.com',
          password: 'Password123',
          // Missing firstName and lastName
        };

        expect(() => authSchemas.register.parse(incompleteData)).toThrow();
      });

      it('should reject data with invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        expect(() => authSchemas.register.parse(invalidData)).toThrow();
      });
    });

    describe('login schema', () => {
      it('should validate correct login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        expect(() => authSchemas.login.parse(validData)).not.toThrow();
      });

      it('should reject login data without email', () => {
        const invalidData = {
          password: 'password',
        };

        expect(() => authSchemas.login.parse(invalidData)).toThrow();
      });
    });
  });

  describe('sanitize functions', () => {
    describe('sanitize.string', () => {
      it('should remove HTML tags', () => {
        const input = '<script>alert("xss")</script>Hello World';
        const result = sanitize.string(input);
        expect(result).toBe('Hello World');
      });

      it('should remove dangerous characters', () => {
        const input = 'Hello<>&"\'World';
        const result = sanitize.string(input);
        expect(result).toBe('HelloWorld');
      });

      it('should trim whitespace', () => {
        const input = '  Hello World  ';
        const result = sanitize.string(input);
        expect(result).toBe('Hello World');
      });
    });

    describe('sanitize.email', () => {
      it('should convert to lowercase and trim', () => {
        const input = '  Test@EXAMPLE.COM  ';
        const result = sanitize.email(input);
        expect(result).toBe('test@example.com');
      });
    });

    describe('sanitize.phoneNumber', () => {
      it('should keep only digits and plus sign', () => {
        const input = '+1 (555) 123-4567';
        const result = sanitize.phoneNumber(input);
        expect(result).toBe('+15551234567');
      });
    });

    describe('sanitize.searchQuery', () => {
      it('should remove special characters except hyphens', () => {
        const input = 'Hello World! @#$% test-query';
        const result = sanitize.searchQuery(input);
        expect(result).toBe('Hello World  test-query');
      });

      it('should limit length to 100 characters', () => {
        const input = 'a'.repeat(150);
        const result = sanitize.searchQuery(input);
        expect(result.length).toBe(100);
      });

      it('should replace multiple spaces with single space', () => {
        const input = 'hello    world     test';
        const result = sanitize.searchQuery(input);
        expect(result).toBe('hello world test');
      });
    });
  });

  describe('validation middleware', () => {
    let mockReq: any;
    let mockRes: any;
    let mockNext: jest.Mock;

    beforeEach(() => {
      mockReq = {
        body: {},
        query: {},
        params: {},
      };
      mockRes = {};
      mockNext = jest.fn();
    });

    describe('validateBody', () => {
      it('should pass valid data through', () => {
        const schema = z.object({ name: z.string() });
        const middleware = validateBody(schema);
        
        mockReq.body = { name: 'Test' };
        
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith();
        expect(mockReq.body.name).toBe('Test');
      });

      it('should call next with ValidationError for invalid data', () => {
        const schema = z.object({ name: z.string() });
        const middleware = validateBody(schema);
        
        mockReq.body = { name: 123 }; // Invalid type
        
        middleware(mockReq, mockRes, mockNext);
        
        expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
      });
    });
  });

  describe('validation error details', () => {
    it('should provide detailed error information', () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(18),
      });

      try {
        schema.parse({ email: 'invalid', age: 15 });
      } catch (error) {
        if (error instanceof z.ZodError) {
          expect(error.errors).toHaveLength(2);
          expect(error.errors[0].path).toEqual(['email']);
          expect(error.errors[1].path).toEqual(['age']);
        }
      }
    });
  });
});