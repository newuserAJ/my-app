import { z } from 'zod';

// Common pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

// Post creation schema
export const createPostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().max(500, 'Excerpt too long').optional(),
  slug: z.string().min(1, 'Slug is required').max(200, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  status: z.enum(['draft', 'published']).default('draft'),
  featuredImageUrl: z.string().url('Invalid image URL').optional(),
  tags: z.array(z.string()).max(10, 'Too many tags').optional(),
  category: z.string().optional(),
  isFeatured: z.boolean().default(false),
  seoTitle: z.string().max(70, 'SEO title too long').optional(),
  seoDescription: z.string().max(160, 'SEO description too long').optional(),
});

// Post update schema (all fields optional)
export const updatePostSchema = createPostSchema.partial();

// Post params schema
export const postParamsSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
});

// Post slug params schema
export const postSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

// Author params schema
export const authorParamsSchema = z.object({
  authorId: z.string().uuid('Invalid author ID'),
});

// Post query schema for filtering
export const postQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// Post search query schema
export const postSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});