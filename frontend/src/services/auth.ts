import { Platform } from 'react-native';

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator
const BASE_URL = Platform.select({
  ios: 'http://localhost:8080',
  android: 'http://10.0.2.2:8080',
  default: 'http://localhost:8080',
});

export interface User {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: {
    name?: string;
    email?: string;
    [key: string]: any;
  };
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

export const AuthService = {
  async checkUsername(username: string) {
    try {
      const response = await fetch(`${BASE_URL}/auth/login/check-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Check username failed');
      return data.exists;
    } catch (error) {
      console.error('Check username error:', error);
      throw error;
    }
  },

  async login(username: string, password: string) {
    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');
      return data; // returns { user, session }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
};
