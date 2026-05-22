import { Database } from '../types/database';
import { BaseService, ServiceResult } from './base.service';
import { logger } from '../config/logger';

type Comment = Database['public']['Tables']['comments']['Row'];
type CommentInsert = Database['public']['Tables']['comments']['Insert'];
type CommentUpdate = Database['public']['Tables']['comments']['Update'];

export interface CommentWithAuthor extends Comment {
  author: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_verified: boolean | null;
  } | null;
}

export class CommentService extends BaseService {
  /**
   * Get comment by ID with author information
   */
  async getById(id: string): Promise<ServiceResult<CommentWithAuthor | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('comments')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('id', id)
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Getting comment by ID');
      }

      return data;
    }, 'CommentService.getById');
  }

  /**
   * Get comments by post ID
   */
  async getByPostId(
    postId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<ServiceResult<CommentWithAuthor[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('comments')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('post_id', postId)
        .eq('status', 'approved')
        .is('parent_id', null) // Only top-level comments
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        this.handleSupabaseError(error, 'Getting comments by post ID');
      }

      return data;
    }, 'CommentService.getByPostId');
  }

  /**
   * Get replies to a comment
   */
  async getReplies(parentId: string): Promise<ServiceResult<CommentWithAuthor[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('comments')
        .select(`
          *,
          author:profiles(id, first_name, last_name, full_name, avatar_url, is_verified)
        `)
        .eq('parent_id', parentId)
        .eq('status', 'approved')
        .order('created_at', { ascending: true });

      if (error) {
        this.handleSupabaseError(error, 'Getting comment replies');
      }

      return data;
    }, 'CommentService.getReplies');
  }

  /**
   * Create a new comment
   */
  async create(comment: CommentInsert): Promise<ServiceResult<Comment>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('comments')
        .insert(comment)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Creating comment');
      }

      logger.info('Comment created successfully:', { commentId: data.id });
      return data;
    }, 'CommentService.create');
  }

  /**
   * Update comment
   */
  async update(id: string, updates: CommentUpdate): Promise<ServiceResult<Comment>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('comments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Updating comment');
      }

      logger.info('Comment updated successfully:', { commentId: id });
      return data;
    }, 'CommentService.update');
  }

  /**
   * Delete comment
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.db
        .from('comments')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError(error, 'Deleting comment');
      }

      logger.info('Comment deleted successfully:', { commentId: id });
    }, 'CommentService.delete');
  }
}