import { Router } from 'express';
import { validateBody, validateQuery, validateParams, paginationSchema } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { PostService, LikeService } from '../lib/database';
import { NotFoundError, ForbiddenError } from '../types/errors';
import { logger } from '../config/logger';
import { z } from 'zod';

export const postsRouter = Router();

// Validation schemas
const createPostSchema = z.object({
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

const updatePostSchema = createPostSchema.partial();

const postParamsSchema = z.object({
  id: z.string().uuid('Invalid post ID'),
});

const postQuerySchema = paginationSchema.extend({
  category: z.string().optional(),
  tag: z.string().optional(),
  author: z.string().uuid().optional(),
  search: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

// GET /posts - Get all published posts with filters
postsRouter.get('/',
  optionalAuth,
  validateQuery(postQuerySchema),
  asyncHandler(async (req, res) => {
    const { page, limit, category, search } = req.query as any;
    const offset = (page - 1) * limit;

    let posts;
    
    if (search) {
      posts = await PostService.search(search, limit, offset);
    } else {
      posts = await PostService.getPublished(limit, offset, category);
    }

    // Add user like status if authenticated
    if (req.user) {
      for (const post of posts) {
        (post as any).isLiked = await LikeService.checkUserLike(req.user.id, (post as any).id, 'post');
      }
    }

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total: posts.length === limit ? page * limit + 1 : page * limit - (limit - posts.length),
          hasMore: posts.length === limit,
        },
      },
    });
  })
);

// GET /posts/:id - Get single post by ID
postsRouter.get('/:id',
  optionalAuth,
  validateParams(postParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const post = await PostService.getById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const postData = post as any;
    
    // Check if user can view this post
    if (postData.status !== 'published' && (!req.user || req.user.id !== postData.author_id)) {
      throw new ForbiddenError('You do not have permission to view this post');
    }

    // Increment view count for published posts
    if (postData.status === 'published') {
      await PostService.incrementViewCount(id);
      postData.view_count += 1; // Update local count for response
    }

    // Add user like status if authenticated
    if (req.user) {
      postData.isLiked = await LikeService.checkUserLike(req.user.id, postData.id, 'post');
    }

    res.json({
      success: true,
      data: { post: postData },
    });
  })
);

// GET /posts/slug/:slug - Get post by slug
postsRouter.get('/slug/:slug',
  optionalAuth,
  validateParams(z.object({ slug: z.string() })),
  asyncHandler(async (req, res) => {
    const { slug } = req.params;
    
    const post = await PostService.getBySlug(slug);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const postData = post as any;
    
    // Increment view count
    await PostService.incrementViewCount(postData.id);
    postData.view_count += 1;

    // Add user like status if authenticated
    if (req.user) {
      postData.isLiked = await LikeService.checkUserLike(req.user.id, postData.id, 'post');
    }

    res.json({
      success: true,
      data: { post: postData },
    });
  })
);

// POST /posts - Create new post
postsRouter.post('/',
  requireAuth,
  validateBody(createPostSchema),
  asyncHandler(async (req, res) => {
    const postData = {
      ...req.body,
      author_id: req.user!.id,
      published_at: req.body.status === 'published' ? new Date().toISOString() : null,
      featured_image_url: req.body.featuredImageUrl,
      is_featured: req.body.isFeatured,
      seo_title: req.body.seoTitle,
      seo_description: req.body.seoDescription,
    };

    // Remove transformed fields
    delete postData.featuredImageUrl;
    delete postData.isFeatured;
    delete postData.seoTitle;
    delete postData.seoDescription;

    const post = await PostService.create(postData);

    logger.info('Post created:', {
      postId: post.id,
      authorId: req.user!.id,
      status: post.status,
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post },
    });
  })
);

// PUT /posts/:id - Update post
postsRouter.put('/:id',
  requireAuth,
  validateParams(postParamsSchema),
  validateBody(updatePostSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get existing post
    const existingPost = await PostService.getById(id);
    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const postData = existingPost as any;
    
    // Check ownership
    if (postData.author_id !== req.user!.id) {
      throw new ForbiddenError('You can only edit your own posts');
    }

    // Prepare update data
    const updateData = { ...req.body };
    
    // Handle status change to published
    if (updateData.status === 'published' && postData.status !== 'published') {
      updateData.published_at = new Date().toISOString();
    }

    // Transform field names
    if (updateData.featuredImageUrl !== undefined) {
      updateData.featured_image_url = updateData.featuredImageUrl;
      delete updateData.featuredImageUrl;
    }
    if (updateData.isFeatured !== undefined) {
      updateData.is_featured = updateData.isFeatured;
      delete updateData.isFeatured;
    }
    if (updateData.seoTitle !== undefined) {
      updateData.seo_title = updateData.seoTitle;
      delete updateData.seoTitle;
    }
    if (updateData.seoDescription !== undefined) {
      updateData.seo_description = updateData.seoDescription;
      delete updateData.seoDescription;
    }

    const post = await PostService.update(id, updateData);

    logger.info('Post updated:', {
      postId: id,
      authorId: req.user!.id,
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      message: 'Post updated successfully',
      data: { post },
    });
  })
);

// DELETE /posts/:id - Delete post
postsRouter.delete('/:id',
  requireAuth,
  validateParams(postParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Get existing post
    const existingPost = await PostService.getById(id);
    if (!existingPost) {
      throw new NotFoundError('Post not found');
    }

    const postData = existingPost as any;
    
    // Check ownership
    if (postData.author_id !== req.user!.id) {
      throw new ForbiddenError('You can only delete your own posts');
    }

    await PostService.delete(id);

    logger.info('Post deleted:', {
      postId: id,
      authorId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Post deleted successfully',
    });
  })
);

// POST /posts/:id/like - Toggle post like
postsRouter.post('/:id/like',
  requireAuth,
  validateParams(postParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    // Check if post exists
    const post = await PostService.getById(id);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const result = await LikeService.toggle(req.user!.id, id, 'post');

    logger.info('Post like toggled:', {
      postId: id,
      userId: req.user!.id,
      action: result.liked ? 'liked' : 'unliked',
    });

    res.json({
      success: true,
      message: result.liked ? 'Post liked' : 'Post unliked',
      data: { liked: result.liked },
    });
  })
);

// GET /posts/author/:authorId - Get posts by author
postsRouter.get('/author/:authorId',
  validateParams(z.object({ authorId: z.string().uuid() })),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { authorId } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const posts = await PostService.getByAuthor(authorId, limit, offset);

    res.json({
      success: true,
      data: {
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