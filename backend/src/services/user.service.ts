import { supabaseAdmin } from '../config/supabase';
import { BaseService } from './base.service';
import { Database } from '../types/database';
import { logger } from '../config/logger';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export class UserService extends BaseService {
  constructor() {
    super(supabaseAdmin, supabaseAdmin);
  }

  /**
   * Get user profile by ID
   */
  async getById(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await this.adminDb!
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // User not found
        }
        this.handleSupabaseError(error, 'Get user profile');
      }

      return data;
    } catch (error: any) {
      if (error.message === 'RECORD_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new user profile
   */
  async create(profileData: ProfileInsert): Promise<Profile> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      this.handleSupabaseError(error, 'Create user profile');
    }

    logger.info('User profile created:', { userId: profileData.id });
    return data;
  }

  /**
   * Update user profile
   */
  async update(userId: string, updateData: ProfileUpdate): Promise<Profile> {
    // Remove empty/undefined fields
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => 
        value !== undefined && value !== null && value !== ''
      )
    );

    const { data, error } = await this.adminDb!
      .from('profiles')
      .update(cleanUpdateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      this.handleSupabaseError(error, 'Update user profile');
    }

    logger.info('User profile updated:', { 
      userId, 
      changes: Object.keys(cleanUpdateData) 
    });
    return data;
  }

  /**
   * Delete user profile
   */
  async delete(userId: string): Promise<void> {
    const { error } = await this.adminDb!
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      this.handleSupabaseError(error, 'Delete user profile');
    }

    logger.info('User profile deleted:', { userId });
  }

  /**
   * Search users by name, email, or username
   */
  async search(query: string, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Search users');
    }

    return data || [];
  }

  /**
   * Get users by location
   */
  async getByLocation(location: string, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .ilike('location', `%${location}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by location');
    }

    return data || [];
  }

  /**
   * Get users by interests
   */
  async getByInterests(interests: string[], limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .overlaps('interests', interests)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by interests');
    }

    return data || [];
  }

  /**
   * Get users by occupation
   */
  async getByOccupation(occupation: string, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .ilike('occupation', `%${occupation}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by occupation');
    }

    return data || [];
  }

  /**
   * Get users by school
   */
  async getBySchool(school: string, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .ilike('school', `%${school}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by school');
    }

    return data || [];
  }

  /**
   * Get users by company
   */
  async getByCompany(company: string, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .ilike('company', `%${company}%`)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by company');
    }

    return data || [];
  }

  /**
   * Get users by age range
   */
  async getByAgeRange(minAge: number, maxAge: number, limit: number = 10, offset: number = 0): Promise<Profile[]> {
    const { data, error } = await this.adminDb!
      .from('profiles')
      .select('*')
      .gte('age', minAge)
      .lte('age', maxAge)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      this.handleSupabaseError(error, 'Get users by age range');
    }

    return data || [];
  }

  /**
   * Get user statistics
   */
  async getStats(_userId: string): Promise<{
    followersCount: number;
    followingCount: number;
    postsCount: number;
  }> {
    // These would need to be implemented based on your follows and posts tables
    // For now, returning mock data
    return {
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
    };
  }
}

// Export singleton instance
export const userService = new UserService();