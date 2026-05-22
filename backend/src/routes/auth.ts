import { Router } from 'express';
import { validateBody } from '../utils/validation';
import { authSchemas } from '../utils/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { ValidationError, ConflictError, UnauthorizedError } from '../types/errors';
import { logger } from '../config/logger';
import { AuthService } from '../services/auth.service';

export const authRouter = Router();

// Register endpoint - supports both email and phone number
authRouter.post('/register', 
  validateBody(authSchemas.register),
  asyncHandler(async (req, res) => {
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
    } = req.body;
    
    if (!email && !phoneNumber) {
      throw new ValidationError('Either email or phone number is required');
    }
    
    try {
      const result = await AuthService.signUp({
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
        ageGroup,
      });
      
      res.status(201).json({
        success: true,
        message: 'Registration successful',
        data: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      
      if (errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
        throw new ConflictError('User with this email/phone already exists');
      }
      
      throw new ValidationError(errorMessage);
    }
  })
);

// Login endpoint - supports both email and phone number
authRouter.post('/login',
  validateBody(authSchemas.login),
  asyncHandler(async (req, res) => {
    const { email, phoneNumber, password } = req.body;
    
    if (!email && !phoneNumber) {
      throw new ValidationError('Either email or phone number is required');
    }
    
    try {
      const result = await AuthService.logIn({
        email,
        phoneNumber,
        password,
      });
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new UnauthorizedError(errorMessage);
    }
  })
);

// Logout endpoint
authRouter.post('/logout',
  asyncHandler(async (req, res) => {
    const accessToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (accessToken) {
      try {
        await AuthService.logOut(accessToken);
      } catch (error) {
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
    
    try {
      const result = await AuthService.refreshToken(refreshToken);
      
      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      throw new UnauthorizedError(errorMessage);
    }
  })
);

// Forgot password endpoint
authRouter.post('/forgot-password',
  validateBody(authSchemas.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    
    try {
      await AuthService.forgotPassword(email);
      
      res.json({
        success: true,
        message: 'Password reset email sent',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      throw new ValidationError(errorMessage);
    }
  })
);

// Reset password endpoint
authRouter.post('/reset-password',
  validateBody(authSchemas.resetPassword),
  asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    
    try {
      await AuthService.resetPassword(token, newPassword);
      
      res.json({
        success: true,
        message: 'Password reset successful',
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      throw new UnauthorizedError(errorMessage);
    }
  })
);