import { z } from 'zod';

// Category creation schema
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Name too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format'),
  description: z.string().max(500, 'Description too long').optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().max(50, 'Icon name too long').optional(),
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

// Category update schema
export const updateCategorySchema = createCategorySchema.partial();

// Category params schemas
export const categoryParamsSchema = z.object({
  id: z.string().uuid('Invalid category ID'),
});

export const categorySlugParamsSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});