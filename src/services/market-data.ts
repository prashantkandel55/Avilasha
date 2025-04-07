/**
 * Cryptocurrency Market Data Service
 * Provides market data, trends, and analytics for crypto assets
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

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
  private coinUuidMap: Record<string, string> = {}; // Maps symbols to UUIDs
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
          this.coinUuidMap = data.coinUuidMap || {};
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
          lastFetchTime: this.lastFetchTime,
          coinUuidMap: this.coinUuidMap
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
      const apiUsage = apiService.getUsageStats();
      
      // Only refresh if we're not close to hitting rate limits
      if (apiUsage.lastMinute < apiUsage.minuteLimit * 0.8 && 
          apiUsage.lastMonth < apiUsage.monthlyLimit * 0.9) {
        await Promise.all([
          this.getMarketAssets(this.DEFAULT_LIMIT, true),
          this.getMarketOverview(true)
        ]);
      } else {
        console.log('Skipping auto-refresh due to API rate limit concerns');
      }
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
      // Fetch from real API
      const coinsData = await apiService.getCoins(limit);
      const assets: MarketAsset[] = [];
      
      if (coinsData.coins && Array.isArray(coinsData.coins)) {
        for (const coin of coinsData.coins) {
          const asset: MarketAsset = {
            id: coin.uuid,
            symbol: coin.symbol,
            name: coin.name,
            price: parseFloat(coin.price),
            marketCap: parseFloat(coin.marketCap),
            volume24h: parseFloat(coin['24hVolume']),
            changePercent24h: parseFloat(coin.change),
            changePercent7d: 0, // Not directly provided in this endpoint
            totalSupply: parseFloat(coin.supply.total || 0),
            circulatingSupply: parseFloat(coin.supply.circulating || 0),
            lastUpdated: now
          };
          
          assets.push(asset);
          
          // Update cache
          this.marketAssetsCache[asset.symbol] = asset;
          
          // Keep track of UUID for symbol
          this.coinUuidMap[asset.symbol] = asset.id;
        }
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
      let uuid = this.coinUuidMap[symbol];
      
      // If we don't have the UUID, try to find it
      if (!uuid) {
        // Try to get it from search
        const searchResult = await apiService.searchCoins(symbol);
        if (searchResult.coins && searchResult.coins.length > 0) {
          const exactMatch = searchResult.coins.find(
            (c: any) => c.symbol.toUpperCase() === symbol.toUpperCase()
          );
          
          if (exactMatch) {
            uuid = exactMatch.uuid;
            this.coinUuidMap[symbol] = uuid;
          }
        }
        
        // If still no UUID, try getting top coins first
        if (!uuid) {
          await this.getMarketAssets(100);
          uuid = this.coinUuidMap[symbol];
          
          if (!uuid) {
            return null; // Couldn't find this symbol
          }
        }
      }
      
      // Now get the detailed data
      const coinData = await apiService.getCoin(uuid);
      
      if (coinData && coinData.coin) {
        const coin = coinData.coin;
        
        // Get 7d change from history if available
        let change7d = 0;
        try {
          const history = await apiService.getCoinHistory(uuid, '7d');
          if (history && history.history && history.history.length > 0) {
            const oldestPrice = parseFloat(history.history[0].price);
            const newestPrice = parseFloat(coin.price);
            change7d = ((newestPrice - oldestPrice) / oldestPrice) * 100;
          }
        } catch (historyError) {
          console.error('Failed to fetch coin history:', historyError);
        }
        
        const asset: MarketAsset = {
          id: coin.uuid,
          symbol: coin.symbol,
          name: coin.name,
          price: parseFloat(coin.price),
          marketCap: parseFloat(coin.marketCap),
          volume24h: parseFloat(coin['24hVolume']),
          changePercent24h: parseFloat(coin.change),
          changePercent7d: change7d,
          totalSupply: parseFloat(coin.supply.total || 0),
          circulatingSupply: parseFloat(coin.supply.circulating || 0),
          lastUpdated: now
        };
        
        this.marketAssetsCache[asset.symbol] = asset;
        this.lastFetchTime[cacheKey] = now;
        this.saveToCache();
        
        return asset;
      }
      
      return null;
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
      // Get global stats
      const statsData = await apiService.getGlobalStats();
      
      // Get top coins for gainers/losers
      const assets = await this.getMarketAssets(50);
      
      // Sort for gainers and losers
      const sortedByChange = [...assets].sort(
        (a, b) => b.changePercent24h - a.changePercent24h
      );
      
      const topGainers = sortedByChange.slice(0, 5);
      const topLosers = sortedByChange.slice(-5).reverse();
      
      // Create market trends based on categories
      // In a real implementation, you'd get this from an API or analyze the market
      const trends: MarketTrend[] = this.generateMarketTrends(assets);
      
      const overview: MarketOverview = {
        totalMarketCap: parseFloat(statsData.totalMarketCap),
        totalVolume24h: parseFloat(statsData.total24hVolume),
        btcDominance: parseFloat(statsData.btcDominance),
        ethDominance: parseFloat(statsData.btcDominance) * 0.4, // Approximate, not provided directly
        defiTvl: parseFloat(statsData.totalMarketCap) * 0.08, // Approximate, not provided directly
        fearGreedIndex: 65, // Not provided by API, would need another source
        topGainers,
        topLosers,
        trends,
        lastUpdated: now
      };
      
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
      // Use the search API
      const searchResult = await apiService.searchCoins(query);
      
      const assets: MarketAsset[] = [];
      const now = Date.now();
      
      if (searchResult.coins && Array.isArray(searchResult.coins)) {
        for (const coin of searchResult.coins) {
          const asset: MarketAsset = {
            id: coin.uuid,
            symbol: coin.symbol,
            name: coin.name,
            price: parseFloat(coin.price),
            marketCap: parseFloat(coin.marketCap || 0),
            volume24h: parseFloat(coin['24hVolume'] || 0),
            changePercent24h: parseFloat(coin.change || 0),
            changePercent7d: 0, // Not provided in search results
            totalSupply: 0, // Not provided in search results
            circulatingSupply: 0, // Not provided in search results
            lastUpdated: now
          };
          
          assets.push(asset);
          
          // Update cache
          this.marketAssetsCache[asset.symbol] = asset;
          
          // Keep track of UUID for symbol
          this.coinUuidMap[asset.symbol] = asset.id;
        }
        
        this.saveToCache();
      }
      
      return assets;
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
   * Generate market trends based on available assets
   * In a real implementation, this would come from an API or more sophisticated analysis
   */
  private generateMarketTrends(assets: MarketAsset[]): MarketTrend[] {
    const totalMarketCap = assets.reduce((sum, asset) => sum + asset.marketCap, 0);
    
    // Map some common symbols to categories
    const defiSymbols = ['UNI', 'AAVE', 'CAKE', 'COMP', 'MKR', 'SNX', 'YFI', 'SUSHI', 'CRV'];
    const gamingSymbols = ['AXS', 'MANA', 'SAND', 'ENJ', 'GALA', 'ILV', 'ALICE'];
    const layer1Symbols = ['ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'ATOM', 'NEAR', 'FTM', 'ONE'];
    const privacySymbols = ['XMR', 'ZEC', 'DASH', 'SCRT', 'ARRR'];
    
    // Filter assets by category
    const defiAssets = assets.filter(a => defiSymbols.includes(a.symbol));
    const gamingAssets = assets.filter(a => gamingSymbols.includes(a.symbol));
    const layer1Assets = assets.filter(a => layer1Symbols.includes(a.symbol));
    const privacyAssets = assets.filter(a => privacySymbols.includes(a.symbol));
    
    // Calculate category metrics
    const calculateCategoryMetrics = (categoryAssets: MarketAsset[]) => {
      const totalValue = categoryAssets.reduce((sum, a) => sum + a.marketCap, 0);
      const avgChange = categoryAssets.length > 0
        ? categoryAssets.reduce((sum, a) => sum + a.changePercent24h, 0) / categoryAssets.length
        : 0;
      const symbols = categoryAssets.map(a => a.symbol);
      return { totalValue, avgChange, symbols };
    };
    
    const defiMetrics = calculateCategoryMetrics(defiAssets);
    const gamingMetrics = calculateCategoryMetrics(gamingAssets);
    const layer1Metrics = calculateCategoryMetrics(layer1Assets);
    const privacyMetrics = calculateCategoryMetrics(privacyAssets);
    
    // Create trend objects
    return [
      {
        id: 'defi',
        name: 'DeFi Tokens',
        value: defiMetrics.totalValue,
        description: 'Decentralized Finance protocols showing increased activity',
        changePercent: defiMetrics.avgChange,
        assets: defiMetrics.symbols
      },
      {
        id: 'gaming',
        name: 'Gaming & Metaverse',
        value: gamingMetrics.totalValue,
        description: 'Gaming tokens seeing increased interest',
        changePercent: gamingMetrics.avgChange,
        assets: gamingMetrics.symbols
      },
      {
        id: 'layer1',
        name: 'Layer 1 Blockchains',
        value: layer1Metrics.totalValue,
        description: 'Alternative L1 chains with growing developer activity',
        changePercent: layer1Metrics.avgChange,
        assets: layer1Metrics.symbols
      },
      {
        id: 'privacy',
        name: 'Privacy Coins',
        value: privacyMetrics.totalValue,
        description: 'Privacy-focused cryptocurrencies',
        changePercent: privacyMetrics.avgChange,
        assets: privacyMetrics.symbols
      }
    ];
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
