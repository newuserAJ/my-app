import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '../utils/asyncStorage';
import { apiClient, AuthAPI } from '../services/api';

interface User {
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
}

interface AuthContextType {
  user: User | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  sessionToken: string | null;
  login: (phoneNumber?: string, email?: string, password?: string) => Promise<void>;
  signup: (payload: {
    email?: string;
    phoneNumber?: string;
    password: string;
    firstName?: string;
    lastName?: string;
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
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'auth_user',
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // DEVELOPMENT MODE: Clear auth state to always start fresh
        // TODO: Comment out these lines for production to enable session persistence
        await AsyncStorage.multiRemove([
          STORAGE_KEYS.USER,
          STORAGE_KEYS.ACCESS_TOKEN,
          STORAGE_KEYS.REFRESH_TOKEN,
        ]);
        
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.USER);
        const storedAccessToken = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedRefreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

        if (storedUser && storedAccessToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setIsLoggedIn(true);
          setSessionToken(storedAccessToken);
          apiClient.setTokens(storedAccessToken, storedRefreshToken || undefined);
        }
      } catch (error) {
        console.error('Failed to restore auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (phoneNumber?: string, email?: string, password?: string) => {
    if (!password) {
      throw new Error('Password is required');
    }

    if (!phoneNumber && !email) {
      throw new Error('Either phone number or email is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.login({
        phoneNumber,
        email,
        password,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Login failed');
      }

      const { user: userData, session } = response.data;

      // Store auth data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
      if (session.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token);
      }

      // Update API client
      apiClient.setTokens(session.access_token, session.refresh_token);

      // Update state
      setUser(userData);
      setIsLoggedIn(true);
      setSessionToken(session.access_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (payload: {
    email?: string;
    phoneNumber?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
  }) => {
    if (!payload.password) {
      throw new Error('Password is required');
    }

    if (!payload.phoneNumber && !payload.email) {
      throw new Error('Either phone number or email is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await AuthAPI.register(payload);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Registration failed');
      }

      const { user: userData, session } = response.data;

      // Store auth data
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, session.access_token);
      if (session.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, session.refresh_token);
      }

      // Update API client
      apiClient.setTokens(session.access_token, session.refresh_token);

      // Update state
      setUser(userData);
      setIsLoggedIn(true);
      setSessionToken(session.access_token);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Call backend logout endpoint
      try {
        await AuthAPI.logout();
      } catch (err) {
        console.warn('Backend logout failed, clearing local auth anyway:', err);
      }

      // Clear storage
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.USER,
        STORAGE_KEYS.ACCESS_TOKEN,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);

      // Clear API client tokens
      apiClient.clearTokens();

      // Update state
      setUser(null);
      setIsLoggedIn(false);
      setSessionToken(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Logout failed';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    }
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn,
        isLoading,
        error,
        sessionToken,
        login,
        signup,
        logout,
        updateUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}