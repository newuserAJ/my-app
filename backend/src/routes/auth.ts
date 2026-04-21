import { Router } from 'express';
import { supabase } from '../config/supabase';
import { validateBody } from '../utils/validation';
import { authSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, ConflictError, UnauthorizedError } from '../types/errors';
import { logger } from '../config/logger';
import { passwordResetRateLimit } from '../middleware/rateLimiting';

export const authRouter = Router();

// Register endpoint
authRouter.post('/register', 
  validateBody(authSchemas.register),
  asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    logger.info('User registration attempt:', { email });
    
    // Sign up user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
        },
      },
    });
    
    if (error) {
      logger.error('Registration failed:', { email, error: error.message });
      
      if (error.message.includes('already registered')) {
        throw new ConflictError('User with this email already exists');
      }
      
      throw new ValidationError(error.message);
    }
    
    if (!data.user) {
      throw new ValidationError('Registration failed');
    }
    
    logger.info('User registered successfully:', { 
      userId: data.user.id, 
      email: data.user.email 
    });
    
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName,
          lastName,
          emailConfirmed: data.user.email_confirmed_at !== null,
        },
        session: data.session,
      },
    });
  })
);

// Login endpoint
authRouter.post('/login',
  validateBody(authSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    logger.info('User login attempt:', { email });
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      logger.warn('Login failed:', { email, error: error.message });
      throw new UnauthorizedError('Invalid email or password');
    }
    
    if (!data.user || !data.session) {
      throw new UnauthorizedError('Login failed');
    }
    
    logger.info('User logged in successfully:', { 
      userId: data.user.id, 
      email: data.user.email 
    });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata?.firstName,
          lastName: data.user.user_metadata?.lastName,
          emailConfirmed: data.user.email_confirmed_at !== null,
        },
        session: data.session,
      },
    });
  })
);

// Logout endpoint
authRouter.post('/logout',
  asyncHandler(async (req, res) => {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (accessToken) {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        logger.warn('Logout error:', error);
      }
    }
    
    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);

// Refresh token endpoint
authRouter.post('/refresh',
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }
    
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });
    
    if (error) {
      logger.warn('Token refresh failed:', error);
      throw new UnauthorizedError('Invalid refresh token');
    }
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        session: data.session,
      },
    });
  })
);

// Forgot password endpoint
authRouter.post('/forgot-password',
  passwordResetRateLimit,
  validateBody(authSchemas.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    logger.info('Password reset requested:', { email });
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
    });
    
    if (error) {
      logger.error('Password reset failed:', { email, error: error.message });
      throw new ValidationError(error.message);
    }
    
    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  })
);

// Reset password endpoint
authRouter.post('/reset-password',
  passwordResetRateLimit,
  validateBody(authSchemas.resetPassword),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    // Verify the reset token and update password
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });
    
    if (error) {
      logger.error('Password reset verification failed:', error);
      throw new UnauthorizedError('Invalid or expired reset token');
    }
    
    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (updateError) {
      logger.error('Password update failed:', updateError);
      throw new ValidationError('Failed to update password');
    }
    
    logger.info('Password reset successful:', { userId: data.user?.id });
    
    res.json({
      success: true,
      message: 'Password reset successful',
    });
  })
);