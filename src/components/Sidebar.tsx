import React, { useState } from 'react';
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
    <span className={cn({ hidden: active })}>{label}</span>
  </Link>
);

const Sidebar = () => {
  const location = useLocation();
  const path = location.pathname;
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (route: string) => {
    if (route === '/') {
      return path === '/';
    }
    return path.startsWith(route);
  };

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen ${collapsed ? 'w-16' : 'w-60'} pt-16 pb-4 bg-sidebar border-r border-border transition-all duration-300`}>
      <div className="flex flex-col h-full px-3 py-4">
        <Button 
          className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity mb-6"
          onClick={() => {/* trigger add wallet modal */}}
        >
          <Plus size={18} />
          {!collapsed && <span>Add New Wallet</span>}
        </Button>
        <Button
          variant="ghost"
          className="absolute top-2 right-2"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="sr-only">{collapsed ? 'Expand' : 'Collapse'}</span>
          <svg className={`w-4 h-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.293 9.293a1 1 0 011.414 0L10 11.586l2.293-2.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
        </Button>
        <div className="space-y-6 flex-1 overflow-y-auto">
          <div>
            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ${collapsed ? 'hidden' : ''}`}>OVERVIEW</h3>
            <nav className="space-y-1">
              <SidebarItem to="/" icon={<LayoutDashboard />} label="Dashboard" active={isActive('/')} />
              <SidebarItem to="/transfer" icon={<TrendingUp />} label="Transfer" active={isActive('/transfer')} />
              <SidebarItem to="/portfolio" icon={<LineChart />} label="Portfolio Analytics" active={isActive('/portfolio')} />
              <SidebarItem to="/market" icon={<TrendingUp />} label="Market Analysis" active={isActive('/market')} />
            </nav>
          </div>
          
          <div>
            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ${collapsed ? 'hidden' : ''}`}>ASSETS</h3>
            <nav className="space-y-1">
              <SidebarItem to="/assets" icon={<Database />} label="Assets" active={isActive('/assets')} />
              <SidebarItem to="/wallets" icon={<Wallet />} label="Wallets" active={isActive('/wallets')} />
              <SidebarItem to="/defi" icon={<Database />} label="DeFi" active={isActive('/defi')} />
              <SidebarItem to="/nfts" icon={<FileImage />} label="NFTs" active={isActive('/nfts')} />
            </nav>
          </div>
          
          <div>
            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ${collapsed ? 'hidden' : ''}`}>ACTIVITY</h3>
            <nav className="space-y-1">
              <SidebarItem to="/history" icon={<History />} label="History" active={isActive('/history')} />
              <SidebarItem to="/alerts" icon={<Bell />} label="Alerts" active={isActive('/alerts')} />
              <SidebarItem to="/news" icon={<Newspaper />} label="News" active={isActive('/news')} />
              <SidebarItem to="/quests" icon={<Gift />} label="Quests & Airdrop" active={isActive('/quests')} />
            </nav>
          </div>
          
          <div>
            <h3 className={`px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 ${collapsed ? 'hidden' : ''}`}>SUPPORT</h3>
            <nav className="space-y-1">
              <SidebarItem to="/help" icon={<HelpCircle />} label="Help Center" active={isActive('/help')} />
              <SidebarItem to="/onboarding" icon={<HelpCircle />} label="App Tour" active={isActive('/onboarding')} />
              <SidebarItem to="/settings" icon={<Settings />} label="Settings" active={isActive('/settings')} />
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
