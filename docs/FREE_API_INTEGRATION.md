# Free Cryptocurrency API Integration

This document provides information about the free cryptocurrency API integrations available in Avilasha 2.

## Overview

Avilasha 2 integrates with several free cryptocurrency API providers to offer comprehensive data without subscription costs. These integrations include:

- **CoinGecko** - Market data, prices, and trends
- **Etherscan** - Ethereum blockchain data
- **Covalent** - Multi-chain data and portfolio analytics
- **Moralis** - Wallet data, NFTs, and transactions

## Features

These free API integrations provide the following features:

- Real-time cryptocurrency price tracking
- Wallet balance monitoring across multiple chains
- NFT gallery and metadata
- Transaction history
- Portfolio analytics and historical value
- Gas price estimation
- Market trends and data

## Usage

### Setting Up API Keys

To use these services, you'll need to obtain free API keys from the respective providers:

1. **Etherscan**: Register at [https://etherscan.io/apis](https://etherscan.io/apis)
2. **Covalent**: Register at [https://www.covalenthq.com/platform/](https://www.covalenthq.com/platform/)
3. **Moralis**: Register at [https://moralis.io/](https://moralis.io/)

> Note: CoinGecko's basic API doesn't require an API key for most endpoints.

### Configuration

Update the API keys in `src/config/crypto-api-config.ts`:

```typescript
export const cryptoApiConfig = {
  etherscan: 'YOUR_ETHERSCAN_API_KEY',
  covalent: 'YOUR_COVALENT_API_KEY',
  moralis: 'YOUR_MORALIS_API_KEY'
};
```

Then initialize the services in your application:

```typescript
import { initializeCryptoServices } from '@/config/crypto-api-config';

// Initialize services with API keys
initializeCryptoServices();
```

### Using the Services

Import the crypto service in your components:

```typescript
import { cryptoService } from '@/services/crypto-service-integration';

// Example: Get cryptocurrency prices
async function fetchPrices() {
  const prices = await cryptoService.getPrices(['bitcoin', 'ethereum'], ['usd']);
  console.log(prices);
}

// Example: Get wallet tokens
async function fetchWalletTokens(address: string) {
  const tokens = await cryptoService.getWalletTokens(address);
  console.log(tokens);
}

// Example: Get NFTs
async function fetchNFTs(address: string) {
  const nfts = await cryptoService.getWalletNFTs(address);
  console.log(nfts);
}
```

## Rate Limiting and Caching

The integration includes built-in rate limiting and caching to ensure:

- API rate limits are respected
- Reduced API usage to stay within free tiers
- Improved application performance
- Fallback mechanisms when one API is unavailable

## Available Methods

### CoinGecko

- `getPrices(coinIds, currencies)` - Get current prices for cryptocurrencies
- `getTrendingCoins()` - Get trending cryptocurrencies
- `getCoinDetails(coinId)` - Get detailed information about a specific coin
- `getCoinMarkets(currency, page, perPage)` - Get market data for cryptocurrencies

### Etherscan

- `getBalance(address)` - Get ETH balance for an address
- `getTokenBalance(address, contractAddress)` - Get ERC20 token balance
- `getTransactions(address)` - Get transaction history
- `getTokenTransactions(address, contractAddress)` - Get ERC20 token transactions
- `getGasPrice()` - Get current gas prices

### Covalent

- `getTokenBalances(chainId, address)` - Get token balances across multiple chains
- `getNFTs(chainId, address)` - Get NFTs owned by an address
- `getHistoricalPortfolioValue(chainId, address, days)` - Get historical portfolio value

### Moralis

- `getNativeBalance(address, chain)` - Get native token balance
- `getTokenBalances(address, chain)` - Get token balances
- `getNFTs(address, chain, limit)` - Get NFTs owned by an address
- `getTransactions(address, chain, limit)` - Get transaction history

## Best Practices

1. **Stay Within Free Tier Limits**: Monitor your API usage to avoid exceeding free tier limits
2. **Implement Additional Caching**: For high-traffic applications, consider additional caching layers
3. **Handle API Failures Gracefully**: Always implement error handling for API calls
4. **Use Fallback Mechanisms**: The integration attempts to use alternative APIs when one fails

## Troubleshooting

- **API Key Issues**: Ensure your API keys are correctly entered and have the necessary permissions
- **Rate Limiting**: If you encounter rate limit errors, consider increasing cache durations
- **Data Inconsistency**: Different APIs may return slightly different data formats or values