/**
 * Avilasha AI Assistant Service
 * Provides intelligent guidance and real-time responses to users
 */

import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export interface AssistantOptions {
  userName?: string;
  welcomeMessage?: string;
  onNewMessage?: (message: Message) => void;
}

class AssistantService {
  private messages: Message[] = [];
  private userName: string = 'User';
  private welcomeMessage: string = 'Hi there! I\'m Avilasha, your personal crypto assistant. I\'m here to help you navigate the app and answer any questions you might have about cryptocurrency.';
  private onNewMessage?: (message: Message) => void;
  private isInitialized: boolean = false;
  
  /**
   * Initialize the assistant service
   */
  initialize(options?: AssistantOptions): boolean {
    try {
      if (options?.userName) {
        this.userName = options.userName;
      }
      
      if (options?.welcomeMessage) {
        this.welcomeMessage = options.welcomeMessage;
      }
      
      if (options?.onNewMessage) {
        this.onNewMessage = options.onNewMessage;
      }
      
      this.isInitialized = true;
      
      // Add welcome message
      this.addMessage({
        id: this.generateId(),
        content: this.welcomeMessage,
        role: 'assistant',
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Failed to initialize assistant service:', error);
      return false;
    }
  }
  
  /**
   * Send a message to the assistant
   */
  sendMessage(content: string): void {
    if (!this.isInitialized) {
      toast({
        title: 'Assistant Not Ready',
        description: 'The assistant service is not initialized.',
        variant: 'destructive'
      });
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: this.generateId(),
      content,
      role: 'user',
      timestamp: new Date()
    };
    
    this.addMessage(userMessage);
    
    // Generate assistant response
    setTimeout(() => {
      const response = this.generateResponse(content);
      const assistantMessage: Message = {
        id: this.generateId(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };
      
      this.addMessage(assistantMessage);
    }, 500); // Simulate processing time
  }
  
  /**
   * Get contextual help based on current page
   */
  getContextualHelp(currentPage: string): string {
    const pageHelp: Record<string, string> = {
      'dashboard': 'The Dashboard provides an overview of your crypto portfolio, market trends, and important notifications.',
      'portfolio': 'The Portfolio Analytics page helps you track your investments and analyze your portfolio performance over time.',
      'market': 'The Market Analysis page shows current market trends, price movements, and trading volumes for various cryptocurrencies.',
      'assets': 'The Assets page displays all your cryptocurrency holdings and their current values.',
      'wallets': 'The Wallets page allows you to manage your connected wallets, view balances, and track transactions.',
      'defi': 'The DeFi page shows your decentralized finance investments, including staking, lending, and yield farming.',
      'nfts': 'The NFTs page displays your non-fungible token collection and relevant market data.',
      'history': 'The History page shows all your past transactions across different wallets and platforms.',
      'alerts': 'The Alerts page lets you set up price notifications for specific cryptocurrencies.',
      'news': 'The News page provides the latest updates and articles from the crypto world.',
      'help': 'The Help Center provides guides, tutorials, and FAQs to help you use the app effectively.',
      'settings': 'The Settings page allows you to customize the app according to your preferences.'
    };
    
    return pageHelp[currentPage.toLowerCase()] || 
      'I can help you navigate through the app and answer any questions you might have about cryptocurrency.';
  }
  
  /**
   * Get all messages
   */
  getMessages(): Message[] {
    return [...this.messages];
  }
  
  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messages = [];
    
    // Add welcome message again
    this.addMessage({
      id: this.generateId(),
      content: this.welcomeMessage,
      role: 'assistant',
      timestamp: new Date()
    });
  }
  
  /**
   * Generate a response based on user input
   */
  private generateResponse(userMessage: string): string {
    const normalizedMessage = userMessage.toLowerCase();
    
    // Basic responses based on keywords
    if (normalizedMessage.includes('hello') || normalizedMessage.includes('hi')) {
      return `Hello ${this.userName}! How can I help you today?`;
    }
    
    if (normalizedMessage.includes('thank')) {
      return 'You\'re welcome! Is there anything else I can help you with?';
    }
    
    if (normalizedMessage.includes('wallet')) {
      return 'You can connect your wallet by clicking the "Connect Wallet" button in the Wallets page. We support MetaMask, Coinbase Wallet, and WalletConnect.';
    }
    
    if (normalizedMessage.includes('portfolio')) {
      return 'Your portfolio shows all your crypto assets across connected wallets. You can view detailed analytics in the Portfolio Analytics page.';
    }
    
    if (normalizedMessage.includes('price') || normalizedMessage.includes('value')) {
      return 'You can check current prices in the Market Analysis page. For specific assets, you can also set up price alerts in the Alerts page.';
    }
    
    if (normalizedMessage.includes('help')) {
      return 'I\'m here to help! You can ask me about any feature in the app, or visit the Help Center for detailed guides and tutorials.';
    }
    
    // Default response
    return 'I\'m here to help you navigate through the app and answer any questions about cryptocurrency. What would you like to know?';
  }
  
  /**
   * Add a message to the list and trigger callback
   */
  private addMessage(message: Message): void {
    this.messages.push(message);
    
    if (this.onNewMessage) {
      this.onNewMessage(message);
    }
  }
  
  /**
   * Generate a unique ID for messages
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

export const assistantService = new AssistantService();