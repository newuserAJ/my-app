import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from './logger';

// Environment variables validation
const requiredEnvVars = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Validate required environment variables
for (const [key, value] of Object.entries(requiredEnvVars)) {
  if (!value) {
    logger.error(`Missing required environment variable: ${key}`);
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

export const appPort = Number(process.env.PORT || 8080);

// Client for public operations (with RLS enabled)
export const supabase: SupabaseClient = createClient(
  requiredEnvVars.SUPABASE_URL!,
  requiredEnvVars.SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Admin client for server-side operations (bypasses RLS)
export const supabaseAdmin: SupabaseClient = createClient(
  requiredEnvVars.SUPABASE_URL!,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Health check for Supabase connection
export const checkSupabaseHealth = async (): Promise<{ healthy: boolean; error?: string }> => {
  try {
    const { error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    
    if (error) {
      logger.error('Supabase health check failed:', error);
      return { healthy: false, error: error.message };
    }
    
    return { healthy: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Supabase health check failed with exception:', error);
    return { healthy: false, error: errorMessage };
  }
};

// Initialize Supabase connection
export const initializeSupabase = async (): Promise<void> => {
  logger.info('Initializing Supabase connection...');
  
  const healthCheck = await checkSupabaseHealth();
  
  if (!healthCheck.healthy) {
    throw new Error(`Failed to connect to Supabase: ${healthCheck.error}`);
  }
  
  logger.info('Supabase connection established successfully');
};