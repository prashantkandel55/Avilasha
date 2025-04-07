
import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  holdings: number;
  value: number;
}

const assets: Asset[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    price: 43567.89,
    change24h: 2.31,
    holdings: 0.56,
    value: 24398.01,
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    price: 2843.21,
    change24h: -1.42,
    holdings: 3.25,
    value: 9240.43,
  },
  {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    price: 146.78,
    change24h: 5.67,
    holdings: 24.5,
    value: 3596.11,
  },
  {
    id: 'binancecoin',
    name: 'BNB',
    symbol: 'BNB',
    price: 567.32,
    change24h: 0.84,
    holdings: 4.2,
    value: 2382.74,
  },
  {
    id: 'cardano',
    name: 'Cardano',
    symbol: 'ADA',
    price: 0.65,
    change24h: -0.23,
    holdings: 4500,
    value: 2925.00,
  },
];

const formatCurrency = (value: number) => {
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: value < 1 ? 4 : 2,
    maximumFractionDigits: value < 1 ? 4 : 2 
  })}`;
};

const TopAssets = () => {
  return (
    <div className="bg-card rounded-xl shadow-sm">
      <div className="flex justify-between items-center p-4">
        <h3 className="text-lg font-medium">Top Assets</h3>
        <Button variant="link" className="text-primary h-auto p-0">
          View All
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">24h Change</TableHead>
              <TableHead className="text-right">Holdings</TableHead>
              <TableHead className="text-right">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.map((asset) => (
              <TableRow key={asset.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center bg-${asset.id === 'bitcoin' ? 'crypto-bitcoin' : asset.id === 'ethereum' ? 'crypto-ethereum' : asset.id === 'solana' ? 'crypto-solana' : 'crypto-other'} bg-opacity-20`}>
                      <span className={`text-xs text-${asset.id === 'bitcoin' ? 'crypto-bitcoin' : asset.id === 'ethereum' ? 'crypto-ethereum' : asset.id === 'solana' ? 'crypto-solana' : 'crypto-other'}`}>
                        {asset.symbol.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div>{asset.name}</div>
                      <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(asset.price)}
                </TableCell>
                <TableCell className={`text-right ${asset.change24h >= 0 ? 'text-success-500' : 'text-red-500'}`}>
                  <div className="flex items-center justify-end">
                    {asset.change24h >= 0 ? <ArrowUp size={14} className="mr-1" /> : <ArrowDown size={14} className="mr-1" />}
                    {Math.abs(asset.change24h).toFixed(2)}%
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div>{asset.holdings.toLocaleString('en-US', { maximumFractionDigits: 8 })}</div>
                  <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(asset.value)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopAssets;
