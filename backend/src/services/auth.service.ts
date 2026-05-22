import { supabase, supabaseAdmin } from '../config/supabase';
import { logger } from '../config/logger';

interface SignUpPayload {
  email?: string;
  phoneNumber?: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  location?: string;
  language?: string;
  occupation?: string;
  school?: string;
  company?: string;
  interests?: string[];
  age?: number;
  ageGroup?: '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
}

interface LoginPayload {
  email?: string;
  phoneNumber?: string;
  password: string;
}

/** E.164-ish phone → stable local-part for Supabase email auth (avoids `+` etc. in mailbox). */
function syntheticEmailFromPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/\D/g, '');
  if (digits.length < 9) {
    throw new Error('Invalid phone number');
  }
  return `phone_${digits}@app.local`;
}

interface AuthResponse {
  user: {
    id: string;
    email?: string;
    phoneNumber?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    gender?: string;
    dateOfBirth?: string;
    location?: string;
    language?: string;
    occupation?: string;
    school?: string;
    company?: string;
    interests?: string[];
    age?: number;
    ageGroup?: string;
  };
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at?: number;
  };
}

export class AuthService {
  /**
   * Register a new user with email or phone number
   */
  static async signUp(payload: SignUpPayload): Promise<AuthResponse> {
    const { 
      email, 
      phoneNumber, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth, 
      gender,
      location,
      language,
      occupation,
      school,
      company,
      interests,
      age,
      ageGroup
    } = payload;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const signUpEmail = email || syntheticEmailFromPhone(phoneNumber!);

    logger.info('User registration attempt:', { email, phoneNumber });

    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password,
      options: {
        data: {
          firstName: firstName || '',
          lastName: lastName || '',
          fullName: `${firstName || ''} ${lastName || ''}`.trim(),
          phoneNumber: phoneNumber || null,
          gender: gender || null,
          dateOfBirth: dateOfBirth || null,
          location: location || null,
          language: language || null,
          occupation: occupation || null,
          school: school || null,
          company: company || null,
          interests: interests || [],
          age: age || null,
          ageGroup: ageGroup || null,
        },
      },
    });

    if (error) {
      logger.error('Registration failed:', { email, phoneNumber, error: error.message });
      
      if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) {
        throw new Error('Email rate limit exceeded. Please try again in a few minutes or use phone number authentication instead.');
      }
      
      throw new Error(error.message || 'Registration failed');
    }

    if (!data.user) {
      throw new Error('Registration failed: User not created');
    }

    // Create profile record in the database
    await this.createProfile(data.user.id, {
      email: email || null,
      phoneNumber: phoneNumber || null,
      firstName: firstName || null,
      lastName: lastName || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      location: location || null,
      language: language || null,
      occupation: occupation || null,
      school: school || null,
      company: company || null,
      interests: interests || [],
      age: age || null,
      ageGroup: ageGroup || null,
    });

    logger.info('User registered successfully:', {
      userId: data.user.id,
      email,
      phoneNumber,
    });

    const user: AuthResponse['user'] = {
      id: data.user.id,
      fullName: `${firstName || ''} ${lastName || ''}`.trim(),
    };
    
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (gender) user.gender = gender;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (location) user.location = location;
    if (language) user.language = language;
    if (occupation) user.occupation = occupation;
    if (school) user.school = school;
    if (company) user.company = company;
    if (interests && interests.length > 0) user.interests = interests;
    if (age) user.age = age;
    if (ageGroup) user.ageGroup = ageGroup;

    const session: AuthResponse['session'] = {
      access_token: data.session?.access_token || '',
    };
    
    if (data.session?.refresh_token) session.refresh_token = data.session.refresh_token;
    if (data.session?.expires_at) session.expires_at = data.session.expires_at;

    return { user, session };
  }

  /**
   * Login user with email or phone number
   */
  static async logIn(payload: LoginPayload) {
    const { email, phoneNumber, password } = payload;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required');
    }

    if (!password) {
      throw new Error('Password is required');
    }

    const emailCandidates = email
      ? [email]
      : Array.from(
          new Set([
            syntheticEmailFromPhone(phoneNumber!),
            // Also try without the + prefix (as stored in DB)
            `phone_${phoneNumber!.trim().replace(/\D/g, '')}@app.local`,
          ])
        );

    logger.info('User login attempt:', { email, phoneNumber });

    let data: Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>['data'] | undefined;
    let lastError: { message: string } | null = null;

    // Try phone authentication first if phone number is provided
    if (phoneNumber) {
      // Try with original format first
      logger.info('Attempting phone authentication for:', phoneNumber);
      let phoneResult = await supabase.auth.signInWithPassword({
        phone: phoneNumber,
        password,
      });
      
      // If failed, try without country code (as stored in DB)
      if (phoneResult.error && phoneNumber.startsWith('+91')) {
        const phoneWithoutCountryCode = phoneNumber.substring(3); // Remove +91
        logger.info('Retrying phone authentication without country code:', phoneWithoutCountryCode);
        phoneResult = await supabase.auth.signInWithPassword({
          phone: phoneWithoutCountryCode,
          password,
        });
      }
      
      if (!phoneResult.error && phoneResult.data.session) {
        data = phoneResult.data;
        logger.info('Phone authentication successful');
      } else {
        lastError = phoneResult.error;
        logger.warn('Phone authentication failed:', phoneResult.error?.message);
      }
    }
    
    // Fallback to email authentication if phone authentication failed or no phone provided
    if (!data?.session) {
      logger.info('Attempting email authentication with synthetic emails');
      for (const loginEmail of emailCandidates) {
        logger.info('Trying email:', loginEmail);
        const result = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });
        if (!result.error && result.data.session) {
          data = result.data;
          logger.info('Email authentication successful with:', loginEmail);
          break;
        }
        lastError = result.error;
        logger.warn('Email authentication failed for:', loginEmail, result.error?.message);
      }
    }

    if (!data?.user || !data.session) {
      logger.warn('Login failed:', {
        email,
        phoneNumber,
        error: lastError?.message,
      });
      throw new Error('Invalid email/phone or password');
    }

    // Fetch user profile
    const profile = await this.getProfile(data.user.id);

    logger.info('User logged in successfully:', {
      userId: data.user.id,
      email,
      phoneNumber,
    });

    const user: AuthResponse['user'] = {
      id: data.user.id,
    };
    
    if (profile?.email || email) user.email = profile?.email || email;
    if (profile?.phone_number || phoneNumber) user.phoneNumber = profile?.phone_number || phoneNumber;
    if (profile?.first_name) user.firstName = profile.first_name;
    if (profile?.last_name) user.lastName = profile.last_name;
    if (profile?.full_name) user.fullName = profile.full_name;
    if (profile?.gender) user.gender = profile.gender;
    if (profile?.date_of_birth) user.dateOfBirth = profile.date_of_birth;
    if (profile?.location) user.location = profile.location;
    if (profile?.language) user.language = profile.language;
    if (profile?.occupation) user.occupation = profile.occupation;
    if (profile?.school) user.school = profile.school;
    if (profile?.company) user.company = profile.company;
    if (profile?.interests) user.interests = profile.interests;
    if (profile?.age) user.age = profile.age;
    if (profile?.age_group) user.ageGroup = profile.age_group;

    const session: AuthResponse['session'] = {
      access_token: data.session.access_token,
    };
    
    if (data.session.refresh_token) session.refresh_token = data.session.refresh_token;
    if (data.session.expires_at) session.expires_at = data.session.expires_at;

    return { user, session };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new Error('Refresh token is required');
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      logger.warn('Token refresh failed:', error);
      throw new Error('Invalid refresh token');
    }

    if (!data.session) {
      throw new Error('Token refresh failed');
    }

    logger.info('Token refreshed successfully');

    return {
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
      },
    };
  }

  /**
   * Logout user
   */
  static async logOut(accessToken: string) {
    if (!accessToken) {
      logger.warn('Logout attempted without access token');
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.warn('Logout error:', error);
      // Don't throw - client can clear tokens anyway
    }

    logger.info('User logged out');
  }

  /**
   * Get user profile from database
   */
  static async getProfile(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      logger.error('Error fetching profile:', { userId, error });
      throw error;
    }

    return data;
  }

  /**
   * Create user profile in database
   */
  static async createProfile(
    userId: string,
    profileData: {
      email?: string | null;
      phoneNumber?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      dateOfBirth?: string | null;
      gender?: string | null;
      location?: string | null;
      language?: string | null;
      occupation?: string | null;
      school?: string | null;
      company?: string | null;
      interests?: string[];
      age?: number | null;
      ageGroup?: string | null;
    }
  ) {
    const { 
      email, 
      phoneNumber, 
      firstName, 
      lastName, 
    } = profileData;

    // Only use core required fields that definitely exist in the schema
    const profile: any = {
      id: userId,
      email: email || phoneNumber || `user_${userId}`,
      first_name: firstName || null,
      last_name: lastName || null,
      phone_number: phoneNumber || null,
      is_active: true,
      role: 'user',
    };

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert(profile)
      .select()
      .single();

    if (error) {
      // If profile already exists (e.g., created by trigger), ignore
      if (error.code === 'PGRST116') {
        logger.info('Profile already exists for user:', { userId });
        return;
      }
      // Unique violation (profile already inserted)
      if (error.code === '23505') {
        logger.info('Profile row already present (duplicate):', { userId });
        return;
      }
      
      logger.error('Error creating profile:', { userId, error });
      throw error;
    }

    logger.info('Profile created successfully:', { userId });
    
    // Update profile with additional fields after creation if provided
    const additionalFields: any = {};
    if (profileData.dateOfBirth) additionalFields.date_of_birth = profileData.dateOfBirth;
    if (profileData.gender) additionalFields.gender = profileData.gender;
    if (profileData.location) additionalFields.location = profileData.location;
    if (profileData.language) additionalFields.language = profileData.language;
    if (profileData.occupation) additionalFields.occupation = profileData.occupation;
    if (profileData.school) additionalFields.school = profileData.school;
    if (profileData.company) additionalFields.company = profileData.company;
    if (profileData.interests) additionalFields.interests = profileData.interests;
    if (profileData.age) additionalFields.age = profileData.age;
    if (profileData.ageGroup) additionalFields.age_group = profileData.ageGroup;

    if (Object.keys(additionalFields).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(additionalFields)
        .eq('id', userId);

      if (updateError) {
        logger.warn('Error updating profile with additional fields:', { userId, error: updateError.message });
        // Don't fail the entire registration if additional fields fail
      }
    }

    return data;
  }

  /**
   * Forgot password
   */
  static async forgotPassword(email: string) {
    if (!email) {
      throw new Error('Email is required');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${frontendUrl}/auth/reset-password`,
    });

    if (error) {
      logger.error('Password reset failed:', { email, error: error.message });
      throw new Error(error.message || 'Password reset failed');
    }

    logger.info('Password reset email sent:', { email });
  }

  /**
   * Reset password with OTP token
   */
  static async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new Error('Token and new password are required');
    }

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error) {
      logger.error('Password reset verification failed:', error);
      throw new Error('Invalid or expired reset token');
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      logger.error('Password update failed:', updateError);
      throw new Error('Failed to update password');
    }

    logger.info('Password reset successful:', { userId: data.user?.id });
  }
}
