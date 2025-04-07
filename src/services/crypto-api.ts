/**
 * Enhanced cryptocurrency API service with advanced features and better error handling
 */

import { toast } from '@/hooks/use-toast';
import { securityService } from './security';

// Types for cryptocurrency data
export interface CryptoMarketData {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  image: string;
  last_updated: string;
  ath?: number;
  ath_change_percentage?: number;
  ath_date?: string;
  atl?: number;
  atl_change_percentage?: number;
  atl_date?: string;
  roi?: {
    times: number;
    currency: string;
    percentage: number;
  };
  price_change_24h?: number;
  price_change_percentage_7d?: number;
  price_change_percentage_30d?: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number;
  thumb: string;
  small: string;
  large: string;
  slug: string;
  price_btc: number;
  score: number;
}

export interface TrendingResponse {
  coins: Array<{
    item: TrendingCoin;
  }>;
  nfts: Array<any>;
  categories: Array<any>;
}

export interface CoinDetails {
  id: string;
  symbol: string;
  name: string;
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
    official_forum_url: string[];
    chat_url: string[];
    announcement_url: string[];
    twitter_screen_name: string;
    facebook_username: string;
    telegram_channel_identifier: string;
    subreddit_url: string;
  };
  image: {
    thumb: string;
    small: string;
    large: string;
  };
  market_data: {
    current_price: Record<string, number>;
    ath: Record<string, number>;
    ath_change_percentage: Record<string, number>;
    ath_date: Record<string, string>;
    atl: Record<string, number>;
    atl_change_percentage: Record<string, number>;
    atl_date: Record<string, string>;
    market_cap: Record<string, number>;
    market_cap_rank: number;
    fully_diluted_valuation: Record<string, number>;
    total_volume: Record<string, number>;
    high_24h: Record<string, number>;
    low_24h: Record<string, number>;
    price_change_24h: number;
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_14d: number;
    price_change_percentage_30d: number;
    price_change_percentage_60d: number;
    price_change_percentage_200d: number;
    price_change_percentage_1y: number;
    market_cap_change_24h: number;
    market_cap_change_percentage_24h: number;
    total_supply: number;
    max_supply: number;
    circulating_supply: number;
  };
}

export interface HistoricalMarketData {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface PriceAlert {
  coinId: string;
  symbol: string;
  name: string;
  targetPrice: number;
  currentPrice: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: number;
}

class CryptoApiService {
  private readonly API_BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds cache
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private priceAlerts: PriceAlert[] = [];
  
  constructor() {
    // Load saved price alerts from localStorage
    this.loadPriceAlerts();
    
    // Check price alerts every minute
    setInterval(() => this.checkPriceAlerts(), 60 * 1000);
  }
  
  /**
   * Make an API request with rate limiting and caching
   */
  private async apiRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    try {
      // Apply rate limiting
      if (!securityService.applyRateLimit(`crypto_api_${endpoint}`)) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Build URL with query parameters
      const queryParams = new URLSearchParams(params).toString();
      const url = `${this.API_BASE_URL}${endpoint}${queryParams ? `?${queryParams}` : ''}`;
      
      // Check cache first
      const cacheKey = url;
      const cachedData = this.cache.get(cacheKey);
      const now = Date.now();
      
      if (cachedData && now - cachedData.timestamp < this.CACHE_DURATION) {
        return cachedData.data as T;
      }
      
      // Add cache-control headers to avoid rate limiting
      const headers = new Headers({
        'Accept': 'application/json',
        'Cache-Control': 'max-age=30' // Cache for 30 seconds
      });
      
      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }
      
      const data = await response.json();
      
      // Store in cache
      this.cache.set(cacheKey, { data, timestamp: now });
      
      return data as T;
    } catch (error) {
      console.error('CryptoAPI error:', error);
      throw new Error(`Failed to fetch data: ${error.message}`);
    }
  }
  
  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(limit: number = 10, currency: string = 'usd'): Promise<CryptoMarketData[]> {
    return this.apiRequest<CryptoMarketData[]>('/coins/markets', {
      vs_currency: currency,
      order: 'market_cap_desc',
      per_page: limit.toString(),
      page: '1',
      sparkline: 'true',
      price_change_percentage: '24h,7d,30d'
    });
  }
  
  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCoins(): Promise<TrendingCoin[]> {
    const response = await this.apiRequest<TrendingResponse>('/search/trending');
    return response.coins.map(coin => coin.item);
  }
  
  /**
   * Get detailed information about a specific coin
   */
  async getCoinDetails(coinId: string, currency: string = 'usd'): Promise<CoinDetails> {
    return this.apiRequest<CoinDetails>(`/coins/${coinId}`, {
      localization: 'false',
      tickers: 'false',
      market_data: 'true',
      community_data: 'false',
      developer_data: 'false',
      sparkline: 'false'
    });
  }
  
  /**
   * Get historical market data for a coin
   */
  async getHistoricalData(
    coinId: string, 
    days: number | 'max' = 7, 
    currency: string = 'usd'
  ): Promise<HistoricalMarketData> {
    return this.apiRequest<HistoricalMarketData>(`/coins/${coinId}/market_chart`, {
      vs_currency: currency,
      days: days.toString(),
      interval: days === 1 ? 'hourly' : 'daily'
    });
  }
  
  /**
   * Create a price alert for a specific coin
   */
  createPriceAlert(alert: Omit<PriceAlert, 'createdAt' | 'triggered'>): PriceAlert {
    const newAlert: PriceAlert = {
      ...alert,
      triggered: false,
      createdAt: Date.now()
    };
    
    this.priceAlerts.push(newAlert);
    this.savePriceAlerts();
    return newAlert;
  }
  
  /**
   * Get all price alerts
   */
  getPriceAlerts(): PriceAlert[] {
    return [...this.priceAlerts];
  }
  
  /**
   * Delete a price alert
   */
  deletePriceAlert(coinId: string, targetPrice: number): boolean {
    const initialLength = this.priceAlerts.length;
    this.priceAlerts = this.priceAlerts.filter(
      alert => !(alert.coinId === coinId && alert.targetPrice === targetPrice)
    );
    
    if (this.priceAlerts.length !== initialLength) {
      this.savePriceAlerts();
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if any price alerts have been triggered
   */
  private async checkPriceAlerts(): Promise<void> {
    if (this.priceAlerts.length === 0) return;
    
    try {
      // Get unique coin IDs from alerts
      const coinIds = [...new Set(this.priceAlerts.map(alert => alert.coinId))];
      
      // Fetch current prices for all coins in alerts
      const prices = await Promise.all(
        coinIds.map(async (coinId) => {
          try {
            const data = await this.getCoinDetails(coinId);
            return { coinId, price: data.market_data.current_price.usd };
          } catch (error) {
            console.error(`Failed to fetch price for ${coinId}:`, error);
            return { coinId, price: null };
          }
        })
      );
      
      // Create a map for quick price lookup
      const priceMap = new Map(prices.map(p => [p.coinId, p.price]));
      
      // Check each alert
      let alertsTriggered = false;
      
      this.priceAlerts.forEach(alert => {
        if (alert.triggered) return; // Skip already triggered alerts
        
        const currentPrice = priceMap.get(alert.coinId);
        if (currentPrice === null) return; // Skip if price fetch failed
        
        // Update current price
        alert.currentPrice = currentPrice;
        
        // Check if alert condition is met
        if (
          (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
          (alert.condition === 'below' && currentPrice <= alert.targetPrice)
        ) {
          alert.triggered = true;
          alertsTriggered = true;
          
          // Show notification
          toast({
            title: `Price Alert: ${alert.name} (${alert.symbol.toUpperCase()})`,
            description: `Price is now ${alert.condition === 'above' ? 'above' : 'below'} ${alert.targetPrice} USD (Current: $${currentPrice.toFixed(2)})`,
            variant: 'default'
          });
        }
      });
      
      // Save alerts if any were triggered
      if (alertsTriggered) {
        this.savePriceAlerts();
      }
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }
  
  /**
   * Save price alerts to localStorage
   */
  private savePriceAlerts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('price_alerts', JSON.stringify(this.priceAlerts));
    }
  }
  
  /**
   * Load price alerts from localStorage
   */
  private loadPriceAlerts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      const savedAlerts = localStorage.getItem('price_alerts');
      if (savedAlerts) {
        try {
          this.priceAlerts = JSON.parse(savedAlerts);
        } catch (error) {
          console.error('Failed to parse saved price alerts:', error);
          this.priceAlerts = [];
        }
      }
    }
  }
  
  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

export const cryptoApiService = new CryptoApiService();