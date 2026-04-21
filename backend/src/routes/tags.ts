import { Router } from 'express';
import { validateQuery } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { TagService } from '../lib/database';
import { z } from 'zod';

export const tagsRouter = Router();

// Validation schemas
const searchTagsSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(50, 'Search query too long'),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /tags - Get all tags
tagsRouter.get('/',
  asyncHandler(async (_req, res) => {
    const tags = await TagService.getAll();

    res.json({
      success: true,
      data: { tags },
    });
  })
);

// GET /tags/featured - Get featured tags
tagsRouter.get('/featured',
  asyncHandler(async (_req, res) => {
    const tags = await TagService.getFeatured();

    res.json({
      success: true,
      data: { tags },
    });
  })
);

// GET /tags/search - Search tags
tagsRouter.get('/search',
  validateQuery(searchTagsSchema),
  asyncHandler(async (req, res) => {
    const { q: query, limit } = req.query as any;

    const tags = await TagService.search(query, limit);

    res.json({
      success: true,
      data: { tags },
    });
  })
);