import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { cryptoApiService, CryptoMarketData } from '@/services/crypto-api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2 
  })}`;
};

const formatNumber = (value: number) => {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`;
  } else if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`;
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`;
  }
  return value.toLocaleString();
};

const TopCryptos = () => {
  const { data: cryptos, isLoading, error, refetch } = useQuery<CryptoMarketData[]>({
    queryKey: ['topCryptos'],
    queryFn: () => cryptoApiService.getTopCryptos(10),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border p-6 animate-pulse bg-card">
        <div className="flex justify-between items-center mb-4">
          <div className="h-6 w-40 bg-muted rounded" />
          <div className="h-6 w-6 bg-muted rounded-full" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right">Market Cap</TableHead>
                <TableHead className="text-right">Volume (24h)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(10)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 w-6 bg-muted rounded" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-full" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted rounded" />
                        <div className="h-3 w-16 bg-muted rounded" />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right"><div className="h-4 w-20 bg-muted rounded ml-auto" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-16 bg-muted rounded ml-auto" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-24 bg-muted rounded ml-auto" /></TableCell>
                  <TableCell className="text-right"><div className="h-4 w-24 bg-muted rounded ml-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border p-6 bg-destructive/10 text-destructive">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Error Loading Cryptocurrencies</h2>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-2">
            <RefreshCw size={14} />
            <span>Retry</span>
          </Button>
        </div>
        <p>Failed to fetch cryptocurrency data. Please try again later.</p>
        <p className="text-sm mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6 bg-card shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Last updated: {cryptos && cryptos[0] ? new Date(cryptos[0].last_updated).toLocaleTimeString() : 'N/A'}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-8 w-8 p-0">
          <RefreshCw size={14} />
          <span className="sr-only">Refresh</span>
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
              <TableHead className="text-right">Market Cap</TableHead>
              <TableHead className="text-right">Volume (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {cryptos?.map((crypto) => (
              <TableRow key={crypto.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{crypto.market_cap_rank}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img src={crypto.image} alt={crypto.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <div className="font-medium">{crypto.name}</div>
                      <div className="text-xs text-muted-foreground uppercase">{crypto.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(crypto.current_price)}
                </TableCell>
                <TableCell className={`text-right ${crypto.price_change_percentage_24h >= 0 ? 'text-success-500' : 'text-red-500'}`}>
                  <div className="flex items-center justify-end">
                    {crypto.price_change_percentage_24h >= 0 ? 
                      <ArrowUp size={14} className="mr-1" /> : 
                      <ArrowDown size={14} className="mr-1" />}
                    {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  ${formatNumber(crypto.market_cap)}
                </TableCell>
                <TableCell className="text-right">
                  ${formatNumber(crypto.total_volume)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 text-xs text-muted-foreground text-right">
        Data provided by CoinGecko API
      </div>
    </div>
  );
};

export default TopCryptos;