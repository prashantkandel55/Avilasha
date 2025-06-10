import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

const CryptoTickerBar: React.FC = () => {
  const [prices, setPrices] = useState<CryptoPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);

  // Generate realistic mock data for demo purposes
  const generateMockPrices = (): CryptoPrice[] => {
    const baseData = [
      { symbol: 'BTC', name: 'Bitcoin', basePrice: 65000 },
      { symbol: 'ETH', name: 'Ethereum', basePrice: 3500 },
      { symbol: 'BNB', name: 'Binance Coin', basePrice: 580 },
      { symbol: 'SOL', name: 'Solana', basePrice: 140 },
      { symbol: 'XRP', name: 'XRP', basePrice: 0.55 },
      { symbol: 'ADA', name: 'Cardano', basePrice: 0.45 },
      { symbol: 'DOT', name: 'Polkadot', basePrice: 7.2 },
      { symbol: 'DOGE', name: 'Dogecoin', basePrice: 0.12 },
      { symbol: 'AVAX', name: 'Avalanche', basePrice: 35 },
      { symbol: 'LINK', name: 'Chainlink', basePrice: 15 },
      { symbol: 'MATIC', name: 'Polygon', basePrice: 0.85 },
      { symbol: 'UNI', name: 'Uniswap', basePrice: 7.5 },
      { symbol: 'ATOM', name: 'Cosmos', basePrice: 9.2 },
      { symbol: 'LTC', name: 'Litecoin', basePrice: 80 },
      { symbol: 'ALGO', name: 'Algorand', basePrice: 0.18 }
    ];

    return baseData.map(coin => {
      // Add random fluctuation to price (±2%)
      const fluctuation = (Math.random() * 4 - 2) / 100;
      const price = coin.basePrice * (1 + fluctuation);
      
      // Generate realistic price change (±5%)
      const change24h = (Math.random() * 10 - 5);
      
      return {
        symbol: coin.symbol,
        name: coin.name,
        price,
        change24h
      };
    });
  };

  // Fetch prices on component mount and set up polling
  useEffect(() => {
    const fetchPrices = () => {
      setLoading(true);
      // In a real app, you would fetch from an API
      // For demo purposes, we'll use mock data
      const mockPrices = generateMockPrices();
      setPrices(mockPrices);
      setLoading(false);
    };

    fetchPrices();
    
    // Poll for new prices every 15 seconds
    const interval = setInterval(fetchPrices, 15000);
    
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="w-full bg-black border-b border-green-900/30 py-1 px-4 overflow-hidden">
      <div 
        ref={scrollRef}
        className="flex space-x-8 whitespace-nowrap overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Duplicate the prices array to create a seamless loop */}
        {[...prices, ...prices].map((crypto, index) => (
          <div key={`${crypto.symbol}-${index}`} className="inline-flex items-center">
            <span className="font-medium text-sm mr-2">{crypto.symbol}</span>
            <span className="text-sm mr-2">{formatPrice(crypto.price)}</span>
            <span 
              className={`flex items-center text-xs ${
                crypto.change24h >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {crypto.change24h >= 0 ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {Math.abs(crypto.change24h).toFixed(2)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CryptoTickerBar;