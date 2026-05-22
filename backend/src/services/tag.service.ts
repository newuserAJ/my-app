import { Database } from '../types/database';
import { BaseService, ServiceResult } from './base.service';

type Tag = Database['public']['Tables']['tags']['Row'];
type TagInsert = Database['public']['Tables']['tags']['Insert'];
type TagUpdate = Database['public']['Tables']['tags']['Update'];

export class TagService extends BaseService {
  /**
   * Get all tags
   */
  async getAll(): Promise<ServiceResult<Tag[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .order('name');

      if (error) {
        this.handleSupabaseError(error, 'Getting all tags');
      }

      return data;
    }, 'TagService.getAll');
  }

  /**
   * Get featured tags
   */
  async getFeatured(): Promise<ServiceResult<Tag[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .eq('is_featured', true)
        .order('post_count', { ascending: false });

      if (error) {
        this.handleSupabaseError(error, 'Getting featured tags');
      }

      return data;
    }, 'TagService.getFeatured');
  }

  /**
   * Search tags by name
   */
  async search(query: string, limit: number = 10): Promise<ServiceResult<Tag[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .ilike('name', `%${query}%`)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) {
        this.handleSupabaseError(error, 'Searching tags');
      }

      return data;
    }, 'TagService.search');
  }

  /**
   * Get tag by slug
   */
  async getBySlug(slug: string): Promise<ServiceResult<Tag | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleSupabaseError(error, 'Getting tag by slug');
      }

      return data;
    }, 'TagService.getBySlug');
  }

  /**
   * Get tag by ID
   */
  async getById(id: string): Promise<ServiceResult<Tag | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Getting tag by ID');
      }

      return data;
    }, 'TagService.getById');
  }

  /**
   * Create a new tag
   */
  async create(tag: TagInsert): Promise<ServiceResult<Tag>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .insert(tag)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Creating tag');
      }

      return data;
    }, 'TagService.create');
  }

  /**
   * Update tag
   */
  async update(id: string, updates: TagUpdate): Promise<ServiceResult<Tag>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Updating tag');
      }

      return data;
    }, 'TagService.update');
  }

  /**
   * Delete tag
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.db
        .from('tags')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError(error, 'Deleting tag');
      }
    }, 'TagService.delete');
  }

  /**
   * Get most used tags
   */
  async getMostUsed(limit: number = 20): Promise<ServiceResult<Tag[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('tags')
        .select('*')
        .gt('post_count', 0)
        .order('post_count', { ascending: false })
        .limit(limit);

      if (error) {
        this.handleSupabaseError(error, 'Getting most used tags');
      }

      return data;
    }, 'TagService.getMostUsed');
  }
}