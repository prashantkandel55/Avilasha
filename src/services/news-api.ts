/**
 * News API service for cryptocurrency news
 */
import { toast } from '@/hooks/use-toast';
import { securityService } from './security';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  url: string;
  image: string;
  source: string;
  date: string;
  category: string;
  author?: string;
  timeToRead: string;
  saved: boolean;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

export interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: {
    source: {
      id: string | null;
      name: string;
    };
    author: string | null;
    title: string;
    description: string;
    url: string;
    urlToImage: string | null;
    publishedAt: string;
    content: string;
  }[];
}

class NewsApiService {
  private readonly API_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.NEWS_API_KEY) || 'YOUR_NEWS_API_KEY'; // Replace with your actual key
  private readonly API_BASE_URL = 'https://newsapi.org/v2';
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private savedNews: Set<string> = new Set();
  private retryCount = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    this.loadSavedNews();
  }

  /**
   * Make an API request with rate limiting, caching, and retry mechanism
   */
  private async apiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    try {
      // Apply rate limiting
      if (!securityService.applyRateLimit('news_api_' + endpoint)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Create cache key from endpoint and params
      const queryParams = new URLSearchParams({
        ...params,
        apiKey: this.API_KEY
      }).toString();
      
      const cacheKey = `${endpoint}?${queryParams}`;
      
      // Check cache first
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
        return cached.data;
      }
      
      // Make the actual API call
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < this.retryCount; attempt++) {
        try {
          const response = await fetch(`${this.API_BASE_URL}${endpoint}?${queryParams}`, {
            headers: {
              'Accept': 'application/json',
              'X-Api-Key': this.API_KEY
            }
          });
          
          if (!response.ok) {
            if (response.status === 429) {
              // Rate limit exceeded
              toast({
                title: 'API Rate Limit Exceeded',
                description: 'Please try again in a few minutes.',
                variant: 'destructive'
              });
              throw new Error('Rate limit exceeded. Please try again later.');
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API Error: ${errorData.message || response.statusText}`);
          }
          
          const data = await response.json();
          
          // Cache the successful response
          this.cache.set(cacheKey, { data, timestamp: Date.now() });
          
          return data;
        } catch (error) {
          lastError = error as Error;
          
          // Wait before retrying
          if (attempt < this.retryCount - 1) {
            await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          }
        }
      }
      
      // If we get here, all retry attempts failed
      throw lastError || new Error('Failed to fetch data after multiple attempts');
    } catch (error) {
      console.error('News API Error:', error);
      toast({
        title: 'Failed to Load News',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Get the latest crypto news
   */
  async getLatestNews(page: number = 1, pageSize: number = 10): Promise<NewsItem[]> {
    try {
      const response = await this.apiRequest<NewsApiResponse>('/everything', {
        q: 'cryptocurrency OR bitcoin OR blockchain',
        language: 'en',
        sortBy: 'publishedAt',
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (response.status !== 'ok' || !response.articles) {
        throw new Error('Invalid news API response');
      }
      
      return response.articles.map((article, index) => {
        const id = `news-${Date.now()}-${index}`;
        const timeToRead = `${Math.max(2, Math.ceil(article.content.length / 1000))} min read`;
        const category = this.getCategoryFromTitle(article.title);
        
        return {
          id,
          title: article.title,
          summary: article.description || 'No description available',
          content: article.content || 'No content available',
          url: article.url,
          image: article.urlToImage || 'https://via.placeholder.com/800x450?text=No+Image',
          source: article.source.name || 'Unknown',
          date: new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          category,
          author: article.author || 'Anonymous',
          timeToRead,
          saved: this.savedNews.has(id),
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
        };
      });
    } catch (error) {
      console.error('Failed to fetch news:', error);
      return [];
    }
  }

  /**
   * Get top headlines for crypto
   */
  async getTopHeadlines(country: string = 'us', pageSize: number = 5): Promise<NewsItem[]> {
    try {
      const response = await this.apiRequest<NewsApiResponse>('/top-headlines', {
        category: 'business',
        q: 'crypto OR bitcoin OR blockchain',
        country,
        pageSize: pageSize.toString()
      });
      
      if (response.status !== 'ok' || !response.articles) {
        throw new Error('Invalid news API response');
      }
      
      return response.articles.map((article, index) => {
        const id = `headline-${Date.now()}-${index}`;
        const timeToRead = `${Math.max(2, Math.ceil((article.content?.length || 0) / 1000))} min read`;
        const category = 'Headlines';
        
        return {
          id,
          title: article.title,
          summary: article.description || 'No description available',
          content: article.content || 'No content available',
          url: article.url,
          image: article.urlToImage || 'https://via.placeholder.com/800x450?text=No+Image',
          source: article.source.name || 'Unknown',
          date: new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          category,
          author: article.author || 'Anonymous',
          timeToRead,
          saved: this.savedNews.has(id),
          sentiment: this.analyzeSentiment(article.title)
        };
      });
    } catch (error) {
      console.error('Failed to fetch headlines:', error);
      return [];
    }
  }

  /**
   * Search for news articles
   */
  async searchNews(query: string, page: number = 1, pageSize: number = 10): Promise<NewsItem[]> {
    if (!query.trim()) {
      return this.getLatestNews(page, pageSize);
    }
    
    try {
      const response = await this.apiRequest<NewsApiResponse>('/everything', {
        q: query,
        language: 'en',
        sortBy: 'relevancy',
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      if (response.status !== 'ok' || !response.articles) {
        throw new Error('Invalid news API response');
      }
      
      return response.articles.map((article, index) => {
        const id = `search-${Date.now()}-${index}`;
        const timeToRead = `${Math.max(2, Math.ceil((article.content?.length || 0) / 1000))} min read`;
        const category = this.getCategoryFromTitle(article.title);
        
        return {
          id,
          title: article.title,
          summary: article.description || 'No description available',
          content: article.content || 'No content available',
          url: article.url,
          image: article.urlToImage || 'https://via.placeholder.com/800x450?text=No+Image',
          source: article.source.name || 'Unknown',
          date: new Date(article.publishedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          }),
          category,
          author: article.author || 'Anonymous',
          timeToRead,
          saved: this.savedNews.has(id),
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
        };
      });
    } catch (error) {
      console.error('Failed to search news:', error);
      return [];
    }
  }

  /**
   * Toggle saved status for a news item
   */
  toggleSaveNews(id: string): boolean {
    if (this.savedNews.has(id)) {
      this.savedNews.delete(id);
    } else {
      this.savedNews.add(id);
    }
    
    this.saveSavedNews();
    return this.savedNews.has(id);
  }

  /**
   * Get all saved news IDs
   */
  getSavedNewsIds(): string[] {
    return Array.from(this.savedNews);
  }

  /**
   * Save news IDs to localStorage
   */
  private saveSavedNews(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('saved_news', JSON.stringify(Array.from(this.savedNews)));
    }
  }

  /**
   * Load saved news IDs from localStorage
   */
  private loadSavedNews(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem('saved_news');
      if (saved) {
        try {
          const savedIds = JSON.parse(saved);
          this.savedNews = new Set(savedIds);
        } catch (e) {
          console.error('Failed to parse saved news', e);
        }
      }
    }
  }

  /**
   * Analyze sentiment of text (very basic implementation)
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bullish', 'growth', 'gain', 'surge', 'rally', 'positive', 'up', 
                          'increase', 'profit', 'success', 'opportunity', 'rise', 'good'];
    const negativeWords = ['bearish', 'crash', 'loss', 'drop', 'fall', 'negative', 'down',
                          'decrease', 'risk', 'failure', 'threat', 'decline', 'bad', 'problem'];
    
    const lowerText = text.toLowerCase();
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (lowerText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (lowerText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Determine category based on title keywords
   */
  private getCategoryFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('bitcoin') || lowerTitle.includes('btc')) return 'Bitcoin';
    if (lowerTitle.includes('ethereum') || lowerTitle.includes('eth')) return 'Ethereum';
    if (lowerTitle.includes('regulation') || lowerTitle.includes('law') || 
        lowerTitle.includes('sec') || lowerTitle.includes('legal')) return 'Regulation';
    if (lowerTitle.includes('defi') || lowerTitle.includes('yield') || 
        lowerTitle.includes('lending')) return 'DeFi';
    if (lowerTitle.includes('nft')) return 'NFT';
    if (lowerTitle.includes('mining') || lowerTitle.includes('miner')) return 'Mining';
    if (lowerTitle.includes('hack') || lowerTitle.includes('security') || 
        lowerTitle.includes('stolen')) return 'Security';
    
    return 'General';
  }

  /**
   * Clear news cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const newsApiService = new NewsApiService();
