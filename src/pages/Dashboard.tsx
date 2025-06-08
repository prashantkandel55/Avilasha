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
import AvilashaLogo from '/Avilasha.svg';
import CryptoNewsWidget from '../components/CryptoNewsWidget';
import CoolFeatures from '../components/CoolFeatures';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [selectedWallet, setSelectedWalletState] = useState(getSelectedWallet());

  const [portfolioSummary, setPortfolioSummary] = useState<{totalValue: number, percentChange: number}>({totalValue: 0, percentChange: 0});
  const [topAssets, setTopAssets] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loadingWidgets, setLoadingWidgets] = useState(true);

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

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchDashboardData() {
      setLoadingWidgets(true);
      try {
        const walletsResp = await import('./PortfolioAnalytics');
        const fetchFn = walletsResp.fetchWalletsAndPricesAndHistoryAndActivity;
        if (fetchFn) {
          const { wallets, totalValue, percentChange, topAssets, recentActivity } = await fetchFn();
          setPortfolioSummary({ totalValue, percentChange });
          setTopAssets(topAssets);
          setRecentActivity(recentActivity);
        }
      } catch (e) {}
      setLoadingWidgets(false);
    }
    fetchDashboardData();
    interval = setInterval(fetchDashboardData, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading dashboard...</div>;
  }

  if (!wallets.length) {
    return (
      <motion.div 
        className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
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
      </motion.div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="absolute top-0 right-0 flex items-center gap-2">
        <ThemeSwitcher />
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setNotificationModalOpen(true)}
          className="rounded-full h-9 w-9 hover:bg-primary/10"
        >
          <Bell className="h-5 w-5" />
        </Button>
      </div>

      {/* Avilasha Logo, Greeting, and Animated Header */}
      <motion.div 
        className="flex items-center gap-4 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <img 
            src={AvilashaLogo} 
            alt="Avilasha Logo" 
            className="w-14 h-14 rounded-full shadow-neon bg-black/40 p-1 float-animation" 
            style={{ filter: 'drop-shadow(0 0 12px #00ffb3)' }} 
          />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background pulse-border-animation"></div>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gradient bg-gradient-to-r from-primary to-purple-600 tracking-tight">Welcome to Avilasha</h1>
          <span className="text-secondary-foreground text-base">Your smart crypto dashboard</span>
        </div>
      </motion.div>

      {/* --- Enhanced Dashboard Grid --- */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <PortfolioStatsRow />
      </motion.div>

      {/* --- Main Widgets Row --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <motion.div 
          className="col-span-2 flex flex-col gap-6"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-xl bg-card shadow-lg p-6 transition-all hover:shadow-xl">
            <PortfolioChart wallet={selectedWallet} />
          </div>
          <div className="rounded-xl bg-card shadow-lg p-6 transition-all hover:shadow-xl">
            <AssetAllocation wallet={selectedWallet} />
          </div>
        </motion.div>
        <motion.div 
          className="flex flex-col gap-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="rounded-xl bg-card shadow-lg p-6 flex flex-col items-center transition-all hover:shadow-xl">
            <h3 className="font-bold mb-2">Top Assets</h3>
            {loadingWidgets ? (
              <div className="w-full animate-pulse flex flex-col gap-2">
                <div className="h-4 bg-muted rounded w-2/3 mx-auto" />
                <div className="h-4 bg-muted rounded w-1/2 mx-auto" />
                <div className="h-4 bg-muted rounded w-1/3 mx-auto" />
              </div>
            ) : (
              <ul className="text-xs w-full">
                {topAssets.length === 0 ? <li>No assets</li> : topAssets.map((asset, idx) => (
                  <li key={idx}>{asset.symbol}: {asset.amount}</li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-xl bg-card shadow-lg p-6 flex flex-col items-center transition-all hover:shadow-xl">
            <ProfilePoints />
          </div>
          <CoolFeatures />
        </motion.div>
      </div>

      {/* --- News Feed Widget Row --- */}
      <motion.div 
        className="rounded-xl bg-card shadow-lg p-6 transition-all hover:shadow-xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <CryptoNewsWidget />
      </motion.div>

      {/* --- Notification Modal --- */}
      <NotificationSettingsModal open={notificationModalOpen} onClose={() => setNotificationModalOpen(false)} />
    </div>
  );
};

export default Dashboard;