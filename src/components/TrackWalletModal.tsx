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
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg rounded-2xl shadow-2xl bg-gradient-to-br from-white via-blue-50 to-purple-50 border border-primary/10 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-primary drop-shadow-glow mb-2 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" /> Track a Wallet
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 mb-4">
          <Label className="text-xs font-semibold">Wallet Address
            <Input value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x... or domain" className="mt-1 focus:ring-2 focus:ring-primary/30" />
          </Label>
          <Label className="text-xs font-semibold">Nickname (optional)
            <Input value={nickname} onChange={e => setNickname(e.target.value)} placeholder="e.g. My Main ETH" className="mt-1 focus:ring-2 focus:ring-primary/30" />
          </Label>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold mb-1">Chains</div>
          <div className="flex flex-wrap gap-2">
            {chains.map(chain => (
              <button key={chain.id} type="button" onClick={() => handleToggleChain(chain.id)} className={`px-3 py-1 rounded-full border text-xs transition ${selectedChains.includes(chain.id) ? 'bg-primary text-white border-primary' : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-primary/10'}`}>{chain.name}</button>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="text-xs font-semibold mb-1">Tags</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map(tag => (
              <Badge key={tag.id} className={`cursor-pointer px-2 py-1 rounded-full text-xs ${selectedTags.includes(tag.id) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`} onClick={() => handleToggleTag(tag.id)}>{tag.name}</Badge>
            ))}
            {showAddTag ? (
              <Input autoFocus value={newTag} onChange={e => setNewTag(e.target.value)} onBlur={addNewTag} onKeyDown={e => e.key === 'Enter' && addNewTag()} className="w-24 text-xs px-2 py-1" placeholder="New tag..." />
            ) : (
              <button type="button" className="text-xs underline text-primary" onClick={() => setShowAddTag(true)}>+ Add Tag</button>
            )}
          </div>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2">
          <Label className="flex items-center gap-2 text-xs font-semibold">
            <Switch checked={allTransactions} onCheckedChange={setAllTransactions} />
            Notify for all transactions
          </Label>
          <Label className="flex items-center gap-2 text-xs font-semibold">
            <Switch checked={largeTransactions} onCheckedChange={setLargeTransactions} />
            Notify for large transactions
          </Label>
        </div>
        <DialogFooter className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose} className="transition hover:bg-primary/10">Cancel</Button>
          <Button className="bg-primary text-white rounded transition hover:bg-primary/90">Track Wallet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TrackWalletModal;
