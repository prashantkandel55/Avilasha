/**
 * Free Cryptocurrency API Services
 * Integrates with multiple free API providers (CoinGecko, Etherscan, Covalent, Moralis)
 * with proper rate limiting and caching mechanisms
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

// Types for API responses
export interface CoinGeckoPrice {
  [id: string]: {
    [currency: string]: number;
  };
}

export interface TokenBalance {
  token_address: string;
  name: string;
  symbol: string;
  logo?: string;
  thumbnail?: string;
  decimals: number;
  balance: string;
  balance_formatted?: string;
  price_usd?: number;
  value_usd?: number;
}

export interface NFTAsset {
  token_address: string;
  token_id: string;
  contract_type: string;
  owner_of: string;
  block_number: string;
  block_number_minted: string;
  token_uri?: string;
  metadata?: string;
  normalized_metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
  amount: string;
  name: string;
  symbol: string;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  timestamp: number;
  blockNumber: number;
  contractAddress?: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: string;
  isError?: string;
  txreceipt_status?: string;
  input?: string;
  methodId?: string;
  functionName?: string;
}

export interface GasPrice {
  safeLow: number;
  standard: number;
  fast: number;
  fastest: number;
  baseFee: number;
  lastBlock: number;
}

/**
 * Cache manager for API responses
 */
class CacheManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default TTL

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.DEFAULT_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set data in cache
   */
  set(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });

    // Set expiration
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }
}

/**
 * Rate limiter for API requests
 */
class RateLimiter {
  private requestTimestamps: Map<string, number[]> = new Map();

  /**
   * Check if a request can be made based on rate limits
   */
  canMakeRequest(apiKey: string, maxRequests: number, timeWindowMs: number): boolean {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(apiKey) || [];
    
    // Filter out timestamps outside the time window
    const recentTimestamps = timestamps.filter(ts => now - ts < timeWindowMs);
    
    // Update timestamps
    this.requestTimestamps.set(apiKey, recentTimestamps);
    
    // Check if we're under the limit
    return recentTimestamps.length < maxRequests;
  }

  /**
   * Record a request
   */
  recordRequest(apiKey: string): void {
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(apiKey) || [];
    timestamps.push(now);
    this.requestTimestamps.set(apiKey, timestamps);
  }
}

/**
 * CoinGecko API Service
 * Free tier limits: 10-30 calls/minute
 */
class CoinGeckoService {
  private readonly BASE_URL = 'https://api.coingecko.com/api/v3';
  private readonly RATE_LIMIT_REQUESTS = 25; // Conservative limit
  private readonly RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
  private readonly API_KEY = 'coingecko';
  
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter();

  /**
   * Make a rate-limited request to CoinGecko API
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(this.API_KEY, this.RATE_LIMIT_REQUESTS, this.RATE_LIMIT_WINDOW_MS)) {
      throw new Error('Rate limit exceeded for CoinGecko API. Please try again later.');
    }

    // Build URL with query parameters
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      // Record the request
      this.rateLimiter.recordRequest(this.API_KEY);
      
      const response = await fetch(url.toString());
      
      if (response.status === 429) {
        throw new Error('CoinGecko API rate limit exceeded');
      }
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('CoinGecko API request failed:', error);
      throw error;
    }
  }

  /**
   * Get cryptocurrency prices
   */
  async getPrices(coinIds: string[], currencies: string[] = ['usd']): Promise<CoinGeckoPrice> {
    const cacheKey = `coingecko_prices_${coinIds.join('_')}_${currencies.join('_')}`;
    const cached = this.cache.get<CoinGeckoPrice>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<CoinGeckoPrice>('/simple/price', {
        ids: coinIds.join(','),
        vs_currencies: currencies.join(','),
        include_market_cap: 'true',
        include_24hr_vol: 'true',
        include_24hr_change: 'true',
      });
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      toast({
        title: 'Price Data Error',
        description: 'Failed to fetch cryptocurrency prices',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Get trending coins
   */
  async getTrendingCoins() {
    const cacheKey = 'coingecko_trending';
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest('/search/trending');
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      throw error;
    }
  }

  /**
   * Get coin details
   */
  async getCoinDetails(coinId: string) {
    const cacheKey = `coingecko_coin_${coinId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest(`/coins/${coinId}`, {
        localization: 'false',
        tickers: 'false',
        market_data: 'true',
        community_data: 'true',
        developer_data: 'false',
      });
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error(`Failed to fetch details for coin ${coinId}:`, error);
      throw error;
    }
  }

  /**
   * Get coin market data
   */
  async getCoinMarkets(currency: string = 'usd', page: number = 1, perPage: number = 100) {
    const cacheKey = `coingecko_markets_${currency}_${page}_${perPage}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest('/coins/markets', {
        vs_currency: currency,
        order: 'market_cap_desc',
        per_page: perPage.toString(),
        page: page.toString(),
        sparkline: 'true',
        price_change_percentage: '1h,24h,7d'
      });
      
      this.cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Failed to fetch coin markets:', error);
      throw error;
    }
  }
}

/**
 * Etherscan API Service
 * Free tier limits: 5 calls/sec, max 100,000 calls/day
 */
class EtherscanService {
  private readonly BASE_URL = 'https://api.etherscan.io/api';
  private readonly RATE_LIMIT_REQUESTS = 4; // Conservative limit (5 calls/sec)
  private readonly RATE_LIMIT_WINDOW_MS = 1000; // 1 second
  private readonly API_KEY = 'etherscan';
  
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter();
  private apiKey = ''; // User should provide their own API key

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Make a rate-limited request to Etherscan API
   */
  private async makeRequest<T>(module: string, action: string, params: Record<string, string> = {}): Promise<T> {
    // Check if API key is set
    if (!this.apiKey) {
      throw new Error('Etherscan API key not set. Please set your API key first.');
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(this.API_KEY, this.RATE_LIMIT_REQUESTS, this.RATE_LIMIT_WINDOW_MS)) {
      // Wait for rate limit window to pass
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_WINDOW_MS));
    }

    // Build URL with query parameters
    const url = new URL(this.BASE_URL);
    url.searchParams.append('module', module);
    url.searchParams.append('action', action);
    url.searchParams.append('apikey', this.apiKey);
    
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      // Record the request
      this.rateLimiter.recordRequest(this.API_KEY);
      
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.status === '0') {
        throw new Error(`Etherscan API error: ${data.message}`);
      }
      
      return data.result as T;
    } catch (error) {
      console.error('Etherscan API request failed:', error);
      throw error;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(address: string): Promise<string> {
    const cacheKey = `etherscan_balance_${address}`;
    const cached = this.cache.get<string>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const balance = await this.makeRequest<string>('account', 'balance', {
        address,
        tag: 'latest'
      });
      
      this.cache.set(cacheKey, balance, 30 * 1000); // Cache for 30 seconds
      return balance;
    } catch (error) {
      console.error(`Failed to fetch balance for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get token balance (ERC20)
   */
  async getTokenBalance(address: string, contractAddress: string): Promise<string> {
    const cacheKey = `etherscan_token_${address}_${contractAddress}`;
    const cached = this.cache.get<string>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const balance = await this.makeRequest<string>('account', 'tokenbalance', {
        address,
        contractaddress: contractAddress,
        tag: 'latest'
      });
      
      this.cache.set(cacheKey, balance, 30 * 1000); // Cache for 30 seconds
      return balance;
    } catch (error) {
      console.error(`Failed to fetch token balance for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(address: string, startBlock: number = 0, endBlock: number = 99999999, page: number = 1, offset: number = 10): Promise<TransactionData[]> {
    const cacheKey = `etherscan_txs_${address}_${startBlock}_${endBlock}_${page}_${offset}`;
    const cached = this.cache.get<TransactionData[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const transactions = await this.makeRequest<TransactionData[]>('account', 'txlist', {
        address,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc'
      });
      
      this.cache.set(cacheKey, transactions, 60 * 1000); // Cache for 1 minute
      return transactions;
    } catch (error) {
      console.error(`Failed to fetch transactions for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get ERC20 token transactions
   */
  async getTokenTransactions(address: string, contractAddress?: string, page: number = 1, offset: number = 10): Promise<TransactionData[]> {
    const cacheKey = `etherscan_token_txs_${address}_${contractAddress || 'all'}_${page}_${offset}`;
    const cached = this.cache.get<TransactionData[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const params: Record<string, string> = {
        address,
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc'
      };
      
      if (contractAddress) {
        params.contractaddress = contractAddress;
      }
      
      const transactions = await this.makeRequest<TransactionData[]>('account', 'tokentx', params);
      
      this.cache.set(cacheKey, transactions, 60 * 1000); // Cache for 1 minute
      return transactions;
    } catch (error) {
      console.error(`Failed to fetch token transactions for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<GasPrice> {
    const cacheKey = 'etherscan_gas_price';
    const cached = this.cache.get<GasPrice>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const gasPrice = await this.makeRequest<GasPrice>('gastracker', 'gasoracle');
      this.cache.set(cacheKey, gasPrice, 30 * 1000); // Cache for 30 seconds
      return gasPrice;
    } catch (error) {
      console.error('Failed to fetch gas price:', error);
      throw error;
    }
  }
}

/**
 * Covalent API Service
 * Free tier: 100,000 credits per month (~3,333 requests)
 */
class CovalentService {
  private readonly BASE_URL = 'https://api.covalenthq.com/v1';
  private readonly RATE_LIMIT_REQUESTS = 5; // Conservative limit
  private readonly RATE_LIMIT_WINDOW_MS = 1000; // 1 second
  private readonly API_KEY = 'covalent';
  
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter();
  private apiKey = ''; // User should provide their own API key

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Make a rate-limited request to Covalent API
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Check if API key is set
    if (!this.apiKey) {
      throw new Error('Covalent API key not set. Please set your API key first.');
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(this.API_KEY, this.RATE_LIMIT_REQUESTS, this.RATE_LIMIT_WINDOW_MS)) {
      // Wait for rate limit window to pass
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_WINDOW_MS));
    }

    // Build URL with query parameters
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      // Record the request
      this.rateLimiter.recordRequest(this.API_KEY);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${btoa(this.apiKey + ':')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.data) {
        throw new Error(`Covalent API error: ${data.error_message || 'Unknown error'}`);
      }
      
      return data.data as T;
    } catch (error) {
      console.error('Covalent API request failed:', error);
      throw error;
    }
  }

  /**
   * Get token balances for address
   */
  async getTokenBalances(chainId: number, address: string): Promise<TokenBalance[]> {
    const cacheKey = `covalent_balances_${chainId}_${address}`;
    const cached = this.cache.get<TokenBalance[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<{ items: TokenBalance[] }>(`/${chainId}/address/${address}/balances_v2/`);
      this.cache.set(cacheKey, data.items, 60 * 1000); // Cache for 1 minute
      return data.items;
    } catch (error) {
      console.error(`Failed to fetch token balances for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get NFTs for address
   */
  async getNFTs(chainId: number, address: string): Promise<NFTAsset[]> {
    const cacheKey = `covalent_nfts_${chainId}_${address}`;
    const cached = this.cache.get<NFTAsset[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<{ items: NFTAsset[] }>(`/${chainId}/address/${address}/balances_nft/`);
      this.cache.set(cacheKey, data.items, 5 * 60 * 1000); // Cache for 5 minutes
      return data.items;
    } catch (error) {
      console.error(`Failed to fetch NFTs for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get historical portfolio value
   */
  async getHistoricalPortfolioValue(chainId: number, address: string, days: number = 30): Promise<any> {
    const cacheKey = `covalent_portfolio_${chainId}_${address}_${days}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest(`/${chainId}/address/${address}/portfolio_v2/`, {
        days: days.toString()
      });
      
      this.cache.set(cacheKey, data, 60 * 60 * 1000); // Cache for 1 hour
      return data;
    } catch (error) {
      console.error(`Failed to fetch portfolio value for address ${address}:`, error);
      throw error;
    }
  }
}

/**
 * Moralis API Service
 * Free tier: 25,000 API calls per month
 */
class MoralisService {
  private readonly BASE_URL = 'https://deep-index.moralis.io/api/v2';
  private readonly RATE_LIMIT_REQUESTS = 10; // Conservative limit
  private readonly RATE_LIMIT_WINDOW_MS = 1000; // 1 second
  private readonly API_KEY = 'moralis';
  
  private cache = new CacheManager();
  private rateLimiter = new RateLimiter();
  private apiKey = ''; // User should provide their own API key

  /**
   * Set API key
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Make a rate-limited request to Moralis API
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Check if API key is set
    if (!this.apiKey) {
      throw new Error('Moralis API key not set. Please set your API key first.');
    }

    // Check rate limit
    if (!this.rateLimiter.canMakeRequest(this.API_KEY, this.RATE_LIMIT_REQUESTS, this.RATE_LIMIT_WINDOW_MS)) {
      // Wait for rate limit window to pass
      await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_WINDOW_MS));
    }

    // Build URL with query parameters
    const url = new URL(`${this.BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    try {
      // Record the request
      this.rateLimiter.recordRequest(this.API_KEY);
      
      const response = await fetch(url.toString(), {
        headers: {
          'X-API-Key': this.apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Moralis API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      console.error('Moralis API request failed:', error);
      throw error;
    }
  }

  /**
   * Get native balance
   */
  async getNativeBalance(address: string, chain: string = 'eth'): Promise<string> {
    const cacheKey = `moralis_native_balance_${address}_${chain}`;
    const cached = this.cache.get<string>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<{ balance: string }>(`/${address}/balance`, { chain });
      this.cache.set(cacheKey, data.balance, 30 * 1000); // Cache for 30 seconds
      return data.balance;
    } catch (error) {
      console.error(`Failed to fetch native balance for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get token balances
   */
  async getTokenBalances(address: string, chain: string = 'eth'): Promise<TokenBalance[]> {
    const cacheKey = `moralis_token_balances_${address}_${chain}`;
    const cached = this.cache.get<TokenBalance[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<TokenBalance[]>(`/${address}/erc20`, { chain });
      this.cache.set(cacheKey, data, 60 * 1000); // Cache for 1 minute
      return data;
    } catch (error) {
      console.error(`Failed to fetch token balances for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get NFTs
   */
  async getNFTs(address: string, chain: string = 'eth', limit: number = 100): Promise<NFTAsset[]> {
    const cacheKey = `moralis_nfts_${address}_${chain}_${limit}`;
    const cached = this.cache.get<NFTAsset[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<{ result: NFTAsset[] }>(`/${address}/nft`, {
        chain,
        limit: limit.toString(),
        normalizeMetadata: 'true'
      });
      
      this.cache.set(cacheKey, data.result, 5 * 60 * 1000); // Cache for 5 minutes
      return data.result;
    } catch (error) {
      console.error(`Failed to fetch NFTs for address ${address}:`, error);
      throw error;
    }
  }

  /**
   * Get transactions
   */
  async getTransactions(address: string, chain: string = 'eth', limit: number = 100): Promise<TransactionData[]> {
    const cacheKey = `moralis_txs_${address}_${chain}_${limit}`;
    const cached = this.cache.get<TransactionData[]>(cacheKey);
    
    if (cached) return cached;
    
    try {
      const data = await this.makeRequest<{ result: TransactionData[] }>(`/${address}`, {
        chain,
        limit: limit.toString()
      });
      
      this.cache.set(cacheKey, data.result, 60 * 1000); // Cache for 1 minute
      return data.result;
    } catch (error) {
      console.error(`Failed to fetch transactions for address ${address}:`, error);
      throw error;
    }
  }
}

// Create and export service instances
export const coinGeckoService = new CoinGeckoService();
export const etherscanService = new EtherscanService();
export const covalentService = new CovalentService();
export const moralisService = new MoralisService();

// Import new API services
import { moralisNftApi } from './moralis-nft-api';
import { cryptocompareApi } from './cryptocompare-api';
import { cryptoNewsApi } from './cryptonews-api';

// Export a unified service for easier access
export const freeCryptoApis = {
  coinGecko: coinGeckoService,
  etherscan: etherscanService,
  covalent: covalentService,
  moralis: moralisService,
  defiLlama: defiLlamaApi,
  moralisNft: moralisNftApi,
  cryptocompare: cryptocompareApi,
  cryptoNews: cryptoNewsApi
};