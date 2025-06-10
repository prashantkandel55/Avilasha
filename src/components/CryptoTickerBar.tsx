import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

const CryptoTickerBar: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Fetch prices from CoinGecko API
  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h'
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch cryptocurrency data');
        }
        
        const data = await response.json();
        setPrices(data);
      } catch (err) {
        console.error('Error fetching crypto prices:', err);
        setError('Failed to load price data');
        // Fallback to mock data if API fails
        setPrices(generateMockPrices());
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    
    // Poll for new prices every 60 seconds (CoinGecko free tier has rate limits)
    const interval = setInterval(fetchPrices, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Generate realistic mock data for demo purposes or fallback
  const generateMockPrices = (): CryptoPrice[] => {
    const baseData = [
      { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin', basePrice: 65000 },
      { id: 'ethereum', symbol: 'eth', name: 'Ethereum', basePrice: 3500 },
      { id: 'binancecoin', symbol: 'bnb', name: 'Binance Coin', basePrice: 580 },
      { id: 'solana', symbol: 'sol', name: 'Solana', basePrice: 140 },
      { id: 'ripple', symbol: 'xrp', name: 'XRP', basePrice: 0.55 },
      { id: 'cardano', symbol: 'ada', name: 'Cardano', basePrice: 0.45 },
      { id: 'polkadot', symbol: 'dot', name: 'Polkadot', basePrice: 7.2 },
      { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin', basePrice: 0.12 },
      { id: 'avalanche-2', symbol: 'avax', name: 'Avalanche', basePrice: 35 },
      { id: 'chainlink', symbol: 'link', name: 'Chainlink', basePrice: 15 },
      { id: 'matic-network', symbol: 'matic', name: 'Polygon', basePrice: 0.85 },
      { id: 'uniswap', symbol: 'uni', name: 'Uniswap', basePrice: 7.5 },
      { id: 'cosmos', symbol: 'atom', name: 'Cosmos', basePrice: 9.2 },
      { id: 'litecoin', symbol: 'ltc', name: 'Litecoin', basePrice: 80 },
      { id: 'algorand', symbol: 'algo', name: 'Algorand', basePrice: 0.18 }
    ];

    return baseData.map(coin => {
      // Add random fluctuation to price (±2%)
      const fluctuation = (Math.random() * 4 - 2) / 100;
      const current_price = coin.basePrice * (1 + fluctuation);
      
      // Generate realistic price change (±5%)
      const price_change_percentage_24h = (Math.random() * 10 - 5);
      
      return {
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        name: coin.name,
        image: `https://assets.coingecko.com/coins/images/1/small/bitcoin.png?1547033579`.replace('1/small/bitcoin', `${coin.id.toLowerCase()}`),
        current_price,
        price_change_percentage_24h
      };
    });
  };

  // Smooth scrolling animation
  useEffect(() => {
    if (!scrollRef.current || prices.length === 0) return;
    
    let scrollPosition = 0;
    const scrollWidth = scrollRef.current.scrollWidth;
    const containerWidth = scrollRef.current.clientWidth;
    
    const scroll = () => {
      if (!scrollRef.current) return;
      
      scrollPosition += 0.5; // Adjust speed here
      
      // Reset position when we've scrolled through all items
      if (scrollPosition >= scrollWidth - containerWidth) {
        scrollPosition = 0;
      }
      
      scrollRef.current.scrollLeft = scrollPosition;
      animationRef.current = requestAnimationFrame(scroll);
    };
    
    animationRef.current = requestAnimationFrame(scroll);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prices]);

  // Format currency with appropriate decimal places
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return price.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
    } else if (price >= 1) {
      return price.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    } else {
      return price.toLocaleString('en-US', { 
        style: 'currency', 
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      });
    }
  };

  if (loading && prices.length === 0) {
    return (
      <div className="w-full bg-black border-b border-green-900/30 py-1 px-4 overflow-hidden">
        <div className="animate-pulse flex space-x-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-6 bg-green-900/20 rounded w-24"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error && prices.length === 0) {
    return (
      <div className="w-full bg-black border-b border-green-900/30 py-1 px-4 text-red-500 text-xs">
        {error} - Using fallback data
      </div>
    );
  }

  return (
    <div className="w-full bg-black border-b border-green-900/30 py-1 px-4 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex space-x-8 whitespace-nowrap overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Duplicate the prices array to create a seamless loop */}
        {[...prices, ...prices].map((crypto, index) => (
          <div key={`${crypto.id}-${index}`} className="inline-flex items-center">
            <img 
              src={crypto.image} 
              alt={crypto.name} 
              className="w-5 h-5 mr-2 rounded-full"
              onError={(e) => {
                // Fallback if image fails to load
                (e.target as HTMLImageElement).src = `https://via.placeholder.com/20/22c55e/FFFFFF?text=${crypto.symbol.charAt(0)}`;
              }}
            />
            <span className="font-medium text-sm mr-2">{crypto.symbol}</span>
            <span className="text-sm mr-2">{formatPrice(crypto.current_price)}</span>
            <span 
              className={`flex items-center text-xs ${
                crypto.price_change_percentage_24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {crypto.price_change_percentage_24h >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoTickerBar;