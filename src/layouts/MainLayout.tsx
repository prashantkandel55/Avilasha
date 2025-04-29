import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TrackWalletModal from '@/components/TrackWalletModal';
import AvilashaAssistant from '@/components/AvilashaAssistant';
import { useToast } from '@/hooks/use-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationBell from '@/components/NotificationBell';

const MainLayout = () => {
  const [trackWalletOpen, setTrackWalletOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  
  // Handle page title and notifications on route change
  useEffect(() => {
    const path = location.pathname.replace('/', '');
    const pageName = path.charAt(0).toUpperCase() + path.slice(1) || 'Dashboard';
    document.title = `${pageName} | Avilasha Crypto`;
    
    // Show welcome toast on first load
    if (path === '' && !localStorage.getItem('welcomed')) {
      setTimeout(() => {
        toast({
          title: "Welcome to Avilasha",
          description: "Your comprehensive crypto portfolio tracker",
        });
        localStorage.setItem('welcomed', 'true');
      }, 1000);
    }
  }, [location, toast]);
  
  function Breadcrumbs() {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter(Boolean);
    return (
      <nav className="text-sm mb-4" aria-label="Breadcrumb">
        <ol className="flex items-center space-x-2">
          <li>
            <Link to="/" className="text-primary hover:underline">Home</Link>
          </li>
          {pathnames.map((value, idx) => {
            const to = '/' + pathnames.slice(0, idx + 1).join('/');
            const isLast = idx === pathnames.length - 1;
            return (
              <li key={to} className="flex items-center">
                <span className="mx-2">/</span>
                {isLast ? (
                  <span className="text-muted-foreground">{value.charAt(0).toUpperCase() + value.slice(1)}</span>
                ) : (
                  <Link to={to} className="text-primary hover:underline">{value.charAt(0).toUpperCase() + value.slice(1)}</Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
  
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-background">
        <Header onTrackWallet={() => setTrackWalletOpen(true)} />
        <div className="absolute top-3 right-8 z-50">
          <NotificationBell />
        </div>
        <Sidebar />
        
        <main className={`transition-all duration-300 ml-60 pt-16 min-h-screen`}>
          <div className="container py-6 px-4 lg:px-6 mx-auto max-w-6xl">
            <Breadcrumbs />
            <Outlet />
          </div>
        </main>
        
        <TrackWalletModal
          open={trackWalletOpen}
          onClose={() => {
            setTrackWalletOpen(false);
            toast({
              title: "Wallet Tracked",
              description: "Your wallet has been successfully tracked",
            });
          }}
        />
        
        {/* Avilasha AI Assistant */}
        <AvilashaAssistant />
      </div>
    </NotificationProvider>
  );
};

export default MainLayout;
