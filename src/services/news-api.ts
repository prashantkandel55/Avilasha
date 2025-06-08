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
      
      // Return mock data for demo purposes
      return this.getMockNewsData(endpoint) as T;
    }
  }

  /**
   * Get the latest crypto news
   */
  async getLatestNews(page: number = 1, pageSize: number = 10): Promise<NewsItem[]> {
    try {
      // For demo purposes, return mock data
      return this.getMockNewsData('latest', page, pageSize);
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
      // For demo purposes, return mock data
      return this.getMockNewsData('headlines', 1, pageSize);
    } catch (error) {
      console.error('Failed to fetch headlines:', error);
      return [];
    }
  }

  /**
   * Search news by keywords
   */
  async searchNews(keywords: string, items: number = 10, page: number = 1): Promise<NewsItem[]> {
    try {
      // For demo purposes, filter mock data based on keywords
      const allNews = this.getMockNewsData('latest', 1, 20);
      return allNews.filter(item => 
        item.title.toLowerCase().includes(keywords.toLowerCase()) ||
        item.summary.toLowerCase().includes(keywords.toLowerCase()) ||
        item.content.toLowerCase().includes(keywords.toLowerCase())
      ).slice(0, items);
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
   * Generate mock news data for demo purposes
   */
  private getMockNewsData(type: string, page: number = 1, pageSize: number = 10): NewsItem[] {
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Bitcoin Surges Past $60,000 as Institutional Interest Grows',
        summary: 'Bitcoin has surpassed $60,000 for the first time in weeks as institutional investors continue to show interest in the cryptocurrency.',
        content: 'Bitcoin has surpassed $60,000 for the first time in weeks as institutional investors continue to show interest in the cryptocurrency. The surge comes amid growing adoption by major financial institutions and corporations. Analysts suggest that this could be the beginning of another bull run, with some predicting prices as high as $100,000 by the end of the year. The increased interest from institutional investors is seen as a sign of growing confidence in Bitcoin as a store of value and a hedge against inflation.',
        url: 'https://example.com/news/1',
        image: 'https://via.placeholder.com/800x450?text=Bitcoin+News',
        source: 'Crypto News',
        date: '2025-04-15',
        category: 'Bitcoin',
        author: 'John Doe',
        timeToRead: '3 min read',
        saved: this.savedNews.has('1'),
        sentiment: 'positive'
      },
      {
        id: '2',
        title: 'Ethereum Upgrade Scheduled for Next Month',
        summary: 'Developers have announced that the next major Ethereum upgrade will take place next month, bringing significant improvements to the network.',
        content: 'Ethereum developers have announced that the next major upgrade to the network will take place next month. The upgrade is expected to bring significant improvements to the network, including reduced gas fees and increased transaction throughput. This is part of the ongoing effort to scale Ethereum and make it more accessible to users. The upgrade has been in development for several months and has undergone extensive testing to ensure a smooth transition.',
        url: 'https://example.com/news/2',
        image: 'https://via.placeholder.com/800x450?text=Ethereum+News',
        source: 'Blockchain Daily',
        date: '2025-04-14',
        category: 'Ethereum',
        author: 'Jane Smith',
        timeToRead: '5 min read',
        saved: this.savedNews.has('2'),
        sentiment: 'positive'
      },
      {
        id: '3',
        title: 'Regulatory Concerns Impact Crypto Markets',
        summary: 'New regulatory proposals have caused uncertainty in cryptocurrency markets, with some assets seeing significant price drops.',
        content: 'New regulatory proposals from several major economies have caused uncertainty in cryptocurrency markets, with some assets seeing significant price drops. The proposals aim to increase oversight of cryptocurrency exchanges and impose stricter reporting requirements for transactions. Industry leaders have expressed concerns about the potential impact on innovation and adoption. However, some analysts suggest that clearer regulations could ultimately benefit the industry by providing more certainty and legitimacy.',
        url: 'https://example.com/news/3',
        image: 'https://via.placeholder.com/800x450?text=Regulation+News',
        source: 'Financial Times',
        date: '2025-04-13',
        category: 'Regulation',
        author: 'Robert Johnson',
        timeToRead: '4 min read',
        saved: this.savedNews.has('3'),
        sentiment: 'negative'
      },
      {
        id: '4',
        title: 'New DeFi Protocol Launches with $100M TVL',
        summary: 'A new decentralized finance protocol has launched with $100 million in total value locked, attracting attention from yield farmers.',
        content: 'A new decentralized finance (DeFi) protocol has launched with an impressive $100 million in total value locked (TVL) within just 24 hours of its launch. The protocol, which offers innovative yield farming opportunities, has attracted significant attention from DeFi enthusiasts and yield farmers. The team behind the protocol has implemented several security measures, including multiple audits and a bug bounty program, to address concerns about potential vulnerabilities. The protocol\'s native token has seen a price increase of over 200% since its launch.',
        url: 'https://example.com/news/4',
        image: 'https://via.placeholder.com/800x450?text=DeFi+News',
        source: 'DeFi Pulse',
        date: '2025-04-12',
        category: 'DeFi',
        author: 'Sarah Chen',
        timeToRead: '6 min read',
        saved: this.savedNews.has('4'),
        sentiment: 'positive'
      },
      {
        id: '5',
        title: 'NFT Market Shows Signs of Recovery',
        summary: 'After months of declining sales, the NFT market is showing signs of recovery with several high-profile collections seeing increased trading volume.',
        content: 'After months of declining sales and decreasing floor prices, the NFT market is showing signs of recovery. Several high-profile collections have seen increased trading volume and rising floor prices in recent weeks. This recovery comes as more traditional art institutions and brands continue to enter the space, bringing new collectors and increased legitimacy. Analysts suggest that the market may be maturing, with a greater focus on utility and long-term value rather than short-term speculation.',
        url: 'https://example.com/news/5',
        image: 'https://via.placeholder.com/800x450?text=NFT+News',
        source: 'NFT Insider',
        date: '2025-04-11',
        category: 'NFTs',
        author: 'Michael Wong',
        timeToRead: '4 min read',
        saved: this.savedNews.has('5'),
        sentiment: 'neutral'
      },
      {
        id: '6',
        title: 'Major Bank Launches Cryptocurrency Custody Service',
        summary: 'One of the world\'s largest banks has announced the launch of a cryptocurrency custody service for institutional clients.',
        content: 'One of the world\'s largest banks has announced the launch of a cryptocurrency custody service for institutional clients. This move represents a significant step in the mainstream adoption of cryptocurrencies and could pave the way for more traditional financial institutions to offer similar services. The bank has partnered with several blockchain security firms to ensure the safety of client assets. The service will initially support Bitcoin and Ethereum, with plans to add more cryptocurrencies in the future.',
        url: 'https://example.com/news/6',
        image: 'https://via.placeholder.com/800x450?text=Banking+News',
        source: 'Banking Times',
        date: '2025-04-10',
        category: 'Business',
        author: 'Emily Johnson',
        timeToRead: '5 min read',
        saved: this.savedNews.has('6'),
        sentiment: 'positive'
      },
      {
        id: '7',
        title: 'New Blockchain Scaling Solution Achieves 100,000 TPS in Tests',
        summary: 'A new blockchain scaling solution has achieved 100,000 transactions per second in recent tests, potentially solving one of the industry\'s biggest challenges.',
        content: 'A new blockchain scaling solution has achieved an impressive 100,000 transactions per second (TPS) in recent tests, potentially solving one of the biggest challenges facing the blockchain industry. The solution uses a novel approach to sharding and parallel processing to achieve these high throughput rates while maintaining security and decentralization. If successful in real-world deployments, this technology could enable blockchain networks to compete with traditional payment processors like Visa and Mastercard in terms of transaction capacity.',
        url: 'https://example.com/news/7',
        image: 'https://via.placeholder.com/800x450?text=Technology+News',
        source: 'Tech Insights',
        date: '2025-04-09',
        category: 'Technology',
        author: 'David Kim',
        timeToRead: '7 min read',
        saved: this.savedNews.has('7'),
        sentiment: 'positive'
      },
      {
        id: '8',
        title: 'Crypto Mining Companies Shift to Renewable Energy Sources',
        summary: 'Major cryptocurrency mining companies are increasingly shifting to renewable energy sources in response to environmental concerns.',
        content: 'Major cryptocurrency mining companies are increasingly shifting to renewable energy sources in response to growing environmental concerns about the industry\'s carbon footprint. Several large mining operations have announced plans to power their facilities with solar, wind, and hydroelectric energy. This shift comes amid increasing scrutiny from regulators and environmental activists regarding the energy consumption of proof-of-work cryptocurrencies like Bitcoin. Industry leaders hope that this transition will help improve the public perception of cryptocurrency mining and address legitimate environmental concerns.',
        url: 'https://example.com/news/8',
        image: 'https://via.placeholder.com/800x450?text=Mining+News',
        source: 'Energy Report',
        date: '2025-04-08',
        category: 'Mining',
        author: 'Lisa Chen',
        timeToRead: '6 min read',
        saved: this.savedNews.has('8'),
        sentiment: 'positive'
      },
      {
        id: '9',
        title: 'Central Bank Digital Currencies Gain Momentum Globally',
        summary: 'More central banks around the world are exploring or implementing digital currencies, with several pilot programs underway.',
        content: 'Central Bank Digital Currencies (CBDCs) are gaining momentum globally, with more central banks exploring or implementing these digital versions of national currencies. Several countries have launched pilot programs, while others are in advanced stages of research and development. Proponents argue that CBDCs could increase financial inclusion, reduce transaction costs, and provide central banks with more effective monetary policy tools. However, critics express concerns about privacy implications and the potential for increased government control over financial transactions.',
        url: 'https://example.com/news/9',
        image: 'https://via.placeholder.com/800x450?text=CBDC+News',
        source: 'Global Finance',
        date: '2025-04-07',
        category: 'Regulation',
        author: 'Thomas Wilson',
        timeToRead: '8 min read',
        saved: this.savedNews.has('9'),
        sentiment: 'neutral'
      },
      {
        id: '10',
        title: 'Major Crypto Exchange Expands Services to Include Stock Trading',
        summary: 'One of the world\'s largest cryptocurrency exchanges has announced plans to expand its services to include traditional stock trading.',
        content: 'One of the world\'s largest cryptocurrency exchanges has announced plans to expand its services to include traditional stock trading. This move represents a significant step in the convergence of traditional and digital asset markets. The exchange plans to offer commission-free trading of stocks and ETFs to its millions of users worldwide. Regulatory approvals are still pending in several jurisdictions, but the company expects to launch the service in select markets by the end of the quarter. This development could potentially bring millions of crypto traders into the traditional stock market.',
        url: 'https://example.com/news/10',
        image: 'https://via.placeholder.com/800x450?text=Exchange+News',
        source: 'Market Watch',
        date: '2025-04-06',
        category: 'Business',
        author: 'Jennifer Lee',
        timeToRead: '5 min read',
        saved: this.savedNews.has('10'),
        sentiment: 'positive'
      }
    ];

    // Paginate the results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return mockNews.slice(startIndex, endIndex);
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
   * Clear news cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const newsApiService = new NewsApiService();