import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageSquare, Mic, Bell, User } from 'lucide-react';
import WindowControls from './WindowControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { walletService } from '@/services/wallet.service';
import { setSelectedWallet } from '@/services/selectedWallet';
import WalletDropdown from './WalletDropdown';

interface HeaderProps {
  onTrackWallet: () => void;
}

const Header = ({ onTrackWallet }: HeaderProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { toast } = useToast();
  const [wallets, setWallets] = useState([]);
  const [selectedWalletIdx, setSelectedWalletIdx] = useState(0);
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      if (allWallets.length) setSelectedWallet(allWallets[selectedWalletIdx]);
    }
    fetchWallets();
  }, []);

  useEffect(() => {
    if (wallets.length) setSelectedWallet(wallets[selectedWalletIdx]);
  }, [selectedWalletIdx, wallets]);

  const handleWalletConnect = () => setShowWalletModal(true);

  const handleSelectWallet = (idx: number) => {
    setSelectedWalletIdx(idx);
    setSelectedWallet(wallets[idx]);
  };

  const handleRemoveWallet = async (idx: number) => {
    const addr = wallets[idx].address;
    await walletService.removeWallet(addr);
    const updated = await walletService.getAllWallets?.() || [];
    setWallets(updated);
    if (selectedWalletIdx >= updated.length) setSelectedWalletIdx(0);
    if (updated.length) setSelectedWallet(updated[0]);
    else setSelectedWallet(null);
  };

  return (
    <header className="fixed top-0 left-0 w-full z-30 bg-background/80 backdrop-blur-md shadow-md flex items-center justify-between px-6 py-3 draggable-area" style={{ WebkitAppRegion: 'drag', appRegion: 'drag' }}>
      <div className="flex items-center gap-4 w-full">
        <img src="/Avilasha.svg" alt="Logo" className="w-9 h-9 rounded-full shadow-lg no-drag" style={{ WebkitAppRegion: 'no-drag', appRegion: 'no-drag' }} />
        <div className={`relative w-80 transition-all duration-200 ease-in-out ${isSearchFocused ? 'scale-105' : ''}`}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            type="search"
            placeholder="Search assets, wallets, transactions..."
            className="pl-10 bg-secondary border-none transition-all duration-300 hover:shadow-md"
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
          />
        </div>
        <div className="flex items-center space-x-2">
          {wallets.length ? (
            <WalletDropdown
              wallets={wallets}
              selectedWalletIdx={selectedWalletIdx}
              onSelect={handleSelectWallet}
              onRemove={handleRemoveWallet}
            />
          ) : (
            <Button 
              variant="luxury" 
              className="flex items-center gap-2 transition-all duration-300"
              onClick={handleWalletConnect}
            >
              <Wallet size={16} />
              <span>Connect Wallet</span>
            </Button>
          )}
          {showWalletModal && (
            <WalletConnectModal onConnect={() => {
              setShowWalletModal(false);
              (async () => {
                const allWallets = await walletService.getAllWallets?.() || [];
                setWallets(allWallets);
              })();
            }} />
          )}
          <Button 
            variant="ghost" 
            size="icon"
            className="transition-transform duration-300 hover:rotate-90"
            onClick={() => toast({
              title: "Add New Wallet",
              description: "Feature to add a new wallet coming soon",
            })}
          >
            <Plus size={20} />
          </Button>
          
          <Button 
            onClick={onTrackWallet}
            variant="luxury"
            className="transition-all duration-300"
          >
            Track Wallet
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="transition-all duration-300 hover:bg-primary/10"
            onClick={() => toast({
              title: "Messages",
              description: "You have no new messages",
            })}
          >
            <MessageSquare size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="transition-all duration-300 hover:bg-primary/10"
            onClick={() => toast({
              title: "Voice Assistant",
              description: "Voice commands coming soon",
            })}
          >
            <Mic size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="transition-all duration-300 hover:bg-primary/10"
            onClick={() => toast({
              title: "Notifications",
              description: "You have no new notifications",
            })}
          >
            <Bell size={20} />
          </Button>
          
          <Button 
            variant="ghost" 
            className="h-9 w-9 rounded-full p-0 transition-all duration-300 hover:bg-primary/10"
            onClick={() => toast({
              title: "User Profile",
              description: "Profile settings coming soon",
            })}
          >
            <User size={20} />
          </Button>
        </div>
      </div>
      <div className="window-controls no-drag">
        <WindowControls />
      </div>
    </header>
  );
};

// This icon isn't in the imported set, so creating a custom one
const Wallet = ({ size = 24, className = "" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M20 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
    <path d="M14 6V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
    <path d="M18 12h.01" />
  </svg>
);

export default Header;