
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { X, Plus, Bell, Wallet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Chain {
  id: string;
  name: string;
  color: string;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TrackWalletModalProps {
  open: boolean;
  onClose: () => void;
}

const chains: Chain[] = [
  { id: 'ethereum', name: 'Ethereum', color: 'bg-crypto-ethereum' },
  { id: 'bnb', name: 'BNB Chain', color: 'bg-crypto-bnb' },
  { id: 'polygon', name: 'Polygon', color: 'bg-purple-500' },
  { id: 'solana', name: 'Solana', color: 'bg-crypto-solana' },
];

const initialTags: Tag[] = [
  { id: 'memecoin', name: 'Memecoin Trader', color: 'bg-green-500' },
  { id: 'whale', name: 'Whale', color: 'bg-blue-500' },
];

const TrackWalletModal = ({ open, onClose }: TrackWalletModalProps) => {
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedChains, setSelectedChains] = useState<string[]>(['ethereum']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [newTag, setNewTag] = useState('');
  const [showAddTag, setShowAddTag] = useState(false);
  const [allTransactions, setAllTransactions] = useState(true);
  const [largeTransactions, setLargeTransactions] = useState(false);

  const handleToggleChain = (chainId: string) => {
    if (selectedChains.includes(chainId)) {
      setSelectedChains(selectedChains.filter(id => id !== chainId));
    } else {
      setSelectedChains([...selectedChains, chainId]);
    }
  };

  const handleToggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter(id => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const addNewTag = () => {
    if (newTag.trim()) {
      const tag = {
        id: newTag.toLowerCase().replace(/\s+/g, '-'),
        name: newTag,
        color: `bg-${['green', 'blue', 'purple', 'yellow', 'red'][Math.floor(Math.random() * 5)]}-500`,
      };
      setTags([...tags, tag]);
      setSelectedTags([...selectedTags, tag.id]);
      setNewTag('');
      setShowAddTag(false);
    }
  };

  const handleSubmit = () => {
    if (!walletAddress) {
      toast({
        title: "Error",
        description: "Wallet address is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedChains.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one blockchain",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Wallet Added",
      description: "The wallet has been added to your tracking list",
    });
    
    onClose();
    
    // Reset form
    setWalletAddress('');
    setNickname('');
    setSelectedChains(['ethereum']);
    setSelectedTags([]);
    setAllTransactions(true);
    setLargeTransactions(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold mb-2">Track Wallet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-2">
          <div>
            <Label htmlFor="wallet-address">Wallet Address</Label>
            <div className="relative mt-1.5">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                #
              </div>
              <Input
                id="wallet-address"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                className="pl-8"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="nickname">Nickname (Optional)</Label>
            <Input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g., Whale Wallet #1"
              className="mt-1.5"
            />
          </div>
          
          <div>
            <Label>Select Chains</Label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {chains.map((chain) => (
                <button
                  key={chain.id}
                  type="button"
                  onClick={() => handleToggleChain(chain.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                    selectedChains.includes(chain.id)
                      ? `${chain.color} text-white`
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full mr-1.5 ${
                    selectedChains.includes(chain.id) ? 'bg-white' : chain.color
                  }`}></span>
                  {chain.name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleToggleTag(tag.id)}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm ${
                    selectedTags.includes(tag.id)
                      ? `${tag.color} text-white`
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full mr-1.5 ${
                    selectedTags.includes(tag.id) ? 'bg-white' : tag.color
                  }`}></span>
                  {tag.name}
                </button>
              ))}
              
              {showAddTag ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="New tag name"
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === 'Enter' && addNewTag()}
                  />
                  <Button size="sm" variant="ghost" onClick={() => setShowAddTag(false)}>
                    <X size={16} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={addNewTag}>
                    <Plus size={16} />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 rounded-full"
                  onClick={() => setShowAddTag(true)}
                >
                  <Plus size={14} className="mr-1" />
                  Add Tag
                </Button>
              )}
            </div>
          </div>
          
          <div>
            <Label>Notification Preferences</Label>
            <div className="space-y-3 mt-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-primary" />
                  <span>All Transactions</span>
                </div>
                <Switch
                  checked={allTransactions}
                  onCheckedChange={(checked) => {
                    setAllTransactions(checked);
                    if (checked) setLargeTransactions(false);
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-yellow-500">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  <span>Large Transactions Only</span>
                </div>
                <Switch
                  checked={largeTransactions}
                  onCheckedChange={(checked) => {
                    setLargeTransactions(checked);
                    if (checked) setAllTransactions(false);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-primary hover:bg-primary/90"
            onClick={handleSubmit}
          >
            Start Tracking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackWalletModal;
