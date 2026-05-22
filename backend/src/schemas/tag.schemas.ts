import { z } from 'zod';

// Tag creation schema
export const createTagSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(50, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(50, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().max(200, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  is_featured: z.boolean().default(false),
});

// Tag update schema
export const updateTagSchema = createTagSchema.partial();

// Tag params schemas
export const tagParamsSchema = z.object({
  id: z.string().uuid('Invalid tag ID'),
});

export const tagSlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

// Tag search query schema
export const tagSearchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

// Tag list query schema
export const tagListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
});