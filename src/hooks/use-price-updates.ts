import { useState, useEffect } from 'react';

type PriceData = {
  symbol: string;
  name: string;
  price: string;
  change24h: string;
  marketCap?: string;
  volume24h?: string;
  rank?: number;
};

type PriceUpdateHook = {
  prices: Record<string, PriceData>;
  isConnected: boolean;
  error: string | null;
};

export const usePriceUpdates = (symbols: string[]): PriceUpdateHook => {
  const [prices, setPrices] = useState<Record<string, PriceData>>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const retryDelay = 3000; // 3 seconds
  const connectionTimeout = 5000; // 5 seconds timeout for initial connection
  const heartbeatInterval = 30000; // 30 seconds heartbeat interval

  const connect = () => {
    let timeoutId: NodeJS.Timeout;
    let heartbeatId: NodeJS.Timeout;
    // Reset error state on new connection attempt
    setError(null);
    
    // Using Binance WebSocket API for real-time price updates
    const ws = new WebSocket('wss://stream.binance.com:9443/ws');
    
    // Set connection timeout
    timeoutId = setTimeout(() => {
      if (ws.readyState !== WebSocket.OPEN) {
        ws.close();
        setError('Connection timeout');
        setIsConnected(false);
      }
    }, connectionTimeout);

    ws.onopen = () => {
      clearTimeout(timeoutId);
      setIsConnected(true);
      setError(null);
      setRetryCount(0); // Reset retry count on successful connection
      
      // Subscribe to ticker streams for each symbol
      const subscribeMsg = {
        method: 'SUBSCRIBE',
        params: symbols.map(symbol => `${symbol.toLowerCase()}@ticker`),
        id: 1
      };
      ws.send(JSON.stringify(subscribeMsg));

      // Setup heartbeat to keep connection alive
      heartbeatId = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ method: 'PING' }));
        }
      }, heartbeatInterval);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.e === '24hrTicker') {
          const symbol = data.s;
          const name = symbol.replace('USDT', '');
          setPrices(prev => ({
            ...prev,
            [symbol]: {
              symbol,
              name,
              price: parseFloat(data.c).toFixed(2),
              change24h: `${parseFloat(data.P).toFixed(2)}%`,
              marketCap: data.q ? `$${(parseFloat(data.q) * parseFloat(data.c)).toFixed(2)}B` : undefined,
              volume24h: data.v ? `$${(parseFloat(data.v) * parseFloat(data.c)).toFixed(2)}M` : undefined,
              rank: prev[symbol]?.rank || undefined
            }
          }));
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };

    ws.onerror = (err) => {
      setError('WebSocket connection error');
      setIsConnected(false);
    };

    ws.onclose = (event) => {
      clearTimeout(timeoutId);
      setIsConnected(false);
      
      // Don't attempt to reconnect if the connection was closed normally
      if (!event.wasClean && retryCount < maxRetries) {
        const reconnectTimeoutId = setTimeout(() => {
          setRetryCount(prev => prev + 1);
          connect();
        }, retryDelay * Math.pow(2, retryCount)); // Exponential backoff with base 2

        return () => clearTimeout(reconnectTimeoutId);
      } else if (!event.wasClean) {
        setError(`Connection lost. Max retries reached. Code: ${event.code}`);
      }
    };

    const cleanup = () => {
      clearInterval(heartbeatId);
      clearTimeout(timeoutId);
      
      if (ws.readyState === WebSocket.OPEN) {
        const unsubscribeMsg = {
          method: 'UNSUBSCRIBE',
          params: symbols.map(symbol => `${symbol.toLowerCase()}@ticker`),
          id: 1
        };
        ws.send(JSON.stringify(unsubscribeMsg));
        ws.close(1000, 'Component unmounting');
      }
      setRetryCount(0); // Reset retry count on unmount
      setPrices({}); // Clear prices on unmount
    };

    return cleanup;
  };

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [symbols]);

  return { prices, isConnected, error };
};