/**
 * Cryptocurrency Market Data Service
 * Provides market data, trends, and analytics for crypto assets
 */

import { toast } from '@/hooks/use-toast';

export interface MarketAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  changePercent24h: number;
  changePercent7d: number;
  totalSupply: number;
  circulatingSupply: number;
  lastUpdated: number;
}

export interface MarketTrend {
  id: string;
  name: string;
  value: number;
  description: string;
  changePercent: number;
  assets: string[]; // Asset symbols
}

export interface MarketOverview {
  totalMarketCap: number;
  totalVolume24h: number;
  btcDominance: number;
  ethDominance: number;
  defiTvl: number;
  fearGreedIndex: number;
  topGainers: MarketAsset[];
  topLosers: MarketAsset[];
  trends: MarketTrend[];
  lastUpdated: number;
}

class MarketDataService {
  private readonly CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
  private readonly MARKET_DATA_KEY = 'avilasha_market_data';
  private readonly MARKET_OVERVIEW_KEY = 'avilasha_market_overview';
  private readonly DEFAULT_LIMIT = 100;
  
  private marketAssetsCache: Record<string, MarketAsset> = {};
  private marketOverviewCache: MarketOverview | null = null;
  private lastFetchTime: Record<string, number> = {};
  private refreshInterval: number | null = null;

  constructor() {
    this.loadFromCache();
    this.setupAutoRefresh();
  }

  /**
   * Load cached data from localStorage
   */
  private loadFromCache(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const marketDataJson = localStorage.getItem(this.MARKET_DATA_KEY);
        if (marketDataJson) {
          const data = JSON.parse(marketDataJson);
          this.marketAssetsCache = data.assets || {};
          this.lastFetchTime = data.lastFetchTime || {};
        }

        const overviewJson = localStorage.getItem(this.MARKET_OVERVIEW_KEY);
        if (overviewJson) {
          this.marketOverviewCache = JSON.parse(overviewJson);
        }
      } catch (error) {
        console.error('Failed to load market data from cache:', error);
      }
    }
  }

  /**
   * Save data to local cache
   */
  private saveToCache(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.MARKET_DATA_KEY, JSON.stringify({
          assets: this.marketAssetsCache,
          lastFetchTime: this.lastFetchTime
        }));

        if (this.marketOverviewCache) {
          localStorage.setItem(this.MARKET_OVERVIEW_KEY, JSON.stringify(this.marketOverviewCache));
        }
      } catch (error) {
        console.error('Failed to save market data to cache:', error);
      }
    }
  }

  /**
   * Set up automatic refresh of market data
   */
  private setupAutoRefresh(): void {
    // Clear any existing interval
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }

    // Auto-refresh market data every 5 minutes
    this.refreshInterval = window.setInterval(() => {
      this.refreshMarketData();
    }, this.CACHE_DURATION_MS) as unknown as number;
  }

  /**
   * Refresh market data in background
   */
  private async refreshMarketData(): Promise<void> {
    try {
      await Promise.all([
        this.getMarketAssets(this.DEFAULT_LIMIT, true),
        this.getMarketOverview(true)
      ]);
    } catch (error) {
      console.error('Failed to refresh market data:', error);
    }
  }

  /**
   * Get market data for top assets
   * @param limit Number of assets to return
   * @param forceRefresh Force refresh from API even if cache is valid
   */
  async getMarketAssets(limit = this.DEFAULT_LIMIT, forceRefresh = false): Promise<MarketAsset[]> {
    const cacheKey = `market_assets_${limit}`;
    const now = Date.now();
    const cacheDuration = this.CACHE_DURATION_MS;

    const isCacheValid = 
      this.lastFetchTime[cacheKey] && 
      now - this.lastFetchTime[cacheKey] < cacheDuration;

    if (!forceRefresh && isCacheValid && Object.keys(this.marketAssetsCache).length > 0) {
      // Return from cache
      return Object.values(this.marketAssetsCache)
        .sort((a, b) => b.marketCap - a.marketCap)
        .slice(0, limit);
    }

    try {
      // In a real app, this would be a fetch to a crypto API
      const assets = await this.fetchMockMarketAssets(limit);
      
      // Update cache
      for (const asset of assets) {
        this.marketAssetsCache[asset.symbol] = asset;
      }

      this.lastFetchTime[cacheKey] = now;
      this.saveToCache();

      return assets;
    } catch (error) {
      console.error('Failed to fetch market assets:', error);
      
      // If we have cached data, return it as fallback
      if (Object.keys(this.marketAssetsCache).length > 0) {
        return Object.values(this.marketAssetsCache)
          .sort((a, b) => b.marketCap - a.marketCap)
          .slice(0, limit);
      }
      
      throw error;
    }
  }

  /**
   * Get detail for a specific asset by symbol
   */
  async getAssetDetail(symbol: string): Promise<MarketAsset | null> {
    // Check if we have it in cache and it's fresh enough
    const now = Date.now();
    const cacheKey = `asset_${symbol}`;
    const cacheDuration = this.CACHE_DURATION_MS;

    const cachedAsset = this.marketAssetsCache[symbol];
    const isCacheValid = 
      cachedAsset && 
      this.lastFetchTime[cacheKey] && 
      now - this.lastFetchTime[cacheKey] < cacheDuration;

    if (isCacheValid) {
      return cachedAsset;
    }

    try {
      // In a real app, this would fetch from a crypto API
      const asset = await this.fetchMockAssetDetail(symbol);
      if (asset) {
        this.marketAssetsCache[asset.symbol] = asset;
        this.lastFetchTime[cacheKey] = now;
        this.saveToCache();
      }
      return asset;
    } catch (error) {
      console.error(`Failed to fetch details for ${symbol}:`, error);
      
      // Return from cache as fallback if available
      return cachedAsset || null;
    }
  }

  /**
   * Get market overview data
   */
  async getMarketOverview(forceRefresh = false): Promise<MarketOverview> {
    const now = Date.now();
    const cacheDuration = this.CACHE_DURATION_MS;

    const isCacheValid = 
      this.marketOverviewCache && 
      now - this.marketOverviewCache.lastUpdated < cacheDuration;

    if (!forceRefresh && isCacheValid) {
      return this.marketOverviewCache;
    }

    try {
      // In a real app, this would fetch from a crypto API
      const overview = await this.fetchMockMarketOverview();
      
      this.marketOverviewCache = overview;
      this.saveToCache();

      return overview;
    } catch (error) {
      console.error('Failed to fetch market overview:', error);
      
      // If we have cached data, return it as fallback
      if (this.marketOverviewCache) {
        return this.marketOverviewCache;
      }
      
      throw error;
    }
  }

  /**
   * Search for assets by name or symbol
   */
  async searchAssets(query: string): Promise<MarketAsset[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    query = query.toLowerCase().trim();

    // First check our cache
    const matchedFromCache = Object.values(this.marketAssetsCache).filter(asset => 
      asset.symbol.toLowerCase().includes(query) || 
      asset.name.toLowerCase().includes(query)
    );

    if (matchedFromCache.length > 0) {
      return matchedFromCache;
    }

    try {
      // In a real app, this would use a search API endpoint
      // For our mock, we'll fetch top assets and filter
      const assets = await this.getMarketAssets(100);
      
      return assets.filter(asset => 
        asset.symbol.toLowerCase().includes(query) || 
        asset.name.toLowerCase().includes(query)
      );
    } catch (error) {
      console.error('Failed to search assets:', error);
      return [];
    }
  }

  /**
   * Get current market trends
   */
  async getMarketTrends(): Promise<MarketTrend[]> {
    try {
      const overview = await this.getMarketOverview();
      return overview.trends;
    } catch (error) {
      console.error('Failed to get market trends:', error);
      return [];
    }
  }

  /**
   * Mock implementation of market assets fetch
   * In a real app, this would call a cryptocurrency API
   */
  private async fetchMockMarketAssets(limit: number): Promise<MarketAsset[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const mockCryptos = [
      { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000, marketCap: 1.28e12 },
      { symbol: 'ETH', name: 'Ethereum', basePrice: 3500, marketCap: 4.2e11 },
      { symbol: 'BNB', name: 'Binance Coin', basePrice: 580, marketCap: 8.9e10 },
      { symbol: 'SOL', name: 'Solana', basePrice: 140, marketCap: 6.3e10 },
      { symbol: 'XRP', name: 'XRP', basePrice: 0.50, marketCap: 5.1e10 },
      { symbol: 'ADA', name: 'Cardano', basePrice: 0.55, marketCap: 1.9e10 },
      { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.12, marketCap: 1.7e10 },
      { symbol: 'AVAX', name: 'Avalanche', basePrice: 35, marketCap: 1.3e10 },
      { symbol: 'DOT', name: 'Polkadot', basePrice: 7.2, marketCap: 1.0e10 },
      { symbol: 'MATIC', name: 'Polygon', basePrice: 0.85, marketCap: 8.1e9 },
      { symbol: 'LINK', name: 'Chainlink', basePrice: 18, marketCap: 7.8e9 },
      { symbol: 'UNI', name: 'Uniswap', basePrice: 11, marketCap: 6.5e9 },
      { symbol: 'SHIB', name: 'Shiba Inu', basePrice: 0.000028, marketCap: 1.6e10 },
      { symbol: 'LTC', name: 'Litecoin', basePrice: 80, marketCap: 6.0e9 },
      { symbol: 'ATOM', name: 'Cosmos', basePrice: 9.2, marketCap: 3.5e9 }
    ];

    const now = Date.now();
    return mockCryptos.slice(0, limit).map(crypto => {
      // Add random price fluctuation
      const changePercent24h = (Math.random() * 20) - 10; // -10% to +10%
      const price = crypto.basePrice * (1 + changePercent24h / 100);
      
      // Generate additional mock data
      return {
        id: `${crypto.symbol.toLowerCase()}`,
        symbol: crypto.symbol,
        name: crypto.name,
        price,
        marketCap: crypto.marketCap,
        volume24h: crypto.marketCap * (Math.random() * 0.2 + 0.1), // 10-30% of market cap
        changePercent24h,
        changePercent7d: (Math.random() * 40) - 20, // -20% to +20%
        totalSupply: crypto.marketCap / (crypto.basePrice * 0.8),
        circulatingSupply: crypto.marketCap / crypto.basePrice,
        lastUpdated: now
      };
    });
  }

  /**
   * Mock implementation of asset detail fetch
   */
  private async fetchMockAssetDetail(symbol: string): Promise<MarketAsset | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));

    const mockCryptos: Record<string, {name: string, basePrice: number, marketCap: number}> = {
      'BTC': { name: 'Bitcoin', basePrice: 65000, marketCap: 1.28e12 },
      'ETH': { name: 'Ethereum', basePrice: 3500, marketCap: 4.2e11 },
      'BNB': { name: 'Binance Coin', basePrice: 580, marketCap: 8.9e10 },
      'SOL': { name: 'Solana', basePrice: 140, marketCap: 6.3e10 },
      'XRP': { name: 'XRP', basePrice: 0.50, marketCap: 5.1e10 },
      'ADA': { name: 'Cardano', basePrice: 0.55, marketCap: 1.9e10 },
      'DOGE': { name: 'Dogecoin', basePrice: 0.12, marketCap: 1.7e10 },
      'AVAX': { name: 'Avalanche', basePrice: 35, marketCap: 1.3e10 },
      'DOT': { name: 'Polkadot', basePrice: 7.2, marketCap: 1.0e10 },
      'MATIC': { name: 'Polygon', basePrice: 0.85, marketCap: 8.1e9 },
      'LINK': { name: 'Chainlink', basePrice: 18, marketCap: 7.8e9 },
      'UNI': { name: 'Uniswap', basePrice: 11, marketCap: 6.5e9 },
      'SHIB': { name: 'Shiba Inu', basePrice: 0.000028, marketCap: 1.6e10 },
      'LTC': { name: 'Litecoin', basePrice: 80, marketCap: 6.0e9 },
      'ATOM': { name: 'Cosmos', basePrice: 9.2, marketCap: 3.5e9 }
    };

    // If symbol not found in our mock data
    if (!mockCryptos[symbol]) {
      return null;
    }

    const crypto = mockCryptos[symbol];
    const now = Date.now();
    
    // Add random price fluctuation
    const changePercent24h = (Math.random() * 20) - 10; // -10% to +10%
    const price = crypto.basePrice * (1 + changePercent24h / 100);
    
    return {
      id: `${symbol.toLowerCase()}`,
      symbol,
      name: crypto.name,
      price,
      marketCap: crypto.marketCap,
      volume24h: crypto.marketCap * (Math.random() * 0.2 + 0.1), // 10-30% of market cap
      changePercent24h,
      changePercent7d: (Math.random() * 40) - 20, // -20% to +20%
      totalSupply: crypto.marketCap / (crypto.basePrice * 0.8),
      circulatingSupply: crypto.marketCap / crypto.basePrice,
      lastUpdated: now
    };
  }

  /**
   * Mock implementation of market overview fetch
   */
  private async fetchMockMarketOverview(): Promise<MarketOverview> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const now = Date.now();
    
    // Get top assets for market overview
    const assets = await this.fetchMockMarketAssets(30);
    
    // Calculate total market cap
    const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCap, 0);
    
    // Calculate BTC and ETH dominance
    const btc = assets.find(a => a.symbol === 'BTC');
    const eth = assets.find(a => a.symbol === 'ETH');
    
    const btcDominance = btc ? (btc.marketCap / totalMarketCap) * 100 : 45;
    const ethDominance = eth ? (eth.marketCap / totalMarketCap) * 100 : 18;
    
    // Sort for gainers and losers
    const sortedByChange = [...assets].sort(
      (a, b) => b.changePercent24h - a.changePercent24h
    );
    
    const topGainers = sortedByChange.slice(0, 5);
    const topLosers = sortedByChange.slice(-5).reverse();
    
    // Mock trends
    const trends: MarketTrend[] = [
      {
        id: 'defi',
        name: 'DeFi Tokens',
        value: totalMarketCap * 0.08,
        description: 'Decentralized Finance protocols showing increased activity',
        changePercent: 12.5,
        assets: ['UNI', 'LINK', 'AAVE', 'CRV', 'MKR']
      },
      {
        id: 'gaming',
        name: 'Gaming & Metaverse',
        value: totalMarketCap * 0.04,
        description: 'Gaming tokens seeing increased interest',
        changePercent: 8.3,
        assets: ['AXS', 'MANA', 'SAND', 'ENJ']
      },
      {
        id: 'layer1',
        name: 'Layer 1 Blockchains',
        value: totalMarketCap * 0.25,
        description: 'Alternative L1 chains with growing developer activity',
        changePercent: -3.2,
        assets: ['SOL', 'ADA', 'AVAX', 'DOT', 'ATOM']
      },
      {
        id: 'privacy',
        name: 'Privacy Coins',
        value: totalMarketCap * 0.01,
        description: 'Privacy-focused cryptocurrencies',
        changePercent: -5.7,
        assets: ['XMR', 'ZEC', 'DASH']
      }
    ];
    
    return {
      totalMarketCap,
      totalVolume24h: assets.reduce((sum, asset) => sum + asset.volume24h, 0),
      btcDominance,
      ethDominance,
      defiTvl: totalMarketCap * 0.08, // ~8% of total market
      fearGreedIndex: 65, // 0-100, higher is more greedy
      topGainers,
      topLosers,
      trends,
      lastUpdated: now
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

export const marketDataService = new MarketDataService();
