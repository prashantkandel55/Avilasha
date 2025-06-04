/**
 * Crypto Service Integration
 * Integrates free cryptocurrency API services with the application
 */

import { toast } from '@/hooks/use-toast';
import { freeCryptoApis, TokenBalance, NFTAsset, TransactionData, GasPrice } from './free-crypto-apis';
import { moralisNftApi } from './moralis-nft-api';
import { cryptocompareApi } from './cryptocompare-api';
import { cryptoNewsApi } from './cryptonews-api';
import { defiLlamaApi } from './defillama-api';

// Configuration for API keys
interface ApiConfig {
  etherscan?: string;
  covalent?: string;
  moralis?: string;
  cryptocompare?: string;
  cryptonews?: string;
  defillama?: string;
}

/**
 * Manages cryptocurrency data from multiple free API sources
 */
class CryptoServiceIntegration {
  private initialized = false;
  
  /**
   * Initialize the service with API keys
   */
  initialize(config: ApiConfig): void {
    try {
      if (config.etherscan) {
        freeCryptoApis.etherscan.setApiKey(config.etherscan);
      }
      
      if (config.covalent) {
        freeCryptoApis.covalent.setApiKey(config.covalent);
      }
      
      if (config.moralis) {
        freeCryptoApis.moralis.setApiKey(config.moralis);
        moralisNftApi.setApiKey(config.moralis);
      }
      
      if (config.cryptocompare) {
        cryptocompareApi.setApiKey(config.cryptocompare);
      }
      
      if (config.cryptonews) {
        cryptoNewsApi.setApiKey(config.cryptonews);
      }

      if (config.defillama) {
        defiLlamaApi.setApiKey(config.defillama);
      }
      
      this.initialized = true;
      console.log('Crypto service integration initialized successfully');
    } catch (error) {
      console.error('Failed to initialize crypto service integration:', error);
      toast({
        title: 'Service Initialization Error',
        description: 'Failed to initialize cryptocurrency services',
        variant: 'destructive'
      });
    }
  }
  
  /**
   * Check if the service is initialized
   */
  private checkInitialized(): void {
    if (!this.initialized) {
      console.warn('Crypto service not fully initialized. Some features may be limited.');
    }
  }
  
  /**
   * Get cryptocurrency prices
   */
  async getPrices(coinIds: string[], currencies: string[] = ['usd']) {
    this.checkInitialized();
    
    try {
      // Return mock data for demo purposes
      const mockPrices: any = {};
      coinIds.forEach(coin => {
        mockPrices[coin] = {};
        currencies.forEach(currency => {
          // Generate a realistic price based on the coin
          let basePrice = 0;
          if (coin.toLowerCase() === 'bitcoin') basePrice = 60000;
          else if (coin.toLowerCase() === 'ethereum') basePrice = 3500;
          else if (coin.toLowerCase() === 'solana') basePrice = 150;
          else if (coin.toLowerCase() === 'cardano') basePrice = 0.5;
          else if (coin.toLowerCase() === 'ripple') basePrice = 0.6;
          else basePrice = 10 + Math.random() * 100;
          
          // Add some randomness
          const price = basePrice * (0.95 + Math.random() * 0.1);
          mockPrices[coin][currency] = price;
        });
      });
      
      return mockPrices;
    } catch (error) {
      console.error('Failed to fetch cryptocurrency prices:', error);
      toast({
        title: 'Price Data Error',
        description: 'Unable to fetch current prices. Please try again later.',
        variant: 'destructive'
      });
      throw error;
    }
  }
  
  /**
   * Get trending cryptocurrencies
   */
  async getTrendingCoins() {
    this.checkInitialized();
    
    try {
      // Return mock data for demo purposes
      return {
        coins: [
          { item: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', market_cap_rank: 1, price_btc: 1 } },
          { item: { id: 'ethereum', name: 'Ethereum', symbol: 'ETH', market_cap_rank: 2, price_btc: 0.06 } },
          { item: { id: 'solana', name: 'Solana', symbol: 'SOL', market_cap_rank: 3, price_btc: 0.0025 } },
          { item: { id: 'cardano', name: 'Cardano', symbol: 'ADA', market_cap_rank: 4, price_btc: 0.00002 } },
          { item: { id: 'ripple', name: 'XRP', symbol: 'XRP', market_cap_rank: 5, price_btc: 0.00003 } }
        ]
      };
    } catch (error) {
      console.error('Failed to fetch trending coins:', error);
      return { coins: [] };
    }
  }
  
  /**
   * Get market data for cryptocurrencies
   */
  async getCoinMarkets(currency: string = 'usd', page: number = 1, perPage: number = 100) {
    this.checkInitialized();
    
    try {
      // Return mock data for demo purposes
      return [
        { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', current_price: 60000, market_cap: 1200000000000, total_volume: 30000000000, price_change_percentage_24h: 2.5 },
        { id: 'ethereum', symbol: 'eth', name: 'Ethereum', current_price: 3500, market_cap: 420000000000, total_volume: 15000000000, price_change_percentage_24h: 1.8 },
        { id: 'solana', symbol: 'sol', name: 'Solana', current_price: 150, market_cap: 60000000000, total_volume: 3000000000, price_change_percentage_24h: 3.2 },
        { id: 'cardano', symbol: 'ada', name: 'Cardano', current_price: 0.5, market_cap: 18000000000, total_volume: 500000000, price_change_percentage_24h: -1.2 },
        { id: 'ripple', symbol: 'xrp', name: 'XRP', current_price: 0.6, market_cap: 30000000000, total_volume: 1200000000, price_change_percentage_24h: -0.5 }
      ];
    } catch (error) {
      console.error('Failed to fetch coin markets:', error);
      toast({
        title: 'Market Data Error',
        description: 'Unable to fetch market data. Please try again later.',
        variant: 'destructive'
      });
      return [];
    }
  }
  
  /**
   * Get wallet token balances using available services
   * Tries multiple services in case one fails
   */
  async getWalletTokens(address: string, chainId: number = 1): Promise<TokenBalance[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { token_address: '0x0000000000000000000000000000000000000000', name: 'Ethereum', symbol: 'ETH', decimals: 18, balance: '1.5', balance_formatted: '1.5', price_usd: 3500, value_usd: 5250 },
      { token_address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', name: 'USD Coin', symbol: 'USDC', decimals: 6, balance: '1000', balance_formatted: '1000', price_usd: 1, value_usd: 1000 },
      { token_address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984', name: 'Uniswap', symbol: 'UNI', decimals: 18, balance: '50', balance_formatted: '50', price_usd: 10, value_usd: 500 }
    ];
  }
  
  /**
   * Get NFTs for a wallet address
   */
  async getWalletNFTs(address: string, chain: string = 'eth'): Promise<NFTAsset[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { token_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', token_id: '1234', contract_type: 'ERC721', owner_of: address, block_number: '12345678', block_number_minted: '12345670', token_uri: 'ipfs://abc123', metadata: '{"name":"Bored Ape #1234","image":"https://via.placeholder.com/350x350"}', amount: '1', name: 'Bored Ape Yacht Club', symbol: 'BAYC' },
      { token_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', token_id: '5678', contract_type: 'ERC721', owner_of: address, block_number: '12345679', block_number_minted: '12345675', token_uri: 'ipfs://def456', metadata: '{"name":"Mutant Ape #5678","image":"https://via.placeholder.com/350x350"}', amount: '1', name: 'Mutant Ape Yacht Club', symbol: 'MAYC' }
    ];
  }
  
  /**
   * Get transactions for a wallet address
   */
  async getWalletTransactions(address: string, chainId: number = 1): Promise<TransactionData[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { hash: '0x123...', from: '0xabc...', to: address, value: '1000000000000000000', gas: '21000', gasPrice: '50000000000', timestamp: Date.now() - 3600000, blockNumber: 12345678 },
      { hash: '0x456...', from: address, to: '0xdef...', value: '500000000000000000', gas: '21000', gasPrice: '50000000000', timestamp: Date.now() - 7200000, blockNumber: 12345677 }
    ];
  }
  
  /**
   * Get gas price (Ethereum only)
   */
  async getGasPrice(): Promise<GasPrice> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return {
      safeLow: 50,
      standard: 60,
      fast: 70,
      fastest: 80,
      baseFee: 45,
      lastBlock: 12345678
    };
  }

  /**
   * Get all DeFi protocols with their TVL and other metrics
   */
  async getAllDeFiProtocols(): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { id: 'aave', name: 'Aave', chain: 'Ethereum', tvl: 5000000000, change_1d: 2.5 },
      { id: 'curve', name: 'Curve', chain: 'Ethereum', tvl: 3500000000, change_1d: 1.8 },
      { id: 'uniswap', name: 'Uniswap', chain: 'Ethereum', tvl: 3000000000, change_1d: -0.5 },
      { id: 'compound', name: 'Compound', chain: 'Ethereum', tvl: 2000000000, change_1d: 0.7 },
      { id: 'maker', name: 'MakerDAO', chain: 'Ethereum', tvl: 1800000000, change_1d: 1.2 }
    ];
  }

  /**
   * Get TVL data for a specific protocol
   */
  async getProtocolTvl(protocol: string): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    const mockData = [];
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 86400;
    
    for (let i = 30; i >= 0; i--) {
      mockData.push({
        date: now - (i * daySeconds),
        tvl: 2000000000 + (Math.random() * 500000000 - 250000000)
      });
    }
    
    return mockData;
  }

  /**
   * Get TVL data for all chains
   */
  async getChainsTvl(): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { name: 'Ethereum', tvl: 40000000000, change_1d: 1.5 },
      { name: 'BSC', tvl: 10000000000, change_1d: 0.8 },
      { name: 'Polygon', tvl: 5000000000, change_1d: 2.3 },
      { name: 'Solana', tvl: 3000000000, change_1d: 3.1 },
      { name: 'Avalanche', tvl: 2000000000, change_1d: 1.9 }
    ];
  }

  /**
   * Get global TVL data (historical)
   */
  async getGlobalTvl(): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    const mockData = [];
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 86400;
    
    for (let i = 30; i >= 0; i--) {
      mockData.push({
        date: now - (i * daySeconds),
        tvl: 80000000000 + (Math.random() * 10000000000 - 5000000000)
      });
    }
    
    return mockData;
  }

  /**
   * Get yield pools data
   */
  async getYieldPools(limit: number = 100): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { pool: 'Aave USDC', chain: 'Ethereum', project: 'Aave', symbol: 'USDC', tvlUsd: 1000000000, apy: 3.5, apyBase: 2.5, apyReward: 1.0 },
      { pool: 'Compound ETH', chain: 'Ethereum', project: 'Compound', symbol: 'ETH', tvlUsd: 800000000, apy: 2.8, apyBase: 2.0, apyReward: 0.8 },
      { pool: 'Curve 3pool', chain: 'Ethereum', project: 'Curve', symbol: '3CRV', tvlUsd: 600000000, apy: 4.2, apyBase: 3.0, apyReward: 1.2 },
      { pool: 'Uniswap ETH/USDC', chain: 'Ethereum', project: 'Uniswap', symbol: 'ETH-USDC', tvlUsd: 500000000, apy: 12.5, apyBase: 8.0, apyReward: 4.5 },
      { pool: 'SushiSwap ETH/WBTC', chain: 'Ethereum', project: 'SushiSwap', symbol: 'ETH-WBTC', tvlUsd: 400000000, apy: 15.0, apyBase: 10.0, apyReward: 5.0 }
    ];
  }

  /**
   * Get stablecoins data
   */
  async getStablecoins(): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { name: 'USDT', symbol: 'USDT', price: 1.0, pegType: 'fiat-backed', pegMechanism: 'centralized', circulating: { pegged: 80000000000 } },
      { name: 'USDC', symbol: 'USDC', price: 1.0, pegType: 'fiat-backed', pegMechanism: 'centralized', circulating: { pegged: 50000000000 } },
      { name: 'DAI', symbol: 'DAI', price: 1.0, pegType: 'crypto-backed', pegMechanism: 'decentralized', circulating: { pegged: 10000000000 } },
      { name: 'BUSD', symbol: 'BUSD', price: 1.0, pegType: 'fiat-backed', pegMechanism: 'centralized', circulating: { pegged: 8000000000 } },
      { name: 'FRAX', symbol: 'FRAX', price: 1.0, pegType: 'hybrid', pegMechanism: 'algorithmic', circulating: { pegged: 3000000000 } }
    ];
  }
  
  /**
   * Get NFT collections owned by a wallet
   */
  async getWalletNFTCollections(address: string, chain: string = 'eth'): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { token_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', name: 'Bored Ape Yacht Club', symbol: 'BAYC', total_supply: '10000', floor_price: 68.5 },
      { token_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', name: 'Mutant Ape Yacht Club', symbol: 'MAYC', total_supply: '20000', floor_price: 15.2 }
    ];
  }
  
  /**
   * Get NFT transfers for a wallet
   */
  async getNFTTransfers(address: string, chain: string = 'eth'): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { block_timestamp: '2023-01-01T00:00:00Z', transaction_hash: '0x123...', from_address: '0xabc...', to_address: address, token_id: '1234', token_address: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d', contract_type: 'ERC721' },
      { block_timestamp: '2023-01-02T00:00:00Z', transaction_hash: '0x456...', from_address: address, to_address: '0xdef...', token_id: '5678', token_address: '0x60e4d786628fea6478f785a6d7e704777c86a7c6', contract_type: 'ERC721' }
    ];
  }
  
  /**
   * Get NFT collection stats
   */
  async getNFTCollectionStats(address: string, chain: string = 'eth'): Promise<any> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return {
      collection_name: 'Bored Ape Yacht Club',
      collection_address: address,
      floor_price: 68.5,
      volume_24h: 500,
      volume_7d: 3500,
      average_price: 72.3,
      market_cap: 685000,
      items_count: 10000,
      owners_count: 6000
    };
  }
  
  /**
   * Get historical daily price data
   */
  async getHistoricalDailyPrices(coin: string, currency: string = 'USD', days: number = 30): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    const mockData = [];
    const now = Math.floor(Date.now() / 1000);
    const daySeconds = 86400;
    
    // Base price depends on the coin
    let basePrice = 100;
    if (coin.toLowerCase() === 'bitcoin') basePrice = 60000;
    else if (coin.toLowerCase() === 'ethereum') basePrice = 3500;
    else if (coin.toLowerCase() === 'solana') basePrice = 150;
    
    for (let i = days; i >= 0; i--) {
      // Add some randomness to the price
      const price = basePrice * (0.9 + Math.random() * 0.2);
      
      mockData.push({
        time: now - (i * daySeconds),
        high: price * 1.05,
        low: price * 0.95,
        open: price * 0.98,
        close: price,
        volumefrom: 1000000 + Math.random() * 500000,
        volumeto: (1000000 + Math.random() * 500000) * price
      });
    }
    
    return mockData;
  }
  
  /**
   * Get historical hourly price data
   */
  async getHistoricalHourlyPrices(coin: string, currency: string = 'USD', hours: number = 24): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    const mockData = [];
    const now = Math.floor(Date.now() / 1000);
    const hourSeconds = 3600;
    
    // Base price depends on the coin
    let basePrice = 100;
    if (coin.toLowerCase() === 'bitcoin') basePrice = 60000;
    else if (coin.toLowerCase() === 'ethereum') basePrice = 3500;
    else if (coin.toLowerCase() === 'solana') basePrice = 150;
    
    for (let i = hours; i >= 0; i--) {
      // Add some randomness to the price
      const price = basePrice * (0.98 + Math.random() * 0.04);
      
      mockData.push({
        time: now - (i * hourSeconds),
        high: price * 1.02,
        low: price * 0.98,
        open: price * 0.99,
        close: price,
        volumefrom: 50000 + Math.random() * 20000,
        volumeto: (50000 + Math.random() * 20000) * price
      });
    }
    
    return mockData;
  }
  
  /**
   * Get trading signals for a cryptocurrency
   */
  async getTradingSignals(coin: string): Promise<any> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return {
      inOutVar: {
        sentiment: 'bullish',
        value: 0.75
      },
      largetxsVar: {
        sentiment: 'neutral',
        value: 0.5
      },
      addressesNetGrowth: {
        sentiment: 'bullish',
        value: 0.8
      },
      concentrationVar: {
        sentiment: 'bearish',
        value: 0.3
      },
      summary: {
        sentiment: 'bullish',
        score: 0.65
      }
    };
  }
  
  /**
   * Get latest cryptocurrency news
   */
  async getLatestNews(page: number = 1, items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { id: '1', title: 'Bitcoin Surges Past $60,000', summary: 'Bitcoin has surpassed $60,000 for the first time in weeks.', content: 'Full article content here...', url: 'https://example.com/news/1', image: 'https://via.placeholder.com/800x450?text=Bitcoin+News', source: 'Crypto News', date: '2023-01-01', category: 'Bitcoin', author: 'John Doe', timeToRead: '3 min read', saved: false, sentiment: 'positive' },
      { id: '2', title: 'Ethereum Upgrade Scheduled', summary: 'Ethereum developers announce the next major upgrade.', content: 'Full article content here...', url: 'https://example.com/news/2', image: 'https://via.placeholder.com/800x450?text=Ethereum+News', source: 'Blockchain Daily', date: '2023-01-02', category: 'Ethereum', author: 'Jane Smith', timeToRead: '5 min read', saved: false, sentiment: 'positive' }
    ];
  }
  
  /**
   * Get news for specific cryptocurrencies
   */
  async getNewsByCoin(coins: string[], items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { id: '1', title: `${coins[0]} Price Analysis`, summary: `Recent price movements for ${coins[0]}.`, content: 'Full article content here...', url: 'https://example.com/news/1', image: 'https://via.placeholder.com/800x450?text=Price+Analysis', source: 'Crypto News', date: '2023-01-01', category: coins[0], author: 'John Doe', timeToRead: '3 min read', saved: false, sentiment: 'neutral' },
      { id: '2', title: `${coins[0]} Development Update`, summary: `Latest developments in the ${coins[0]} ecosystem.`, content: 'Full article content here...', url: 'https://example.com/news/2', image: 'https://via.placeholder.com/800x450?text=Development+Update', source: 'Blockchain Daily', date: '2023-01-02', category: coins[0], author: 'Jane Smith', timeToRead: '5 min read', saved: false, sentiment: 'positive' }
    ];
  }
  
  /**
   * Search news by keywords
   */
  async searchNews(keywords: string, items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    return [
      { id: '1', title: `News Related to ${keywords}`, summary: `Article about ${keywords}.`, content: 'Full article content here...', url: 'https://example.com/news/1', image: 'https://via.placeholder.com/800x450?text=Search+Results', source: 'Crypto News', date: '2023-01-01', category: 'Search', author: 'John Doe', timeToRead: '3 min read', saved: false, sentiment: 'neutral' },
      { id: '2', title: `More About ${keywords}`, summary: `Another article about ${keywords}.`, content: 'Full article content here...', url: 'https://example.com/news/2', image: 'https://via.placeholder.com/800x450?text=More+Results', source: 'Blockchain Daily', date: '2023-01-02', category: 'Search', author: 'Jane Smith', timeToRead: '5 min read', saved: false, sentiment: 'positive' }
    ];
  }
  
  /**
   * Get historical portfolio value
   */
  async getPortfolioHistory(address: string, chainId: number = 1, days: number = 30) {
    this.checkInitialized();
    
    // Return mock data for demo purposes
    const mockData = {
      data: {
        items: [
          {
            holdings: Array.from({ length: days }, (_, i) => ({
              timestamp: Math.floor(Date.now() / 1000) - ((days - i) * 86400),
              quote: 10000 + (Math.random() * 5000 - 2500)
            }))
          }
        ]
      }
    };
    
    return mockData;
  }
}

// Create and export service instance
export const cryptoService = new CryptoServiceIntegration();