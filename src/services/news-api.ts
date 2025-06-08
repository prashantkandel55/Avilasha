/**
 * News API service for cryptocurrency news with real-time updates
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
  private readonly CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache for real-time updates
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private savedNews: Set<string> = new Set();
  private retryCount = 3;
  private retryDelay = 1000; // 1 second
  private newsUpdateInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<() => void> = new Set();

  constructor() {
    this.loadSavedNews();
    this.startRealTimeUpdates();
  }

  /**
   * Subscribe to news updates
   */
  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of updates
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }

  /**
   * Start real-time news updates
   */
  private startRealTimeUpdates(): void {
    // Clear any existing interval
    if (this.newsUpdateInterval) {
      clearInterval(this.newsUpdateInterval);
    }

    // Update news every 2 minutes
    this.newsUpdateInterval = setInterval(() => {
      this.getLatestNews(1, 10).then(() => {
        this.notifySubscribers();
      }).catch(error => {
        console.error('Failed to update news in background:', error);
      });
    }, 2 * 60 * 1000); // 2 minutes
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
      // In a real implementation, we would call the actual API
      // const response = await this.apiRequest<NewsApiResponse>('/everything', {
      //   q: 'cryptocurrency OR bitcoin OR ethereum OR blockchain',
      //   language: 'en',
      //   sortBy: 'publishedAt',
      //   page: page.toString(),
      //   pageSize: pageSize.toString()
      // });
      
      // const articles = response.articles.map(article => ({
      //   id: article.url,
      //   title: article.title,
      //   summary: article.description || '',
      //   content: article.content || '',
      //   url: article.url,
      //   image: article.urlToImage || 'https://via.placeholder.com/800x450?text=Crypto+News',
      //   source: article.source.name,
      //   date: new Date(article.publishedAt).toISOString().split('T')[0],
      //   category: this.categorizeArticle(article.title, article.description || ''),
      //   author: article.author,
      //   timeToRead: this.estimateReadTime(article.content || article.description || ''),
      //   saved: this.savedNews.has(article.url),
      //   sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || ''))
      // }));
      
      // return articles;

      // For demo purposes, return mock data with current timestamp
      const mockNews = this.getMockNewsData('latest', page, pageSize);
      
      // Update timestamps to be more recent
      mockNews.forEach(news => {
        // Random time in the last 24 hours
        const hoursAgo = Math.floor(Math.random() * 24);
        const minutesAgo = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setHours(date.getHours() - hoursAgo);
        date.setMinutes(date.getMinutes() - minutesAgo);
        news.date = date.toISOString().split('T')[0];
      });
      
      return mockNews;
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
      // In a real implementation, we would call the actual API
      // const response = await this.apiRequest<NewsApiResponse>('/top-headlines', {
      //   category: 'business',
      //   country,
      //   q: 'crypto OR bitcoin OR blockchain',
      //   pageSize: pageSize.toString()
      // });
      
      // const articles = response.articles.map(article => ({
      //   id: article.url,
      //   title: article.title,
      //   summary: article.description || '',
      //   content: article.content || '',
      //   url: article.url,
      //   image: article.urlToImage || 'https://via.placeholder.com/800x450?text=Crypto+News',
      //   source: article.source.name,
      //   date: new Date(article.publishedAt).toISOString().split('T')[0],
      //   category: this.categorizeArticle(article.title, article.description || ''),
      //   author: article.author,
      //   timeToRead: this.estimateReadTime(article.content || article.description || ''),
      //   saved: this.savedNews.has(article.url),
      //   sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || ''))
      // }));
      
      // return articles;

      // For demo purposes, return mock data with current timestamp
      const mockNews = this.getMockNewsData('headlines', 1, pageSize);
      
      // Update timestamps to be more recent
      mockNews.forEach(news => {
        // Random time in the last 12 hours
        const hoursAgo = Math.floor(Math.random() * 12);
        const minutesAgo = Math.floor(Math.random() * 60);
        const date = new Date();
        date.setHours(date.getHours() - hoursAgo);
        date.setMinutes(date.getMinutes() - minutesAgo);
        news.date = date.toISOString().split('T')[0];
      });
      
      return mockNews;
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
      // In a real implementation, we would call the actual API
      // const response = await this.apiRequest<NewsApiResponse>('/everything', {
      //   q: keywords,
      //   language: 'en',
      //   sortBy: 'relevancy',
      //   page: page.toString(),
      //   pageSize: items.toString()
      // });
      
      // const articles = response.articles.map(article => ({
      //   id: article.url,
      //   title: article.title,
      //   summary: article.description || '',
      //   content: article.content || '',
      //   url: article.url,
      //   image: article.urlToImage || 'https://via.placeholder.com/800x450?text=Search+Results',
      //   source: article.source.name,
      //   date: new Date(article.publishedAt).toISOString().split('T')[0],
      //   category: 'Search',
      //   author: article.author,
      //   timeToRead: this.estimateReadTime(article.content || article.description || ''),
      //   saved: this.savedNews.has(article.url),
      //   sentiment: this.analyzeSentiment(article.title + ' ' + (article.description || ''))
      // }));
      
      // return articles;

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
          this.savedNews = new Set();
        }
      }
    }
  }

  /**
   * Categorize an article based on its title and description
   */
  private categorizeArticle(title: string, description: string): string {
    const text = (title + ' ' + description).toLowerCase();
    
    if (text.includes('bitcoin') || text.includes('btc')) return 'Bitcoin';
    if (text.includes('ethereum') || text.includes('eth')) return 'Ethereum';
    if (text.includes('solana') || text.includes('sol')) return 'Solana';
    if (text.includes('regulation') || text.includes('sec') || text.includes('law')) return 'Regulation';
    if (text.includes('defi') || text.includes('yield') || text.includes('staking')) return 'DeFi';
    if (text.includes('nft') || text.includes('collectible')) return 'NFTs';
    if (text.includes('market') || text.includes('price') || text.includes('trading')) return 'Markets';
    
    return 'Crypto';
  }

  /**
   * Estimate read time for an article
   */
  private estimateReadTime(text: string): string {
    const wordsPerMinute = 200;
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min read`;
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
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.newsUpdateInterval) {
      clearInterval(this.newsUpdateInterval);
      this.newsUpdateInterval = null;
    }
  }

  /**
   * Generate mock news data for demo purposes
   */
  private getMockNewsData(type: string, page: number = 1, pageSize: number = 10): NewsItem[] {
    const currentDate = new Date().toISOString().split('T')[0];
    
    const mockNews: NewsItem[] = [
      {
        id: '1',
        title: 'Bitcoin Surges Past $60,000 as Institutional Interest Grows',
        summary: 'Bitcoin has surpassed $60,000 for the first time in weeks as institutional investors continue to show interest in the cryptocurrency.',
        content: 'Bitcoin has surpassed $60,000 for the first time in weeks as institutional investors continue to show interest in the cryptocurrency. The surge comes amid growing adoption by major financial institutions and corporations. Analysts suggest that this could be the beginning of another bull run, with some predicting prices as high as $100,000 by the end of the year. The increased interest from institutional investors is seen as a sign of growing confidence in Bitcoin as a store of value and a hedge against inflation.',
        url: 'https://example.com/news/1',
        image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Crypto News',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Blockchain Daily',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1605792657660-596af9009e82?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Financial Times',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1639762681057-408e52192e55?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'DeFi Pulse',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'NFT Insider',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Banking Times',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Tech Insights',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1581092921461-39b9d08ed889?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Energy Report',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Global Finance',
        date: currentDate,
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
        image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Market Watch',
        date: currentDate,
        category: 'Business',
        author: 'Jennifer Lee',
        timeToRead: '5 min read',
        saved: this.savedNews.has('10'),
        sentiment: 'positive'
      },
      {
        id: '11',
        title: 'Solana Ecosystem Expands with New DeFi and NFT Projects',
        summary: 'The Solana blockchain is seeing rapid growth with dozens of new DeFi protocols and NFT marketplaces launching on the platform.',
        content: 'The Solana blockchain ecosystem is experiencing rapid expansion with dozens of new decentralized finance (DeFi) protocols and NFT marketplaces launching on the platform. Developers are attracted to Solana\'s high throughput and low transaction costs, which enable more complex applications. The total value locked (TVL) in Solana DeFi has increased by over 200% in the past month, while NFT trading volume has reached new all-time highs. This growth comes despite previous network outages, suggesting increased confidence in the platform\'s stability.',
        url: 'https://example.com/news/11',
        image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Blockchain Report',
        date: currentDate,
        category: 'Solana',
        author: 'Alex Rivera',
        timeToRead: '4 min read',
        saved: this.savedNews.has('11'),
        sentiment: 'positive'
      },
      {
        id: '12',
        title: 'Crypto Tax Reporting Requirements Tightened in New Legislation',
        summary: 'New legislation introduces stricter tax reporting requirements for cryptocurrency transactions and holdings.',
        content: 'New legislation has introduced significantly stricter tax reporting requirements for cryptocurrency transactions and holdings. The new rules require exchanges and other crypto service providers to report user transactions to tax authorities, similar to how traditional brokerages report stock trades. Individual crypto holders will also face enhanced reporting obligations for their digital asset activities. Tax experts recommend keeping detailed records of all crypto transactions and consulting with specialists familiar with the new requirements. Non-compliance could result in substantial penalties and interest charges.',
        url: 'https://example.com/news/12',
        image: 'https://images.unsplash.com/photo-1586486855514-8c633cc6fd38?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Tax Policy Center',
        date: currentDate,
        category: 'Regulation',
        author: 'Maria Rodriguez',
        timeToRead: '6 min read',
        saved: this.savedNews.has('12'),
        sentiment: 'negative'
      },
      {
        id: '13',
        title: 'Cardano Smart Contracts See Exponential Growth in Adoption',
        summary: 'The number of smart contracts deployed on the Cardano blockchain has grown exponentially following recent protocol upgrades.',
        content: 'The Cardano blockchain is experiencing exponential growth in smart contract deployment following recent protocol upgrades that enhanced functionality and developer tools. The number of smart contracts on the network has increased by over 400% in the past quarter, with DeFi applications leading the charge. The Cardano Foundation reports that developer activity has reached an all-time high, with thousands of developers now building on the platform. This surge in development activity comes as Cardano continues to implement its roadmap focused on scalability and interoperability improvements.',
        url: 'https://example.com/news/13',
        image: 'https://images.unsplash.com/photo-1639152201720-5e536d254d81?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Blockchain Insights',
        date: currentDate,
        category: 'Cardano',
        author: 'James Wilson',
        timeToRead: '5 min read',
        saved: this.savedNews.has('13'),
        sentiment: 'positive'
      },
      {
        id: '14',
        title: 'Major Retailer Announces Bitcoin Payment Integration',
        summary: 'A major global retailer has announced plans to accept Bitcoin payments across its online and physical stores.',
        content: 'A major global retailer with stores in over 30 countries has announced plans to accept Bitcoin payments across its online and physical locations. The company has partnered with a leading cryptocurrency payment processor to enable seamless transactions. Customers will be able to pay using Bitcoin through a QR code system at checkout, with the option for merchants to receive either Bitcoin or local currency. This move represents one of the largest retail adoptions of cryptocurrency payments to date and could potentially influence other major retailers to follow suit.',
        url: 'https://example.com/news/14',
        image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Retail Business Review',
        date: currentDate,
        category: 'Adoption',
        author: 'Patricia Lee',
        timeToRead: '4 min read',
        saved: this.savedNews.has('14'),
        sentiment: 'positive'
      },
      {
        id: '15',
        title: 'Crypto Venture Capital Funding Reaches New Quarterly Record',
        summary: 'Venture capital funding for cryptocurrency and blockchain startups has reached a new quarterly record despite market volatility.',
        content: 'Venture capital funding for cryptocurrency and blockchain startups has reached a new quarterly record despite ongoing market volatility. Investment firms have poured over $12 billion into the sector in the past three months, surpassing the previous record set last year. The funding is primarily focused on infrastructure projects, DeFi protocols, and Web3 applications. Investors remain bullish on the long-term potential of blockchain technology, with many venture capital firms raising dedicated crypto funds to capitalize on what they see as a transformative technology comparable to the early internet.',
        url: 'https://example.com/news/15',
        image: 'https://images.unsplash.com/photo-1551135049-8a33b5883817?ixlib=rb-1.2.1&auto=format&fit=crop&w=1200&q=80',
        source: 'Venture Beat',
        date: currentDate,
        category: 'Business',
        author: 'Daniel Park',
        timeToRead: '7 min read',
        saved: this.savedNews.has('15'),
        sentiment: 'positive'
      }
    ];

    // Paginate the results
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return mockNews.slice(startIndex, endIndex);
  }
}

export const newsApiService = new NewsApiService();