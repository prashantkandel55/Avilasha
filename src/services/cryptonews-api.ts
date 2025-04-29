/**
 * CryptoNews API Integration
 * Provides access to cryptocurrency news from multiple sources
 * Documentation: https://cryptonews-api.com/documentation
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

// Types for CryptoNews API responses
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  image: string;
  date: string;
  topics: string[];
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  type: string;
  tickers: string[];
}

export interface NewsResponse {
  data: NewsItem[];
  type: string;
  message: string;
  total_pages?: number;
  page?: number;
  count?: number;
}

/**
 * CryptoNews API Service
 * Provides methods to access cryptocurrency news from multiple sources
 */
class CryptoNewsApi {
  private readonly BASE_URL = 'https://cryptonews-api.com/api/v1';
  private apiKey: string = '';
  private cacheManager: any; // Will be initialized by the free-crypto-apis.ts
  private rateLimiter: any; // Will be initialized by the free-crypto-apis.ts

  /**
   * Initialize the service with cache manager and rate limiter
   */
  initialize(cacheManager: any, rateLimiter: any): void {
    this.cacheManager = cacheManager;
    this.rateLimiter = rateLimiter;
  }

  /**
   * Set the API key for CryptoNews API
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Defensive JSON parsing helper
   */
  async safeJson(response) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      return response.json();
    } else {
      const text = await response.text();
      throw new Error('API did not return JSON: ' + text.slice(0, 100));
    }
  }

  /**
   * Get latest cryptocurrency news
   */
  async getLatestNews(page: number = 1, items: number = 10): Promise<NewsItem[]> {
    if (!this.apiKey) {
      console.error('CryptoNews API key not set');
      toast({
        title: 'API Error',
        description: 'CryptoNews API key not configured',
        variant: 'destructive'
      });
      return [];
    }

    const cacheKey = `cryptonews_latest_${page}_${items}`;
    const cached = this.cacheManager?.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/category?section=general&items=${items}&page=${page}&token=${this.apiKey}`);
      const data: NewsResponse = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 10 * 60 * 1000); // Cache for 10 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching latest news:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch cryptocurrency news',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get news for specific cryptocurrencies
   */
  async getNewsByCoin(coins: string[], items: number = 10, page: number = 1): Promise<NewsItem[]> {
    if (!this.apiKey) {
      console.error('CryptoNews API key not set');
      return [];
    }

    const coinsStr = coins.join(',');
    const cacheKey = `cryptonews_by_coin_${coinsStr}_${items}_${page}`;
    const cached = this.cacheManager?.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/coin?tickers=${coinsStr}&items=${items}&page=${page}&token=${this.apiKey}`);
      const data: NewsResponse = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 10 * 60 * 1000); // Cache for 10 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching news by coin:', error);
      return [];
    }
  }

  /**
   * Get news by specific topics
   */
  async getNewsByTopic(topics: string[], items: number = 10, page: number = 1): Promise<NewsItem[]> {
    if (!this.apiKey) {
      console.error('CryptoNews API key not set');
      return [];
    }

    const topicsStr = topics.join(',');
    const cacheKey = `cryptonews_by_topic_${topicsStr}_${items}_${page}`;
    const cached = this.cacheManager?.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/topic?topics=${topicsStr}&items=${items}&page=${page}&token=${this.apiKey}`);
      const data: NewsResponse = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 10 * 60 * 1000); // Cache for 10 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching news by topic:', error);
      return [];
    }
  }

  /**
   * Search news by keywords
   */
  async searchNews(keywords: string, items: number = 10, page: number = 1): Promise<NewsItem[]> {
    if (!this.apiKey) {
      console.error('CryptoNews API key not set');
      return [];
    }

    const cacheKey = `cryptonews_search_${keywords}_${items}_${page}`;
    const cached = this.cacheManager?.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/search?q=${encodeURIComponent(keywords)}&items=${items}&page=${page}&token=${this.apiKey}`);
      const data: NewsResponse = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 10 * 60 * 1000); // Cache for 10 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error searching news:', error);
      return [];
    }
  }

  /**
   * Get top trending news
   */
  async getTrendingNews(items: number = 10): Promise<NewsItem[]> {
    if (!this.apiKey) {
      console.error('CryptoNews API key not set');
      return [];
    }

    const cacheKey = `cryptonews_trending_${items}`;
    const cached = this.cacheManager?.get<NewsItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/trending?items=${items}&token=${this.apiKey}`);
      const data: NewsResponse = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 15 * 60 * 1000); // Cache for 15 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching trending news:', error);
      return [];
    }
  }
}

export const cryptoNewsApi = new CryptoNewsApi();