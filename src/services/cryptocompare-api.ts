/**
 * CryptoCompare API Integration
 * Provides access to historical price data, OHLCV data, and trading signals
 * Documentation: https://min-api.cryptocompare.com/documentation
 */

import { toast } from '@/hooks/use-toast';
import { apiService } from './api-service';

// Types for CryptoCompare API responses
export interface HistoricalPrice {
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volumefrom: number;
  volumeto: number;
}

export interface PriceMultiple {
  [symbol: string]: {
    [currency: string]: number;
  };
}

export interface ExchangeRate {
  [currency: string]: number;
}

export interface TradingSignal {
  inOutVar: {
    sentiment: string;
    value: number;
  };
  largetxsVar: {
    sentiment: string;
    value: number;
  };
  addressesNetGrowth: {
    sentiment: string;
    value: number;
  };
  concentrationVar: {
    sentiment: string;
    value: number;
  };
  summary: {
    sentiment: string;
    score: number;
  };
}

/**
 * CryptoCompare API Service
 * Provides methods to access historical price data and trading signals
 */
class CryptoCompareApi {
  private readonly BASE_URL = 'https://min-api.cryptocompare.com/data';
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
   * Set the API key for CryptoCompare API
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get historical daily price data for a cryptocurrency
   */
  async getHistoricalDailyData(fsym: string, tsym: string = 'USD', limit: number = 30): Promise<HistoricalPrice[]> {
    const cacheKey = `cryptocompare_histoday_${fsym}_${tsym}_${limit}`;
    const cached = this.cacheManager?.get<HistoricalPrice[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const url = `${this.BASE_URL}/v2/histoday?fsym=${fsym}&tsym=${tsym}&limit=${limit}`;
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['authorization'] = `Apikey ${this.apiKey}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data && data.Response === 'Success' && Array.isArray(data.Data.Data)) {
        this.cacheManager?.set(cacheKey, data.Data.Data, 60 * 60 * 1000); // Cache for 1 hour
        return data.Data.Data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching historical daily data:', error);
      toast({
        title: 'API Error',
        description: 'Failed to fetch historical price data',
        variant: 'destructive'
      });
      return [];
    }
  }

  /**
   * Get historical hourly price data for a cryptocurrency
   */
  async getHistoricalHourlyData(fsym: string, tsym: string = 'USD', limit: number = 24): Promise<HistoricalPrice[]> {
    const cacheKey = `cryptocompare_histohour_${fsym}_${tsym}_${limit}`;
    const cached = this.cacheManager?.get<HistoricalPrice[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const url = `${this.BASE_URL}/v2/histohour?fsym=${fsym}&tsym=${tsym}&limit=${limit}`;
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['authorization'] = `Apikey ${this.apiKey}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data && data.Response === 'Success' && Array.isArray(data.Data.Data)) {
        this.cacheManager?.set(cacheKey, data.Data.Data, 30 * 60 * 1000); // Cache for 30 minutes
        return data.Data.Data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching historical hourly data:', error);
      return [];
    }
  }

  /**
   * Get historical minute price data for a cryptocurrency
   */
  async getHistoricalMinuteData(fsym: string, tsym: string = 'USD', limit: number = 60): Promise<HistoricalPrice[]> {
    const cacheKey = `cryptocompare_histominute_${fsym}_${tsym}_${limit}`;
    const cached = this.cacheManager?.get<HistoricalPrice[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const url = `${this.BASE_URL}/v2/histominute?fsym=${fsym}&tsym=${tsym}&limit=${limit}`;
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['authorization'] = `Apikey ${this.apiKey}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data && data.Response === 'Success' && Array.isArray(data.Data.Data)) {
        this.cacheManager?.set(cacheKey, data.Data.Data, 5 * 60 * 1000); // Cache for 5 minutes
        return data.Data.Data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching historical minute data:', error);
      return [];
    }
  }

  /**
   * Get current price for multiple cryptocurrencies in multiple currencies
   */
  async getMultipleSymbolsPrice(fsyms: string[], tsyms: string[] = ['USD']): Promise<PriceMultiple> {
    const fsymsStr = fsyms.join(',');
    const tsymsStr = tsyms.join(',');
    const cacheKey = `cryptocompare_multiprice_${fsymsStr}_${tsymsStr}`;
    const cached = this.cacheManager?.get<PriceMultiple>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const url = `${this.BASE_URL}/pricemulti?fsyms=${fsymsStr}&tsyms=${tsymsStr}`;
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['authorization'] = `Apikey ${this.apiKey}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data && typeof data === 'object') {
        this.cacheManager?.set(cacheKey, data, 5 * 60 * 1000); // Cache for 5 minutes
        return data;
      }
      return {};
    } catch (error) {
      console.error('Error fetching multiple prices:', error);
      return {};
    }
  }

  /**
   * Get trading signals for a cryptocurrency
   */
  async getTradingSignals(fsym: string): Promise<TradingSignal | null> {
    if (!this.apiKey) {
      console.error('CryptoCompare API key not set');
      return null;
    }

    const cacheKey = `cryptocompare_trading_signals_${fsym}`;
    const cached = this.cacheManager?.get<TradingSignal>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const response = await fetch(`${this.BASE_URL}/tradingsignals/intotheblock/latest?fsym=${fsym}`, {
        headers: {
          'Accept': 'application/json',
          'authorization': `Apikey ${this.apiKey}`
        }
      });
      
      const data = await response.json();
      
      if (data && data.Response === 'Success' && data.Data) {
        this.cacheManager?.set(cacheKey, data.Data, 60 * 60 * 1000); // Cache for 1 hour
        return data.Data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching trading signals:', error);
      return null;
    }
  }

  /**
   * Get top exchanges by volume for a cryptocurrency pair
   */
  async getTopExchanges(fsym: string, tsym: string = 'USD', limit: number = 10): Promise<any[]> {
    const cacheKey = `cryptocompare_top_exchanges_${fsym}_${tsym}_${limit}`;
    const cached = this.cacheManager?.get<any[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.rateLimiter?.acquire();
      const url = `${this.BASE_URL}/top/exchanges?fsym=${fsym}&tsym=${tsym}&limit=${limit}`;
      const headers: HeadersInit = {
        'Accept': 'application/json'
      };
      
      if (this.apiKey) {
        headers['authorization'] = `Apikey ${this.apiKey}`;
      }
      
      const response = await fetch(url, { headers });
      const data = await response.json();
      
      if (data && data.Response === 'Success' && Array.isArray(data.Data)) {
        this.cacheManager?.set(cacheKey, data.Data, 60 * 60 * 1000); // Cache for 1 hour
        return data.Data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching top exchanges:', error);
      return [];
    }
  }
}

export const cryptocompareApi = new CryptoCompareApi();