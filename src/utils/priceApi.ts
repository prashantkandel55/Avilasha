// Utility to fetch token prices from CoinGecko
export async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  // Map symbols to CoinGecko IDs (simplified, add more as needed)
  const symbolToId: Record<string, string> = {
    ETH: 'ethereum',
    BTC: 'bitcoin',
    USDT: 'tether',
    USDC: 'usd-coin',
    BNB: 'binancecoin',
    MATIC: 'matic-network',
    SOL: 'solana',
    AVAX: 'avalanche-2',
    DOGE: 'dogecoin',
    XRP: 'ripple',
    ADA: 'cardano',
    // Add more as needed
  };
  const ids = symbols.map(s => symbolToId[s.toUpperCase()]).filter(Boolean).join(',');
  if (!ids) return {};
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
  const resp = await fetch(url);
  const data = await resp.json();
  const result: Record<string, number> = {};
  for (const [symbol, id] of Object.entries(symbolToId)) {
    if (data[id] && data[id].usd) {
      result[symbol] = data[id].usd;
    }
  }
  return result;
}
