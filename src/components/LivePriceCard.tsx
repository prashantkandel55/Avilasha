import React from 'react';
import { usePriceUpdates } from '@/hooks/use-price-updates';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

type LivePriceCardProps = {
  symbols: string[];
  title?: string;
  showDetails?: boolean;
  maxItems?: number;
};

export const LivePriceCard: React.FC<LivePriceCardProps> = ({ symbols, title = 'Live Prices', showDetails = false, maxItems = 5 }) => {
  const { prices, isConnected, error } = usePriceUpdates(symbols);

  return (
    <Card className="glassmorphism-dark overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {title}
          {isConnected && (
            <span className="text-xs px-2 py-1 bg-green-500/20 text-green-500 rounded-full">
              Live
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="space-y-4">
            {Object.values(prices)
              .slice(0, maxItems)
              .map((price) => (
                <div key={price.symbol} className="flex items-center justify-between hover:bg-muted/50 p-2 rounded-lg transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{price.name}</span>
                    <span className="text-xs text-muted-foreground">{price.symbol}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="font-medium">${price.price}</div>
                    <div className="flex items-center gap-4">
                      <div
                        className={`text-sm flex items-center ${parseFloat(price.change24h) >= 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {parseFloat(price.change24h) >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                        {price.change24h}
                      </div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          <div>MC: {price.marketCap}</div>
                          <div>Vol: {price.volume24h}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};