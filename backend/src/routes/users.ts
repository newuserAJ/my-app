import { Router } from 'express';
import { validateBody, validateQuery, validateParams, paginationSchema, userSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth, optionalAuth } from '../middleware/auth';
import { userService } from '../services/user.service';
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
    const profile = await userService.getById(req.user!.id);
    
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
      date_of_birth: req.body.dateOfBirth,
      gender: req.body.gender,
      location: req.body.location,
      language: req.body.language,
      occupation: req.body.occupation,
      school: req.body.school,
      company: req.body.company,
      interests: req.body.interests,
      age: req.body.age,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(key => 
      updateData[key as keyof typeof updateData] === undefined && 
      delete updateData[key as keyof typeof updateData]
    );

    const profile = await userService.update(req.user!.id, updateData);

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

    const users = await userService.search(query, limit, offset);

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
    
    const profile = await userService.getById(id);
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

    res.json({
      success: true,
      data: { 
        user: userProfile,
      },
    });
  })
);

/* TODO: Implement when post service is ready
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
    const profile = await userService.getById(id);
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
*/

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
    const userToFollow = await userService.getById(followingId);
    if (!userToFollow) {
      throw new NotFoundError('User not found');
    }

    // TODO: Implement FollowService
    const result = { following: true }; // Mock for now

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

    // Check if user exists
    const profile = await userService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    // TODO: Implement FollowService
    const followers: any[] = []; // Mock for now

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

    // Check if user exists
    const profile = await userService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    // TODO: Implement FollowService
    const following: any[] = []; // Mock for now

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
    await userService.delete(userId);

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
    const profile = await userService.getById(id);
    if (!profile) {
      throw new NotFoundError('User not found');
    }

    // Get stats using the user service
    const stats = await userService.getStats(id);

    res.json({
      success: true,
      data: { stats },
    });
  })
);

// GET /users/by-location/:location - Get users by location
usersRouter.get('/by-location/:location',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { location } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const users = await userService.getByLocation(location, limit, offset);

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

// GET /users/by-occupation/:occupation - Get users by occupation
usersRouter.get('/by-occupation/:occupation',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { occupation } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const users = await userService.getByOccupation(occupation, limit, offset);

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

// GET /users/by-school/:school - Get users by school
usersRouter.get('/by-school/:school',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { school } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const users = await userService.getBySchool(school, limit, offset);

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

// GET /users/by-company/:company - Get users by company
usersRouter.get('/by-company/:company',
  validateQuery(paginationSchema),
  asyncHandler(async (req, res) => {
    const { company } = req.params;
    const { page, limit } = req.query as any;
    const offset = (page - 1) * limit;

    const users = await userService.getByCompany(company, limit, offset);

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