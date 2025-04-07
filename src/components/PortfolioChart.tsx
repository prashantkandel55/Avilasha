
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';

// Sample data
const generateData = (days: number, trend: 'up' | 'down' | 'mixed') => {
  const baseValue = 10000;
  const volatility = 0.1; // 10% volatility
  
  let data = [];
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

// Portfolio Chart Component
const PortfolioChart = () => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '1Y'>('1W');
  
  const getChartData = () => {
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
        return generateData(365, 'up').filter((_, i) => i % 30 === 0); // Sample every 30 days
      default:
        return generateData(7, 'mixed');
    }
  };
  
  const data = getChartData();
  
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
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              tickFormatter={(value) => {
                // Format based on timeframe
                if (timeframe === '1D') return value;
                if (timeframe === '1Y') {
                  return value.split('-')[1] + '/' + value.split('-')[2];
                }
                return value.split('-').slice(1).join('/');
              }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'rgba(255,255,255,0.6)' }}
              tickFormatter={formatYAxis}
              domain={['dataMin - 500', 'dataMax + 500']}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#10B981" 
              fillOpacity={1}
              fill="url(#colorValue)" 
              strokeWidth={2}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10B981' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PortfolioChart;
