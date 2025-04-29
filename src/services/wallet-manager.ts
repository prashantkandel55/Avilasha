/**
 * Wallet Management Service for Avilasha-2
 * Handles crypto wallet connections, transactions, and balances
 */

import { toast } from '@/hooks/use-toast';
import { securityService } from './security';

export interface WalletType {
  id: string;
  name: string;
  icon: string;
  description: string;
  connectionMethod: 'api' | 'seed' | 'privateKey' | 'view' | 'hardware';
  supportedChains: string[];
}

export interface Token {
  symbol: string;
  name: string;
  balance: number;
  decimals?: number;
  priceUSD?: number;
  valueUSD: number; // Add valueUSD property to match usages elsewhere
}

export interface WalletConnection {
  id: string;
  name: string;
  walletTypeId: string;
  address: string;
  chain: string;
  balance?: number;
  lastSynced?: number;
  isHardware: boolean;
  isReadOnly: boolean;
  isHidden?: boolean;
  notes?: string;
  tags?: string[];
  tokens: Token[];
}

export interface WalletTransaction {
  id: string;
  walletId: string;
  txHash: string;
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
  fee: number;
  status: 'pending' | 'completed' | 'failed';
  type: 'send' | 'receive' | 'swap' | 'stake' | 'unstake' | 'claim';
  notes?: string;
}

class WalletManager {
  private readonly WALLETS_STORAGE_KEY = 'avilasha_wallets';
  private readonly TRANSACTIONS_STORAGE_KEY = 'avilasha_tx_history';
  private readonly FIAT_CONVERSION_STORAGE_KEY = 'avilasha_fiat_conversion';
  
  private walletConnections: WalletConnection[] = [];
  private transactions: WalletTransaction[] = [];
  private refreshInterval: number | null = null;
  private selectedWalletId: string | null = null;
  private preferredFiat: string = 'USD';
  private fiatConversion: Record<string, number> = {
    'USD': 1,
    'EUR': 0.92,
    'GBP': 0.78,
    'JPY': 150.53,
    'CAD': 1.37,
    'AUD': 1.52,
    'INR': 83.5
  };

  // List of supported wallet types
  private readonly walletTypes: WalletType[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: 'metamask.svg',
      description: 'Connect to your MetaMask wallet',
      connectionMethod: 'api',
      supportedChains: ['ETH', 'BSC', 'POLYGON', 'ARBITRUM', 'OPTIMISM', 'AVALANCHE']
    },
    {
      id: 'ledger',
      name: 'Ledger',
      icon: 'ledger.svg',
      description: 'Connect to your Ledger hardware wallet',
      connectionMethod: 'hardware',
      supportedChains: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'XRP']
    },
    {
      id: 'trezor',
      name: 'Trezor',
      icon: 'trezor.svg',
      description: 'Connect to your Trezor hardware wallet',
      connectionMethod: 'hardware',
      supportedChains: ['BTC', 'ETH', 'LTC', 'DASH', 'ZEC']
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: 'walletconnect.svg',
      description: 'Connect any WalletConnect compatible wallet',
      connectionMethod: 'api',
      supportedChains: ['ETH', 'BSC', 'POLYGON', 'AVALANCHE', 'COSMOS']
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: 'phantom.svg',
      description: 'Connect to your Phantom wallet',
      connectionMethod: 'api',
      supportedChains: ['SOL']
    },
    {
      id: 'trustwallet',
      name: 'Trust Wallet',
      icon: 'trustwallet.svg',
      description: 'Connect to your Trust Wallet',
      connectionMethod: 'api',
      supportedChains: ['ETH', 'BSC', 'TRON', 'POLYGON']
    },
    {
      id: 'viewonly',
      name: 'View Only Wallet',
      icon: 'viewonly.svg',
      description: 'Add a wallet for viewing purposes only (public address)',
      connectionMethod: 'view',
      supportedChains: ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'XRP', 'LTC', 'DOGE', 'BNB', 'AVAX']
    }
  ];

  constructor() {
    this.loadFromStorage();
    this.setupAutoRefresh();
  }

  /**
   * Load wallet data from storage
   */
  private async loadFromStorage(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Load encrypted wallet connections
        const encryptedWallets = localStorage.getItem(this.WALLETS_STORAGE_KEY);
        if (encryptedWallets) {
          const decrypted = await securityService.decrypt(encryptedWallets);
          if (decrypted) {
            this.walletConnections = JSON.parse(decrypted);
          }
        }

        // Load transaction history
        const encryptedTx = localStorage.getItem(this.TRANSACTIONS_STORAGE_KEY);
        if (encryptedTx) {
          const decrypted = await securityService.decrypt(encryptedTx);
          if (decrypted) {
            this.transactions = JSON.parse(decrypted);
          }
        }

        // Load fiat conversion preferences
        const fiatPref = localStorage.getItem(this.FIAT_CONVERSION_STORAGE_KEY);
        if (fiatPref) {
          const data = JSON.parse(fiatPref);
          this.preferredFiat = data.preferred || 'USD';
          if (data.rates) {
            this.fiatConversion = data.rates;
          }
        }
      } catch (error) {
        console.error('Failed to load wallet data:', error);
        this.walletConnections = [];
        this.transactions = [];
      }
    }
  }

  /**
   * Save wallet data to secure storage
   */
  private async saveToStorage(): Promise<void> {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Encrypt and save wallet connections
        const walletsJson = JSON.stringify(this.walletConnections);
        const encryptedWallets = await securityService.encrypt(walletsJson);
        localStorage.setItem(this.WALLETS_STORAGE_KEY, encryptedWallets);

        // Encrypt and save transaction history
        const txJson = JSON.stringify(this.transactions);
        const encryptedTx = await securityService.encrypt(txJson);
        localStorage.setItem(this.TRANSACTIONS_STORAGE_KEY, encryptedTx);

        // Save fiat conversion preferences
        localStorage.setItem(this.FIAT_CONVERSION_STORAGE_KEY, JSON.stringify({
          preferred: this.preferredFiat,
          rates: this.fiatConversion
        }));
      } catch (error) {
        console.error('Failed to save wallet data:', error);
        toast({
          title: 'Storage Error',
          description: 'Failed to save wallet data securely',
          variant: 'destructive'
        });
      }
    }
  }

  /**
   * Setup automatic refresh of wallet balances
   */
  private setupAutoRefresh(): void {
    // Clear any existing refresh interval
    if (this.refreshInterval) {
      window.clearInterval(this.refreshInterval);
    }

    // Auto-refresh wallet balances every 2 minutes
    this.refreshInterval = window.setInterval(() => {
      this.refreshAllWalletBalances();
    }, 2 * 60 * 1000) as unknown as number;
  }

  /**
   * Get available wallet connection types
   */
  getWalletTypes(): WalletType[] {
    return [...this.walletTypes];
  }

  /**
   * Get all wallet connections
   */
  getWallets(includeHidden: boolean = false): WalletConnection[] {
    if (includeHidden) {
      return [...this.walletConnections];
    }
    return this.walletConnections.filter(wallet => !wallet.isHidden);
  }

  /**
   * Get a specific wallet by ID
   */
  getWalletById(id: string): WalletConnection | null {
    return this.walletConnections.find(wallet => wallet.id === id) || null;
  }

  /**
   * Add a new wallet connection
   */
  async addWallet(wallet: Omit<WalletConnection, 'id'>): Promise<WalletConnection> {
    // Generate a unique ID for the wallet
    const id = crypto.randomUUID ? crypto.randomUUID() : `wallet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newWallet: WalletConnection = {
      id,
      ...wallet,
      lastSynced: Date.now()
    };
    
    this.walletConnections.push(newWallet);
    await this.saveToStorage();
    
    // Fetch initial balance
    this.refreshWalletBalance(id);
    
    return newWallet;
  }

  /**
   * Update an existing wallet
   */
  updateWallet(id: string, updates: Partial<WalletConnection>): boolean {
    const walletIndex = this.walletConnections.findIndex(w => w.id === id);
    if (walletIndex === -1) return false;
    
    this.walletConnections[walletIndex] = {
      ...this.walletConnections[walletIndex],
      ...updates
    };
    
    this.saveToStorage();
    return true;
  }

  /**
   * Remove a wallet connection
   */
  removeWallet(id: string): boolean {
    const initialCount = this.walletConnections.length;
    this.walletConnections = this.walletConnections.filter(wallet => wallet.id !== id);
    
    if (this.walletConnections.length < initialCount) {
      // If the removed wallet was selected, clear selection
      if (this.selectedWalletId === id) {
        this.selectedWalletId = null;
      }
      
      this.saveToStorage();
      return true;
    }
    
    return false;
  }

  /**
   * Refresh balance for a specific wallet
   */
  async refreshWalletBalance(walletId: string): Promise<boolean> {
    const wallet = this.getWalletById(walletId);
    if (!wallet) return false;
    
    try {
      // In a real app, this would make API calls to blockchain explorers or wallet providers
      // For our mock implementation, we'll generate realistic balances
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const balance = this.getMockBalance(wallet.chain, wallet.address);
      
      this.updateWallet(walletId, {
        balance,
        lastSynced: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error(`Failed to refresh balance for wallet ${walletId}:`, error);
      return false;
    }
  }

  /**
   * Refresh balances for all wallets
   */
  async refreshAllWalletBalances(): Promise<void> {
    const refreshPromises = this.walletConnections.map(wallet => 
      this.refreshWalletBalance(wallet.id)
    );
    
    await Promise.allSettled(refreshPromises);
  }

  /**
   * Get total balance across all wallets in preferred fiat currency
   */
  getTotalBalance(fiatCurrency: string = this.preferredFiat): number {
    let totalBalance = 0;
    
    for (const wallet of this.walletConnections) {
      if (wallet.balance) {
        totalBalance += wallet.balance;
      }
    }
    
    // Convert to selected fiat if needed
    if (fiatCurrency !== 'USD') {
      const conversionRate = this.fiatConversion[fiatCurrency] || 1;
      totalBalance *= conversionRate;
    }
    
    return totalBalance;
  }

  /**
   * Get breakdown of balances by chain
   */
  getBalanceByChain(): Record<string, number> {
    const chainBalances: Record<string, number> = {};
    
    for (const wallet of this.walletConnections) {
      if (wallet.balance) {
        if (chainBalances[wallet.chain]) {
          chainBalances[wallet.chain] += wallet.balance;
        } else {
          chainBalances[wallet.chain] = wallet.balance;
        }
      }
    }
    
    return chainBalances;
  }

  /**
   * Get transaction history for all wallets or a specific wallet
   */
  getTransactionHistory(walletId?: string, limit?: number): WalletTransaction[] {
    let txList = [...this.transactions];
    
    if (walletId) {
      txList = txList.filter(tx => tx.walletId === walletId);
    }
    
    // Sort by timestamp, newest first
    txList.sort((a, b) => b.timestamp - a.timestamp);
    
    // Apply limit if specified
    if (limit && limit > 0) {
      txList = txList.slice(0, limit);
    }
    
    return txList;
  }

  /**
   * Add a new transaction to history
   */
  addTransaction(transaction: Omit<WalletTransaction, 'id'>): WalletTransaction {
    const id = crypto.randomUUID ? crypto.randomUUID() : `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    const newTx: WalletTransaction = {
      id,
      ...transaction
    };
    
    this.transactions.push(newTx);
    this.saveToStorage();
    
    // Refresh wallet balance after transaction
    this.refreshWalletBalance(transaction.walletId);
    
    return newTx;
  }

  /**
   * Update transaction status
   */
  updateTransactionStatus(txId: string, status: 'pending' | 'completed' | 'failed', notes?: string): boolean {
    const txIndex = this.transactions.findIndex(tx => tx.id === txId);
    if (txIndex === -1) return false;
    
    this.transactions[txIndex] = {
      ...this.transactions[txIndex],
      status,
      ...(notes ? { notes } : {})
    };
    
    this.saveToStorage();
    return true;
  }

  /**
   * Set preferred fiat currency for display
   */
  setPreferredFiat(currency: string): void {
    if (this.fiatConversion[currency]) {
      this.preferredFiat = currency;
      this.saveToStorage();
    }
  }

  /**
   * Get preferred fiat currency
   */
  getPreferredFiat(): string {
    return this.preferredFiat;
  }

  /**
   * Update fiat conversion rates
   * In a real app, this would fetch from a currency API
   */
  async updateFiatRates(): Promise<boolean> {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock fluctuations in rates
      const baseFiatRates: Record<string, number> = {
        'USD': 1,
        'EUR': 0.92,
        'GBP': 0.78,
        'JPY': 150.53,
        'CAD': 1.37,
        'AUD': 1.52,
        'INR': 83.5
      };
      
      // Add small random fluctuations
      for (const currency in baseFiatRates) {
        if (currency === 'USD') continue; // Keep USD as base
        
        const baseRate = baseFiatRates[currency];
        const fluctuation = (Math.random() * 0.04) - 0.02; // -2% to +2%
        this.fiatConversion[currency] = baseRate * (1 + fluctuation);
      }
      
      this.saveToStorage();
      return true;
    } catch (error) {
      console.error('Failed to update fiat rates:', error);
      return false;
    }
  }

  /**
   * Set currently selected wallet
   */
  setSelectedWallet(walletId: string | null): void {
    if (walletId === null || this.walletConnections.some(w => w.id === walletId)) {
      this.selectedWalletId = walletId;
    }
  }

  /**
   * Get currently selected wallet
   */
  getSelectedWallet(): WalletConnection | null {
    if (!this.selectedWalletId) return null;
    return this.getWalletById(this.selectedWalletId);
  }

  /**
   * Connect to a hardware wallet
   * This is a mock implementation - in a real app would use wallet SDKs
   */
  async connectHardwareWallet(type: 'ledger' | 'trezor', chain: string): Promise<WalletConnection | null> {
    try {
      toast({
        title: 'Connecting to Hardware Wallet',
        description: `Please connect your ${type === 'ledger' ? 'Ledger' : 'Trezor'} device and follow the instructions`,
        variant: 'default'
      });
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Generate a mock address based on the wallet type and chain
      const mockAddress = this.generateMockAddress(chain);
      
      const newWallet = await this.addWallet({
        name: `${type === 'ledger' ? 'Ledger' : 'Trezor'} ${chain}`,
        walletTypeId: type,
        address: mockAddress,
        chain,
        isHardware: true,
        isReadOnly: false,
        tokens: [] // Provide empty array for required tokens property
      });
      
      toast({
        title: 'Wallet Connected',
        description: `Successfully connected to ${newWallet.name}`,
        variant: 'default'
      });
      
      return newWallet;
    } catch (error) {
      console.error('Failed to connect hardware wallet:', error);
      
      toast({
        title: 'Connection Failed',
        description: `Could not connect to ${type} device`,
        variant: 'destructive'
      });
      
      return null;
    }
  }

  /**
   * Generate mock wallet balance for demo purposes
   */
  private getMockBalance(chain: string, address: string): number {
    // Use address as seed for deterministic but realistic balances
    const seed = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = Math.sin(seed) * 10000;
    
    // Different chains have different typical balances
    switch (chain) {
      case 'BTC':
        return 0.05 + (random * 0.01); // 0.05-0.15 BTC
      case 'ETH':
        return 0.8 + (random * 0.2); // 0.8-2.8 ETH
      case 'SOL':
        return 15 + (random * 5); // 15-65 SOL
      case 'ADA':
        return 800 + (random * 200); // 800-2800 ADA
      case 'DOT':
        return 100 + (random * 50); // 100-550 DOT
      case 'AVAX':
        return 30 + (random * 10); // 30-130 AVAX
      case 'MATIC':
        return 500 + (random * 200); // 500-2500 MATIC
      default:
        return 100 + (random * 50); // Generic balance
    }
  }

  /**
   * Generate mock blockchain address for demo purposes
   */
  private generateMockAddress(chain: string): string {
    const randomHex = () => Math.floor(Math.random() * 16).toString(16);
    
    switch (chain) {
      case 'BTC':
        return 'bc1' + Array(40).fill(0).map(randomHex).join('');
      case 'ETH':
      case 'POLYGON':
      case 'BSC':
      case 'ARBITRUM':
      case 'OPTIMISM':
      case 'AVALANCHE':
        return '0x' + Array(40).fill(0).map(randomHex).join('');
      case 'SOL':
        return Array(44).fill(0).map(randomHex).join('');
      case 'ADA':
        return 'addr1' + Array(50).fill(0).map(randomHex).join('');
      case 'DOT':
        return '1' + Array(47).fill(0).map(randomHex).join('');
      case 'XRP':
        return 'r' + Array(33).fill(0).map(randomHex).join('');
      default:
        return '0x' + Array(40).fill(0).map(randomHex).join('');
    }
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

export const walletManager = new WalletManager();
