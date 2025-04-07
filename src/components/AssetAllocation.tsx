
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface Asset {
  name: string;
  symbol: string;
  percentage: number;
  color: string;
}

const assets: Asset[] = [
  { name: 'Bitcoin', symbol: 'BTC', percentage: 45, color: 'bg-crypto-bitcoin' },
  { name: 'Ethereum', symbol: 'ETH', percentage: 30, color: 'bg-crypto-ethereum' },
  { name: 'Solana', symbol: 'SOL', percentage: 15, color: 'bg-crypto-solana' },
  { name: 'Others', symbol: '', percentage: 10, color: 'bg-crypto-other' },
];

const AssetAllocation = () => {
  return (
    <div className="bg-card rounded-xl p-4 shadow-sm">
      <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
      
      <div className="space-y-4">
        {assets.map((asset) => (
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

export default AssetAllocation;
