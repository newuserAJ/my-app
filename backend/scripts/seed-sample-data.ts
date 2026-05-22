#!/usr/bin/env ts-node

/**
 * Seed Sample Data Script (TypeScript version)
 * Populates the database with sample user profiles
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join } from 'path';

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env') });

// Types
interface UserData {
  name: string;
  location: string;
  language: string;
  occupation: string;
  school: string;
  company: string;
  interests: string[];
  ageGroup: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
}

interface SeedResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ name: string; error: any }>;
}

interface CreateUserResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: any;
}

// Sample data from the user
const sampleUsers: UserData[] = [
  {
    name: 'Aishvarya',
    location: 'Coimbatore',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Microsoft',
    interests: ['Orator', 'Movies'],
    ageGroup: '18-24'
  },
  {
    name: 'Bianca',
    location: 'Chennai',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Wipro',
    interests: ['Music', 'Books'],
    ageGroup: '18-24'
  },
  {
    name: 'Deepthi',
    location: 'Madurai',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Deloitte',
    interests: ['Movies', 'Music'],
    ageGroup: '18-24'
  },
  {
    name: 'Dhilip',
    location: 'Coimbatore',
    language: 'Telugu',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'JPMC',
    interests: ['Tech', 'Quotes'],
    ageGroup: '18-24'
  },
  {
    name: 'Harshini',
    location: 'Ramanathapuram',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Oracle',
    interests: ['Movies', 'Cooking'],
    ageGroup: '18-24'
  },
  {
    name: 'Indrajit',
    location: 'Coimbatore',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Microsoft',
    interests: ['Music', 'Movies'],
    ageGroup: '18-24'
  },
  {
    name: 'Iswaryaa',
    location: 'Erode',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Deloitte',
    interests: ['Movies', 'Orator'],
    ageGroup: '18-24'
  },
  {
    name: 'Jenitha',
    location: 'Chittoor',
    language: 'Telugu',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Morgan Stanley',
    interests: ['Movies', 'Books'],
    ageGroup: '18-24'
  },
  {
    name: 'Keerthi',
    location: 'Coimbatore',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Walmart',
    interests: ['Cricket', 'Music'],
    ageGroup: '18-24'
  },
  {
    name: 'Mokshith',
    location: 'Hosur',
    language: 'Telugu',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Cisco',
    interests: ['Books', 'Orator'],
    ageGroup: '18-24'
  },
  {
    name: 'Preetham',
    location: 'Salem',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Astra Zeneca',
    interests: ['Football', 'Cricket', 'Gaming'],
    ageGroup: '18-24'
  },
  {
    name: 'Rishitha',
    location: 'Kolkata',
    language: 'Hindi',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Societe Generale',
    interests: ['Books', 'Art'],
    ageGroup: '18-24'
  },
  {
    name: 'Roshini',
    location: 'Salem',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Cisco',
    interests: ['Movies', 'Books'],
    ageGroup: '18-24'
  },
  {
    name: 'Sneha',
    location: 'Coimbatore',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Medibuddy',
    interests: ['Art', 'Craft'],
    ageGroup: '18-24'
  },
  {
    name: 'Swetha',
    location: 'Coimbatore',
    language: 'Tamil',
    occupation: 'Software Engineer',
    school: 'PSG',
    company: 'Microsoft',
    interests: ['Books', 'Cricket'],
    ageGroup: '18-24'
  }
];

class DatabaseSeeder {
  private supabase: SupabaseClient;
  private readonly supabaseUrl: string;
  private readonly supabaseServiceKey: string;

  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL!;
    this.supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!this.supabaseUrl || !this.supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    // Use service role key to bypass RLS
    this.supabase = createClient(this.supabaseUrl, this.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async createUser(userData: UserData): Promise<CreateUserResult> {
    try {
      console.log(`Creating user: ${userData.name}...`);
      
      // Generate a realistic email based on the name
      const emailName = userData.name.toLowerCase().replace(/\s+/g, '.');
      const email = `${emailName}@example.com`;
      
      // Create auth user first
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: email,
        password: 'TempPassword123!', // Temporary password
        email_confirm: true,
        user_metadata: {
          name: userData.name
        }
      });

      if (authError) {
        console.error(`Error creating auth user for ${userData.name}:`, authError);
        return { success: false, error: authError };
      }

      console.log(`Auth user created for ${userData.name}: ${authData.user.id}`);

      // Split name into first and last name
      const nameParts = userData.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || null;

      // Create profile - only include fields that exist in the current schema
      const profileData: any = {
        id: authData.user.id,
        email: email,
        first_name: firstName,
        last_name: lastName,
        is_active: true,
        role: 'user' as const,
        bio: `Software Engineer at ${userData.company}, passionate about ${userData.interests.slice(0, 2).join(' and ')}.`
      };

      // Add optional fields if they exist in the schema
      if (userData.location) profileData.location = userData.location;
      if (userData.language) profileData.language = userData.language;
      if (userData.occupation) profileData.occupation = userData.occupation;
      if (userData.school) profileData.school = userData.school;
      if (userData.company) profileData.company = userData.company;
      if (userData.interests.length > 0) profileData.interests = userData.interests;
      if (userData.ageGroup) profileData.age_group = userData.ageGroup;

      const { data: profileResult, error: profileError } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select();

      if (profileError) {
        console.error(`Error creating profile for ${userData.name}:`, profileError);
        
        // Clean up auth user if profile creation fails
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        
        return { success: false, error: profileError };
      }

      console.log(`✅ Successfully created user: ${userData.name} (ID: ${authData.user.id})`);
      
      return { 
        success: true, 
        user: authData.user, 
        profile: profileResult?.[0] 
      };
      
    } catch (error) {
      console.error(`Unexpected error creating user ${userData.name}:`, error);
      return { success: false, error };
    }
  }

  async seedUsers(): Promise<SeedResult> {
    console.log('🌱 Starting database seeding with sample users...');
    console.log(`📊 Total users to create: ${sampleUsers.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors: Array<{ name: string; error: any }> = [];

    for (const userData of sampleUsers) {
      const result = await this.createUser(userData);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push({
          name: userData.name,
          error: result.error
        });
      }
      
      // Small delay between creates to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📈 Seeding Results:');
    console.log(`✅ Successfully created: ${successCount} users`);
    console.log(`❌ Failed to create: ${errorCount} users`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ name, error }) => {
        console.log(`  - ${name}: ${error.message || JSON.stringify(error)}`);
      });
    }

    return {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors
    };
  }

  async checkExistingUsers(): Promise<void> {
    console.log('🔍 Checking for existing users...');
    
    const { data, error } = await this.supabase
      .from('profiles')
      .select('email, first_name, last_name')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking existing users:', error);
      return;
    }

    console.log(`📋 Found ${data.length} existing users in the database`);
    
    if (data.length > 0) {
      console.log('Recent users:');
      data.slice(0, 5).forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.first_name} ${user.last_name || ''} (${user.email})`);
      });
      
      if (data.length > 5) {
        console.log(`  ... and ${data.length - 5} more`);
      }
    }
  }

  async clearSampleUsers(): Promise<boolean> {
    console.log('🗑️ Clearing existing sample users...');
    
    // Get users with example.com emails (our sample users)
    const { data: profiles, error: selectError } = await this.supabase
      .from('profiles')
      .select('id, email')
      .like('email', '%@example.com');

    if (selectError) {
      console.error('Error fetching sample users:', selectError);
      return false;
    }

    if (profiles.length === 0) {
      console.log('No sample users found to clear.');
      return true;
    }

    console.log(`Found ${profiles.length} sample users to delete...`);

    // Delete auth users (this will cascade delete profiles due to foreign key)
    let deletedCount = 0;
    for (const profile of profiles) {
      try {
        const { error } = await this.supabase.auth.admin.deleteUser(profile.id);
        if (!error) {
          deletedCount++;
          console.log(`  Deleted user: ${profile.email}`);
        } else {
          console.error(`  Failed to delete ${profile.email}:`, error.message);
        }
      } catch (error) {
        console.error(`  Error deleting ${profile.email}:`, error);
      }
    }

    console.log(`✅ Cleared ${deletedCount} sample users`);
    return true;
  }
}

// CLI functionality
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0];

  const seeder = new DatabaseSeeder();

  try {
    switch (command) {
      case 'clear':
        await seeder.clearSampleUsers();
        break;
        
      case 'check':
        await seeder.checkExistingUsers();
        break;
        
      case 'seed':
      default:
        await seeder.checkExistingUsers();
        console.log();
        
        if (args.includes('--clear')) {
          await seeder.clearSampleUsers();
          console.log();
        }
        
        const result = await seeder.seedUsers();
        
        if (result.success) {
          console.log('\n🎉 Database seeding completed successfully!');
          process.exit(0);
        } else {
          console.log('\n⚠️ Database seeding completed with errors.');
          process.exit(1);
        }
    }
  } catch (error) {
    console.error('❌ Fatal error during seeding:', error);
    process.exit(1);
  }
}

// Show usage if no valid command
if (process.argv.length < 2) {
  console.log('Usage:');
  console.log('  npx ts-node scripts/seed-sample-data.ts [command]');
  console.log('');
  console.log('Commands:');
  console.log('  seed          Seed the database with sample users (default)');
  console.log('  seed --clear  Clear existing sample users and seed fresh data');
  console.log('  clear         Clear existing sample users only');
  console.log('  check         Check existing users in database');
  process.exit(0);
}

// Run the main function
main().catch(console.error);