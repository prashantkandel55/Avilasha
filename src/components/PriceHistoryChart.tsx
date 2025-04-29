import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cryptoService } from '@/services/crypto-service-integration';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';

interface HistoricalPrice {
  time: number;
  high: number;
  low: number;
  open: number;
  close: number;
  volumefrom: number;
  volumeto: number;
}

interface PriceHistoryChartProps {
  coinId: string;
  currency?: string;
  days?: number;
  showHeader?: boolean;
}

const PriceHistoryChart: React.FC<PriceHistoryChartProps> = ({
  coinId,
  currency = 'USD',
  days = 30,
  showHeader = true
}) => {
  const [priceData, setPriceData] = useState<HistoricalPrice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeframe, setTimeframe] = useState<string>('30d');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPriceData();
  }, [coinId, currency, timeframe]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let data: HistoricalPrice[] = [];
      
      switch (timeframe) {
        case '24h':
          data = await cryptoService.getHistoricalHourlyPrices(coinId, currency, 24);
          break;
        case '7d':
          data = await cryptoService.getHistoricalDailyPrices(coinId, currency, 7);
          break;
        case '30d':
          data = await cryptoService.getHistoricalDailyPrices(coinId, currency, 30);
          break;
        case '90d':
          data = await cryptoService.getHistoricalDailyPrices(coinId, currency, 90);
          break;
        case '1y':
          data = await cryptoService.getHistoricalDailyPrices(coinId, currency, 365);
          break;
        default:
          data = await cryptoService.getHistoricalDailyPrices(coinId, currency, 30);
      }
      
      setPriceData(data);
    } catch (error) {
      console.error('Error fetching price data:', error);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPriceData();
  };

  const renderPriceChart = () => {
    if (loading) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (priceData.length === 0) {
      return (
        <div className="w-full h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No price data available</p>
        </div>
      );
    }

    // In a real implementation, you would use a charting library like recharts, chart.js, or d3
    // This is a simplified placeholder visualization
    const firstPrice = priceData[0]?.close || 0;
    const lastPrice = priceData[priceData.length - 1]?.close || 0;
    const priceChange = lastPrice - firstPrice;
    const percentChange = (priceChange / firstPrice) * 100;
    const isPositive = priceChange >= 0;

    return (
      <div className="w-full">
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-2xl font-bold">
              {currency} {lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
              <span>{Math.abs(priceChange).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="ml-1">({percentChange.toFixed(2)}%)</span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {new Date(priceData[priceData.length - 1]?.time * 1000).toLocaleDateString()}
          </div>
        </div>

        <div className="w-full h-40 relative">
          {/* Simplified chart visualization - in a real app, use a proper chart library */}
          <div className="absolute inset-0 flex items-end">
            {priceData.map((price, index) => {
              const min = Math.min(...priceData.map(p => p.low));
              const max = Math.max(...priceData.map(p => p.high));
              const range = max - min;
              const heightPercent = range > 0 ? ((price.close - min) / range) * 100 : 50;
              
              return (
                <div 
                  key={index}
                  className={`flex-1 mx-px ${isPositive ? 'bg-green-500' : 'bg-red-500'}`}
                  style={{ height: `${heightPercent}%`, opacity: 0.7 + (index / priceData.length) * 0.3 }}
                  title={`${new Date(price.time * 1000).toLocaleDateString()}: ${currency} ${price.close}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      {showHeader && (
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Price History</CardTitle>
              <CardDescription>{coinId.toUpperCase()} / {currency}</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent>
        <Tabs defaultValue="30d" value={timeframe} onValueChange={setTimeframe} className="mb-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="24h">24H</TabsTrigger>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
            <TabsTrigger value="90d">90D</TabsTrigger>
            <TabsTrigger value="1y">1Y</TabsTrigger>
          </TabsList>
        </Tabs>
        {renderPriceChart()}
      </CardContent>
    </Card>
  );
};

export default PriceHistoryChart;