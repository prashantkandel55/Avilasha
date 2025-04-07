
import React, { useState } from 'react';
import { Bell, RefreshCw } from 'lucide-react';
import { WalletDashboard } from '../components/WalletDashboard';
import PortfolioStatsRow from '@/components/DashboardCards';
import PortfolioChart from '@/components/PortfolioChart';
import AssetAllocation from '@/components/AssetAllocation';
import TopAssets from '@/components/TopAssets';
import TopCryptos from '@/components/TopCryptos';
import NotificationSettingsModal from '@/components/NotificationSettingsModal';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  return (
    <div className="animate-fade-in">
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
      
      <PortfolioStatsRow />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 transition-all duration-500 hover:shadow-lg rounded-lg">
          <WalletDashboard className="mb-6" />
          <PortfolioChart />
        </div>
        <div className="transition-all duration-500 hover:shadow-lg rounded-lg">
          <AssetAllocation />
        </div>
      </div>
      
      <div className="mb-6 fade-in-animation">
        <TopAssets />
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
