import { Router } from 'express';
import { validateBody, validateQuery, validateParams, paginationSchema, userSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { ProfileService, FollowService, PostService } from '../lib/database';
import { NotFoundError, ForbiddenError } from '../types/errors';
import { logger } from '../config/logger';
import { z } from 'zod';

export const usersRouter = Router();

// Validation schemas
const userParamsSchema = z.object({
  id: z.string().uuid('Invalid user ID'),
});

const searchUsersSchema = paginationSchema.extend({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query too long'),
});

// GET /users/me - Get current user profile
usersRouter.get('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const profile = await ProfileService.getById(req.user!.id);
    
    if (!profile) {
      throw new NotFoundError('User profile not found');
    }

    res.json({
      success: true,
      data: { user: profile },
    });
  })
);

// PUT /users/me - Update current user profile
usersRouter.put('/me',
  requireAuth,
  validateBody(userSchemas.updateProfile),
  asyncHandler(async (req, res) => {
    const updateData = {
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      phone_number: req.body.phoneNumber,
      bio: req.body.bio,
      avatar_url: req.body.avatar,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof typeof updateData] === undefined && 
      delete updateData[key as keyof typeof updateData]
    );

    const profile = await ProfileService.update(req.user!.id, updateData);

    logger.info('User profile updated:', {
      userId: req.user!.id,
      changes: Object.keys(updateData),
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: profile },
    });
  })
);

// GET /users/search - Search users
usersRouter.get('/search',
  validateQuery(searchUsersSchema),
  asyncHandler(async (req, res) => {
    const { q: query, page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const users = await ProfileService.search(query, limit, offset);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          hasMore: users.length === limit,
        },
      },
    });
  })
);

// GET /users/:id - Get user profile by ID
usersRouter.get('/:id',
  optionalAuth,
  validateParams(userParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const profile = await ProfileService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    // If not the current user, only show public info
    let userProfile: any = profile;
    if (!req.user || req.user.id !== id) {
      // Remove private fields for public view
      const { phone_number, preferences, metadata, ...publicProfile } = profile as any;
      userProfile = publicProfile;
    }

    // Add follow status if authenticated and viewing another user
    let isFollowing = false;
    if (req.user && req.user.id !== id) {
      // Check if current user is following this user
      const followers = await FollowService.getFollowers(id, 1, 0);
      isFollowing = followers.some((follower: any) => follower?.id === req.user!.id);
    }

    res.json({
      success: true,
      data: { 
        user: userProfile,
        isFollowing,
      },
    });
  })
);

// GET /users/:id/posts - Get user's posts
usersRouter.get('/:id/posts',
  optionalAuth,
  validateParams(userParamsSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    // Check if user exists
    const profile = await ProfileService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    const posts = await PostService.getByAuthor(id, limit, offset);

    // Filter out unpublished posts if not the owner
    let filteredPosts = posts;
    if (!req.user || req.user.id !== id) {
      filteredPosts = posts.filter((post: any) => post.status === 'published');
    }

    res.json({
      success: true,
      data: {
        posts: filteredPosts,
        pagination: {
          page,
          limit,
          hasMore: posts.length === limit,
        },
      },
    });
  })
);

// POST /users/:id/follow - Follow/unfollow user
usersRouter.post('/:id/follow',
  requireAuth,
  validateParams(userParamsSchema),
  asyncHandler(async (req, res) => {
    const { id: followingId } = req.params;
    const followerId = req.user!.id;

    // Can't follow yourself
    if (followerId === followingId) {
      throw new ForbiddenError('You cannot follow yourself');
    }

    // Check if user to follow exists
    const userToFollow = await ProfileService.getById(followingId);
    if (!userToFollow) {
      throw new NotFoundError('User not found');
    }

    const result = await FollowService.toggle(followerId, followingId);

    logger.info('Follow toggled:', {
      followerId,
      followingId,
      action: result.following ? 'followed' : 'unfollowed',
    });

    res.json({
      success: true,
      message: result.following ? 'User followed successfully' : 'User unfollowed successfully',
      data: { following: result.following },
    });
  })
);

// GET /users/:id/followers - Get user's followers
usersRouter.get('/:id/followers',
  validateParams(userParamsSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    // Check if user exists
    const profile = await ProfileService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    const followers = await FollowService.getFollowers(id, limit, offset);

    res.json({
      success: true,
      data: {
        followers,
        pagination: {
          page,
          limit,
          hasMore: followers.length === limit,
        },
      },
    });
  })
);

// GET /users/:id/following - Get users that this user follows
usersRouter.get('/:id/following',
  validateParams(userParamsSchema),
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    // Check if user exists
    const profile = await ProfileService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    const following = await FollowService.getFollowing(id, limit, offset);

    res.json({
      success: true,
      data: {
        following,
        pagination: {
          page,
          limit,
          hasMore: following.length === limit,
        },
      },
    });
  })
);

// DELETE /users/me - Delete current user account
usersRouter.delete('/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;

    // This will cascade delete all related data due to foreign key constraints
    await ProfileService.delete(userId);

    logger.info('User account deleted:', { userId });

    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  })
);

// GET /users/:id/stats - Get user statistics
usersRouter.get('/:id/stats',
  validateParams(userParamsSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if user exists
    const profile = await ProfileService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    // Get counts (these would need to be implemented in the database service)
    const [posts, followers, following] = await Promise.all([
      PostService.getByAuthor(id, 1, 0), // Get first post to check if any exist
      FollowService.getFollowers(id, 1, 0),
      FollowService.getFollowing(id, 1, 0),
    ]);

    // Note: In a real implementation, you'd want dedicated count queries for better performance
    const stats = {
      postsCount: posts.length > 0 ? 'Has posts' : 0, // This should be a proper count
      followersCount: followers.length,
      followingCount: following.length,
      // Add more stats as needed: likesReceived, commentsReceived, etc.
    };

    res.json({
      success: true,
      data: { stats },
    });
  })
);