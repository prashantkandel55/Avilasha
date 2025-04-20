import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { WalletConnection } from '../services/wallet-manager';

interface Asset {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  holdings: number;
  value: number;
}

interface TopAssetsProps {
  wallet: WalletConnection;
}

/**
 * TopAssets lists the top assets in the selected wallet.
 * - Uses wallet prop for dynamic asset list
 * - Handles empty/no wallet gracefully
 * - Type safe
 */
const TopAssets: React.FC<TopAssetsProps> = ({ wallet }) => {
  // Use wallet.tokens if available
  const tokens = (wallet as any).tokens || [];
  // Sort by valueUSD descending
  const topTokens = tokens.sort((a: any, b: any) => (b.valueUSD || 0) - (a.valueUSD || 0)).slice(0, 5);

  if (!wallet) {
    return <div className="bg-card rounded-xl shadow-sm p-4">No wallet selected.</div>;
  }
  if (!topTokens.length) {
    return <div className="bg-card rounded-xl shadow-sm p-4">No assets found for this wallet.</div>;
  }

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString('en-US', { 
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2 
    })}`;
  };

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
            {topTokens.map((token: any) => (
              <TableRow key={token.symbol}>
                <TableCell className="font-medium">
                  {token.name} {token.symbol && <span className="text-xs text-muted-foreground">({token.symbol})</span>}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(token.price ?? 0)}</TableCell>
                <TableCell className={`text-right ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>{token.change24h ? token.change24h.toFixed(2) : '0.00'}%</TableCell>
                <TableCell className="text-right">{token.balance ?? 0}</TableCell>
                <TableCell className="text-right">{formatCurrency(token.valueUSD ?? 0)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default TopAssets;
