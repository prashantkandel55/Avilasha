/**
 * Moralis NFT API Integration
 * Provides access to NFT data across multiple blockchains
 * Documentation: https://docs.moralis.io/web3-data-api/evm/nft-api
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

// Types for Moralis NFT API responses
export interface NFTCollection {
  token_address: string;
  name: string;
  symbol: string;
  contract_type: string;
  total_supply?: string;
  owner?: string;
  floor_price?: number;
  image?: string;
  description?: string;
}

export interface NFTItem {
  token_address: string;
  token_id: string;
  amount: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri?: string;
  metadata?: string;
  normalized_metadata?: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{ trait_type: string; value: string }>;
  };
  owner_of: string;
  last_token_uri_sync?: string;
  last_metadata_sync?: string;
}

export interface NFTTransfer {
  block_number: string;
  block_timestamp: string;
  transaction_hash: string;
  transaction_index: string;
  log_index: string;
  value: string;
  contract_type: string;
  token_address: string;
  token_id: string;
  from_address: string;
  to_address: string;
  amount: string;
  verified: number;
  operator?: string;
}

export interface NFTMarketData {
  collection_name: string;
  collection_address: string;
  floor_price: number;
  volume_24h: number;
  volume_7d: number;
  average_price: number;
  market_cap: number;
  items_count: number;
  owners_count: number;
}

/**
 * Moralis NFT API Service
 * Provides methods to access NFT data across multiple blockchains
 */
class MoralisNftApi {
  private readonly BASE_URL = 'https://deep-index.moralis.io/api/v2';
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
   * Set the API key for Moralis API
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
   * Get NFTs owned by a wallet address
   */
  async getWalletNFTs(address: string, chain: string = 'eth', limit: number = 100): Promise<NFTItem[]> {
    if (!this.apiKey) {
      console.error('Moralis API key not set');
      toast({
        title: 'API Error',
        description: 'Moralis API key not configured',
        variant: 'destructive'
      });
      return [];
    }

    const cacheKey = `moralis_wallet_nfts_${address}_${chain}_${limit}`;
    const cached = this.cacheManager?.get<NFTItem[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/${address}/nft?chain=${chain}&format=json&limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.result)) {
        this.cacheManager?.set(cacheKey, data.result, 15 * 60 * 1000); // Cache for 15 minutes
        return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching wallet NFTs:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch NFT data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get a specific NFT by contract address and token ID
   */
  async getNFTByTokenId(address: string, tokenId: string, chain: string = 'eth'): Promise<NFTItem | null> {
    if (!this.apiKey) {
      console.error('Moralis API key not set');
      return null;
    }

    const cacheKey = `moralis_nft_${address}_${tokenId}_${chain}`;
    const cached = this.cacheManager?.get<NFTItem>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/nft/${address}/${tokenId}?chain=${chain}&format=json`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const data = await this.safeJson(response);
      
      if (data) {
        this.cacheManager?.set(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching NFT details:', error);
      return null;
    }
  }

  /**
   * Get NFT transfers for a specific wallet address
   */
  async getNFTTransfers(address: string, chain: string = 'eth', limit: number = 100): Promise<NFTTransfer[]> {
    if (!this.apiKey) {
      console.error('Moralis API key not set');
      return [];
    }

    const cacheKey = `moralis_nft_transfers_${address}_${chain}_${limit}`;
    const cached = this.cacheManager?.get<NFTTransfer[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/${address}/nft/transfers?chain=${chain}&format=json&limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.result)) {
        this.cacheManager?.set(cacheKey, data.result, 10 * 60 * 1000); // Cache for 10 minutes
        return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching NFT transfers:', error);
      return [];
    }
  }

  /**
   * Get NFT collections owned by a wallet address
   */
  async getWalletNFTCollections(address: string, chain: string = 'eth', limit: number = 100): Promise<NFTCollection[]> {
    if (!this.apiKey) {
      console.error('Moralis API key not set');
      return [];
    }

    const cacheKey = `moralis_wallet_nft_collections_${address}_${chain}_${limit}`;
    const cached = this.cacheManager?.get<NFTCollection[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/${address}/nft/collections?chain=${chain}&limit=${limit}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.result)) {
        this.cacheManager?.set(cacheKey, data.result, 30 * 60 * 1000); // Cache for 30 minutes
        return data.result;
      }
      return [];
    } catch (error) {
      console.error('Error fetching wallet NFT collections:', error);
      return [];
    }
  }

  /**
   * Get NFT market data for a collection
   */
  async getNFTCollectionStats(address: string, chain: string = 'eth'): Promise<NFTMarketData | null> {
    if (!this.apiKey) {
      console.error('Moralis API key not set');
      return null;
    }

    const cacheKey = `moralis_nft_collection_stats_${address}_${chain}`;
    const cached = this.cacheManager?.get<NFTMarketData>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/nft/${address}/stats?chain=${chain}`, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      const data = await this.safeJson(response);
      
      if (data) {
        this.cacheManager?.set(cacheKey, data, 60 * 60 * 1000); // Cache for 1 hour
        return data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching NFT collection stats:', error);
      return null;
    }
  }
}

export const moralisNftApi = new MoralisNftApi();