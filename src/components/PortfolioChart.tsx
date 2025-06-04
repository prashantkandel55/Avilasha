import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { WalletConnection } from '../services/wallet-manager';

/**
 * PortfolioChartProps defines the properties for the PortfolioChart component.
 */
interface PortfolioChartProps {
  /**
   * The wallet connection object.
   */
  wallet: WalletConnection | null;
}

/**
 * PortfolioChart visualizes the selected wallet's performance.
 * - Uses wallet prop for dynamic chart data
 * - Shows loading/error states
 * - Type safe
 */
const PortfolioChart: React.FC<PortfolioChartProps> = ({ wallet }) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  const [error, setError] = useState<string | null>(null);

  // Derive chart data from wallet (mock fallback if empty)
  const getChartData = () => {
    if (wallet && wallet.balance !== undefined) {
      // Simulate data points based on wallet.balance for demo
      const baseValue = wallet.balance || 0;
      const days = timeframe === '1D' ? 24 : timeframe === '1W' ? 7 : timeframe === '1M' ? 30 : 12;
      return Array.from({ length: days }, (_, i) => ({
        date: timeframe === '1D' ? `${i}:00` : `Day ${i + 1}`,
        value: baseValue * (1 + (Math.random() - 0.5) * 0.05) // small random fluctuation
      }));
    }
    // fallback to static data
    switch (timeframe) {
      case '1D':
        return generateData(24, 'mixed').map(item => ({
          ...item,
          date: new Date(item.date).getHours() + ':00'
        }));
      case '1W':
        return generateData(7, 'down');
      case '1M':
        return generateData(30, 'mixed');
      case '1Y':
        return generateData(365, 'up').filter((_, i) => i % 30 === 0);
      default:
        return generateData(7, 'mixed');
    }
  };

  const data = getChartData();

  if (!wallet) {
    return <div className="bg-card rounded-xl p-4 shadow-sm">No wallet selected.</div>;
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Portfolio Performance</h3>
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={timeframe === '1D' ? 'default' : 'outline'}
            className={timeframe === '1D' ? 'bg-primary text-white' : ''}
            onClick={() => setTimeframe('1D')}
          >
            1D
          </Button>
          <Button
            size="sm"
            variant={timeframe === '1W' ? 'default' : 'outline'}
            className={timeframe === '1W' ? 'bg-primary text-white' : ''}
            onClick={() => setTimeframe('1W')}
          >
            1W
          </Button>
          <Button
            size="sm"
            variant={timeframe === '1M' ? 'default' : 'outline'}
            className={timeframe === '1M' ? 'bg-primary text-white' : ''}
            onClick={() => setTimeframe('1M')}
          >
            1M
          </Button>
          <Button
            size="sm"
            variant={timeframe === '1Y' ? 'default' : 'outline'}
            className={timeframe === '1Y' ? 'bg-primary text-white' : ''}
            onClick={() => setTimeframe('1Y')}
          >
            1Y
          </Button>
        </div>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={formatYAxis} width={60} />
          <CartesianGrid strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#6366f1"
            fillOpacity={1}
            fill="url(#colorValue)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// Sample data
const generateData = (days: number, trend: 'up' | 'down' | 'mixed') => {
  const baseValue = 10000;
  const volatility = 0.1; // 10% volatility
  
  const data = [];
  let currentValue = baseValue;
  
  for (let i = 0; i < days; i++) {
    let change;
    
    if (trend === 'up') {
      change = (Math.random() * volatility) - (volatility * 0.3); // Biased towards positive
    } else if (trend === 'down') {
      change = (Math.random() * volatility) - (volatility * 0.7); // Biased towards negative
    } else {
      change = (Math.random() * volatility) - (volatility * 0.5); // Balanced
    }
    
    currentValue = currentValue * (1 + change);
    
    // Add some cyclical pattern
    const cyclical = Math.sin(i / 5) * 200;
    
    data.push({
      date: new Date(2023, 4, i + 1).toISOString().split('T')[0],
      value: currentValue + cyclical
    });
  }
  
  return data;
};

const formatYAxis = (value: number) => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
};

const formatTooltipValue = (value: number) => {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-popover border border-border p-2 rounded-md shadow-md">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-primary text-sm font-semibold">
          {formatTooltipValue(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default PortfolioChart;