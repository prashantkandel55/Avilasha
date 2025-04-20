import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, Trash2 } from 'lucide-react';
import NetworkIcon from './NetworkIcon';

interface WalletDropdownProps {
  wallets: any[];
  selectedWalletIdx: number;
  onSelect: (idx: number) => void;
  onRemove: (idx: number) => void;
}

const WalletDropdown: React.FC<WalletDropdownProps> = ({ wallets, selectedWalletIdx, onSelect, onRemove }) => {
  const [open, setOpen] = useState(false);
  if (!wallets.length) return null;
  return (
    <div className="relative">
      <Button
        variant="outline"
        className="flex items-center gap-2 transition-all duration-300 hover:shadow-md"
        onClick={() => setOpen((v) => !v)}
      >
        <NetworkIcon chain={wallets[selectedWalletIdx]?.chain} size={18} />
        <span className="truncate max-w-[110px]">
          {wallets[selectedWalletIdx]?.chain.charAt(0).toUpperCase() + wallets[selectedWalletIdx]?.chain.slice(1)}
          : {wallets[selectedWalletIdx]?.address.slice(0, 6)}...{wallets[selectedWalletIdx]?.address.slice(-4)}
        </span>
        <span className="ml-2 text-xs text-muted-foreground font-mono">
          ${wallets[selectedWalletIdx]?.totalValueUSD?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}
        </span>
        <ChevronDown size={16} />
      </Button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-background border border-border rounded-lg shadow-lg z-50">
          {wallets.map((w, idx) => (
            <div
              key={w.address}
              className={`flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-secondary ${idx === selectedWalletIdx ? 'bg-primary/10 font-bold' : ''}`}
              onClick={() => {
                setOpen(false);
                onSelect(idx);
              }}
            >
              <div className="flex items-center gap-2">
                <NetworkIcon chain={w.chain} size={16} />
                <span className="truncate">
                  {w.chain.charAt(0).toUpperCase() + w.chain.slice(1)}: {w.address.slice(0, 8)}...{w.address.slice(-4)}
                </span>
                <span className="ml-2 text-xs text-muted-foreground font-mono">
                  ${w.totalValueUSD?.toLocaleString(undefined, { maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>
              <button
                className="ml-2 text-red-500 hover:text-red-700"
                onClick={e => {
                  e.stopPropagation();
                  onRemove(idx);
                }}
                title="Remove Wallet"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WalletDropdown;
