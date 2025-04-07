import { COINGECKO_API_BASE, WALLET_CONFIG } from '../config/wallet.config';
import { encrypt, decrypt } from './security';

interface WalletBalance {
  address: string;
  network: string;
  tokens: TokenBalance[];
  totalValueUSD: number;
  lastUpdated: number;
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

  async addWallet(address: string, network: string): Promise<boolean> {
    try {
      if (this.wallets.size >= WALLET_CONFIG.maxWallets) {
        throw new Error('Maximum number of wallets reached');
      }

      if (!WALLET_CONFIG.supportedNetworks.includes(network)) {
        throw new Error('Unsupported network');
      }

      const encryptedAddress = await encrypt(address);
      const initialBalance: WalletBalance = {
        address: encryptedAddress,
        network,
        tokens: [],
        totalValueUSD: 0,
        lastUpdated: Date.now()
      };

      this.wallets.set(address, initialBalance);
      await this.updateWalletBalance(address);
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

  private async updateWalletBalance(address: string): Promise<void> {
    try {
      const wallet = this.wallets.get(address);
      if (!wallet) return;

      const decryptedAddress = await decrypt(wallet.address);
      const response = await fetch(`${COINGECKO_API_BASE}/simple/token_price/${wallet.network}?contract_addresses=${decryptedAddress}&vs_currencies=usd&include_24h_change=true`);
      const data = await response.json();

      // Process and update token balances
      const tokens: TokenBalance[] = Object.entries(data).map(([tokenAddress, priceData]: [string, any]) => ({
        symbol: priceData.symbol || '',
        name: priceData.name || '',
        balance: '0', // To be updated with actual balance
        valueUSD: priceData.usd || 0,
        price: priceData.usd || 0,
        change24h: priceData.usd_24h_change || 0
      }));

      const totalValueUSD = tokens.reduce((sum, token) => sum + token.valueUSD, 0);

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

  private startUpdateCycle(): void {
    this.updateInterval = setInterval(() => {
      this.wallets.forEach((_, address) => this.updateWalletBalance(address));
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