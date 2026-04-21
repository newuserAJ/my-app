import { z } from 'zod';
import { authSchemas, userSchemas, sanitize } from '../../src/utils/validation';

describe('Validation Utils', () => {
  describe('Auth Schemas', () => {
    describe('register schema', () => {
      it('should validate valid registration data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(validData);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual(validData);
        }
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'Password123',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('email');
        }
      });

      it('should reject weak password', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
        };

        const result = authSchemas.register.safeParse(invalidData);
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.errors[0].path).toContain('password');
        }
      });

      it('should reject missing required fields', () => {
        const invalidData = {
          email: 'test@example.com',
          password: 'Password123',
          // Missing firstName and lastName
        };

        const result = authSchemas.register.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });

    describe('login schema', () => {
      it('should validate valid login data', () => {
        const validData = {
          email: 'test@example.com',
          password: 'anypassword',
        };

        const result = authSchemas.login.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should reject invalid email', () => {
        const invalidData = {
          email: 'invalid',
          password: 'password',
        };

        const result = authSchemas.login.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('User Schemas', () => {
    describe('updateProfile schema', () => {
      it('should validate valid profile update', () => {
        const validData = {
          firstName: 'Jane',
          lastName: 'Smith',
          bio: 'A short bio',
        };

        const result = userSchemas.updateProfile.safeParse(validData);
        expect(result.success).toBe(true);
      });

      it('should allow partial updates', () => {
        const partialData = {
          firstName: 'Jane',
        };

        const result = userSchemas.updateProfile.safeParse(partialData);
        expect(result.success).toBe(true);
      });

      it('should reject bio that is too long', () => {
        const invalidData = {
          bio: 'a'.repeat(501), // Exceeds 500 character limit
        };

        const result = userSchemas.updateProfile.safeParse(invalidData);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Sanitization Functions', () => {
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
        const input = '  TEST@EXAMPLE.COM  ';
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
      it('should sanitize search query', () => {
        const input = '<script>malicious</script>  hello   world';
        const result = sanitize.searchQuery(input);
        expect(result).toBe('hello world');
      });

      it('should limit length to 100 characters', () => {
        const input = 'a'.repeat(150);
        const result = sanitize.searchQuery(input);
        expect(result.length).toBe(100);
      });

      it('should preserve hyphens and alphanumeric', () => {
        const input = 'hello-world 123';
        const result = sanitize.searchQuery(input);
        expect(result).toBe('hello-world 123');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty strings', () => {
      expect(sanitize.string('')).toBe('');
      expect(sanitize.email('')).toBe('');
      expect(sanitize.searchQuery('')).toBe('');
    });

    it('should handle null and undefined gracefully', () => {
      expect(() => sanitize.string(null as any)).not.toThrow();
      expect(() => sanitize.string(undefined as any)).not.toThrow();
    });

    it('should handle special Unicode characters', () => {
      const input = 'Hello 🌍 World';
      const result = sanitize.string(input);
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });
  });
});