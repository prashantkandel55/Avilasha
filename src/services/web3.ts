import { ethers } from 'ethers';
import { securityService } from './security';
import { toast } from '@/hooks/use-toast';

export interface WalletInfo {
  address: string;
  balance: string;
  network: string;
  nickname?: string;
  provider: string;
  providerType: WalletProviderType;
}

export enum WalletProviderType {
  METAMASK = 'metamask',
  COINBASE = 'coinbase',
  WALLET_CONNECT = 'walletconnect',
  BRAVE = 'brave',
  OTHER = 'other',
  NONE = 'none'
}

export interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  image: string;
  last_updated: string;
}

export interface WalletError {
  code: string;
  message: string;
  stack?: string;
  data?: any;
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private connectedWallet: WalletInfo | null = null;
  private readonly WALLET_LOCAL_STORAGE_KEY = 'last_connected_wallet';
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // milliseconds
  private networkListeners: Array<() => void> = [];
  private accountListeners: Array<() => void> = [];

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for wallet events
   */
  private setupEventListeners(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Handle chain (network) changes
      const handleChainChanged = async (chainId: string) => {
        // Force page reload 
        this.provider = null;
        
        // Notify user of the change
        toast({
          title: 'Network Changed',
          description: `Switched to chain ID: ${parseInt(chainId, 16)}`,
          variant: 'default'
        });
        
        // Update wallet info
        if (this.connectedWallet) {
          try {
            const walletInfo = await this.getConnectedWalletInfo();
            this.connectedWallet = walletInfo;
            
            // Notify listeners
            this.networkListeners.forEach(listener => listener());
          } catch (error) {
            console.error('Failed to update wallet after chain change:', error);
          }
        }
      };
      
      // Handle account changes
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          this.provider = null;
          this.connectedWallet = null;
          localStorage.removeItem(this.WALLET_LOCAL_STORAGE_KEY);
          
          toast({
            title: 'Wallet Disconnected',
            description: 'Your wallet has been disconnected.',
            variant: 'default'
          });
        } else {
          // Account changed
          try {
            const walletInfo = await this.getConnectedWalletInfo();
            this.connectedWallet = walletInfo;
            
            toast({
              title: 'Account Changed',
              description: `Connected to: ${accounts[0].substring(0, 6)}...${accounts[0].substring(accounts[0].length - 4)}`,
              variant: 'default'
            });
          } catch (error) {
            console.error('Failed to update wallet after account change:', error);
          }
        }
        
        // Notify listeners
        this.accountListeners.forEach(listener => listener());
      };
      
      // Add event listeners
      window.ethereum.on('chainChanged', handleChainChanged);
      window.ethereum.on('accountsChanged', handleAccountsChanged);
    }
  }

  /**
   * Subscribe to network changes
   */
  onNetworkChange(callback: () => void): () => void {
    this.networkListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.networkListeners = this.networkListeners.filter(listener => listener !== callback);
    };
  }
  
  /**
   * Subscribe to account changes
   */
  onAccountChange(callback: () => void): () => void {
    this.accountListeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.accountListeners = this.accountListeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Check if any wallet provider is available
   */
  isWalletAvailable(): boolean {
    if (typeof window === 'undefined') return false;
    
    return !!(
      window.ethereum || 
      (window as any).web3 || 
      (window as any).coinbaseWalletExtension || 
      document.querySelector('iframe[id^="walletconnect-"]')
    );
  }

  /**
   * Detect available wallet providers
   */
  detectWalletProviders(): WalletProviderType[] {
    if (typeof window === 'undefined') return [WalletProviderType.NONE];
    
    const providers: WalletProviderType[] = [];
    
    // Check for MetaMask
    if (window.ethereum?.isMetaMask) {
      providers.push(WalletProviderType.METAMASK);
    }
    
    // Check for Coinbase Wallet
    if ((window as any).coinbaseWalletExtension || 
        (window.ethereum && window.ethereum.isCoinbaseWallet)) {
      providers.push(WalletProviderType.COINBASE);
    }
    
    // Check for Brave Wallet
    if (window.ethereum?.isBraveWallet || (window as any).brave) {
      providers.push(WalletProviderType.BRAVE);
    }
    
    // Check for WalletConnect
    if (document.querySelector('iframe[id^="walletconnect-"]') || 
        localStorage.getItem('walletconnect')) {
      providers.push(WalletProviderType.WALLET_CONNECT);
    }
    
    // If we have window.ethereum but couldn't identify the specific provider
    if (window.ethereum && providers.length === 0) {
      providers.push(WalletProviderType.OTHER);
    }
    
    // If no providers detected
    if (providers.length === 0) {
      providers.push(WalletProviderType.NONE);
    }
    
    return providers;
  }

  /**
   * Get installation instructions for a wallet provider
   */
  getWalletInstallationInstructions(provider: WalletProviderType): string {
    switch (provider) {
      case WalletProviderType.METAMASK:
        return 'To install MetaMask, visit https://metamask.io/download/ and add it to your browser.';
      case WalletProviderType.COINBASE:
        return 'To install Coinbase Wallet, visit https://www.coinbase.com/wallet and download the extension.';
      case WalletProviderType.BRAVE:
        return 'To use Brave Wallet, open Brave browser and enable the wallet from settings.';
      case WalletProviderType.WALLET_CONNECT:
        return 'WalletConnect doesn\'t require an installation. You can scan a QR code with your mobile wallet.';
      default:
        return 'Please install a Web3 compatible wallet like MetaMask or Coinbase Wallet to continue.';
    }
  }

  /**
   * Connect to a wallet with retry mechanism
   */
  async connectWallet(preferredProvider?: WalletProviderType): Promise<WalletInfo> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Check if any wallet is available
        if (!this.isWalletAvailable()) {
          const availableProviders = this.detectWalletProviders();
          if (availableProviders.includes(WalletProviderType.NONE)) {
            // Throw error with installation instructions
            const instructions = this.getWalletInstallationInstructions(
              preferredProvider || WalletProviderType.METAMASK
            );
            throw new Error(`No wallet provider detected. ${instructions}`);
          }
        }

        // Get ethereum provider
        const ethereumProvider = this.getEthereumProvider(preferredProvider);
        if (!ethereumProvider) {
          throw new Error(`No compatible wallet provider found. Please install a Web3 wallet.`);
        }

        // Create ethers provider
        this.provider = new ethers.BrowserProvider(ethereumProvider);
        
        // Request wallet permission/connection
        await ethereumProvider.request({ method: 'eth_requestAccounts' });
        
        // Get wallet info
        const walletInfo = await this.getConnectedWalletInfo();
        
        // Save wallet info
        this.connectedWallet = walletInfo;
        localStorage.setItem(this.WALLET_LOCAL_STORAGE_KEY, JSON.stringify({
          address: walletInfo.address,
          provider: walletInfo.provider,
          providerType: walletInfo.providerType,
          timestamp: Date.now()
        }));
        
        return walletInfo;
      } catch (error) {
        lastError = this.handleWalletError(error);
        
        // If user rejected the request, don't retry
        if (
          error.code === 4001 || // User rejected (MetaMask)
          error.code === -32603 || // Internal error (often user rejection)
          (error.message && error.message.includes('rejected'))
        ) {
          throw new Error('Connection rejected by user. Please try again and approve the connection request.');
        }
        
        // Wait before retrying
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
        }
      }
    }
    
    // If all attempts failed
    throw lastError || new Error('Failed to connect to wallet after multiple attempts');
  }

  /**
   * Get ethereum provider based on preferred type
   */
  private getEthereumProvider(preferredProvider?: WalletProviderType): any {
    if (typeof window === 'undefined') return null;
    
    // If no preference, use any available provider
    if (!preferredProvider) {
      return window.ethereum || (window as any).web3?.currentProvider;
    }
    
    switch (preferredProvider) {
      case WalletProviderType.METAMASK:
        // Check if MetaMask is available
        if (window.ethereum?.isMetaMask) {
          return window.ethereum;
        }
        break;
      
      case WalletProviderType.COINBASE:
        // Check for Coinbase Wallet
        if ((window as any).coinbaseWalletExtension) {
          return (window as any).coinbaseWalletExtension;
        }
        if (window.ethereum?.isCoinbaseWallet) {
          return window.ethereum;
        }
        break;
      
      case WalletProviderType.BRAVE:
        // Check for Brave Wallet
        if (window.ethereum?.isBraveWallet) {
          return window.ethereum;
        }
        break;
      
      // Add other wallet providers as needed
      
      default:
        // Fallback to any available provider
        return window.ethereum || (window as any).web3?.currentProvider;
    }
    
    return null;
  }

  /**
   * Get wallet information after connection
   */
  private async getConnectedWalletInfo(): Promise<WalletInfo> {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }
    
    try {
      const signer = await this.provider.getSigner();
      const address = await signer.getAddress();
      const balance = await this.provider.getBalance(address);
      const network = await this.provider.getNetwork();
      
      // Detect provider type
      let providerType = WalletProviderType.OTHER;
      let providerName = 'Unknown Wallet';
      
      if (window.ethereum?.isMetaMask) {
        providerType = WalletProviderType.METAMASK;
        providerName = 'MetaMask';
      } else if (window.ethereum?.isCoinbaseWallet) {
        providerType = WalletProviderType.COINBASE;
        providerName = 'Coinbase Wallet';
      } else if (window.ethereum?.isBraveWallet) {
        providerType = WalletProviderType.BRAVE;
        providerName = 'Brave Wallet';
      } else if (localStorage.getItem('walletconnect')) {
        providerType = WalletProviderType.WALLET_CONNECT;
        providerName = 'WalletConnect';
      }
      
      return {
        address,
        balance: ethers.formatEther(balance),
        network: network.name,
        provider: providerName,
        providerType
      };
    } catch (error) {
      throw new Error(`Failed to get wallet information: ${error.message}`);
    }
  }

  /**
   * Handle and format wallet errors
   */
  private handleWalletError(error: any): Error {
    console.error('Wallet error:', error);
    
    // Format the error message based on the error code
    let message = error.message || 'An unknown error occurred';
    
    switch (error.code) {
      case 4001:
        message = 'Connection request rejected. Please approve the connection request.';
        break;
      case -32002:
        message = 'Connection request already pending. Please check your wallet and approve the request.';
        break;
      case -32603:
        message = 'Connection process encountered an error. Please try again.';
        break;
      case -32601:
        message = 'The requested method is not supported by this wallet.';
        break;
    }
    
    // Display toast notification for user
    toast({
      title: 'Wallet Connection Error',
      description: message,
      variant: 'destructive'
    });
    
    return new Error(message);
  }

  /**
   * Try to reconnect to previously connected wallet
   */
  async tryReconnect(): Promise<WalletInfo | null> {
    try {
      // Check if there's a stored wallet
      const storedWallet = localStorage.getItem(this.WALLET_LOCAL_STORAGE_KEY);
      if (!storedWallet) return null;
      
      const walletData = JSON.parse(storedWallet);
      
      // Check if the stored data is too old (over 1 day)
      const ONE_DAY = 24 * 60 * 60 * 1000;
      if (Date.now() - walletData.timestamp > ONE_DAY) {
        localStorage.removeItem(this.WALLET_LOCAL_STORAGE_KEY);
        return null;
      }
      
      // Try to silently connect
      if (this.isWalletAvailable()) {
        // Create provider
        const ethereumProvider = this.getEthereumProvider(walletData.providerType);
        if (!ethereumProvider) return null;
        
        this.provider = new ethers.BrowserProvider(ethereumProvider);
        
        // Check if already authorized (this won't trigger a popup)
        const accounts = await ethereumProvider.request({ 
          method: 'eth_accounts' 
        });
        
        if (accounts && accounts.length > 0) {
          // Successfully reconnected
          const walletInfo = await this.getConnectedWalletInfo();
          this.connectedWallet = walletInfo;
          return walletInfo;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to reconnect wallet:', error);
      return null;
    }
  }

  /**
   * Disconnect the current wallet
   */
  async disconnectWallet(): Promise<void> {
    this.provider = null;
    this.connectedWallet = null;
    localStorage.removeItem(this.WALLET_LOCAL_STORAGE_KEY);
    
    // Note: Most providers don't actually support a disconnect method
    // We're just clearing our local state
    
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected from the application.',
      variant: 'default'
    });
    
    // Notify listeners
    this.accountListeners.forEach(listener => listener());
  }

  /**
   * Check if a wallet is connected
   */
  isConnected(): boolean {
    return this.provider !== null && this.connectedWallet !== null;
  }

  /**
   * Get the currently connected wallet
   */
  getWallet(): WalletInfo | null {
    return this.connectedWallet;
  }

  /**
   * Get top cryptocurrencies by market cap
   */
  async getTopCryptos(): Promise<CryptoPrice[]> {
    try {
      // Apply rate limiting
      if (!securityService.applyRateLimit('web3_getTopCryptos')) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      
      // Add cache-control headers to avoid rate limiting
      const headers = new Headers({
        'Accept': 'application/json',
        'Cache-Control': 'max-age=30' // Cache for 30 seconds
      });
      
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h&locale=en',
        { headers }
      );
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          toast({
            title: 'API Rate Limit Exceeded',
            description: 'Please try again later or reduce the frequency of requests.',
            variant: 'destructive'
          });
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        throw new Error(`Failed to fetch crypto prices: ${errorData.error || response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API error:', error);
      throw new Error(`Failed to get crypto prices: ${error.message}`);
    }
  }

  /**
   * Get wallet balance for a specific address
   */
  async getWalletBalance(address: string): Promise<string> {
    let retries = 0;
    
    while (retries < this.MAX_RETRIES) {
      try {
        if (!this.provider) {
          // If no provider is available and wallet is available, try to create a provider
          if (this.isWalletAvailable()) {
            const ethereumProvider = this.getEthereumProvider();
            if (ethereumProvider) {
              this.provider = new ethers.BrowserProvider(ethereumProvider);
            } else {
              throw new Error('No wallet provider available');
            }
          } else {
            throw new Error('No wallet provider available');
          }
        }
        
        const balance = await this.provider.getBalance(address);
        return ethers.formatEther(balance);
      } catch (error) {
        retries++;
        
        if (retries >= this.MAX_RETRIES) {
          throw new Error(`Failed to get wallet balance: ${error.message}`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
      }
    }
    
    throw new Error('Failed to get wallet balance after multiple attempts');
  }

  /**
   * Get network details
   */
  async getNetworkDetails(): Promise<ethers.Network | null> {
    try {
      if (!this.provider) {
        if (!this.isWalletAvailable()) {
          return null;
        }
        
        const ethereumProvider = this.getEthereumProvider();
        if (!ethereumProvider) {
          return null;
        }
        
        this.provider = new ethers.BrowserProvider(ethereumProvider);
      }
      
      return await this.provider.getNetwork();
    } catch (error) {
      console.error('Failed to get network details:', error);
      return null;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        if (!this.isWalletAvailable()) {
          throw new Error('No wallet provider available');
        }
        
        const ethereumProvider = this.getEthereumProvider();
        if (!ethereumProvider) {
          throw new Error('No wallet provider available');
        }
        
        this.provider = new ethers.BrowserProvider(ethereumProvider);
      }
      
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
    } catch (error) {
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }

  /**
   * Clean up when service is no longer needed
   */
  cleanup(): void {
    if (typeof window !== 'undefined' && window.ethereum) {
      // Remove event listeners
      window.ethereum.removeAllListeners('chainChanged');
      window.ethereum.removeAllListeners('accountsChanged');
    }
    
    this.networkListeners = [];
    this.accountListeners = [];
  }
}

export const web3Service = new Web3Service();