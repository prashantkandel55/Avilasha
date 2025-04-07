
import React, { useState } from 'react';
import { Search, Plus, MessageSquare, Mic, Bell, User } from 'lucide-react';
import WindowControls from './WindowControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface HeaderProps {
  onTrackWallet: () => void;
}

const Header = ({ onTrackWallet }: HeaderProps) => {
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { toast } = useToast();
  
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-background border-b border-border">
      <div className="flex h-full items-center justify-between pl-16 pr-0">
        <div className="flex items-center px-4">
          <div className="flex items-center mr-6">
            <div className="flex items-center justify-center rounded-md h-10 w-10 transition-transform duration-300 hover:scale-110">
              <img src="/lovable-uploads/a9b122d3-f7ef-4017-8eba-b492ec301e79.png" alt="Logo" className="h-full animate-pulse" />
            </div>
          </div>
          
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
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2 transition-all duration-300 hover:shadow-md"
            onClick={() => toast({
              title: "Connected Wallet",
              description: "Your Main Wallet is connected and synced",
            })}
          >
            <Wallet size={16} />
            <span>Main Wallet</span>
          </Button>
          
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
            className="bg-primary hover:bg-primary/90 text-white transition-all duration-300 hover:shadow-lg"
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
          <WindowControls />
        </div>
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
