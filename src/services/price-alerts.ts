/**
 * Price Alert Service for monitoring cryptocurrency prices and triggering notifications
 */

import { toast } from '@/hooks/use-toast';

export interface PriceAlert {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  type: 'above' | 'below';
  price: number;
  createdAt: number;
  triggered: boolean;
  dismissedAt?: number;
}

export interface AlertServiceState {
  alerts: PriceAlert[];
  monitoring: boolean;
  lastCheckTime: number;
}

class PriceAlertService {
  private readonly ALERTS_STORAGE_KEY = 'avilasha_price_alerts';
  private checkInterval: number | null = null;
  private readonly CHECK_INTERVAL_MS = 60 * 1000; // Check every minute
  private state: AlertServiceState = {
    alerts: [],
    monitoring: false,
    lastCheckTime: 0
  };

  constructor() {
    this.loadAlerts();
  }

  /**
   * Load saved alerts from storage
   */
  private loadAlerts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedAlerts = localStorage.getItem(this.ALERTS_STORAGE_KEY);
        if (storedAlerts) {
          const data = JSON.parse(storedAlerts) as AlertServiceState;
          this.state = {
            ...data,
            // Always start with monitoring off when app restarts
            monitoring: false
          };
        }
      } catch (error) {
        console.error('Failed to load saved alerts:', error);
        this.state.alerts = [];
      }
    }
  }

  /**
   * Save alerts to persistent storage
   */
  private saveAlerts(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(this.state));
      } catch (error) {
        console.error('Failed to save alerts:', error);
      }
    }
  }

  /**
   * Get all price alerts
   */
  getAlerts(): PriceAlert[] {
    return [...this.state.alerts];
  }

  /**
   * Get alerts for a specific asset
   */
  getAlertsForAsset(assetId: string): PriceAlert[] {
    return this.state.alerts.filter(alert => alert.assetId === assetId);
  }

  /**
   * Add a new price alert
   */
  addAlert(alert: Omit<PriceAlert, 'id' | 'createdAt' | 'triggered'>): PriceAlert {
    const newAlert: PriceAlert = {
      id: crypto.randomUUID ? crypto.randomUUID() : `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
      triggered: false,
      ...alert
    };
    
    this.state.alerts.push(newAlert);
    this.saveAlerts();
    
    toast({
      title: 'Price Alert Created',
      description: `We'll notify you when ${alert.symbol} goes ${alert.type} $${alert.price.toLocaleString()}`,
      variant: 'default'
    });
    
    // Start monitoring if not already running
    this.startMonitoring();
    
    return newAlert;
  }

  /**
   * Remove a price alert
   */
  removeAlert(alertId: string): boolean {
    const initialCount = this.state.alerts.length;
    this.state.alerts = this.state.alerts.filter(alert => alert.id !== alertId);
    
    if (this.state.alerts.length < initialCount) {
      this.saveAlerts();
      
      // If no alerts left, stop monitoring
      if (this.state.alerts.length === 0) {
        this.stopMonitoring();
      }
      
      return true;
    }
    
    return false;
  }

  /**
   * Mark an alert as triggered and optionally dismissed
   */
  markAlertTriggered(alertId: string, dismissed: boolean = false): void {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.triggered = true;
      if (dismissed) {
        alert.dismissedAt = Date.now();
      }
      this.saveAlerts();
    }
  }

  /**
   * Start monitoring price alerts
   */
  startMonitoring(): void {
    if (this.state.monitoring || this.checkInterval) {
      return; // Already monitoring
    }
    
    if (this.state.alerts.length === 0) {
      return; // No alerts to monitor
    }
    
    this.state.monitoring = true;
    this.saveAlerts();
    
    // Set up interval for regular price checks
    this.checkInterval = window.setInterval(() => {
      this.checkAlerts();
    }, this.CHECK_INTERVAL_MS) as unknown as number;
    
    // Do an immediate check
    this.checkAlerts();
    
    console.log('Price alert monitoring started');
  }

  /**
   * Stop monitoring price alerts
   */
  stopMonitoring(): void {
    if (this.checkInterval) {
      window.clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.state.monitoring = false;
    this.saveAlerts();
    
    console.log('Price alert monitoring stopped');
  }

  /**
   * Get the monitoring status
   */
  isMonitoring(): boolean {
    return this.state.monitoring;
  }

  /**
   * Check all active alerts against current prices
   */
  private async checkAlerts(): Promise<void> {
    if (this.state.alerts.length === 0) {
      this.stopMonitoring();
      return;
    }
    
    const untriggeredAlerts = this.state.alerts.filter(alert => !alert.triggered);
    if (untriggeredAlerts.length === 0) {
      return; // No untriggered alerts
    }
    
    this.state.lastCheckTime = Date.now();
    this.saveAlerts();
    
    try {
      // Group alerts by symbol to minimize API calls
      const symbolsToCheck = new Set(untriggeredAlerts.map(alert => alert.symbol));
      
      // TODO: In a real implementation, fetch the current prices using a crypto price API
      // For demonstration, we'll simulate random price updates
      const mockPrices = await this.getMockPrices([...symbolsToCheck]);
      
      // Check each alert against current prices
      let triggered = false;
      for (const alert of untriggeredAlerts) {
        const currentPrice = mockPrices[alert.symbol];
        if (!currentPrice) continue;
        
        const alertTriggered = 
          (alert.type === 'above' && currentPrice >= alert.price) ||
          (alert.type === 'below' && currentPrice <= alert.price);
        
        if (alertTriggered) {
          alert.triggered = true;
          triggered = true;
          
          // Show notification
          this.showAlertNotification(alert, currentPrice);
        }
      }
      
      if (triggered) {
        this.saveAlerts();
      }
      
    } catch (error) {
      console.error('Error checking price alerts:', error);
    }
  }

  /**
   * Show notification for triggered alert
   */
  private showAlertNotification(alert: PriceAlert, currentPrice: number): void {
    const price = currentPrice.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
    
    toast({
      title: `${alert.symbol} Price Alert`,
      description: `${alert.name} is now ${price}, ${alert.type === 'above' ? 'above' : 'below'} your target of $${alert.price}`,
      variant: 'default'
    });
    
    // Try to use the Notification API if available and permitted
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(`${alert.symbol} Price Alert`, {
          body: `${alert.name} is now ${price}, ${alert.type === 'above' ? 'above' : 'below'} your target of $${alert.price}`,
          icon: '/public/avilasha.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
    
    // Dispatch custom event that components can listen for
    window.dispatchEvent(new CustomEvent('price-alert-triggered', { 
      detail: { alert, currentPrice } 
    }));
  }

  /**
   * Mock function to simulate getting prices from an API
   * In a real app, this would connect to a cryptocurrency data API
   */
  private async getMockPrices(symbols: string[]): Promise<Record<string, number>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockPriceData: Record<string, number> = {};
    
    // Current "base" prices for demo purposes
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
      'DOGE': 0.12
    };
    
    // Add random fluctuation to base prices
    for (const symbol of symbols) {
      const basePrice = basePrices[symbol] || 100;
      // Add -3% to +3% random fluctuation
      const fluctuation = (Math.random() * 6 - 3) / 100;
      mockPriceData[symbol] = basePrice * (1 + fluctuation);
    }
    
    return mockPriceData;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.stopMonitoring();
  }
}

export const priceAlertService = new PriceAlertService();
