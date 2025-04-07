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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Price Alert</DialogTitle>
          <DialogDescription>
            Get notified when the price reaches your target.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {coin && (
            <div className="flex items-center space-x-3 mb-4">
              <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
              <div>
                <div className="font-medium">{coin.name}</div>
                <div className="text-sm text-muted-foreground">
                  Current price: ${coin.current_price.toLocaleString()}
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="price">Target Price (USD)</Label>
            <Input
              id="price"
              type="number"
              step="any"
              min="0"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="Enter target price"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label>Alert Condition</Label>
            <RadioGroup value={condition} onValueChange={(value) => setCondition(value as 'above' | 'below')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="above" id="above" />
                <Label htmlFor="above">Price goes above target</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="below" id="below" />
                <Label htmlFor="below">Price goes below target</Label>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit">Create Alert</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PriceAlertModal;