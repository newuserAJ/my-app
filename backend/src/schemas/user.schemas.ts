import { z } from 'zod';

// User ID params schema
export const userParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

// User search query schema
export const userSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Pagination query schema
export const userPaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Profile update schema
export const updateProfileSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  bio: z.string().max(500).optional(),
  avatar_url: z.string().url('Invalid avatar URL').optional(),
  website: z.string().url('Invalid website URL').optional(),
  location: z.string().max(100).optional(),
  language: z.string().max(50).optional(),
  occupation: z.string().max(100).optional(),
  school: z.string().max(100).optional(),
  company: z.string().max(100).optional(),
  interests: z.array(z.string().max(50)).max(10).optional(),
  age: z.number().int().min(13).max(120).optional(),
  date_of_birth: z.string().datetime().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
});