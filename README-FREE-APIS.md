# Free Cryptocurrency API Integrations for Avilasha 2

## Overview

This implementation adds support for multiple free cryptocurrency API services to the Avilasha 2 project. These integrations allow the application to access cryptocurrency data without requiring paid subscriptions, while maintaining proper rate limiting and caching to stay within free tier limits.

## Implemented Services

### 1. CoinGecko API
- **Features**: Market data, prices, trending coins, coin details
- **Free Tier Limits**: 10-30 calls/minute
- **No API Key Required** for basic endpoints

### 2. Etherscan API
- **Features**: Ethereum balances, transactions, token transfers, gas prices
- **Free Tier Limits**: 5 calls/sec, max 100,000 calls/day
- **Requires API Key**: Register at [https://etherscan.io/apis](https://etherscan.io/apis)

### 3. Covalent API
- **Features**: Multi-chain token balances, NFTs, historical portfolio value
- **Free Tier Limits**: 100,000 credits per month (~3,333 requests)
- **Requires API Key**: Register at [https://www.covalenthq.com/platform/](https://www.covalenthq.com/platform/)

### 4. Moralis API
- **Features**: Wallet data, NFTs, transactions across multiple chains
- **Free Tier Limits**: 25,000 API calls per month
- **Requires API Key**: Register at [https://moralis.io/](https://moralis.io/)

## Implementation Details

### Files Created

1. `src/services/free-crypto-apis.ts` - Core implementation of all free API services with rate limiting and caching
2. `src/services/crypto-service-integration.ts` - Integration layer connecting APIs with the application
3. `src/config/crypto-api-config.ts` - Configuration for API keys
4. `src/services/initialize-services.ts` - Service initialization
5. `src/components/FreeCryptoApiDemo.tsx` - Demo component showing API usage
6. `docs/FREE_API_INTEGRATION.md` - Detailed documentation

### Key Features

- **Rate Limiting**: Prevents exceeding free tier API limits
- **Caching**: Reduces API calls and improves performance
- **Fallback Mechanisms**: Tries alternative APIs when one fails
- **Error Handling**: Graceful error handling with user feedback

## How to Use

### 1. Configure API Keys

Update the API keys in `src/config/crypto-api-config.ts`:

```typescript
export const cryptoApiConfig = {
  etherscan: 'YOUR_ETHERSCAN_API_KEY',
  covalent: 'YOUR_COVALENT_API_KEY',
  moralis: 'YOUR_MORALIS_API_KEY'
};
```

### 2. Using the Services

Import the crypto service in your components:

```typescript
import { cryptoService } from '@/services/crypto-service-integration';

// Example: Get cryptocurrency prices
const prices = await cryptoService.getPrices(['bitcoin', 'ethereum'], ['usd']);

// Example: Get wallet tokens
const tokens = await cryptoService.getWalletTokens(walletAddress);

// Example: Get NFTs
const nfts = await cryptoService.getWalletNFTs(walletAddress);
```

### 3. Demo Component

A demo component is included at `src/components/FreeCryptoApiDemo.tsx` that demonstrates:

- Fetching and displaying cryptocurrency prices
- Showing trending coins
- Exploring wallet tokens and NFTs

You can import and use this component to test the API integrations:

```typescript
import FreeCryptoApiDemo from '@/components/FreeCryptoApiDemo';

// In your JSX
<FreeCryptoApiDemo />
```

## Best Practices

1. **Monitor API Usage**: Keep track of your API usage to avoid exceeding free tier limits
2. **Increase Cache Duration**: For less time-sensitive data, increase cache durations
3. **Handle Errors Gracefully**: Always implement proper error handling
4. **Provide Fallbacks**: Show cached data when API calls fail

## Additional Documentation

For more detailed information, see the comprehensive documentation in `docs/FREE_API_INTEGRATION.md`.