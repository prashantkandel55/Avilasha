/**
 * API Service for Avilasha-2
 * Handles external API requests with rate limiting and usage tracking
 */

import { toast } from '@/hooks/use-toast';

interface RequestLogEntry {
  timestamp: number;
  endpoint: string;
}

/**
 * ApiLimiter - Handles rate limiting for API requests
 * Ensures we don't exceed API limits (20 requests per minute and 10,000 per month)
 */
class ApiLimiter {
  private readonly API_KEY = 'SOSO-54479a90cf7546bf807daac1f5aa2e4e';
  private readonly STORAGE_KEY = 'avilasha_api_usage';
  private readonly MAX_REQUESTS_PER_MINUTE = 20;
  private readonly MAX_REQUESTS_PER_MONTH = 10000;
  
  private requestLog: RequestLogEntry[] = [];
  private monthlyQuotaWarningShown = false;
  
  constructor() {
    this.loadRequestLog();
  }
  
  /**
   * Load the request log from storage
   */
  private loadRequestLog(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const savedLog = localStorage.getItem(this.STORAGE_KEY);
        if (savedLog) {
          this.requestLog = JSON.parse(savedLog);
          
          // Clean up old entries (older than 31 days)
          const oneMonthAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
          this.requestLog = this.requestLog.filter(entry => entry.timestamp >= oneMonthAgo);
          this.saveRequestLog();
        }
      } catch (error) {
        console.error('Failed to load API request log:', error);
        this.requestLog = [];
      }
    }
  }
  
  /**
   * Save the request log to storage
   */
  private saveRequestLog(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.requestLog));
      } catch (error) {
        console.error('Failed to save API request log:', error);
      }
    }
  }
  
  /**
   * Get the API key
   */
  getApiKey(): string {
    return this.API_KEY;
  }
  
  /**
   * Check if we can make another API request based on rate limits
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Check minute rate limit (20 per minute)
    const oneMinuteAgo = now - (60 * 1000);
    const requestsLastMinute = this.requestLog.filter(
      entry => entry.timestamp >= oneMinuteAgo
    ).length;
    
    if (requestsLastMinute >= this.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }
    
    // Check monthly rate limit (10,000 per month)
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    const requestsLastMonth = this.requestLog.filter(
      entry => entry.timestamp >= oneMonthAgo
    ).length;
    
    // Warn when approaching monthly limit (at 90%)
    if (!this.monthlyQuotaWarningShown && requestsLastMonth >= this.MAX_REQUESTS_PER_MONTH * 0.9) {
      toast({
        title: 'API Usage Warning',
        description: 'You are approaching your monthly API usage limit',
        variant: 'destructive'
      });
      this.monthlyQuotaWarningShown = true;
    }
    
    return requestsLastMonth < this.MAX_REQUESTS_PER_MONTH;
  }
  
  /**
   * Log an API request
   */
  logRequest(endpoint: string): void {
    const now = Date.now();
    
    this.requestLog.push({
      timestamp: now,
      endpoint
    });
    
    this.saveRequestLog();
  }
  
  /**
   * Get usage statistics
   */
  getUsageStats(): {
    lastMinute: number,
    lastHour: number,
    lastDay: number,
    lastMonth: number,
    minuteLimit: number,
    monthlyLimit: number,
    minutePercentage: number,
    monthlyPercentage: number
  } {
    const now = Date.now();
    const oneMinuteAgo = now - (60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const oneMonthAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const lastMinute = this.requestLog.filter(entry => entry.timestamp >= oneMinuteAgo).length;
    const lastHour = this.requestLog.filter(entry => entry.timestamp >= oneHourAgo).length;
    const lastDay = this.requestLog.filter(entry => entry.timestamp >= oneDayAgo).length;
    const lastMonth = this.requestLog.filter(entry => entry.timestamp >= oneMonthAgo).length;
    
    return {
      lastMinute,
      lastHour,
      lastDay,
      lastMonth,
      minuteLimit: this.MAX_REQUESTS_PER_MINUTE,
      monthlyLimit: this.MAX_REQUESTS_PER_MONTH,
      minutePercentage: (lastMinute / this.MAX_REQUESTS_PER_MINUTE) * 100,
      monthlyPercentage: (lastMonth / this.MAX_REQUESTS_PER_MONTH) * 100
    };
  }
  
  /**
   * Reset monthly warning flag
   */
  resetMonthlyWarning(): void {
    this.monthlyQuotaWarningShown = false;
  }
}

/**
 * ApiService - Handles all external API calls for the application
 */
class ApiService {
  private readonly BASE_URL = 'https://api.coinranking.com/v2';
  private readonly limiter: ApiLimiter;
  private pendingRequests: Map<string, Promise<any>> = new Map();
  
  constructor() {
    this.limiter = new ApiLimiter();
  }
  
  /**
   * Make a rate-limited API request
   * @param endpoint - API endpoint path (without base URL)
   * @param params - Query parameters
   * @param skipCache - Whether to bypass internal request deduplication
   */
  async apiRequest<T>(endpoint: string, params: Record<string, string> = {}, skipCache = false): Promise<T> {
    // Create cache key for request deduplication (for identical parallel requests)
    const queryString = new URLSearchParams(params).toString();
    const cacheKey = `${endpoint}?${queryString}`;
    
    // Check if we already have this exact request in flight
    if (!skipCache && this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey) as Promise<T>;
    }
    
    // Check rate limits
    if (!this.limiter.canMakeRequest()) {
      throw new Error('API rate limit exceeded. Please try again later.');
    }
    
    // Prepare URL
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    
    // Create the fetch promise
    const fetchPromise = new Promise<T>((resolve, reject) => {
      fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': this.limiter.getApiKey()
        }
      })
      .then(response => {
        // Log the API request
        this.limiter.logRequest(endpoint);
        
        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Coinranking data structure: { status, data: { ... } }
        if (data.status === 'success') {
          resolve(data.data as T);
        } else {
          reject(new Error(`API returned error: ${data.status}`));
        }
      })
      .catch(error => {
        reject(error);
      })
      .finally(() => {
        // Remove from pending requests
        this.pendingRequests.delete(cacheKey);
      });
    });
    
    // Store the promise for deduplication
    this.pendingRequests.set(cacheKey, fetchPromise);
    
    return fetchPromise;
  }
  
  /**
   * Get cryptocurrency coins list
   */
  async getCoins(limit = 50, offset = 0, timePeriod: string = '24h'): Promise<any> {
    return this.apiRequest('/coins', {
      limit: limit.toString(),
      offset: offset.toString(),
      timePeriod
    });
  }
  
  /**
   * Get details for a specific coin
   */
  async getCoin(uuid: string, timePeriod: string = '24h'): Promise<any> {
    return this.apiRequest(`/coin/${uuid}`, { timePeriod });
  }
  
  /**
   * Get coin price history
   */
  async getCoinHistory(uuid: string, timePeriod: string = '24h'): Promise<any> {
    return this.apiRequest(`/coin/${uuid}/history`, { timePeriod });
  }
  
  /**
   * Get global stats
   */
  async getGlobalStats(): Promise<any> {
    return this.apiRequest('/stats');
  }
  
  /**
   * Get exchanges
   */
  async getExchanges(limit = 50, offset = 0): Promise<any> {
    return this.apiRequest('/exchanges', {
      limit: limit.toString(),
      offset: offset.toString()
    });
  }
  
  /**
   * Get markets
   */
  async getMarkets(limit = 50, offset = 0): Promise<any> {
    return this.apiRequest('/markets', {
      limit: limit.toString(),
      offset: offset.toString()
    });
  }
  
  /**
   * Search for coins
   */
  async searchCoins(query: string, limit = 10): Promise<any> {
    return this.apiRequest('/search-suggestions', {
      query,
      limit: limit.toString()
    });
  }
  
  /**
   * Get API usage statistics
   */
  getUsageStats() {
    return this.limiter.getUsageStats();
  }
}

// Export singleton instance
export const apiService = new ApiService();
