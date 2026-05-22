#!/usr/bin/env ts-node

/**
 * Basic Phone Authentication Seeder
 * Creates sample users with phone numbers - compatible with current basic schema
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join } from 'path';

dotenv.config({ path: join(__dirname, '../.env') });

// Sample data with Indian phone numbers and simple passwords
const sampleUsers = [
  {
    name: 'Aishvarya',
    phoneNumber: '+919876543210',
    password: 'Aish@123', // ggignore
    location: 'Coimbatore',
    bio: 'Software Engineer at Microsoft, passionate about public speaking and movies. From PSG, speaks Tamil. Interests: Orator, Movies.'
  },
  {
    name: 'Bianca',
    phoneNumber: '+919876543211',
    password: 'Bian@123', // ggignore
    location: 'Chennai',
    bio: 'Software Engineer at Wipro, passionate about music and reading. From PSG, speaks Tamil. Interests: Music, Books.'
  },
  {
    name: 'Deepthi',
    phoneNumber: '+919876543212',
    password: 'Deep@123', // ggignore
    location: 'Madurai',
    bio: 'Software Engineer at Deloitte, passionate about movies and music. From PSG, speaks Tamil. Interests: Movies, Music.'
  },
  {
    name: 'Dhilip',
    phoneNumber: '+919876543213',
    password: 'Dhil@123', // ggignore
    location: 'Coimbatore',
    bio: 'Software Engineer at JPMC, passionate about technology and inspirational quotes. From PSG, speaks Telugu. Interests: Tech, Quotes.'
  },
  {
    name: 'Harshini',
    phoneNumber: '+919876543214',
    password: 'Harsh@123', // ggignore
    location: 'Ramanathapuram',
    bio: 'Software Engineer at Oracle, passionate about movies and cooking. From PSG, speaks Tamil. Interests: Movies, Cooking.'
  },
  {
    name: 'Indrajit',
    phoneNumber: '+919876543215',
    password: 'Indra@123', // ggignore
    location: 'Coimbatore',
    bio: 'Software Engineer at Microsoft, passionate about music and movies. From PSG, speaks Tamil. Interests: Music, Movies.'
  },
  {
    name: 'Iswaryaa',
    phoneNumber: '+919876543216',
    password: 'Iswar@123', // ggignore
    location: 'Erode',
    bio: 'Software Engineer at Deloitte, passionate about movies and public speaking. From PSG, speaks Tamil. Interests: Movies, Orator.'
  },
  {
    name: 'Jenitha',
    phoneNumber: '+919876543217',
    password: 'Jeni@123', // ggignore
    location: 'Chittoor',
    bio: 'Software Engineer at Morgan Stanley, passionate about movies and reading. From PSG, speaks Telugu. Interests: Movies, Books.'
  },
  {
    name: 'Keerthi',
    phoneNumber: '+919876543218',
    password: 'Keer@123', // ggignore
    location: 'Coimbatore',
    bio: 'Software Engineer at Walmart, passionate about cricket and music. From PSG, speaks Tamil. Interests: Cricket, Music.'
  },
  {
    name: 'Mokshith',
    phoneNumber: '+919876543219',
    password: 'Moksh@123', // ggignore
    location: 'Hosur',
    bio: 'Software Engineer at Cisco, passionate about books and public speaking. From PSG, speaks Telugu. Interests: Books, Orator.'
  },
  {
    name: 'Preetham',
    phoneNumber: '+919876543220',
    password: 'Preet@123', // ggignore
    location: 'Salem',
    bio: 'Software Engineer at Astra Zeneca, passionate about football, cricket and gaming. From PSG, speaks Tamil. Interests: Football, Cricket, Gaming.'
  },
  {
    name: 'Rishitha',
    phoneNumber: '+919876543221',
    password: 'Rishi@123', // ggignore
    location: 'Kolkata',
    bio: 'Software Engineer at Societe Generale, passionate about books and art. From PSG, speaks Hindi. Interests: Books, Art.'
  },
  {
    name: 'Roshini',
    phoneNumber: '+919876543222',
    password: 'Roshi@123', // ggignore      
    location: 'Salem',
    bio: 'Software Engineer at Cisco, passionate about movies and reading. From PSG, speaks Tamil. Interests: Movies, Books.'
  },
  {
    name: 'Sneha',
    phoneNumber: '+919876543223',
    password: 'Sneha@123', // ggignore
    location: 'Coimbatore',
    bio: 'Software Engineer at Medibuddy, passionate about art and crafts. From PSG, speaks Tamil. Interests: Art, Craft.'
  },
  {
    name: 'Swetha',
    phoneNumber: '+919876543224',
    password: 'Sweth@123', // ggignore  
    location: 'Coimbatore',
    bio: 'Software Engineer at Microsoft, passionate about reading and cricket. From PSG, speaks Tamil. Interests: Books, Cricket.'
  }
];

interface UserData {
  name: string;
  phoneNumber: string;
  password: string;
  location: string;
  bio: string;
}

class PhoneBasicSeeder {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  async createUser(userData: UserData) {
    try {
      console.log(`Creating user: ${userData.name} (${userData.phoneNumber})...`);
      
      // Create synthetic email from phone number for authentication
      // Since phone auth is disabled in Supabase, use email-based auth with synthetic emails
      const phoneDigits = userData.phoneNumber.replace(/\D/g, '');
      const syntheticEmail = `phone_${phoneDigits}@app.local`;
      
      // Create auth user with synthetic email
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: syntheticEmail,
        password: userData.password,
        email_confirm: true, // Skip email verification for sample data
        user_metadata: {
          name: userData.name,
          phoneNumber: userData.phoneNumber
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

      // Create email from phone number for compatibility (required field)
      const email = `user${userData.phoneNumber.slice(-4)}@phoneauth.local`;

      // Create profile with only available columns
      const profileData = {
        id: authData.user.id,
        email: email, // Required field, using generated email
        phone_number: userData.phoneNumber,
        first_name: firstName,
        last_name: lastName,
        location: userData.location,
        bio: userData.bio,
        is_active: true,
        role: 'user' as const
      };

      const { data: profileResult, error: profileError } = await this.supabase
        .from('profiles')
        .insert(profileData)
        .select();

      if (profileError) {
        console.error(`Error creating profile for ${userData.name}:`, profileError);
        
        // Cleanup auth user
        await this.supabase.auth.admin.deleteUser(authData.user.id);
        
        return { success: false, error: profileError };
      }

      console.log(`✅ Successfully created user: ${userData.name} (Phone: ${userData.phoneNumber})`);
      
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

  async seedUsers() {
    console.log('🌱 Starting basic phone auth database seeding...');
    console.log(`📊 Total users to create: ${sampleUsers.length}`);
    console.log('📱 All users will have phone number authentication');
    
    let successCount = 0;
    let errorCount = 0;
    const errors: any[] = [];

    for (const userData of sampleUsers) {
      const result = await this.createUser(userData);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push({
          name: userData.name,
          phone: userData.phoneNumber,
          error: result.error
        });
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('\n📈 Seeding Results:');
    console.log(`✅ Successfully created: ${successCount} users`);
    console.log(`❌ Failed to create: ${errorCount} users`);

    if (errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      errors.forEach(({ name, phone, error }) => {
        console.log(`  - ${name} (${phone}): ${error.message || JSON.stringify(error)}`);
      });
    }

    // Display login credentials
    if (successCount > 0) {
      console.log('\n🔑 Login Credentials:');
      console.log('═'.repeat(85));
      console.log('   Name        |    Phone Number    |  Password  |    Location    ');
      console.log('═'.repeat(85));
      sampleUsers.slice(0, Math.min(successCount, sampleUsers.length)).forEach(user => {
        console.log(`${user.name.padEnd(12)} | ${user.phoneNumber.padEnd(18)} | ${user.password.padEnd(10)} | ${user.location}`);
      });
      console.log('═'.repeat(85));
      console.log('💡 Use any phone number + password combination above to login to your app');
      console.log('📱 Phone numbers follow Indian format: +91987654321X');
    }

    return {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors
    };
  }

  async checkExistingUsers() {
    console.log('🔍 Checking for existing users...');
    
    const { data, error } = await this.supabase
      .from('profiles')
      .select('phone_number, first_name, last_name, location')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error checking existing users:', error);
      return;
    }

    console.log(`📋 Found ${data.length} existing users in the database`);
    
    if (data.length > 0) {
      console.log('Recent users:');
      data.slice(0, 10).forEach((user, index) => {
        const name = `${user.first_name} ${user.last_name || ''}`.trim();
        const phone = user.phone_number || 'No phone';
        const location = user.location || 'No location';
        console.log(`  ${index + 1}. ${name} (${phone}) - ${location}`);
      });
      
      if (data.length > 10) {
        console.log(`  ... and ${data.length - 10} more`);
      }
    }
  }

  async clearPhoneUsers() {
    console.log('🗑️ Clearing existing phone auth users...');
    
    // Get users with phone numbers starting with +91987654
    const { data: profiles, error: selectError } = await this.supabase
      .from('profiles')
      .select('id, phone_number, first_name')
      .like('phone_number', '+91987654%');

    if (selectError) {
      console.error('Error fetching phone users:', selectError);
      return false;
    }

    if (profiles.length === 0) {
      console.log('No phone auth sample users found to clear.');
      return true;
    }

    console.log(`Found ${profiles.length} phone auth sample users to delete...`);

    let deletedCount = 0;
    for (const profile of profiles) {
      try {
        const { error } = await this.supabase.auth.admin.deleteUser(profile.id);
        if (!error) {
          deletedCount++;
          console.log(`  Deleted user: ${profile.first_name} (${profile.phone_number})`);
        } else {
          console.error(`  Failed to delete ${profile.first_name}:`, error.message);
        }
      } catch (error) {
        console.error(`  Error deleting ${profile.first_name}:`, error);
      }
    }

    console.log(`✅ Cleared ${deletedCount} phone auth users`);
    return true;
  }

  async showCredentials() {
    console.log('\n🔑 Sample User Login Credentials:');
    console.log('═'.repeat(85));
    console.log('   Name        |    Phone Number    |  Password  |    Location    ');
    console.log('═'.repeat(85));
    sampleUsers.forEach(user => {
      console.log(`${user.name.padEnd(12)} | ${user.phoneNumber.padEnd(18)} | ${user.password.padEnd(10)} | ${user.location}`);
    });
    console.log('═'.repeat(85));
    console.log('💡 Use any phone number + password combination above to login');
    console.log('📱 All phone numbers are in Indian format (+91987654321X)');
    console.log('🔐 Passwords follow pattern: Name@123 (e.g., Aish@123, Bian@123)');
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const seeder = new PhoneBasicSeeder();

  try {
    switch (command) {
      case 'clear':
        await seeder.clearPhoneUsers();
        break;
        
      case 'check':
        await seeder.checkExistingUsers();
        break;
        
      case 'credentials':
        await seeder.showCredentials();
        break;
        
      case 'seed':
      default:
        await seeder.checkExistingUsers();
        console.log();
        
        if (args.includes('--clear')) {
          await seeder.clearPhoneUsers();
          console.log();
        }
        
        const result = await seeder.seedUsers();
        
        if (result.success) {
          console.log('\n🎉 Phone auth database seeding completed successfully!');
          console.log('💡 Note: This uses the basic schema. For full features, upgrade your database schema.');
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

if (process.argv.length < 2) {
  console.log('Basic Phone Number Authentication Seeder');
  console.log('');
  console.log('Usage:');
  console.log('  npm run seed:phone:basic [command]');
  console.log('');
  console.log('Commands:');
  console.log('  seed          Seed the database with phone auth users (default)');
  console.log('  seed --clear  Clear existing phone users and seed fresh data');
  console.log('  clear         Clear existing phone auth users only');
  console.log('  check         Check existing users in database');
  console.log('  credentials   Show login credentials table');
  process.exit(0);
}

main().catch(console.error);