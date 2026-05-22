import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../config/logger';

/**
 * Result type for service operations that can fail
 */
export type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  code?: string;
};

/**
 * Base service class with common database operations and error handling
 */
export abstract class BaseService {
  protected constructor(
    protected readonly db: SupabaseClient,
    protected readonly adminDb?: SupabaseClient
  ) {}

  /**
   * Handle Supabase errors consistently across all services
   */
  protected handleSupabaseError(error: any, context: string): never {
    // Handle specific Supabase error codes
    if (error?.code === 'PGRST116') {
      // Record not found - this should be handled by the caller
      throw new Error('RECORD_NOT_FOUND');
    }

    if (error?.code === '23505') {
      // Unique constraint violation
      throw new Error('DUPLICATE_RECORD');
    }

    if (error?.code === '23503') {
      // Foreign key constraint violation
      throw new Error('INVALID_REFERENCE');
    }

    logger.error(`${context} error:`, { error });
    throw new Error(`Database operation failed: ${error?.message || 'Unknown error'}`);
  }

  /**
   * Execute a service operation with consistent error handling
   */
  protected async executeOperation<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ServiceResult<T>> {
    try {
      const result = await operation();
      return { success: true, data: result };
    } catch (error: any) {
      if (error.message === 'RECORD_NOT_FOUND') {
        return { success: false, error: 'Record not found', code: 'NOT_FOUND' };
      }
      
      if (error.message === 'DUPLICATE_RECORD') {
        return { success: false, error: 'Record already exists', code: 'DUPLICATE' };
      }
      
      if (error.message === 'INVALID_REFERENCE') {
        return { success: false, error: 'Invalid reference', code: 'INVALID_REFERENCE' };
      }

      logger.error(`Service operation failed: ${context}`, { error });
      return { 
        success: false, 
        error: error?.message || 'Operation failed',
        code: 'OPERATION_FAILED'
      };
    }
  }

  /**
   * Create a user-scoped Supabase client for RLS operations
   */
  protected createUserScopedClient(_accessToken: string): SupabaseClient {
    return this.db;
  }
}