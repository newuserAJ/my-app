import request from 'supertest';
import app from '../../src/index';

// Mock database services
jest.mock('../../src/lib/database', () => ({
  PostService: {
    getPublished: jest.fn(),
    getById: jest.fn(),
    getBySlug: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    incrementViewCount: jest.fn(),
    search: jest.fn(),
    getByAuthor: jest.fn(),
  },
  LikeService: {
    toggle: jest.fn(),
    checkUserLike: jest.fn(),
  },
}));

// Mock Supabase
jest.mock('../../src/config/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
  },
  appPort: 3001,
  initializeSupabase: jest.fn().mockResolvedValue(undefined),
  checkSupabaseHealth: jest.fn().mockResolvedValue({ healthy: true }),
}));

describe('Posts API Integration Tests', () => {
  const { PostService, LikeService } = require('../../src/lib/database');
  const { supabase } = require('../../src/config/supabase');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    it('should get all published posts', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Test Post 1',
          content: 'Content 1',
          status: 'published',
          author: { id: 'user-1', name: 'John Doe' },
        },
        {
          id: 'post-2',
          title: 'Test Post 2',
          content: 'Content 2',
          status: 'published',
          author: { id: 'user-2', name: 'Jane Smith' },
        },
      ];

      PostService.getPublished.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/api/posts')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.posts).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter posts by category', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'Tech Post',
          category: 'technology',
          status: 'published',
        },
      ];

      PostService.getPublished.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/api/posts')
        .query({ category: 'technology' });

      expect(response.status).toBe(200);
      expect(PostService.getPublished).toHaveBeenCalledWith(10, 0, 'technology');
    });

    it('should search posts by query', async () => {
      const mockPosts = [
        {
          id: 'post-1',
          title: 'JavaScript Tutorial',
          content: 'Learn JavaScript basics',
          status: 'published',
        },
      ];

      PostService.search.mockResolvedValue(mockPosts);

      const response = await request(app)
        .get('/api/posts')
        .query({ search: 'JavaScript' });

      expect(response.status).toBe(200);
      expect(PostService.search).toHaveBeenCalledWith('JavaScript', 10, 0);
    });

    it('should include like status for authenticated users', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockPosts = [
        { id: 'post-1', title: 'Test Post', status: 'published' },
      ];

      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      PostService.getPublished.mockResolvedValue(mockPosts);
      LikeService.checkUserLike.mockResolvedValue(true);

      const response = await request(app)
        .get('/api/posts')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(LikeService.checkUserLike).toHaveBeenCalledWith('user-1', 'post-1', 'post');
    });
  });

  describe('GET /api/posts/:id', () => {
    it('should get post by ID', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        content: 'Test content',
        status: 'published',
        author_id: 'user-1',
        view_count: 5,
      };

      PostService.getById.mockResolvedValue(mockPost);
      PostService.incrementViewCount.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/posts/post-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe('Test Post');
      expect(PostService.incrementViewCount).toHaveBeenCalledWith('post-1');
    });

    it('should return 404 for non-existent post', async () => {
      PostService.getById.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/posts/non-existent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('RECORD_NOT_FOUND');
    });

    it('should return 403 for unpublished post from different user', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Draft Post',
        status: 'draft',
        author_id: 'user-1',
      };

      const mockUser = { id: 'user-2', email: 'other@example.com' };

      PostService.getById.mockResolvedValue(mockPost);
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await request(app)
        .get('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow author to view their own draft', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Draft Post',
        status: 'draft',
        author_id: 'user-1',
      };

      const mockUser = { id: 'user-1', email: 'author@example.com' };

      PostService.getById.mockResolvedValue(mockPost);
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const response = await request(app)
        .get('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.data.post.title).toBe('Draft Post');
    });
  });

  describe('GET /api/posts/slug/:slug', () => {
    it('should get post by slug', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Test Post',
        slug: 'test-post',
        status: 'published',
        view_count: 10,
      };

      PostService.getBySlug.mockResolvedValue(mockPost);
      PostService.incrementViewCount.mockResolvedValue(undefined);

      const response = await request(app)
        .get('/api/posts/slug/test-post');

      expect(response.status).toBe(200);
      expect(response.body.data.post.slug).toBe('test-post');
      expect(PostService.incrementViewCount).toHaveBeenCalledWith('post-1');
    });

    it('should return 404 for non-existent slug', async () => {
      PostService.getBySlug.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/posts/slug/non-existent-slug');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/posts', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-1', email: 'author@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should create new post successfully', async () => {
      const newPost = {
        id: 'post-1',
        title: 'New Post',
        content: 'Post content',
        slug: 'new-post',
        status: 'draft',
        author_id: 'user-1',
      };

      PostService.create.mockResolvedValue(newPost);

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'New Post',
          content: 'Post content',
          slug: 'new-post',
          status: 'draft',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.post.title).toBe('New Post');
      expect(PostService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Post',
          content: 'Post content',
          slug: 'new-post',
          status: 'draft',
          author_id: 'user-1',
        })
      );
    });

    it('should set published_at when status is published', async () => {
      const publishedPost = {
        id: 'post-1',
        title: 'Published Post',
        status: 'published',
        author_id: 'user-1',
      };

      PostService.create.mockResolvedValue(publishedPost);

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Published Post',
          content: 'Post content',
          slug: 'published-post',
          status: 'published',
        });

      expect(response.status).toBe(201);
      expect(PostService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'published',
          published_at: expect.any(String),
        })
      );
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({
          title: 'Unauthorized Post',
          content: 'Content',
          slug: 'unauthorized',
        });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: '', // Empty title
          content: 'Content',
          slug: 'invalid-post',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate slug format', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Valid Title',
          content: 'Content',
          slug: 'Invalid Slug With Spaces',
        });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PUT /api/posts/:id', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-1', email: 'author@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should update post successfully', async () => {
      const existingPost = {
        id: 'post-1',
        title: 'Original Title',
        author_id: 'user-1',
        status: 'draft',
      };

      const updatedPost = {
        ...existingPost,
        title: 'Updated Title',
      };

      PostService.getById.mockResolvedValue(existingPost);
      PostService.update.mockResolvedValue(updatedPost);

      const response = await request(app)
        .put('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(PostService.update).toHaveBeenCalledWith('post-1', {
        title: 'Updated Title',
      });
    });

    it('should prevent non-owner from updating post', async () => {
      const existingPost = {
        id: 'post-1',
        title: 'Original Title',
        author_id: 'user-2', // Different user
        status: 'draft',
      };

      PostService.getById.mockResolvedValue(existingPost);

      const response = await request(app)
        .put('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Unauthorized Update',
        });

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('should return 404 for non-existent post', async () => {
      PostService.getById.mockResolvedValue(null);

      const response = await request(app)
        .put('/api/posts/non-existent')
        .set('Authorization', 'Bearer valid-token')
        .send({
          title: 'Update Attempt',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-1', email: 'author@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should delete post successfully', async () => {
      const existingPost = {
        id: 'post-1',
        title: 'Post to Delete',
        author_id: 'user-1',
      };

      PostService.getById.mockResolvedValue(existingPost);
      PostService.delete.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(PostService.delete).toHaveBeenCalledWith('post-1');
    });

    it('should prevent non-owner from deleting post', async () => {
      const existingPost = {
        id: 'post-1',
        title: 'Post to Delete',
        author_id: 'user-2', // Different user
      };

      PostService.getById.mockResolvedValue(existingPost);

      const response = await request(app)
        .delete('/api/posts/post-1')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('POST /api/posts/:id/like', () => {
    beforeEach(() => {
      const mockUser = { id: 'user-1', email: 'user@example.com' };
      supabase.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
    });

    it('should toggle like successfully', async () => {
      const mockPost = {
        id: 'post-1',
        title: 'Post to Like',
        status: 'published',
      };

      PostService.getById.mockResolvedValue(mockPost);
      LikeService.toggle.mockResolvedValue({ liked: true });

      const response = await request(app)
        .post('/api/posts/post-1/like')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.liked).toBe(true);
      expect(LikeService.toggle).toHaveBeenCalledWith('user-1', 'post-1', 'post');
    });

    it('should require authentication for liking', async () => {
      const response = await request(app)
        .post('/api/posts/post-1/like');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent post', async () => {
      PostService.getById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/posts/non-existent/like')
        .set('Authorization', 'Bearer valid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('Validation', () => {
    it('should validate UUID format for post ID', async () => {
      const response = await request(app)
        .get('/api/posts/invalid-uuid');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate pagination parameters', async () => {
      PostService.getPublished.mockResolvedValue([]);

      const response = await request(app)
        .get('/api/posts')
        .query({ page: -1, limit: 1000 });

      expect(response.status).toBe(400);
    });
  });
});