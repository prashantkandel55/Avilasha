import React, { useState, useEffect } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import WalletDashboard from '../components/WalletDashboard';
import PortfolioStatsRow from '@/components/DashboardCards';
import PortfolioChart from '@/components/PortfolioChart';
import AssetAllocation from '@/components/AssetAllocation';
import TopAssets from '@/components/TopAssets';
import TopCryptos from '@/components/TopCryptos';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';
import { Button } from '@/components/ui/button';
import ProfilePoints from '../components/ProfilePoints';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { getSelectedWallet, subscribeSelectedWallet } from '@/services/selectedWallet';

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedWallet, setSelectedWalletState] = useState(getSelectedWallet());

  useEffect(() => {
    const unsub = subscribeSelectedWallet((wallet) => setSelectedWalletState(wallet));
    return () => unsub();
  }, []);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your dashboard.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal onConnect={() => {
            setShowWalletModal(false);
            (async () => {
              const allWallets = await walletService.getAllWallets?.() || [];
              setWallets(allWallets);
            })();
          }} />
        )}
      </div>
    );
  }

  return (
    <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in">
      <div className="flex justify-between items-center mb-6 slide-up-animation">
        <div>
          <h1 className="text-3xl font-bold mb-1">Welcome to Dashboard</h1>
          <p className="text-muted-foreground">Track your crypto wallets and monitor market activity</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10"
          onClick={() => setNotificationModalOpen(true)}
        >
          <Bell size={16} />
          <span>Notifications</span>
        </Button>
      </div>
      {/* Profile Points for Airdrop Eligibility */}
      <div className="mb-6">
        <ProfilePoints />
      </div>
      <PortfolioStatsRow />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 transition-all duration-500 hover:shadow-lg rounded-lg">
          <WalletDashboard className="mb-6" wallet={selectedWallet} />
          <PortfolioChart wallet={selectedWallet} />
        </div>
        <div className="transition-all duration-500 hover:shadow-lg rounded-lg">
          <AssetAllocation wallet={selectedWallet} />
        </div>
      </div>
      
      <div className="mb-6 fade-in-animation">
        <TopAssets wallet={selectedWallet} />
      </div>
      
      <div className="mb-6 fade-in-animation">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Top 10 Cryptocurrencies</h3>
          <div className="text-sm text-muted-foreground">Real-time market data</div>
        </div>
        <TopCryptos />
      </div>
      
      <NotificationSettingsModal 
        open={notificationModalOpen} 
        onClose={() => setNotificationModalOpen(false)} 
      />
    </div>
  );
};

export default Dashboard;
