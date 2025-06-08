import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  image: string;
  last_updated: string;
}

const LiveCryptoPrices: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, you would use a real API endpoint
      // const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false&price_change_percentage=24h');
      // if (!response.ok) throw new Error('Failed to fetch prices');
      // const data = await response.json();
      
      // For demo purposes, generate realistic mock data
      const mockData = generateMockPrices();
      
      setPrices(mockData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching crypto prices:', err);
      setError('Failed to load price data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Generate realistic mock price data
  const generateMockPrices = (): CryptoPrice[] => {
    const baseData = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', base_price: 65000 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', base_price: 3500 },
      { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', base_price: 580 },
      { id: 'solana', symbol: 'sol', name: 'Solana', base_price: 140 },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', base_price: 0.55 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', base_price: 0.45 },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot', base_price: 7.2 },
      { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', base_price: 0.12 },
      { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', base_price: 35 },
      { id: 'chainlink', symbol: 'link', name: 'Chainlink', base_price: 15 }
    ];

    return baseData.map(coin => {
      // Add random fluctuation to price (±2%)
      const fluctuation = (Math.random() * 4 - 2) / 100;
      const current_price = coin.base_price * (1 + fluctuation);
      
      // Generate realistic price change (±5%)
      const price_change = (Math.random() * 10 - 5);
      
      // Calculate market cap based on price
      const market_cap = current_price * (coin.id === 'bitcoin' ? 19000000 : 
                                         coin.id === 'ethereum' ? 120000000 : 
                                         Math.random() * 500000000 + 100000000);
      
      // Calculate volume as a percentage of market cap
      const volume_percentage = Math.random() * 0.15 + 0.05; // 5-20% of market cap
      const total_volume = market_cap * volume_percentage;
      
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        current_price,
        price_change_percentage_24h: price_change,
        market_cap,
        total_volume,
        image: `https://cryptologos.cc/logos/${coin.id}-${coin.symbol}-logo.png`,
        last_updated: new Date().toISOString()
      };
    });
  };

  // Initial fetch and set up polling
  useEffect(() => {
    fetchPrices();
    
    // Set up polling for real-time updates
    const interval = setInterval(() => {
      fetchPrices();
    }, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 6 : 2
    }).format(value);
  };

  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
    }
    if (value >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (value >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    return formatCurrency(value);
  };

  return (
    <Card className="shadow-lg border-primary/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          Live Crypto Prices
          <Badge variant="outline" className="ml-2 bg-green-500/20 text-green-500 animate-pulse">
            Live
          </Badge>
        </CardTitle>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-muted-foreground">
              Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchPrices} 
            disabled={loading}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center p-4 text-red-500">
            <p>{error}</p>
            <Button onClick={fetchPrices} variant="outline" className="mt-2">
              Try Again
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Asset</th>
                  <th className="text-right py-3 px-2">Price</th>
                  <th className="text-right py-3 px-2">24h Change</th>
                  <th className="text-right py-3 px-2 hidden md:table-cell">Market Cap</th>
                  <th className="text-right py-3 px-2 hidden lg:table-cell">Volume (24h)</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array(5).fill(0).map((_, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-8 w-8 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-3 w-12 mt-1" />
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2"><Skeleton className="h-4 w-24 ml-auto" /></td>
                      <td className="text-right py-3 px-2"><Skeleton className="h-4 w-16 ml-auto" /></td>
                      <td className="text-right py-3 px-2 hidden md:table-cell"><Skeleton className="h-4 w-28 ml-auto" /></td>
                      <td className="text-right py-3 px-2 hidden lg:table-cell"><Skeleton className="h-4 w-24 ml-auto" /></td>
                    </tr>
                  ))
                ) : (
                  prices.map((coin) => (
                    <tr key={coin.id} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <img 
                            src={coin.image} 
                            alt={coin.name} 
                            className="w-8 h-8 rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://via.placeholder.com/32/6366f1/ffffff?text=${coin.symbol}`;
                            }}
                          />
                          <div>
                            <div className="font-medium">{coin.name}</div>
                            <div className="text-xs text-muted-foreground">{coin.symbol}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 font-medium">
                        {formatCurrency(coin.current_price)}
                      </td>
                      <td className={`text-right py-3 px-2 ${coin.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        <div className="flex items-center justify-end">
                          {coin.price_change_percentage_24h >= 0 ? (
                            <ArrowUpRight className="mr-1 h-3 w-3" />
                          ) : (
                            <ArrowDownRight className="mr-1 h-3 w-3" />
                          )}
                          {coin.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      </td>
                      <td className="text-right py-3 px-2 hidden md:table-cell">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td className="text-right py-3 px-2 hidden lg:table-cell">
                        {formatMarketCap(coin.total_volume)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveCryptoPrices;