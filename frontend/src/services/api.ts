import { Platform } from 'react-native';

// Get base URL from environment or use defaults
const getBaseURL = (): string => {
  // For web/development: try to connect to localhost:8081
  // For native apps running on physical devices: update this IP to your computer's local IP
  // Example: '192.168.1.100:8081'
  
  if (Platform.OS === 'web') {
    // For web browser testing, use localhost
    return 'http://localhost:8081';
  }
  
  if (Platform.OS === 'ios') {
    // For iOS simulator, localhost works
    return 'http://localhost:8081';
  }
  
  if (Platform.OS === 'android') {
    // For Android emulator, use special Android IP for host machine
    return 'http://10.0.2.2:8081';
  }
  
  return 'http://localhost:8081';
};

const BASE_URL = getBaseURL();

export const API_BASE_URL = BASE_URL;

interface RequestOptions extends Omit<RequestInit, 'body' | 'headers'> {
  headers?: Record<string, string>;
  method?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
}

interface AuthSession {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
}

interface AuthUser {
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
  bio?: string;
  hubs?: string[];
}

interface AuthPayload {
  user: AuthUser;
  session: AuthSession;
}

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Set authentication tokens
   */
  setTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (refreshToken) {
      this.refreshToken = refreshToken;
    }
  }

  /**
   * Clear authentication tokens (on logout)
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Get current refresh token
   */
  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await this.request<{
        session: {
          access_token: string;
          refresh_token?: string;
          expires_at?: number;
        };
      }>('/api/auth/refresh', {
        method: 'POST',
        body: {
          refreshToken: this.refreshToken,
        },
        skipAuth: true, // Don't add Authorization header for this request
      });

      if (response.data?.session.access_token) {
        this.setTokens(
          response.data.session.access_token,
          response.data.session.refresh_token || this.refreshToken
        );
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    }

    return false;
  }

  /**
   * Make an API request
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions & { 
      body?: any; 
      skipAuth?: boolean;
      retryOnUnauth?: boolean;
    } = {}
  ): Promise<ApiResponse<T>> {
    const { body, skipAuth = false, retryOnUnauth = true, ...fetchOptions } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    // Add authorization header if token exists and not skipped
    if (this.accessToken && !skipAuth) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data: ApiResponse<T> = await response.json();

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryOnUnauth && !skipAuth) {
        const tokenRefreshed = await this.refreshAccessToken();
        if (tokenRefreshed) {
          // Retry the original request with new token
          return this.request<T>(endpoint, {
            ...options,
            retryOnUnauth: false, // Prevent infinite retry loop
          });
        }
      }

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`API Error (${endpoint}): ${url}`, errorMessage);
      console.error('Full error:', error);
      throw error;
    }
  }

  /**
   * GET request
   */
  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  post<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions & { skipAuth?: boolean }
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body,
    });
  }

  /**
   * PUT request
   */
  put<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions & { skipAuth?: boolean }
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body,
    });
  }

  /**
   * PATCH request
   */
  patch<T>(
    endpoint: string,
    body?: any,
    options?: RequestOptions & { skipAuth?: boolean }
  ) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body,
    });
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

/**
 * Auth API methods
 */
export const AuthAPI = {
  register: (payload: {
    email?: string;
    phoneNumber?: string;
    password: string;
    firstName?: string;
    lastName?: string;
    gender?: string;
    dateOfBirth?: string;
  }) => apiClient.post<AuthPayload>('/api/auth/register', payload, { skipAuth: true }),

  login: (payload: {
    email?: string;
    phoneNumber?: string;
    password: string;
  }) => apiClient.post<AuthPayload>('/api/auth/login', payload, { skipAuth: true }),

  logout: () => apiClient.post('/api/auth/logout'),

  refreshToken: (refreshToken: string) =>
    apiClient.post('/api/auth/refresh', { refreshToken }, { skipAuth: true }),

  forgotPassword: (email: string) =>
    apiClient.post('/api/auth/forgot-password', { email }, { skipAuth: true }),

  resetPassword: (token: string, newPassword: string) =>
    apiClient.post(
      '/api/auth/reset-password',
      { token, newPassword },
      { skipAuth: true }
    ),
};

/**
 * User API methods
 */
export const UserAPI = {
  getMe: () => apiClient.get('/api/me'),

  updateProfile: (payload: Record<string, any>) =>
    apiClient.patch('/api/users/me', payload),

  getUser: (userId: string) => apiClient.get(`/api/users/${userId}`),

  searchUsers: (query: string, limit: number = 10) =>
    apiClient.get('/api/users/search', {
      headers: { 'X-Query': query, 'X-Limit': limit.toString() },
    }),

  uploadContacts: (payload: {
    contacts: {
      name: string;
      phone: string;
      email?: string;
    }[];
  }) => apiClient.post('/api/users/contacts', payload),

  getConnections: () => apiClient.get('/api/users/connections'),

  getContacts: () => apiClient.get('/api/users/contacts'),
};

/**
 * Posts API methods
 */
export const PostsAPI = {
  createPost: (payload: Record<string, any>) =>
    apiClient.post('/api/posts', payload),

  getPosts: (page: number = 1, limit: number = 10) =>
    apiClient.get(`/api/posts?page=${page}&limit=${limit}`),

  getPost: (postId: string) => apiClient.get(`/api/posts/${postId}`),

  updatePost: (postId: string, payload: Record<string, any>) =>
    apiClient.patch(`/api/posts/${postId}`, payload),

  deletePost: (postId: string) => apiClient.delete(`/api/posts/${postId}`),
};

/**
 * Comments API methods
 */
export const CommentsAPI = {
  createComment: (payload: Record<string, any>) =>
    apiClient.post('/api/comments', payload),

  getComments: (postId: string, page: number = 1, limit: number = 10) =>
    apiClient.get(`/api/comments?postId=${postId}&page=${page}&limit=${limit}`),

  updateComment: (commentId: string, payload: Record<string, any>) =>
    apiClient.patch(`/api/comments/${commentId}`, payload),

  deleteComment: (commentId: string) => apiClient.delete(`/api/comments/${commentId}`),
};
