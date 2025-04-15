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
  // Use import.meta.env for Vite or default to a fallback URL
  private readonly AUTH_API_URL = (typeof import.meta !== 'undefined' && import.meta.env?.AUTH_API_URL) || 'https://api.example.com/auth';
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
  public async login(options: { email: string; password: string; rememberMe?: boolean }): Promise<User> {
    try {
      const { email, password, rememberMe = false } = options;

      // Validate inputs
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      if (!password || !password.trim()) {
        throw new Error('Password is required');
      }

      // For demo purposes, accept mock credentials
      if (email === 'demo@avilasha.com' && password === 'password123') {
        const mockUser: User = {
          id: 'demo_user',
          email: 'demo@avilasha.com',
          fullName: 'Demo User',
          profilePicture: 'https://ui-avatars.com/api/?name=Demo+User&background=random',
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              priceAlerts: true,
              newsAlerts: false,
              securityAlerts: true,
            },
            currency: 'USD',
            language: 'en'
          }
        };
        
        // Generate mock tokens
        const mockTokens: TokenPair = {
          accessToken: this.generateDemoToken(email),
          refreshToken: this.generateDemoToken(email),
        };
        
        // Store tokens and user
        securityService.storeTokens(mockTokens);
        this.currentUser = mockUser;
        
        // Store in local/session storage based on remember me
        if (rememberMe) {
          localStorage.setItem('user_data', JSON.stringify(mockUser));
        } else {
          sessionStorage.setItem('user_data', JSON.stringify(mockUser));
        }
        
        return mockUser;
      }
      
      // Check for registered mock users in local storage
      const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
      if (mockUsers[email] && mockUsers[email].password === password) {
        const mockUser = mockUsers[email].user;
        
        // Generate mock tokens
        const mockTokens: TokenPair = {
          accessToken: this.generateDemoToken(email),
          refreshToken: this.generateDemoToken(email),
        };
        
        // Store tokens and user
        securityService.storeTokens(mockTokens);
        this.currentUser = mockUser;
        
        // Store in local/session storage based on remember me
        if (rememberMe) {
          localStorage.setItem('user_data', JSON.stringify(mockUser));
        } else {
          sessionStorage.setItem('user_data', JSON.stringify(mockUser));
        }
        
        return mockUser;
      }

      // Real API implementation
      try {
        const response = await this.apiRequest<{user: User, tokens: TokenPair}>('/login', 'POST', { 
          email, 
          password,
          rememberMe 
        });
        
        if (!response || !response.user || !response.tokens) {
          throw new Error('Invalid response from server');
        }

        // Store tokens securely
        securityService.storeTokens(response.tokens);
        
        // Store user
        this.currentUser = response.user;
        
        // Store in local or session storage based on remember me
        const storageMethod = rememberMe ? localStorage : sessionStorage;
        storageMethod.setItem('user_data', JSON.stringify(response.user));
        
        return response.user;
      } catch (error) {
        // For demo, fallback to mock data on API failure
        throw new Error('Invalid email or password');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed. Please try again.');
    }
  }

  /**
   * Register a new user
   */
  public async register(options: { email: string; password: string; fullName: string }): Promise<void> {
    try {
      const { email, password, fullName } = options;

      // Validate inputs
      if (!email || !email.trim()) {
        throw new Error('Email is required');
      }

      if (!password || !password.trim()) {
        throw new Error('Password is required');
      }

      if (!fullName || !fullName.trim()) {
        throw new Error('Full name is required');
      }

      // For demo purposes only
      if (email === 'demo@example.com') {
        throw new Error('This email is already in use');
      }

      // Real API implementation
      try {
        await this.apiRequest('/register', 'POST', { 
          email, 
          password,
          fullName 
        });
      } catch (error) {
        // For demo, create mock user
        const mockUser: User = {
          id: `user_${Date.now()}`,
          email,
          fullName,
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
              priceAlerts: true,
              newsAlerts: false,
              securityAlerts: true,
            },
            currency: 'USD',
            language: 'en'
          }
        };
        
        // Store mock user in localStorage for demo purposes
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '{}');
        mockUsers[email] = { 
          password, 
          user: mockUser 
        };
        localStorage.setItem('mockUsers', JSON.stringify(mockUsers));
        
        toast({
          title: 'Account Created',
          description: 'Account created successfully in demo mode',
          variant: 'default',
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed. Please try again.');
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
   * Refresh the access token using the refresh token
   */
  async refreshToken(): Promise<TokenPair | null> {
    try {
      const refreshToken = securityService.getRefreshToken();
      
      if (!refreshToken) {
        console.warn('No refresh token available');
        return null;
      }
      
      // Api request to refresh token
      const response = await this.apiRequest<TokenPair>('/refresh-token', 'POST', { 
        refreshToken 
      });
      
      if (!response) {
        throw new Error('Failed to refresh token');
      }
      
      // Store new tokens
      securityService.storeTokens(response);
      
      return response;
    } catch (error) {
      console.error('Token refresh error:', error);
      // Clear auth state on refresh failure
      this.logout();
      return null;
    }
  }

  /**
   * Generate a demo JWT token for development purposes
   */
  private generateDemoToken(email: string): JwtToken {
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 3600; // 1 hour
    
    return {
      token: `demo.${btoa(email)}.${expiresAt}`,
      expiresAt: expiresAt
    };
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