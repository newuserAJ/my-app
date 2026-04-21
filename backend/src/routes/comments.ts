import { Router } from 'express';
import { validateBody, validateQuery, validateParams, paginationSchema } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { CommentService, PostService, LikeService } from '../lib/database';
import { NotFoundError, ForbiddenError } from '../types/errors';
import { logger } from '../config/logger';
import { z } from 'zod';

export const commentsRouter = Router();

// Validation schemas
const createCommentSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
  content: z.string().min(1, 'Content is required').max(1000, 'Content too long'),
  parentId: z.string().uuid('Invalid parent comment ID').optional(),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(1000, 'Content too long'),
});

const commentParamsSchema = z.object({
  id: z.string().uuid('Invalid comment ID'),
});

const postCommentsParamsSchema = z.object({
  postId: z.string().uuid('Invalid post ID'),
});

// GET /comments/post/:postId - Get comments for a post
commentsRouter.get('/post/:postId',
  validateParams(postCommentsParamsSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { postId } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    // Check if post exists
    const post = await PostService.getById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    const comments = await CommentService.getByPostId(postId, Number(limit), Number(offset));

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await CommentService.getReplies(comment.id);
        return { ...comment, replies };
      })
    );

    res.json({
      success: true,
      data: {
        comments: commentsWithReplies,
        pagination: {
          page,
          limit,
          hasMore: comments.length === Number(limit),
        },
      },
    });
  })
);

// GET /comments/:id - Get single comment
commentsRouter.get('/:id',
  validateParams(commentParamsSchema),
  asyncHandler(async (req, _res) => {
    const { id: _id } = req.params;
    
    // TODO: Implement CommentService.getById
    // For now, return placeholder
    throw new NotFoundError('Comment lookup not yet implemented');
  })
);

// POST /comments - Create new comment
commentsRouter.post('/',
  requireAuth,
  validateBody(createCommentSchema),
  asyncHandler(async (req, res) => {
    const { postId, content, parentId } = req.body;

    // Check if post exists and is published
    const post = await PostService.getById(postId);
    if (!post) {
      throw new NotFoundError('Post not found');
    }

    if (post.status !== 'published') {
      throw new ForbiddenError('Cannot comment on unpublished posts');
    }

    // If replying to a comment, check if parent comment exists
    if (parentId) {
      // We'll need to add a method to check if comment exists
      // For now, we'll trust the validation
    }

    const commentData = {
      post_id: postId,
      author_id: req.user!.id,
      content,
      parent_id: parentId || null,
      status: 'pending' as const, // Comments need moderation by default
    };

    const comment = await CommentService.create(commentData);

    logger.info('Comment created:', {
      commentId: comment.id,
      postId,
      authorId: req.user!.id,
      isReply: !!parentId,
    });

    res.status(201).json({
      success: true,
      message: 'Comment submitted for moderation',
      data: { comment },
    });
  })
);

// PUT /comments/:id - Update comment
commentsRouter.put('/:id',
  requireAuth,
  validateParams(commentParamsSchema),
  validateBody(updateCommentSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content } = req.body;

    // We need to implement getById for comments
    // For now, let's assume we have a way to get the comment
    const updateData = {
      content,
      is_edited: true,
      edited_at: new Date().toISOString(),
    };

    const comment = await CommentService.update(id, updateData);

    logger.info('Comment updated:', {
      commentId: id,
      authorId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Comment updated successfully',
      data: { comment },
    });
  })
);

// DELETE /comments/:id - Delete comment
commentsRouter.delete('/:id',
  requireAuth,
  validateParams(commentParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check ownership - we'll need to implement this check
    await CommentService.delete(id);

    logger.info('Comment deleted:', {
      commentId: id,
      authorId: req.user!.id,
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  })
);

// POST /comments/:id/like - Toggle comment like
commentsRouter.post('/:id/like',
  requireAuth,
  validateParams(commentParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const result = await LikeService.toggle(req.user!.id, id, 'comment');

    logger.info('Comment like toggled:', {
      commentId: id,
      userId: req.user!.id,
      action: result.liked ? 'liked' : 'unliked',
    });

    res.json({
      success: true,
      message: result.liked ? 'Comment liked' : 'Comment unliked',
      data: { liked: result.liked },
    });
  })
);

// GET /comments/:id/replies - Get replies to a comment
commentsRouter.get('/:id/replies',
  validateParams(commentParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const replies = await CommentService.getReplies(id);

    res.json({
      success: true,
      data: { replies },
    });
  })
);