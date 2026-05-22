import { Database } from '../types/database';
import { BaseService, ServiceResult } from './base.service';
import { logger } from '../config/logger';

type Post = Database['public']['Tables']['posts']['Row'];
type PostInsert = Database['public']['Tables']['posts']['Insert'];
type PostUpdate = Database['public']['Tables']['posts']['Update'];

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export class PostService extends BaseService {
  /**
   * Get post by ID with author information
   */
  async getById(id: string): Promise<ServiceResult<PostWithAuthor | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('id', id)
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Getting post by ID');
      }

      return data;
    }, 'PostService.getById');
  }

  /**
   * Get post by slug with author information
   */
  async getBySlug(slug: string): Promise<ServiceResult<PostWithAuthor | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleSupabaseError(error, 'Getting post by slug');
      }

      return data;
    }, 'PostService.getBySlug');
  }

  /**
   * Get published posts with filtering
   */
  async getPublished(
    limit: number = 10, 
    offset: number = 0, 
    category?: string
  ): Promise<ServiceResult<PostWithAuthor[]>> {
    return this.executeOperation(async () => {
      let query = this.db
        .from('posts')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('status', 'published');

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.handleSupabaseError(error, 'Getting published posts');
      }

      return data;
    }, 'PostService.getPublished');
  }

  /**
   * Get posts by author
   */
  async getByAuthor(
    authorId: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<ServiceResult<Post[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .select('*')
        .eq('author_id', authorId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.handleSupabaseError(error, 'Getting posts by author');
      }

      return data;
    }, 'PostService.getByAuthor');
  }

  /**
   * Create a new post
   */
  async create(post: PostInsert): Promise<ServiceResult<Post>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .insert(post)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Creating post');
      }

      logger.info('Post created successfully:', { postId: data.id });
      return data;
    }, 'PostService.create');
  }

  /**
   * Update post
   */
  async update(id: string, updates: PostUpdate): Promise<ServiceResult<Post>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Updating post');
      }

      logger.info('Post updated successfully:', { postId: id });
      return data;
    }, 'PostService.update');
  }

  /**
   * Delete post
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.db
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError(error, 'Deleting post');
      }

      logger.info('Post deleted successfully:', { postId: id });
    }, 'PostService.delete');
  }

  /**
   * Increment view count for a post
   */
  async incrementViewCount(id: string): Promise<ServiceResult<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.db.rpc('increment_view_count', { post_id: id });

      if (error) {
        this.handleSupabaseError(error, 'Incrementing view count');
      }
    }, 'PostService.incrementViewCount');
  }

  /**
   * Search posts
   */
  async search(
    query: string, 
    limit: number = 10, 
    offset: number = 0
  ): Promise<ServiceResult<PostWithAuthor[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('posts')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .or(`title.ilike.%${query}%,content.ilike.%${query}%,excerpt.ilike.%${query}%`)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.handleSupabaseError(error, 'Searching posts');
      }

      return data;
    }, 'PostService.search');
  }
}