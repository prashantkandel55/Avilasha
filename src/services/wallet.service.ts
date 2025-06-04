// --- New Imports for Multi-Chain Support ---
import { ethers } from 'ethers';
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { WalletStandardAdapterProvider } from '@mysten/wallet-standard';

// --- Existing Imports ---
import { COINGECKO_API_BASE, WALLET_CONFIG } from '../config/wallet.config';
import { securityService } from './security';

interface WalletBalance {
  address: string;
  network: string; // 'ethereum' | 'solana' | 'sui' | ...
  tokens: TokenBalance[];
  totalValueUSD: number;
  lastUpdated: number;
  name?: string; // Add name property to WalletBalance interface
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
    this.startUpdateCycle();
  }

  // --- Multi-Chain Wallet Connectors ---
  async connectEthereumWallet(): Promise<string | null> {
    if (window.ethereum) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);
      return accounts[0] || null;
    }
    return null;
  }

  async connectSolanaWallet(): Promise<string | null> {
    // Phantom Wallet
    // @ts-ignore
    const provider = window.solana;
    if (provider && provider.isPhantom) {
      const resp = await provider.connect();
      return resp.publicKey?.toString() || null;
    }
    return null;
  }

  async connectSuiWallet(): Promise<string | null> {
    // Sui Wallet Standard
    // @ts-ignore
    const suiProvider = window.suiWallet;
    if (suiProvider) {
      const accounts = await suiProvider.requestAccounts();
      return accounts[0] || null;
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
      
      // Store the address directly without encryption for now
      // This is a temporary fix - in production, proper encryption should be used
      const initialBalance: WalletBalance = {
        address: address, // Store unencrypted for now
        network,
        tokens: [], // Initialize with empty array
        totalValueUSD: 0,
        lastUpdated: Date.now()
      };
      
      this.wallets.set(address, initialBalance);
      await this.updateWalletBalance(address, network);
      return true;
    } catch (error) {
      console.error('Error adding wallet:', error);
      return false;
    }
  }

  async removeWallet(address: string): Promise<boolean> {
    return this.wallets.delete(address);
  }

  async getWalletBalance(address: string): Promise<WalletBalance | null> {
    return this.wallets.get(address) || null;
  }

  async getAllWallets(): Promise<WalletBalance[]> {
    return Array.from(this.wallets.values());
  }

  // --- Multi-Chain Balance Fetching ---
  private async updateWalletBalance(address: string, networkOverride?: string): Promise<void> {
    try {
      const wallet = this.wallets.get(address);
      if (!wallet) return;
      
      const network = networkOverride || wallet.network;
      
      // Use the address directly without decryption
      const decryptedAddress = wallet.address;
      
      let tokens: TokenBalance[] = [];
      let totalValueUSD = 0;

      try {
        // Mock data for demo purposes
        const mockTokens = [
          {
            symbol: network === 'ethereum' ? 'ETH' : network === 'solana' ? 'SOL' : 'SUI',
            name: network === 'ethereum' ? 'Ethereum' : network === 'solana' ? 'Solana' : 'Sui',
            balance: '1.5',
            valueUSD: 3000,
            price: 2000,
            change24h: 2.5
          },
          {
            symbol: 'USDC',
            name: 'USD Coin',
            balance: '500',
            valueUSD: 500,
            price: 1,
            change24h: 0
          }
        ];
        
        tokens = mockTokens;
        totalValueUSD = tokens.reduce((sum, token) => sum + token.valueUSD, 0);
      } catch (error) {
        console.error(`Error fetching balance for ${network}:`, error);
        // Don't throw here - we want to update the wallet even if we couldn't fetch new data
      }

      this.wallets.set(address, {
        ...wallet,
        tokens,
        totalValueUSD,
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error(`Error updating wallet ${address}:`, error);
    }
  }

  // --- Wallet Rename ---
  async renameWallet(address: string, newName: string): Promise<boolean> {
    const wallet = this.wallets.get(address);
    if (!wallet) throw new Error('Wallet not found');
    wallet.name = newName;
    this.wallets.set(address, wallet);
    return true;
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