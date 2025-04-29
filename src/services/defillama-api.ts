/**
 * DeFiLlama API Integration
 * Provides access to DeFi protocol data, TVL metrics, and yield information
 * Documentation: https://defillama.com/docs/api
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

// Types for DeFiLlama API responses
export interface Protocol {
  id: string;
  name: string;
  address?: string;
  symbol?: string;
  url?: string;
  description?: string;
  chain: string;
  logo?: string;
  tvl: number;
  change_1h?: number;
  change_1d?: number;
  change_7d?: number;
  staking?: number;
  fdv?: number;
  mcap?: number;
}

export interface ProtocolTvl {
  date: number;
  tvl: number;
}

export interface ChainTvl {
  name: string;
  tvl: number;
  tokenSymbol?: string;
  cmcId?: number;
  geckoId?: string;
  change_1d?: number;
  change_7d?: number;
}

export interface YieldPool {
  pool: string;
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apyBase?: number;
  apyReward?: number;
  apy: number;
  rewardTokens?: string[];
  underlyingTokens?: string[];
}

/**
 * DeFiLlama API Service
 * Provides methods to access DeFi protocol data, TVL metrics, and yield information
 */
class DeFiLlamaApi {
  private readonly BASE_URL = 'https://api.llama.fi';
  private readonly YIELD_BASE_URL = 'https://yields.llama.fi';
  private readonly STABLECOINS_BASE_URL = 'https://stablecoins.llama.fi';
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
   * Get all DeFi protocols with their TVL and other metrics
   */
  async getAllProtocols(): Promise<Protocol[]> {
    const cacheKey = 'defillama_all_protocols';
    const cached = this.cacheManager?.get<Protocol[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/protocols`);
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.protocols)) {
        this.cacheManager?.set(cacheKey, data.protocols, 30 * 60 * 1000); // Cache for 30 minutes
        return data.protocols;
      }
      return [];
    } catch (error) {
      console.error('Error fetching DeFiLlama protocols:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch DeFi protocols data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get TVL data for a specific protocol
   */
  async getProtocolTvl(protocol: string): Promise<ProtocolTvl[]> {
    const cacheKey = `defillama_protocol_tvl_${protocol}`;
    const cached = this.cacheManager?.get<ProtocolTvl[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/protocol/${protocol}`);
      const data = await this.safeJson(response);
      
      if (data && data.tvl) {
        this.cacheManager?.set(cacheKey, data.tvl, 60 * 60 * 1000); // Cache for 1 hour
        return data.tvl;
      }
      return [];
    } catch (error) {
      console.error(`Error fetching TVL for protocol ${protocol}:`, error);
      toast({
        title: 'API Error',
        description: `Failed to fetch TVL data for ${protocol}`,
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get TVL data for all chains
   */
  async getChainsTvl(): Promise<ChainTvl[]> {
    const cacheKey = 'defillama_chains_tvl';
    const cached = this.cacheManager?.get<ChainTvl[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/chains`);
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data)) {
        this.cacheManager?.set(cacheKey, data, 30 * 60 * 1000); // Cache for 30 minutes
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching chains TVL:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch chains TVL data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get global TVL data (historical)
   */
  async getGlobalTvl(): Promise<ProtocolTvl[]> {
    const cacheKey = 'defillama_global_tvl';
    const cached = this.cacheManager?.get<ProtocolTvl[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/charts`);
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data)) {
        this.cacheManager?.set(cacheKey, data, 60 * 60 * 1000); // Cache for 1 hour
        return data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching global TVL:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch global TVL data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get yield pools data
   */
  async getYieldPools(limit: number = 100): Promise<YieldPool[]> {
    const cacheKey = `defillama_yield_pools_${limit}`;
    const cached = this.cacheManager?.get<YieldPool[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.YIELD_BASE_URL}/pools?limit=${limit}`);
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.data)) {
        this.cacheManager?.set(cacheKey, data.data, 30 * 60 * 1000); // Cache for 30 minutes
        return data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching yield pools:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch yield pools data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get stablecoins data
   */
  async getStablecoins(): Promise<any[]> {
    const cacheKey = 'defillama_stablecoins';
    const cached = this.cacheManager?.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.STABLECOINS_BASE_URL}/stablecoins`);
      const data = await this.safeJson(response);
      
      if (data && Array.isArray(data.peggedAssets)) {
        this.cacheManager?.set(cacheKey, data.peggedAssets, 60 * 60 * 1000); // Cache for 1 hour
        return data.peggedAssets;
      }
      return [];
    } catch (error) {
      console.error('Error fetching stablecoins data:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch stablecoins data',
        variant: 'destructive'
      });
      return [];
    }
  }
}

export const defiLlamaApi = new DeFiLlamaApi();