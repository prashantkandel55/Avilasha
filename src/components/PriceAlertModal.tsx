import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { cryptoApiService, CryptoMarketData, PriceAlert } from '@/services/crypto-api';

interface PriceAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coin?: CryptoMarketData;
}

const PriceAlertModal: React.FC<PriceAlertModalProps> = ({ open, onOpenChange, coin }) => {
  const { toast } = useToast();
  const [targetPrice, setTargetPrice] = useState<string>(coin ? coin.current_price.toString() : '');
  const [condition, setCondition] = useState<'above' | 'below'>('above');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!coin) {
      toast({
        title: 'Error',
        description: 'No cryptocurrency selected',
        variant: 'destructive'
      });
      return;
    }
    
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      toast({
        title: 'Invalid Price',
        description: 'Please enter a valid price',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      cryptoApiService.createPriceAlert({
        coinId: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        targetPrice: price,
        currentPrice: coin.current_price,
        condition
      });
      
      toast({
        title: 'Price Alert Created',
        description: `You will be notified when ${coin.name} goes ${condition} $${price}`,
        variant: 'default'
      });
      
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create price alert',
        variant: 'destructive'
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-lg shadow-inner bg-gray-50">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create Price Alert</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mb-2">
            Get notified when the price reaches your target.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {coin && (
            <div className="flex items-center space-x-3 mb-4">
              <span className="font-semibold text-sm bg-primary/10 px-2 py-1 rounded text-primary">{coin.name} ({coin.symbol.toUpperCase()})</span>
              <span className="text-xs text-gray-500">Current: ${coin.current_price}</span>
            </div>
          )}
          <div className="grid grid-cols-1 gap-2">
            <Label className="text-xs font-semibold">Alert Condition</Label>
            <RadioGroup value={condition} onValueChange={setCondition} className="flex gap-4">
              <RadioGroupItem value="above" id="above" />
              <Label htmlFor="above" className="text-xs cursor-pointer">Above</Label>
              <RadioGroupItem value="below" id="below" />
              <Label htmlFor="below" className="text-xs cursor-pointer">Below</Label>
            </RadioGroup>
            <Label className="text-xs font-semibold mt-2">Target Price</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={targetPrice}
              onChange={e => setTargetPrice(e.target.value)}
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-primary/30"
              placeholder="Enter price"
              required
            />
          </div>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-primary text-white rounded hover:bg-primary/90 transition">Create Alert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertModal;