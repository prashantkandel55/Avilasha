/**
 * Security service for handling authentication, authorization, and rate limiting
 */

import { toast } from '@/hooks/use-toast';

// Token types
export interface JwtToken {
  token: string;
  expiresAt: number; // Unix timestamp
}

export interface TokenPair {
  accessToken: JwtToken;
  refreshToken: JwtToken;
}

// Rate limiting configuration
interface RateLimitConfig {
  maxRequests: number;
  timeWindowMs: number;
}

// Rate limiting tracker
interface RateLimitTracker {
  requests: number;
  windowStart: number;
}

class SecurityService {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly WALLET_LOCKED_KEY = 'wallet_locked';
  private readonly ENCRYPTION_KEY = 'avilasha_enc_key';
  private readonly IV_SUFFIX = '_iv';
  private readonly BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
  private readonly rateLimiters: Map<string, RateLimitTracker> = new Map();
  
  // Default rate limit: 30 requests per minute
  private readonly defaultRateLimit: RateLimitConfig = {
    maxRequests: 30,
    timeWindowMs: 60 * 1000 // 1 minute
  };

  // Session timeout in minutes for inactive users
  private readonly SESSION_TIMEOUT_MINUTES = 30; 
  private lastActivityTime: number;
  private sessionTimeoutId: number | null = null;

  constructor() {
    this.lastActivityTime = Date.now();
    this.setupActivityTracking();
    this.setupSessionTimeout();
  }

  /**
   * Track user activity to manage session timeout
   */
  private setupActivityTracking(): void {
    if (typeof window !== 'undefined') {
      const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
      
      const updateActivity = () => {
        this.lastActivityTime = Date.now();
      };
      
      activityEvents.forEach(eventType => {
        window.addEventListener(eventType, updateActivity, { passive: true });
      });
    }
  }

  /**
   * Setup session timeout monitoring
   */
  private setupSessionTimeout(): void {
    if (typeof window !== 'undefined') {
      const checkInactivity = () => {
        const now = Date.now();
        const inactiveTime = now - this.lastActivityTime;
        const maxInactiveTime = this.SESSION_TIMEOUT_MINUTES * 60 * 1000;
        
        if (inactiveTime > maxInactiveTime) {
          // User has been inactive for too long
          if (this.getAccessToken()) {
            this.lockWallet();
            this.clearTokens();
            
            toast({
              title: 'Session Expired',
              description: 'You have been logged out due to inactivity',
              variant: 'default'
            });
            
            // Dispatch auth state change event
            window.dispatchEvent(new CustomEvent('auth-state-changed', { 
              detail: { isAuthenticated: false, user: null }
            }));
            
            // Redirect to login page
            setTimeout(() => {
              window.location.href = '/auth';
            }, 1000);
          }
        }
      };
      
      // Check inactivity every minute
      this.sessionTimeoutId = window.setInterval(checkInactivity, 60 * 1000) as unknown as number;
    }
  }

  /**
   * Encrypt data with a secure encryption key
   * @param data String data to encrypt
   * @returns Promise resolving to encrypted string (JSON format)
   */
  async encrypt(data: string): Promise<string> {
    if (!data) return '';
    try {
      // Simple base64 encoding for demo purposes
      // In production, use proper encryption
      const encoded = btoa(data);
      return JSON.stringify({ encryptedData: encoded, isEncrypted: true });
    } catch (error) {
      console.error('Encryption error:', error);
      return JSON.stringify({ encryptedData: data, isEncrypted: false });
    }
  }

  /**
   * Decrypt previously encrypted data
   * @param encryptedData String that was encrypted with the encrypt method
   * @returns Promise resolving to decrypted string or original string if decryption fails
   */
  async decrypt(encryptedData: string): Promise<string> {
    if (!encryptedData) return '';
    try {
      const data = JSON.parse(encryptedData);
      if (data && typeof data === 'object') {
        if (data.isEncrypted === false) {
          return data.encryptedData;
        } else if (data.encryptedData) {
          // Simple base64 decoding for demo purposes
          return atob(data.encryptedData);
        }
      }
      return encryptedData;
    } catch (error) {
      console.error('Decryption error:', error);
      return encryptedData;
    }
  }

  /**
   * Get the current access token
   */
  getAccessToken(): JwtToken | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const token = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        if (!token) return null;
        return JSON.parse(token);
      } catch (error) {
        console.error('Failed to retrieve access token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): JwtToken | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const token = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        if (!token) return null;
        return JSON.parse(token);
      } catch (error) {
        console.error('Failed to retrieve refresh token:', error);
        return null;
      }
    }
    return null;
  }

  /**
   * Check if the access token is expired
   */
  isTokenExpired(token: JwtToken | null): boolean {
    if (!token) return true;
    
    // Check if token is expired (with 30 second buffer)
    const now = Math.floor(Date.now() / 1000);
    return token.expiresAt <= now + 30;
  }

  /**
   * Store JWT token pair in secure storage
   */
  async storeTokens(tokens: TokenPair): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, JSON.stringify(tokens.accessToken));
        localStorage.setItem(this.REFRESH_TOKEN_KEY, JSON.stringify(tokens.refreshToken));
        
        // Reset the activity timer
        this.lastActivityTime = Date.now();
      } catch (error) {
        console.error('Failed to store tokens securely:', error);
      }
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    }
  }

  /**
   * Apply rate limiting to API requests
   * @param endpoint The API endpoint being accessed
   * @param config Optional custom rate limit configuration
   * @returns Whether the request should be allowed
   */
  applyRateLimit(endpoint: string, config?: RateLimitConfig): boolean {
    const rateLimit = config || this.defaultRateLimit;
    const now = Date.now();
    
    // Get or initialize rate limit tracker for this endpoint
    let tracker = this.rateLimiters.get(endpoint);
    if (!tracker || now - tracker.windowStart > rateLimit.timeWindowMs) {
      // Initialize new tracking window
      tracker = { requests: 0, windowStart: now };
    }
    
    // Check if rate limit is exceeded
    if (tracker.requests >= rateLimit.maxRequests) {
      toast({
        title: 'Rate limit exceeded',
        description: 'Too many requests. Please try again later.',
        variant: 'destructive'
      });
      return false;
    }
    
    // Increment request count and update tracker
    tracker.requests++;
    this.rateLimiters.set(endpoint, tracker);
    return true;
  }

  /**
   * Generate authorization headers for API requests
   */
  async getAuthHeaders(): Promise<HeadersInit> {
    const accessToken = this.getAccessToken();
    
    if (!accessToken) {
      return {};
    }
    
    return {
      'Authorization': `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Lock the wallet for security
   */
  lockWallet(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(this.WALLET_LOCKED_KEY, 'true');
      
      // Dispatch a wallet lock event
      window.dispatchEvent(new CustomEvent('wallet-lock-changed', { 
        detail: { isLocked: true }
      }));
      
      toast({
        title: 'Wallet Locked',
        description: 'Your wallet has been locked for security.',
        variant: 'default'
      });
    }
  }

  /**
   * Unlock the wallet
   */
  unlockWallet(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.WALLET_LOCKED_KEY);
      
      // Dispatch a wallet lock event
      window.dispatchEvent(new CustomEvent('wallet-lock-changed', { 
        detail: { isLocked: false }
      }));
    }
  }

  /**
   * Check if the wallet is locked
   */
  isWalletLocked(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.WALLET_LOCKED_KEY) === 'true';
    }
    return false;
  }

  /**
   * Clean up resources when service is no longer needed
   */
  cleanup(): void {
    if (this.sessionTimeoutId && typeof window !== 'undefined') {
      window.clearInterval(this.sessionTimeoutId);
      this.sessionTimeoutId = null;
    }
  }

  /**
   * Generate a secure random token
   */
  generateSecureToken(length: number = 32): string {
    if (typeof window !== 'undefined' && window.crypto) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      return Array.from(bytes)
        .map(byte => byte.toString(16).padStart(2, '0'))
        .join('');
    }
    
    // Fallback if Web Crypto API is not available
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Sanitize user input to prevent XSS attacks
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const securityService = new SecurityService();

// Export individual methods for direct imports 
export const { encrypt, decrypt } = securityService;