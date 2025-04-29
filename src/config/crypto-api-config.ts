/**
 * Cryptocurrency API Configuration
 * Configure API keys for free cryptocurrency data services
 */

import { cryptoService } from '@/services/crypto-service-integration';

// Default configuration with empty API keys
// Users should replace these with their own API keys
export const cryptoApiConfig = {
  // Etherscan API - https://etherscan.io/apis
  // Free tier: 5 calls/sec, max 100,000 calls/day
  etherscan: '',
  
  // Covalent API - https://www.covalenthq.com/docs/api/
  // Free tier: 100,000 credits per month (~3,333 requests)
  covalent: '',
  
  // Moralis API - https://moralis.io/
  // Free tier: 25,000 API calls per month
  moralis: '',

  // DeFiLlama API - https://defillama.com/docs/api
  // Free tier: No API key required, reasonable rate limits
  
  // CryptoCompare API - https://min-api.cryptocompare.com/
  // Free tier: 100,000 API calls per month
  cryptocompare: '',
  
  // CryptoNews API - https://cryptonews-api.com/
  // Free tier: 50 requests per day
  cryptonews: ''
};

/**
 * Initialize cryptocurrency services with API keys
 */
export function initializeCryptoServices() {
  // Initialize the crypto service with API keys
  cryptoService.initialize(cryptoApiConfig);
  
  console.log('Cryptocurrency services initialized');
}

/**
 * Update API keys at runtime
 */
export function updateApiKeys(config: Partial<typeof cryptoApiConfig>) {
  // Update the configuration
  Object.assign(cryptoApiConfig, config);
  
  // Re-initialize the service with new keys
  cryptoService.initialize(cryptoApiConfig);
  
  console.log('API keys updated');
}