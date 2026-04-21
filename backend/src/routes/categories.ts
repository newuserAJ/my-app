import { Router } from 'express';
import { validateParams } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { CategoryService, PostService } from '../lib/database';
import { NotFoundError } from '../types/errors';
import { z } from 'zod';

export const categoriesRouter = Router();

// Validation schemas
const categoryParamsSchema = z.object({
  slug: z.string().min(1, 'Category slug is required'),
});

// GET /categories - Get all active categories
categoriesRouter.get('/',
  asyncHandler(async (_req, res) => {
    const categories = await CategoryService.getAll();

    res.json({
      success: true,
      data: { categories },
    });
  })
);

// GET /categories/:slug - Get category by slug
categoriesRouter.get('/:slug',
  validateParams(categoryParamsSchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    
    const category = await CategoryService.getBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    res.json({
      success: true,
      data: { category },
    });
  })
);

// GET /categories/:slug/posts - Get posts in a category
categoriesRouter.get('/:slug/posts',
  validateParams(categoryParamsSchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = (page - 1) * limit;

    // Check if category exists
    const category = await CategoryService.getBySlug(slug);
    if (!category) {
      throw new NotFoundError('Category not found');
    }

    // Get posts in this category
    const posts = await PostService.getPublished(limit, offset, slug);

    res.json({
      success: true,
      data: {
        category,
        posts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit,
        },
      },
    });
  })
);