import React, { useEffect, useState, useMemo } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { walletService } from '../services/wallet.service';
import { WALLET_CONFIG } from '../config/wallet.config';
import { WalletConnection } from '../services/wallet-manager';
import DailyPointsMiner from './DailyPointsMiner';

/**
 * WalletDashboard displays and manages the selected wallet's information.
 * - Uses wallet prop for all wallet-specific data
 * - Shows loading/error states
 * - Masks sensitive info
 * - Type safe
 */
interface WalletDashboardProps {
  className?: string;
  wallet: WalletConnection;
}

const WalletDashboard: React.FC<WalletDashboardProps> = ({ className, wallet }) => {
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState(WALLET_CONFIG.supportedNetworks[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallets = async () => {
      try {
        setError(null);
        const walletsData = await walletService.getAllWallets();
      } catch (e) {
        setError('Failed to load wallets');
      }
    };
    fetchWallets();
  }, []);

  const handleAddWallet = async () => {
    if (!newWalletAddress) return;
    setLoading(true);
    setError(null);
    try {
      await walletService.addWallet(newWalletAddress, selectedNetwork);
      setNewWalletAddress('');
    } catch (error) {
      setError('Error adding wallet');
      console.error('Error adding wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mask address helper
  const maskAddress = (address: string) =>
    address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  // Memoize wallet info for performance
  const walletInfo = useMemo(() => wallet, [wallet]);

  if (!walletInfo) {
    return <div className={`space-y-4 ${className}`}><Card className="p-6">No wallet selected.</Card></div>;
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto mt-8">
      <div className="rounded-3xl bg-gradient-to-br from-emerald-900/80 to-black/80 shadow-2xl p-8 flex flex-col md:flex-row items-center gap-8 border border-emerald-700/40">
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-700 shadow-lg flex items-center justify-center">
            <img src="Avilasha.svg" alt="Avilasha Logo" className="w-16 h-16 object-contain drop-shadow-[0_0_10px_rgba(0,255,0,0.3)]" onError={e => (e.currentTarget.style.display = 'none')}/>
          </div>
          <div className="text-lg font-semibold bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent tracking-tight">Avilasha</div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
            <div className="text-2xl font-bold">{walletInfo.name || 'My Wallet'}</div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="bg-emerald-800/40 px-3 py-1 rounded-full font-semibold text-emerald-200">{walletInfo.network?.toUpperCase() || 'ETH'}</span>
              <span className="bg-black/30 px-3 py-1 rounded-full">{maskAddress(walletInfo.address)}</span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 mt-2">
            <div className="text-4xl font-extrabold text-green-300">${walletInfo.balance?.toLocaleString() ?? '0.00'}</div>
            <div className="text-xs text-muted-foreground">Last synced: {walletInfo.lastSynced ? new Date(walletInfo.lastSynced).toLocaleTimeString() : 'N/A'}</div>
          </div>
        </div>
      </div>
      {/* Add more modern dashboard widgets below if desired */}
    </div>
  );
};

export default WalletDashboard;