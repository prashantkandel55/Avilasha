import { toast } from '@/hooks/use-toast';
import { securityService, TokenPair, JwtToken } from './security';

export interface User {
  id: string;
  email: string;
  fullName?: string;
  profilePicture?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    priceAlerts: boolean;
    newsAlerts: boolean;
    securityAlerts: boolean;
  };
  currency: string;
  language: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface RegisterData {
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

class AuthService {
  private readonly AUTH_API_URL = process.env.AUTH_API_URL || 'https://api.example.com/auth';
  private readonly RETRY_COUNT = 3;
  private readonly RETRY_DELAY = 1000; // milliseconds
  private readonly PASSWORD_MIN_LENGTH = 8;
  private readonly EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  private currentUser: User | null = null;

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Validate email format
   */
  private validateEmail(email: string): boolean {
    return this.EMAIL_REGEX.test(email);
  }

  /**
   * Validate password strength
   */
  private validatePassword(password: string): string | null {
    if (password.length < this.PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${this.PASSWORD_MIN_LENGTH} characters long`;
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      return 'Password must contain at least one special character';
    }

    return null;
  }

  /**
   * Make API request with retry mechanism
   */
  private async apiRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    requiresAuth: boolean = false
  ): Promise<T> {
    // Apply rate limiting for auth requests
    if (!securityService.applyRateLimit('auth_api_' + endpoint)) {
      throw new Error('Too many authentication attempts. Please try again later.');
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (requiresAuth) {
      const authHeaders = await securityService.getAuthHeaders();
      Object.assign(headers, authHeaders);
    }

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.RETRY_COUNT; attempt++) {
      try {
        const response = await fetch(`${this.AUTH_API_URL}${endpoint}`, {
          method,
          headers,
          body: body ? JSON.stringify(body) : undefined,
          credentials: 'include' // Include cookies for session management
        });
        
        if (!response.ok) {
          if (response.status === 401 && requiresAuth) {
            // Try to refresh the token
            const refreshed = await this.refreshToken();
            if (refreshed) {
              // Retry with new token
              const authHeaders = await securityService.getAuthHeaders();
              const retryResponse = await fetch(`${this.AUTH_API_URL}${endpoint}`, {
                method,
                headers: {
                  ...headers,
                  ...authHeaders
                },
                body: body ? JSON.stringify(body) : undefined,
                credentials: 'include'
              });
              
              if (retryResponse.ok) {
                return await retryResponse.json();
              }
            }
            
            // If refresh failed or retry with new token failed
            securityService.clearTokens();
            this.currentUser = null;
            localStorage.removeItem('user_data');
            throw new Error('Your session has expired. Please log in again.');
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        return await response.json();
      } catch (error) {
        lastError = error as Error;
        
        // Wait before retrying (except on the last attempt)
        if (attempt < this.RETRY_COUNT - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    
    // If we reach here, all retry attempts failed
    throw lastError || new Error('Failed to complete request after multiple attempts');
  }

  /**
   * Log in with email and password
   */
  async login({ email, password, rememberMe = false }: LoginData): Promise<User> {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!this.validateEmail(email)) {
        throw new Error('Invalid email format');
      }

      // For demo purposes, accept mock credentials
      // In production, this would be a real API call
      if (email === 'demo@example.com' && password === 'Demo@123') {
        // Mock successful login
        const mockUser: User = {
          id: '1',
          email,
          fullName: 'Demo User',
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              priceAlerts: true,
              newsAlerts: true,
              securityAlerts: true,
            },
            currency: 'USD',
            language: 'en',
          },
        };

        const mockTokens: TokenPair = {
          accessToken: {
            token: 'mock_access_token',
            expiresAt: Date.now() + 3600 * 1000, // 1 hour
          },
          refreshToken: {
            token: 'mock_refresh_token',
            expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // 7 days
          },
        };

        // Store tokens securely
        securityService.storeTokens(mockTokens);
        
        // Store user
        this.currentUser = mockUser;
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        return mockUser;
      }

      // Real API call would go here in production
      try {
        const response = await this.apiRequest<{user: User, tokens: TokenPair}>('/login', 'POST', { 
          email, 
          password,
          rememberMe 
        });
        
        // Store tokens securely
        securityService.storeTokens(response.tokens);
        
        // Store user
        this.currentUser = response.user;
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        return response.user;
      } catch (error) {
        // For demo, fallback to mock data on API failure
        throw new Error('Invalid email or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<User> {
    try {
      if (!data.email || !data.password) {
        throw new Error('Email and password are required');
      }

      if (!this.validateEmail(data.email)) {
        throw new Error('Invalid email format');
      }

      const passwordError = this.validatePassword(data.password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // For demo purposes only
      if (data.email === 'demo@example.com') {
        throw new Error('This email is already in use');
      }

      // Real API call would go here in production
      try {
        const response = await this.apiRequest<{user: User, tokens: TokenPair}>('/register', 'POST', data);
        
        // Store tokens securely
        securityService.storeTokens(response.tokens);
        
        // Store user
        this.currentUser = response.user;
        localStorage.setItem('user_data', JSON.stringify(response.user));
        
        return response.user;
      } catch (error) {
        // For demo, create mock user
        const mockUser: User = {
          id: Math.random().toString(36).substring(2, 15),
          email: data.email,
          fullName: data.fullName || data.email.split('@')[0],
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              priceAlerts: true,
              newsAlerts: true,
              securityAlerts: true,
            },
            currency: 'USD',
            language: 'en',
          },
        };

        const mockTokens: TokenPair = {
          accessToken: {
            token: 'mock_access_token_' + mockUser.id,
            expiresAt: Date.now() + 3600 * 1000, // 1 hour
          },
          refreshToken: {
            token: 'mock_refresh_token_' + mockUser.id,
            expiresAt: Date.now() + 7 * 24 * 3600 * 1000, // 7 days
          },
        };

        // Store tokens securely
        securityService.storeTokens(mockTokens);
        
        // Store user
        this.currentUser = mockUser;
        localStorage.setItem('user_data', JSON.stringify(mockUser));

        toast({
          title: 'Registration Successful',
          description: 'Account created successfully in demo mode',
          variant: 'default',
        });

        return mockUser;
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout(): Promise<void> {
    try {
      // Real API call would go here in production
      // await this.apiRequest('/logout', 'POST', null, true);
      
      // Clear tokens and user data
      securityService.clearTokens();
      this.currentUser = null;
      localStorage.removeItem('user_data');
      
      toast({
        title: 'Logged Out',
        description: 'You have been successfully logged out',
        variant: 'default',
      });
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if API fails, clear local tokens and user data
      securityService.clearTokens();
      this.currentUser = null;
      localStorage.removeItem('user_data');
    }
  }

  /**
   * Get the current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    const accessToken = securityService.getAccessToken();
    return !!accessToken && !securityService.isTokenExpired(accessToken);
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = securityService.getRefreshToken();
      
      if (!refreshToken || securityService.isTokenExpired(refreshToken)) {
        return false;
      }
      
      // For demo purposes
      const mockTokens: TokenPair = {
        accessToken: {
          token: 'new_mock_access_token',
          expiresAt: Date.now() + 3600 * 1000, // 1 hour
        },
        refreshToken: {
          token: refreshToken.token,
          expiresAt: refreshToken.expiresAt,
        },
      };
      
      securityService.storeTokens(mockTokens);
      return true;
      
      // Real API implementation:
      // const response = await this.apiRequest<{tokens: TokenPair}>('/refresh-token', 'POST', {
      //   refreshToken: refreshToken.token
      // });
      // securityService.storeTokens(response.tokens);
      // return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      if (!this.currentUser) {
        throw new Error('You must be logged in to update your profile');
      }
      
      // Real API implementation:
      // const updatedUser = await this.apiRequest<User>('/profile', 'PUT', updates, true);
      
      // For demo:
      const updatedUser = {
        ...this.currentUser,
        ...updates,
      };
      
      this.currentUser = updatedUser;
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated',
        variant: 'default',
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Update user preferences
   */
  async updatePreferences(preferences: Partial<UserPreferences>): Promise<User> {
    try {
      if (!this.currentUser) {
        throw new Error('You must be logged in to update preferences');
      }
      
      // Real API implementation:
      // const updatedUser = await this.apiRequest<User>('/preferences', 'PUT', { preferences }, true);
      
      // For demo:
      const updatedUser = {
        ...this.currentUser,
        preferences: {
          ...this.currentUser.preferences,
          ...preferences,
        },
      };
      
      this.currentUser = updatedUser;
      localStorage.setItem('user_data', JSON.stringify(updatedUser));
      
      toast({
        title: 'Preferences Updated',
        description: 'Your preferences have been saved',
        variant: 'default',
      });
      
      return updatedUser;
    } catch (error) {
      console.error('Preferences update error:', error);
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update preferences',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Load user from local storage
   */
  private loadUserFromStorage(): void {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      }
    } catch (error) {
      console.error('Failed to load user from storage:', error);
    }
  }

  /**
   * Change password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      if (!this.currentUser) {
        throw new Error('You must be logged in to change your password');
      }
      
      const passwordError = this.validatePassword(newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }
      
      // Real API implementation:
      // await this.apiRequest('/change-password', 'POST', {
      //   currentPassword,
      //   newPassword
      // }, true);
      
      // For demo:
      // Simulate password change
      
      toast({
        title: 'Password Changed',
        description: 'Your password has been successfully updated',
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Password change error:', error);
      toast({
        title: 'Password Change Failed',
        description: error.message || 'Failed to update password',
        variant: 'destructive',
      });
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    try {
      if (!email || !this.validateEmail(email)) {
        throw new Error('Valid email is required');
      }
      
      // Real API implementation:
      // await this.apiRequest('/request-password-reset', 'POST', { email });
      
      // For demo:
      // Simulate successful request
      
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists with this email, you will receive a password reset link',
        variant: 'default',
      });
      
      return true;
    } catch (error) {
      console.error('Password reset request error:', error);
      
      // Even on error, show the same message for security
      toast({
        title: 'Reset Link Sent',
        description: 'If an account exists with this email, you will receive a password reset link',
        variant: 'default',
      });
      
      // Return true even on error to prevent email enumeration
      return true;
    }
  }
}

export const authService = new AuthService();