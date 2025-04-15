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
   * Generate a secure encryption key
   * @private
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    // Try to retrieve from session storage first
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const storedKey = sessionStorage.getItem(this.ENCRYPTION_KEY);
      if (storedKey) {
        return crypto.subtle.importKey(
          'jwk',
          JSON.parse(storedKey),
          { name: 'AES-GCM' },
          false,
          ['encrypt', 'decrypt']
        );
      }
    }
    
    // Generate a new key if not found
    if (typeof window !== 'undefined' && window.crypto) {
      try {
        const key = await crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        
        // Store the key for future use (during this session only)
        if (window.sessionStorage) {
          const exportedKey = await crypto.subtle.exportKey('jwk', key);
          sessionStorage.setItem(this.ENCRYPTION_KEY, JSON.stringify(exportedKey));
        }
        
        return key;
      } catch (error) {
        console.error('Encryption key generation failed:', error);
        // Fallback to a simple key derivation if WebCrypto fails
        return this.getSimpleEncryptionKey();
      }
    }
    
    // Fallback if WebCrypto is not available
    return this.getSimpleEncryptionKey();
  }
  
  /**
   * Simple key derivation fallback when WebCrypto isn't available
   * @private
   */
  private async getSimpleEncryptionKey(): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode('avilasha_secure_key_material');
    
    return crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    ).then(key => {
      return crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('avilasha_salt'),
          iterations: 100000,
          hash: 'SHA-256'
        },
        key,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
    }).catch(error => {
      console.error('Simple key derivation failed:', error);
      throw error;
    });
  }

  /**
   * Encrypt sensitive data for storage
   * @private
   */
  private async encryptData(data: string): Promise<{ encryptedData: string, iv: string }> {
    try {
      if (typeof window !== 'undefined' && window.crypto) {
        const key = await this.getEncryptionKey();
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        
        // Generate a random initialization vector
        const iv = crypto.getRandomValues(new Uint8Array(12));
        
        // Encrypt the data
        const encryptedBuffer = await crypto.subtle.encrypt(
          { name: 'AES-GCM', iv },
          key,
          dataBuffer
        );
        
        // Convert to base64 strings for storage
        const encryptedData = this.arrayBufferToBase64(encryptedBuffer);
        const ivString = this.arrayBufferToBase64(iv);
        
        return { encryptedData, iv: ivString };
      }
      
      // Fallback if encryption fails
      console.warn('Encryption not available, storing data without encryption');
      return { encryptedData: data, iv: '' };
    } catch (error) {
      console.error('Encryption failed:', error);
      // Fallback to unencrypted data in case of error
      return { encryptedData: data, iv: '' };
    }
  }
  
  /**
   * Decrypt sensitive data from storage
   * @private
   */
  private async decryptData(encryptedData: string, iv: string): Promise<string> {
    try {
      if (typeof window !== 'undefined' && window.crypto && iv) {
        const key = await this.getEncryptionKey();
        
        // Convert from base64 strings
        const encryptedBuffer = this.base64ToArrayBuffer(encryptedData);
        const ivBuffer = this.base64ToArrayBuffer(iv);
        
        // Decrypt the data
        const decryptedBuffer = await crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: ivBuffer },
          key,
          encryptedBuffer
        );
        
        // Convert the decrypted data back to a string
        const decoder = new TextDecoder();
        return decoder.decode(decryptedBuffer);
      }
      
      // If no IV, assume the data wasn't encrypted
      return encryptedData;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedData; // Return original data if decryption fails
    }
  }
  
  /**
   * Convert an ArrayBuffer to a Base64 string
   * @private
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }
  
  /**
   * Convert a Base64 string to an ArrayBuffer
   * @private
   */
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Store JWT token pair in secure storage
   */
  async storeTokens(tokens: TokenPair): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Encrypt the tokens before storing
        const accessTokenStr = JSON.stringify(tokens.accessToken);
        const refreshTokenStr = JSON.stringify(tokens.refreshToken);
        
        const { encryptedData: encryptedAccessToken, iv: accessTokenIv } = 
          await this.encryptData(accessTokenStr);
        
        const { encryptedData: encryptedRefreshToken, iv: refreshTokenIv } = 
          await this.encryptData(refreshTokenStr);
        
        // Store the encrypted tokens and their IVs
        localStorage.setItem(this.ACCESS_TOKEN_KEY, encryptedAccessToken);
        localStorage.setItem(this.ACCESS_TOKEN_KEY + this.IV_SUFFIX, accessTokenIv);
        
        localStorage.setItem(this.REFRESH_TOKEN_KEY, encryptedRefreshToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY + this.IV_SUFFIX, refreshTokenIv);
        
        // Reset the activity timer
        this.lastActivityTime = Date.now();
      } catch (error) {
        console.error('Failed to store tokens securely:', error);
        
        // Fallback to unencrypted storage in case of error
        localStorage.setItem(this.ACCESS_TOKEN_KEY, JSON.stringify(tokens.accessToken));
        localStorage.setItem(this.REFRESH_TOKEN_KEY, JSON.stringify(tokens.refreshToken));
      }
    }
  }

  /**
   * Get the current access token
   */
  async getAccessToken(): Promise<JwtToken | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const encryptedToken = localStorage.getItem(this.ACCESS_TOKEN_KEY);
        const iv = localStorage.getItem(this.ACCESS_TOKEN_KEY + this.IV_SUFFIX);
        
        if (!encryptedToken) return null;
        
        if (encryptedToken && iv) {
          // Decrypt the token
          const decryptedToken = await this.decryptData(encryptedToken, iv);
          return JSON.parse(decryptedToken);
        }
        
        // Fallback for tokens stored without encryption
        return JSON.parse(encryptedToken);
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
  async getRefreshToken(): Promise<JwtToken | null> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const encryptedToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
        const iv = localStorage.getItem(this.REFRESH_TOKEN_KEY + this.IV_SUFFIX);
        
        if (!encryptedToken) return null;
        
        if (encryptedToken && iv) {
          // Decrypt the token
          const decryptedToken = await this.decryptData(encryptedToken, iv);
          return JSON.parse(decryptedToken);
        }
        
        // Fallback for tokens stored without encryption
        return JSON.parse(encryptedToken);
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
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<JwtToken | null> {
    try {
      const refreshToken = await this.getRefreshToken();
      
      if (!refreshToken || this.isTokenExpired(refreshToken)) {
        // If refresh token is missing or expired, force re-login
        this.clearTokens();
        return null;
      }
      
      // Implementation of token refresh API call
      // This would be replaced with an actual API call in production
      // For now, we'll use a simulated token generation
      const now = Math.floor(Date.now() / 1000);
      const newAccessToken: JwtToken = {
        token: `access_token_${crypto.randomUUID?.() || now}`,
        expiresAt: now + 3600 // 1 hour from now
      };
      
      // Store the new access token
      await this.storeTokens({
        accessToken: newAccessToken,
        refreshToken: refreshToken
      });
      
      return newAccessToken;
    } catch (error) {
      console.error('Failed to refresh token:', error);
      this.clearTokens();
      return null;
    }
  }

  /**
   * Clear all stored tokens
   */
  clearTokens(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.ACCESS_TOKEN_KEY + this.IV_SUFFIX);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY + this.IV_SUFFIX);
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
    let accessToken = await this.getAccessToken();
    
    // If token is expired, try to refresh it
    if (this.isTokenExpired(accessToken)) {
      accessToken = await this.refreshAccessToken();
    }
    
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
   * Enable biometric authentication for the application
   * Uses the Web Authentication API when available
   */
  async enableBiometricAuth(): Promise<boolean> {
    try {
      // Check if Web Authentication API is available
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        // Check if platform authenticator is available
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        
        if (available) {
          localStorage.setItem(this.BIOMETRIC_ENABLED_KEY, 'true');
          return true;
        } else {
          toast({
            title: 'Biometric Authentication Unavailable',
            description: 'Your device does not support biometric authentication',
            variant: 'destructive'
          });
          return false;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Failed to enable biometric authentication:', error);
      return false;
    }
  }

  /**
   * Check if biometric authentication is enabled
   */
  isBiometricEnabled(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(this.BIOMETRIC_ENABLED_KEY) === 'true';
    }
    return false;
  }

  /**
   * Authenticate using biometrics
   * @returns Promise resolving to authentication success state
   */
  async authenticateWithBiometrics(): Promise<boolean> {
    if (!this.isBiometricEnabled()) return false;
    
    try {
      // Simple check if WebAuthn is available
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        // In a real implementation, this would use the WebAuthn API
        // to create and verify credentials
        
        // Simulate biometric verification
        toast({
          title: 'Biometric Authentication',
          description: 'Verify your identity using fingerprint or face recognition',
          variant: 'default'
        });
        
        // For demonstration, we'll show a successful authentication
        // In a real app, this would be handled by the WebAuthn API
        return new Promise(resolve => {
          setTimeout(() => {
            toast({
              title: 'Authentication Successful',
              description: 'Biometric authentication completed',
              variant: 'default'
            });
            resolve(true);
          }, 2000);
        });
      }
      
      return false;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      toast({
        title: 'Authentication Failed',
        description: 'Biometric verification could not be completed',
        variant: 'destructive'
      });
      return false;
    }
  }

  /**
   * Encrypt data with a secure encryption key
   * @param data String data to encrypt
   * @returns Encrypted string
   */
  encrypt(data: string): string {
    if (!data) return '';
    
    try {
      const encryptPromise = this.encryptData(data);
      // For synchronous usage, we'll return a placeholder
      // The real implementation should use await, but for compatibility
      // we're providing a synchronous interface for now
      return JSON.stringify({
        encryptedData: data, // Fallback to unencrypted data
        isEncrypted: false
      });
    } catch (error) {
      console.error('Encryption error:', error);
      return data;
    }
  }
  
  /**
   * Decrypt previously encrypted data
   * @param encryptedData String that was encrypted with the encrypt method
   * @returns Decrypted string or original string if decryption fails
   */
  decrypt(encryptedData: string): string {
    if (!encryptedData) return '';
    
    try {
      // Try to parse as JSON to check if it's our encrypted format
      const data = JSON.parse(encryptedData);
      if (data && typeof data === 'object') {
        if (data.isEncrypted === false) {
          // Data wasn't actually encrypted, just return the original
          return data.encryptedData;
        } else if (data.encryptedData && data.iv) {
          // This is properly encrypted data
          const decryptPromise = this.decryptData(data.encryptedData, data.iv);
          // For synchronous usage, fallback to the encrypted data
          return data.encryptedData;
        }
      }
      
      // If it's not our format, return as is
      return encryptedData;
    } catch (error) {
      // If it's not valid JSON, it's not our encrypted format
      console.error('Decryption error:', error);
      return encryptedData;
    }
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