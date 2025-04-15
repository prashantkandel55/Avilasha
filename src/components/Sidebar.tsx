import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  LineChart, 
  TrendingUp, 
  Wallet, 
  Database, 
  FileImage, 
  History,
  Bell, 
  Newspaper, 
  HelpCircle, 
  Settings,
  Plus,
  Gift
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ to, icon, label, active }: SidebarItemProps) => (
  <Link to={to} className={cn("sidebar-item", active && "active")}>
    {icon}
    <span>{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;

  const isActive = (route: string) => {
    if (route === '/') {
      return path === '/';
    }
    return path.startsWith(route);
  };

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-60 pt-16 pb-4 bg-sidebar border-r border-border">
      <div className="flex flex-col h-full px-3 py-4">
        <Button 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity mb-6"
        >
          <Plus size={18} />
          <span>Add New Wallet</span>
        </Button>
        
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              OVERVIEW
            </h3>
            <nav className="space-y-1">
              <SidebarItem 
                to="/" 
                icon={<LayoutDashboard size={18} />} 
                label="Dashboard" 
                active={isActive('/')} 
              />
              <SidebarItem 
                to="/portfolio" 
                icon={<LineChart size={18} />} 
                label="Portfolio Analytics" 
                active={isActive('/portfolio')} 
              />
              <SidebarItem 
                to="/market" 
                icon={<TrendingUp size={18} />} 
                label="Market Analysis" 
                active={isActive('/market')} 
              />
            </nav>
          </div>
          
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              ASSETS
            </h3>
            <nav className="space-y-1">
              <SidebarItem 
                to="/assets" 
                icon={<Database size={18} />} 
                label="Assets" 
                active={isActive('/assets')} 
              />
              <SidebarItem 
                to="/wallets" 
                icon={<Wallet size={18} />} 
                label="Wallets" 
                active={isActive('/wallets')} 
              />
              <SidebarItem 
                to="/defi" 
                icon={<Database size={18} />} 
                label="DeFi" 
                active={isActive('/defi')} 
              />
              <SidebarItem 
                to="/nfts" 
                icon={<FileImage size={18} />} 
                label="NFTs" 
                active={isActive('/nfts')} 
              />
            </nav>
          </div>
          
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              ACTIVITY
            </h3>
            <nav className="space-y-1">
              <SidebarItem 
                to="/history" 
                icon={<History size={18} />} 
                label="History" 
                active={isActive('/history')} 
              />
              <SidebarItem 
                to="/alerts" 
                icon={<Bell size={18} />} 
                label="Alerts" 
                active={isActive('/alerts')} 
              />
              <SidebarItem 
                to="/news" 
                icon={<Newspaper size={18} />} 
                label="News" 
                active={isActive('/news')} 
              />
              <SidebarItem 
                to="/quests" 
                icon={<Gift size={18} />} 
                label="Quests & Airdrop" 
                active={isActive('/quests')} 
              />
            </nav>
          </div>
          
          <div>
            <h3 className="px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              SUPPORT
            </h3>
            <nav className="space-y-1">
              <SidebarItem 
                to="/help" 
                icon={<HelpCircle size={18} />} 
                label="Help Center" 
                active={isActive('/help')} 
              />
              <SidebarItem 
                to="/onboarding" 
                icon={<HelpCircle size={18} />} 
                label="App Tour" 
                active={isActive('/onboarding')} 
              />
              <SidebarItem 
                to="/settings" 
                icon={<Settings size={18} />} 
                label="Settings" 
                active={isActive('/settings')} 
              />
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
