import React from 'react';
import { Progress } from '@/components/ui/progress';

interface Token {
  name?: string;
  symbol: string;
  valueUSD: number;
}

interface Asset {
  name: string;
  symbol: string;
  percentage: number;
  color: string;
}

interface AssetAllocationProps {
  wallet: { tokens: Token[] } | null;
}

/**
 * AssetAllocation displays the wallet's asset distribution.
 * - Uses wallet prop for dynamic allocation
 * - Shows message if no assets
 * - Type safe
 */
const AssetAllocation: React.FC<AssetAllocationProps> = ({ wallet }) => {
  // Early return if wallet is null
  if (!wallet) {
    return <div className="bg-card rounded-xl p-4 shadow-sm">No wallet selected.</div>;
  }

  // Example: derive asset allocation from wallet (if wallet has tokens)
  const tokens = wallet.tokens || [];
  const totalValue = tokens.reduce((sum, t) => sum + t.valueUSD, 0);
  const allocation = totalValue > 0
    ? tokens.map((t) => ({
        name: t.name || t.symbol,
        symbol: t.symbol,
        percentage: Math.round((t.valueUSD / totalValue) * 100),
        color: getColorForAsset(t.symbol)
      }))
    : [];

  if (!allocation.length) {
    return <div className="bg-card rounded-xl p-4 shadow-sm">No asset data available for this wallet.</div>;
  }

  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
      <div className="space-y-4">
        {allocation.map((asset) => (
          <div key={asset.symbol || asset.name}>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${asset.color}`}></div>
                <span className="font-medium">
                  {asset.name} {asset.symbol && `(${asset.symbol})`}
                </span>
              </div>
              <span className="font-semibold">{asset.percentage}%</span>
            </div>
            <Progress 
              value={asset.percentage} 
              className={`h-2 ${asset.color}`} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

// Helper function to get a color for an asset based on its symbol
function getColorForAsset(symbol: string): string {
  const colorMap: Record<string, string> = {
    'BTC': 'bg-crypto-bitcoin',
    'ETH': 'bg-crypto-ethereum',
    'SOL': 'bg-crypto-solana',
    'BNB': 'bg-crypto-bnb',
    'USDT': 'bg-green-500',
    'USDC': 'bg-blue-500',
    'ADA': 'bg-blue-700',
    'DOT': 'bg-pink-500',
    'AVAX': 'bg-red-500',
    'MATIC': 'bg-purple-500',
    'LINK': 'bg-blue-400',
    'UNI': 'bg-pink-400',
    'AAVE': 'bg-purple-400',
    'SNX': 'bg-indigo-500',
    'COMP': 'bg-teal-500',
  };
  
  return colorMap[symbol] || 'bg-crypto-other';
}

export default AssetAllocation;