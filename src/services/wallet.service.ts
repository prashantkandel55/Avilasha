// --- New Imports for Multi-Chain Support ---
import { ethers } from 'ethers';
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalletStandardAdapterProvider } from '@mysten/wallet-standard';

// --- Existing Imports ---
import { COINGECKO_API_BASE, WALLET_CONFIG } from '../config/wallet.config';

interface WalletBalance {
  address: string;
  network: string; // 'ethereum' | 'solana' | 'sui' | ...
  tokens: TokenBalance[];
  totalValueUSD: number;
  lastUpdated: number;
  name?: string; // Add name property to WalletBalance interface
  chain?: string; // For compatibility with other components
}

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  valueUSD: number;
  price: number;
  change24h: number;
}

class WalletService {
  private wallets: Map<string, WalletBalance> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.loadWalletsFromStorage();
    this.startUpdateCycle();
  }

  // Load wallets from localStorage
  private loadWalletsFromStorage(): void {
    try {
      const savedWallets = localStorage.getItem('avilasha_wallets');
      if (savedWallets) {
        const walletArray = JSON.parse(savedWallets);
        walletArray.forEach((wallet: WalletBalance) => {
          this.wallets.set(wallet.address, wallet);
        });
      }
    } catch (error) {
      console.error('Error loading wallets from storage:', error);
    }
  }

  // Save wallets to localStorage
  private saveWalletsToStorage(): void {
    try {
      const walletArray = Array.from(this.wallets.values());
      localStorage.setItem('avilasha_wallets', JSON.stringify(walletArray));
    } catch (error) {
      console.error('Error saving wallets to storage:', error);
    }
  }

  // --- Multi-Chain Wallet Connectors ---
  async connectEthereumWallet(): Promise<string | null> {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send('eth_requestAccounts', []);
        return accounts[0] || null;
      } catch (error) {
        console.error('Error connecting Ethereum wallet:', error);
        return null;
      }
    }
    return null;
  }

  async connectSolanaWallet(): Promise<string | null> {
    // Phantom Wallet
    try {
      // @ts-ignore
      const provider = window.solana;
      if (provider && provider.isPhantom) {
        const resp = await provider.connect();
        return resp.publicKey?.toString() || null;
      }
    } catch (error) {
      console.error('Error connecting Solana wallet:', error);
    }
    return null;
  }

  async connectSuiWallet(): Promise<string | null> {
    // Sui Wallet Standard
    try {
      // @ts-ignore
      const suiProvider = window.suiWallet;
      if (suiProvider) {
        const accounts = await suiProvider.requestAccounts();
        return accounts[0] || null;
      }
    } catch (error) {
      console.error('Error connecting Sui wallet:', error);
    }
    return null;
  }

  async addWallet(address: string, network: string): Promise<boolean> {
    try {
      if (!address) throw new Error('Address is required');
      if (this.wallets.size >= WALLET_CONFIG.maxWallets) {
        throw new Error('Maximum number of wallets reached');
      }
      if (!WALLET_CONFIG.supportedNetworks.includes(network)) {
        throw new Error('Unsupported network');
      }
      
      // Generate mock tokens for the wallet
      const mockTokens = this.generateMockTokens(network);
      const totalValueUSD = mockTokens.reduce((sum, token) => sum + token.valueUSD, 0);
      
      const initialBalance: WalletBalance = {
        address: address,
        network,
        tokens: mockTokens,
        totalValueUSD,
        lastUpdated: Date.now(),
        chain: network // For compatibility with other components
      };
      
      this.wallets.set(address, initialBalance);
      this.saveWalletsToStorage();
      
      return true;
    } catch (error) {
      console.error('Error adding wallet:', error);
      return false;
    }
  }

  async removeWallet(address: string): Promise<boolean> {
    const result = this.wallets.delete(address);
    if (result) {
      this.saveWalletsToStorage();
    }
    return result;
  }

  async getWalletBalance(address: string): Promise<WalletBalance | null> {
    return this.wallets.get(address) || null;
  }

  async getAllWallets(): Promise<WalletBalance[]> {
    return Array.from(this.wallets.values());
  }

  // Generate mock tokens for a wallet based on network
  private generateMockTokens(network: string): TokenBalance[] {
    const tokens: TokenBalance[] = [];
    
    // Add native token
    if (network === 'ethereum') {
      tokens.push({
        symbol: 'ETH',
        name: 'Ethereum',
        balance: (Math.random() * 10).toFixed(4),
        price: 3500 + (Math.random() * 200 - 100),
        valueUSD: 0, // Will calculate below
        change24h: (Math.random() * 10 - 5)
      });
    } else if (network === 'solana') {
      tokens.push({
        symbol: 'SOL',
        name: 'Solana',
        balance: (Math.random() * 100).toFixed(4),
        price: 150 + (Math.random() * 20 - 10),
        valueUSD: 0, // Will calculate below
        change24h: (Math.random() * 12 - 6)
      });
    } else if (network === 'sui') {
      tokens.push({
        symbol: 'SUI',
        name: 'Sui',
        balance: (Math.random() * 1000).toFixed(4),
        price: 1.5 + (Math.random() * 0.3 - 0.15),
        valueUSD: 0, // Will calculate below
        change24h: (Math.random() * 15 - 7.5)
      });
    } else {
      // Default token for other networks
      tokens.push({
        symbol: network.toUpperCase().substring(0, 3),
        name: network.charAt(0).toUpperCase() + network.slice(1),
        balance: (Math.random() * 50).toFixed(4),
        price: 10 + (Math.random() * 5 - 2.5),
        valueUSD: 0, // Will calculate below
        change24h: (Math.random() * 8 - 4)
      });
    }
    
    // Add some common tokens
    tokens.push({
      symbol: 'USDC',
      name: 'USD Coin',
      balance: (Math.random() * 5000).toFixed(2),
      price: 1,
      valueUSD: 0, // Will calculate below
      change24h: (Math.random() * 0.2 - 0.1)
    });
    
    tokens.push({
      symbol: 'USDT',
      name: 'Tether',
      balance: (Math.random() * 3000).toFixed(2),
      price: 1,
      valueUSD: 0, // Will calculate below
      change24h: (Math.random() * 0.2 - 0.1)
    });
    
    // Add a random token
    const randomTokens = [
      { symbol: 'LINK', name: 'Chainlink', price: 15 + (Math.random() * 3 - 1.5) },
      { symbol: 'UNI', name: 'Uniswap', price: 8 + (Math.random() * 2 - 1) },
      { symbol: 'AAVE', name: 'Aave', price: 90 + (Math.random() * 10 - 5) },
      { symbol: 'SNX', name: 'Synthetix', price: 3 + (Math.random() * 1 - 0.5) },
      { symbol: 'COMP', name: 'Compound', price: 60 + (Math.random() * 6 - 3) }
    ];
    
    const randomToken = randomTokens[Math.floor(Math.random() * randomTokens.length)];
    tokens.push({
      symbol: randomToken.symbol,
      name: randomToken.name,
      balance: (Math.random() * 100).toFixed(4),
      price: randomToken.price,
      valueUSD: 0, // Will calculate below
      change24h: (Math.random() * 20 - 10)
    });
    
    // Calculate valueUSD for all tokens
    tokens.forEach(token => {
      token.valueUSD = parseFloat(token.balance) * token.price;
    });
    
    return tokens;
  }

  // --- Multi-Chain Balance Fetching ---
  private async updateWalletBalance(address: string, networkOverride?: string): Promise<void> {
    try {
      const wallet = this.wallets.get(address);
      if (!wallet) return;
      
      const network = networkOverride || wallet.network;
      
      // Update token prices and values
      if (wallet.tokens && wallet.tokens.length > 0) {
        let totalValueUSD = 0;
        
        wallet.tokens.forEach(token => {
          // Add small random price fluctuation (±2%)
          const priceChange = token.price * (Math.random() * 0.04 - 0.02);
          token.price += priceChange;
          
          // Update value based on new price
          token.valueUSD = parseFloat(token.balance) * token.price;
          
          // Update 24h change (±3%)
          token.change24h += (Math.random() * 6 - 3);
          
          totalValueUSD += token.valueUSD;
        });
        
        // Update wallet with new values
        this.wallets.set(address, {
          ...wallet,
          tokens: [...wallet.tokens],
          totalValueUSD,
          lastUpdated: Date.now()
        });
        
        this.saveWalletsToStorage();
      } else {
        // If no tokens exist, generate mock tokens
        const mockTokens = this.generateMockTokens(network);
        const totalValueUSD = mockTokens.reduce((sum, token) => sum + token.valueUSD, 0);
        
        this.wallets.set(address, {
          ...wallet,
          tokens: mockTokens,
          totalValueUSD,
          lastUpdated: Date.now()
        });
        
        this.saveWalletsToStorage();
      }
    } catch (error) {
      console.error(`Error updating wallet ${address}:`, error);
    }
  }

  // --- Wallet Rename ---
  async renameWallet(address: string, newName: string): Promise<boolean> {
    try {
      const wallet = this.wallets.get(address);
      if (!wallet) throw new Error('Wallet not found');
      
      wallet.name = newName;
      this.wallets.set(address, wallet);
      this.saveWalletsToStorage();
      
      return true;
    } catch (error) {
      console.error('Error renaming wallet:', error);
      return false;
    }
  }

  private startUpdateCycle(): void {
    this.updateInterval = setInterval(() => {
      this.wallets.forEach((wallet) => this.updateWalletBalance(wallet.address, wallet.network));
    }, WALLET_CONFIG.refreshInterval);
  }

  public stopUpdateCycle(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

export const walletService = new WalletService();