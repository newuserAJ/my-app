import { z } from 'zod';

// Comment creation schema
export const createCommentSchema = z.object({
  post_id: z.string().uuid('Invalid post ID'),
  parent_id: z.string().uuid('Invalid parent comment ID').optional(),
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
});

// Comment update schema
export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
});

// Comment params schema
export const commentParamsSchema = z.object({
  id: z.string().uuid('Invalid comment ID'),
});

// Post ID params schema for comments
export const postIdParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
});

// Comment query schema for filtering
export const commentQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
});