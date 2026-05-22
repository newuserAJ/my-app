import { Database } from '../types/database';
import { BaseService, ServiceResult } from './base.service';

type Category = Database['public']['Tables']['categories']['Row'];
type CategoryInsert = Database['public']['Tables']['categories']['Insert'];
type CategoryUpdate = Database['public']['Tables']['categories']['Update'];

export class CategoryService extends BaseService {
  /**
   * Get all active categories
   */
  async getAll(): Promise<ServiceResult<Category[]>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) {
        this.handleSupabaseError(error, 'Getting all categories');
      }

      return data;
    }, 'CategoryService.getAll');
  }

  /**
   * Get category by slug
   */
  async getBySlug(slug: string): Promise<ServiceResult<Category | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        this.handleSupabaseError(error, 'Getting category by slug');
      }

      return data;
    }, 'CategoryService.getBySlug');
  }

  /**
   * Get category by ID
   */
  async getById(id: string): Promise<ServiceResult<Category | null>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Getting category by ID');
      }

      return data;
    }, 'CategoryService.getById');
  }

  /**
   * Create a new category (admin only)
   */
  async create(category: CategoryInsert): Promise<ServiceResult<Category>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('categories')
        .insert(category)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Creating category');
      }

      return data;
    }, 'CategoryService.create');
  }

  /**
   * Update category (admin only)
   */
  async update(id: string, updates: CategoryUpdate): Promise<ServiceResult<Category>> {
    return this.executeOperation(async () => {
      const { data, error } = await this.db
        .from('categories')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        this.handleSupabaseError(error, 'Updating category');
      }

      return data;
    }, 'CategoryService.update');
  }

  /**
   * Delete category (admin only)
   */
  async delete(id: string): Promise<ServiceResult<void>> {
    return this.executeOperation(async () => {
      const { error } = await this.db
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        this.handleSupabaseError(error, 'Deleting category');
      }
    }, 'CategoryService.delete');
  }
}