/**
 * Portfolio Analytics Service
 * Provides portfolio analysis, performance tracking, and insights for crypto assets
 */

export interface AssetHolding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  purchasePrice: number;
  purchaseDate: string;
  tags?: string[];
  notes?: string;
  walletId?: string;
}

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: number;
  assets: Array<{
    symbol: string;
    value: number;
    percentage: number;
  }>;
  changePercent24h: number;
  changeValue24h: number;
}

export interface PerformanceMetrics {
  totalValue: number;
  totalCost: number;
  profitLoss: number;
  profitLossPercent: number;
  bestPerformer: {
    symbol: string;
    name: string;
    percentChange: number;
  } | null;
  worstPerformer: {
    symbol: string;
    name: string;
    percentChange: number;
  } | null;
}

export interface AllocationRecommendation {
  type: 'rebalance' | 'diversify' | 'reduce_risk' | 'increase_yield';
  description: string;
  details: string;
  currentAllocation?: Record<string, number>;
  suggestedAllocation?: Record<string, number>;
}

class PortfolioAnalyticsService {
  private readonly HOLDINGS_STORAGE_KEY = 'avilasha_holdings';
  private readonly SNAPSHOTS_STORAGE_KEY = 'avilasha_portfolio_snapshots';
  private holdings: AssetHolding[] = [];
  private snapshots: PortfolioSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 365; // Store up to a year of daily snapshots
  private snapshotInterval: number | null = null;

  constructor() {
    this.loadFromStorage();
    
    // Setup auto-snapshot functionality
    if (typeof window !== 'undefined') {
      // Take a snapshot once a day
      this.setupDailySnapshot();
    }
  }

  /**
   * Load portfolio data from storage
   */
  private loadFromStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const holdingsJSON = localStorage.getItem(this.HOLDINGS_STORAGE_KEY);
        if (holdingsJSON) {
          this.holdings = JSON.parse(holdingsJSON);
        }
        
        const snapshotsJSON = localStorage.getItem(this.SNAPSHOTS_STORAGE_KEY);
        if (snapshotsJSON) {
          this.snapshots = JSON.parse(snapshotsJSON);
        }
      } catch (error) {
        console.error('Failed to load portfolio data:', error);
        this.holdings = [];
        this.snapshots = [];
      }
    }
  }

  /**
   * Save portfolio data to storage
   */
  private saveToStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.HOLDINGS_STORAGE_KEY, JSON.stringify(this.holdings));
        localStorage.setItem(this.SNAPSHOTS_STORAGE_KEY, JSON.stringify(this.snapshots));
      } catch (error) {
        console.error('Failed to save portfolio data:', error);
      }
    }
  }

  /**
   * Set up daily snapshot of portfolio
   */
  private setupDailySnapshot(): void {
    // Clear existing interval if any
    if (this.snapshotInterval) {
      window.clearInterval(this.snapshotInterval);
    }
    
    // Calculate time until next snapshot (midnight)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const timeUntilMidnight = tomorrow.getTime() - now.getTime();
    
    // First run at midnight
    setTimeout(() => {
      this.takePortfolioSnapshot();
      
      // Then every 24 hours
      this.snapshotInterval = window.setInterval(() => {
        this.takePortfolioSnapshot();
      }, 24 * 60 * 60 * 1000) as unknown as number;
      
    }, timeUntilMidnight);
    
    // Also take an initial snapshot if we don't have any recent ones
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const hasRecentSnapshot = this.snapshots.some(s => s.timestamp > oneDayAgo);
    
    if (!hasRecentSnapshot && this.holdings.length > 0) {
      this.takePortfolioSnapshot();
    }
  }

  /**
   * Get all asset holdings
   */
  getHoldings(): AssetHolding[] {
    return [...this.holdings];
  }

  /**
   * Add a new asset to the portfolio
   */
  addAsset(asset: Omit<AssetHolding, 'id'>): AssetHolding {
    const newAsset: AssetHolding = {
      id: crypto.randomUUID ? crypto.randomUUID() : `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      ...asset
    };
    
    this.holdings.push(newAsset);
    this.saveToStorage();
    
    return newAsset;
  }

  /**
   * Update an existing asset
   */
  updateAsset(id: string, updates: Partial<AssetHolding>): boolean {
    const assetIndex = this.holdings.findIndex(a => a.id === id);
    if (assetIndex === -1) return false;
    
    this.holdings[assetIndex] = {
      ...this.holdings[assetIndex],
      ...updates
    };
    
    this.saveToStorage();
    return true;
  }

  /**
   * Delete an asset from the portfolio
   */
  deleteAsset(id: string): boolean {
    const initialCount = this.holdings.length;
    this.holdings = this.holdings.filter(asset => asset.id !== id);
    
    if (this.holdings.length < initialCount) {
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Take a snapshot of the current portfolio
   */
  async takePortfolioSnapshot(): Promise<PortfolioSnapshot | null> {
    if (this.holdings.length === 0) return null;
    
    try {
      // Get current prices for all assets
      const symbols = [...new Set(this.holdings.map(h => h.symbol))];
      const prices = await this.getPrices(symbols);
      
      // Calculate total value and asset allocations
      let totalValue = 0;
      const assetValues: Array<{symbol: string, value: number}> = [];
      
      for (const holding of this.holdings) {
        const price = prices[holding.symbol] || 0;
        const value = holding.amount * price;
        totalValue += value;
        
        // Add or update this symbol's value
        const existingAsset = assetValues.find(a => a.symbol === holding.symbol);
        if (existingAsset) {
          existingAsset.value += value;
        } else {
          assetValues.push({ symbol: holding.symbol, value });
        }
      }
      
      // Calculate percentage for each asset
      const assetsWithPercentage = assetValues.map(asset => ({
        symbol: asset.symbol,
        value: asset.value,
        percentage: totalValue > 0 ? (asset.value / totalValue) * 100 : 0
      }));
      
      // Calculate 24h change by comparing to previous snapshot
      let changePercent24h = 0;
      let changeValue24h = 0;
      
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const previousSnapshot = [...this.snapshots]
        .filter(s => s.timestamp < oneDayAgo)
        .sort((a, b) => b.timestamp - a.timestamp)[0];
      
      if (previousSnapshot) {
        changeValue24h = totalValue - previousSnapshot.totalValue;
        changePercent24h = previousSnapshot.totalValue > 0 
          ? (changeValue24h / previousSnapshot.totalValue) * 100 
          : 0;
      }
      
      // Create the new snapshot
      const snapshot: PortfolioSnapshot = {
        timestamp: Date.now(),
        totalValue,
        assets: assetsWithPercentage,
        changePercent24h,
        changeValue24h
      };
      
      // Add to snapshots and maintain history limit
      this.snapshots.push(snapshot);
      if (this.snapshots.length > this.MAX_SNAPSHOTS) {
        this.snapshots = this.snapshots
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, this.MAX_SNAPSHOTS);
      }
      
      this.saveToStorage();
      return snapshot;
      
    } catch (error) {
      console.error('Failed to take portfolio snapshot:', error);
      return null;
    }
  }

  /**
   * Get portfolio snapshots for a date range
   */
  getSnapshots(startDate?: Date, endDate?: Date): PortfolioSnapshot[] {
    let snapshots = [...this.snapshots];
    
    // Filter by date range if provided
    if (startDate) {
      snapshots = snapshots.filter(s => s.timestamp >= startDate.getTime());
    }
    
    if (endDate) {
      snapshots = snapshots.filter(s => s.timestamp <= endDate.getTime());
    }
    
    return snapshots.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Calculate portfolio performance metrics
   */
  async calculatePerformanceMetrics(): Promise<PerformanceMetrics> {
    if (this.holdings.length === 0) {
      return {
        totalValue: 0,
        totalCost: 0,
        profitLoss: 0,
        profitLossPercent: 0,
        bestPerformer: null,
        worstPerformer: null
      };
    }
    
    try {
      const symbols = [...new Set(this.holdings.map(h => h.symbol))];
      const currentPrices = await this.getPrices(symbols);
      
      let totalValue = 0;
      let totalCost = 0;
      const assetPerformance: Array<{
        symbol: string;
        name: string;
        currentValue: number;
        costBasis: number;
        percentChange: number;
      }> = [];
      
      // Calculate performance for each holding
      for (const holding of this.holdings) {
        const currentPrice = currentPrices[holding.symbol] || 0;
        const currentValue = holding.amount * currentPrice;
        const costBasis = holding.amount * holding.purchasePrice;
        
        totalValue += currentValue;
        totalCost += costBasis;
        
        const percentChange = costBasis > 0 
          ? ((currentValue - costBasis) / costBasis) * 100 
          : 0;
        
        assetPerformance.push({
          symbol: holding.symbol,
          name: holding.name,
          currentValue,
          costBasis,
          percentChange
        });
      }
      
      // Find best and worst performers
      const sortedByPerformance = [...assetPerformance].sort(
        (a, b) => b.percentChange - a.percentChange
      );
      
      const bestPerformer = sortedByPerformance.length > 0 
        ? {
            symbol: sortedByPerformance[0].symbol,
            name: sortedByPerformance[0].name,
            percentChange: sortedByPerformance[0].percentChange
          } 
        : null;
      
      const worstPerformer = sortedByPerformance.length > 0 
        ? {
            symbol: sortedByPerformance[sortedByPerformance.length - 1].symbol,
            name: sortedByPerformance[sortedByPerformance.length - 1].name,
            percentChange: sortedByPerformance[sortedByPerformance.length - 1].percentChange
          } 
        : null;
      
      // Calculate overall performance
      const profitLoss = totalValue - totalCost;
      const profitLossPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;
      
      return {
        totalValue,
        totalCost,
        profitLoss,
        profitLossPercent,
        bestPerformer,
        worstPerformer
      };
      
    } catch (error) {
      console.error('Failed to calculate performance metrics:', error);
      return {
        totalValue: 0,
        totalCost: 0,
        profitLoss: 0,
        profitLossPercent: 0,
        bestPerformer: null,
        worstPerformer: null
      };
    }
  }

  /**
   * Get portfolio allocation recommendations based on current holdings
   */
  async getRecommendations(): Promise<AllocationRecommendation[]> {
    if (this.holdings.length === 0) return [];
    
    try {
      const symbols = [...new Set(this.holdings.map(h => h.symbol))];
      const currentPrices = await this.getPrices(symbols);
      
      // Calculate current allocation
      let totalValue = 0;
      const symbolValues: Record<string, number> = {};
      
      for (const holding of this.holdings) {
        const price = currentPrices[holding.symbol] || 0;
        const value = holding.amount * price;
        totalValue += value;
        
        if (symbolValues[holding.symbol]) {
          symbolValues[holding.symbol] += value;
        } else {
          symbolValues[holding.symbol] = value;
        }
      }
      
      const currentAllocation: Record<string, number> = {};
      for (const symbol in symbolValues) {
        currentAllocation[symbol] = totalValue > 0 
          ? (symbolValues[symbol] / totalValue) * 100 
          : 0;
      }
      
      const recommendations: AllocationRecommendation[] = [];
      
      // Check for over-concentration
      const highestAllocation = Math.max(...Object.values(currentAllocation));
      if (highestAllocation > 40) {
        const overConcentratedSymbols = Object.entries(currentAllocation)
          .filter(([_, percent]) => percent > 40)
          .map(([symbol]) => symbol);
        
        if (overConcentratedSymbols.length > 0) {
          const suggestedAllocation = {...currentAllocation};
          
          for (const symbol of overConcentratedSymbols) {
            const excess = suggestedAllocation[symbol] - 25; // Target 25%
            suggestedAllocation[symbol] = 25;
            
            // Distribute excess to other assets or suggest new assets
            const otherSymbols = Object.keys(suggestedAllocation)
              .filter(s => !overConcentratedSymbols.includes(s));
            
            if (otherSymbols.length > 0) {
              const distributeAmount = excess / otherSymbols.length;
              for (const other of otherSymbols) {
                suggestedAllocation[other] += distributeAmount;
              }
            } else {
              // Suggest adding ETH or BTC if not already in portfolio
              if (!suggestedAllocation['BTC']) {
                suggestedAllocation['BTC'] = excess / 2;
              }
              if (!suggestedAllocation['ETH']) {
                suggestedAllocation['ETH'] = excess / 2;
              }
            }
          }
          
          recommendations.push({
            type: 'rebalance',
            description: 'Your portfolio is too concentrated',
            details: `${overConcentratedSymbols.join(', ')} ${overConcentratedSymbols.length > 1 ? 'are' : 'is'} over 40% of your portfolio. Consider diversifying to reduce risk.`,
            currentAllocation,
            suggestedAllocation
          });
        }
      }
      
      // Check for diversification
      if (Object.keys(currentAllocation).length < 3 && totalValue > 1000) {
        recommendations.push({
          type: 'diversify',
          description: 'Your portfolio could benefit from more diversification',
          details: 'Consider adding more assets to your portfolio to spread risk. A balanced portfolio typically includes a mix of blue-chip cryptos, altcoins, and some DeFi tokens.',
          currentAllocation
        });
      }
      
      // Check for risk profile - if too many volatile assets
      const highRiskSymbols = this.getHighRiskSymbols(Object.keys(currentAllocation));
      if (highRiskSymbols.length >= Object.keys(currentAllocation).length / 2) {
        recommendations.push({
          type: 'reduce_risk',
          description: 'Your portfolio has a high risk profile',
          details: `${highRiskSymbols.join(', ')} are considered higher risk investments. Consider balancing with more stable assets like BTC, ETH, or stablecoins.`,
          currentAllocation
        });
      }
      
      return recommendations;
      
    } catch (error) {
      console.error('Failed to generate portfolio recommendations:', error);
      return [];
    }
  }

  /**
   * Identify high-risk symbols from a list
   * This is a simplified approach - in a real app would use volatility data
   */
  private getHighRiskSymbols(symbols: string[]): string[] {
    // Simple classification based on market cap/volatility
    // In a real app, this would use market data APIs
    const highRiskSymbols = [
      'SHIB', 'DOGE', 'SAFEMOON', 'BABYDOGE', 'ELON', 'FLOKI',
      'APE', 'MEME', 'PEPE', 'SFM'
    ];
    
    return symbols.filter(s => highRiskSymbols.includes(s));
  }

  /**
   * Get asset prices (mock implementation)
   * In a real app, this would use a crypto price API
   */
  private async getPrices(symbols: string[]): Promise<Record<string, number>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockPriceData: Record<string, number> = {};
    
    // Sample "current" prices for demo purposes
    const basePrices: Record<string, number> = {
      'BTC': 65000,
      'ETH': 3500,
      'SOL': 140,
      'ADA': 0.55,
      'DOT': 7.5,
      'AVAX': 35,
      'MATIC': 0.85,
      'LINK': 18,
      'UNI': 11,
      'DOGE': 0.12,
      'XRP': 0.50,
      'BNB': 580,
      'SHIB': 0.000028,
      'LTC': 80,
      'DOT': 7.2
    };
    
    // Add random fluctuation to base prices
    for (const symbol of symbols) {
      const basePrice = basePrices[symbol] || 100;
      // Add -2% to +2% random fluctuation
      const fluctuation = (Math.random() * 4 - 2) / 100;
      mockPriceData[symbol] = basePrice * (1 + fluctuation);
    }
    
    return mockPriceData;
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.snapshotInterval) {
      window.clearInterval(this.snapshotInterval);
      this.snapshotInterval = null;
    }
  }
}

export const portfolioAnalyticsService = new PortfolioAnalyticsService();
