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
      // CoinGecko is always available (no API key required)
      return await freeCryptoApis.coinGecko.getPrices(coinIds, currencies);
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
      return await freeCryptoApis.coinGecko.getTrendingCoins();
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
      return await freeCryptoApis.coinGecko.getCoinMarkets(currency, page, perPage);
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
    
    // Try Covalent first if available
    if (freeCryptoApis.covalent.getApiKey) {
      try {
        return await freeCryptoApis.covalent.getTokenBalances(chainId, address);
      } catch (error) {
        console.warn('Covalent token balance fetch failed, trying Moralis:', error);
      }
    }
    
    // Try Moralis as fallback
    if (freeCryptoApis.moralis.getApiKey) {
      try {
        const chain = chainId === 1 ? 'eth' : 
                     chainId === 56 ? 'bsc' : 
                     chainId === 137 ? 'polygon' : 'eth';
        return await freeCryptoApis.moralis.getTokenBalances(address, chain);
      } catch (error) {
        console.error('Moralis token balance fetch failed:', error);
      }
    }
    
    // If all else fails, return empty array
    return [];
  }
  
  /**
   * Get NFTs for a wallet address
   */
  async getWalletNFTs(address: string, chainId: number = 1): Promise<NFTAsset[]> {
    this.checkInitialized();
    
    // Try Covalent first if available
    if (freeCryptoApis.covalent.getApiKey) {
      try {
        return await freeCryptoApis.covalent.getNFTs(chainId, address);
      } catch (error) {
        console.warn('Covalent NFT fetch failed, trying Moralis:', error);
      }
    }
    
    // Try Moralis as fallback
    if (freeCryptoApis.moralis.getApiKey) {
      try {
        const chain = chainId === 1 ? 'eth' : 
                     chainId === 56 ? 'bsc' : 
                     chainId === 137 ? 'polygon' : 'eth';
        return await freeCryptoApis.moralis.getNFTs(address, chain);
      } catch (error) {
        console.error('Moralis NFT fetch failed:', error);
      }
    }
    
    // If all else fails, return empty array
    return [];
  }
  
  /**
   * Get transactions for a wallet address
   */
  async getWalletTransactions(address: string, chainId: number = 1): Promise<TransactionData[]> {
    this.checkInitialized();
    
    // Try Etherscan first if available and on Ethereum
    if (chainId === 1 && freeCryptoApis.etherscan.getApiKey) {
      try {
        return await freeCryptoApis.etherscan.getTransactions(address);
      } catch (error) {
        console.warn('Etherscan transaction fetch failed, trying Moralis:', error);
      }
    }
    
    // Try Moralis as fallback
    if (freeCryptoApis.moralis.getApiKey) {
      try {
        const chain = chainId === 1 ? 'eth' : 
                     chainId === 56 ? 'bsc' : 
                     chainId === 137 ? 'polygon' : 'eth';
        return await freeCryptoApis.moralis.getTransactions(address, chain);
      } catch (error) {
        console.error('Moralis transaction fetch failed:', error);
      }
    }
    
    // If all else fails, return empty array
    return [];
  }
  
  /**
   * Get gas price (Ethereum only)
   */
  async getGasPrice() {
    this.checkInitialized();
    
    if (freeCryptoApis.etherscan.getApiKey) {
      try {
        return await freeCryptoApis.etherscan.getGasPrice();
      } catch (error) {
        console.error('Failed to fetch gas price:', error);
        throw error;
      }
    } else {
      throw new Error('Etherscan API key not set. Cannot fetch gas price.');
    }
  }

  /**
   * Get all DeFi protocols with their TVL and other metrics
   */
  async getAllDeFiProtocols(): Promise<Protocol[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getAllProtocols();
  }

  /**
   * Get TVL data for a specific protocol
   */
  async getProtocolTvl(protocol: string): Promise<ProtocolTvl[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getProtocolTvl(protocol);
  }

  /**
   * Get TVL data for all chains
   */
  async getChainsTvl(): Promise<ChainTvl[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getChainsTvl();
  }

  /**
   * Get global TVL data (historical)
   */
  async getGlobalTvl(): Promise<ProtocolTvl[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getGlobalTvl();
  }

  /**
   * Get yield pools data
   */
  async getYieldPools(limit: number = 100): Promise<YieldPool[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getYieldPools(limit);
  }

  /**
   * Get stablecoins data
   */
  async getStablecoins(): Promise<any[]> {
    this.checkInitialized();
    return freeCryptoApis.defiLlama.getStablecoins();
  }
  
  /**
   * Get NFT collections owned by a wallet
   */
  async getWalletNFTCollections(address: string, chain: string = 'eth'): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (moralisNftApi) {
        return await moralisNftApi.getWalletNFTCollections(address, chain);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch NFT collections:', error);
      return [];
    }
  }
  
  /**
   * Get NFT transfers for a wallet
   */
  async getNFTTransfers(address: string, chain: string = 'eth'): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (moralisNftApi) {
        return await moralisNftApi.getNFTTransfers(address, chain);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch NFT transfers:', error);
      return [];
    }
  }
  
  /**
   * Get NFT collection stats
   */
  async getNFTCollectionStats(address: string, chain: string = 'eth'): Promise<any> {
    this.checkInitialized();
    
    try {
      if (moralisNftApi) {
        return await moralisNftApi.getNFTCollectionStats(address, chain);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch NFT collection stats:', error);
      return null;
    }
  }
  
  /**
   * Get historical daily price data
   */
  async getHistoricalDailyPrices(coin: string, currency: string = 'USD', days: number = 30): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (cryptocompareApi) {
        return await cryptocompareApi.getHistoricalDailyData(coin, currency, days);
      }
      // Fallback to CoinGecko
      return await freeCryptoApis.coinGecko.getHistoricalMarketData(coin, currency, days);
    } catch (error) {
      console.error('Failed to fetch historical price data:', error);
      toast({
        title: 'Price Data Error',
        description: 'Unable to fetch historical price data',
        variant: 'destructive'
      });
      return [];
    }
  }
  
  /**
   * Get historical hourly price data
   */
  async getHistoricalHourlyPrices(coin: string, currency: string = 'USD', hours: number = 24): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (cryptocompareApi) {
        return await cryptocompareApi.getHistoricalHourlyData(coin, currency, hours);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch hourly price data:', error);
      return [];
    }
  }
  
  /**
   * Get trading signals for a cryptocurrency
   */
  async getTradingSignals(coin: string): Promise<any> {
    this.checkInitialized();
    
    try {
      if (cryptocompareApi) {
        return await cryptocompareApi.getTradingSignals(coin);
      }
      return null;
    } catch (error) {
      console.error('Failed to fetch trading signals:', error);
      return null;
    }
  }
  
  /**
   * Get latest cryptocurrency news
   */
  async getLatestNews(page: number = 1, items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (cryptoNewsApi) {
        return await cryptoNewsApi.getLatestNews(page, items);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch latest news:', error);
      return [];
    }
  }
  
  /**
   * Get news for specific cryptocurrencies
   */
  async getNewsByCoin(coins: string[], items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (cryptoNewsApi) {
        return await cryptoNewsApi.getNewsByCoin(coins, items);
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch coin news:', error);
      return [];
    }
  }
  
  /**
   * Search news by keywords
   */
  async searchNews(keywords: string, items: number = 10): Promise<any[]> {
    this.checkInitialized();
    
    try {
      if (cryptoNewsApi) {
        return await cryptoNewsApi.searchNews(keywords, items);
      }
      return [];
    } catch (error) {
      console.error('Failed to search news:', error);
      return [];
    }
  }
  
  /**
   * Get historical portfolio value
   */
  async getPortfolioHistory(address: string, chainId: number = 1, days: number = 30) {
    this.checkInitialized();
    
    if (freeCryptoApis.covalent.getApiKey) {
      try {
        return await freeCryptoApis.covalent.getHistoricalPortfolioValue(chainId, address, days);
      } catch (error) {
        console.error('Failed to fetch portfolio history:', error);
        throw error;
      }
    } else {
      throw new Error('Covalent API key not set. Cannot fetch portfolio history.');
    }
  }
}

// Create and export service instance
export const cryptoService = new CryptoServiceIntegration();