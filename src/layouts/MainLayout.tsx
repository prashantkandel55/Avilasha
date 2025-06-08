import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TrackWalletModal from '@/components/TrackWalletModal';
import AvilashaAssistant from '@/components/AvilashaAssistant';
import { useToast } from '@/hooks/use-toast';
import { NotificationProvider } from '@/context/NotificationContext';
import NotificationBell from '@/components/NotificationBell';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import { motion, AnimatePresence } from 'framer-motion';
import { SplashCursor } from '@/components/ui/splash-cursor';

const MainLayout = () => {
  const [trackWalletOpen, setTrackWalletOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { toast } = useToast();
  const location = useLocation();
  const [showSplashCursor, setShowSplashCursor] = useState(false);
  
  // Handle page title and notifications on route change
  useEffect(() => {
    const currentPage = location.pathname.replace('/', '') || 'dashboard';
    document.title = `${currentPage.charAt(0).toUpperCase() + currentPage.slice(1)} | Avilasha Crypto`;
    
    // Show welcome toast on first load
    if (currentPage === '' && !localStorage.getItem('welcomed')) {
      setTimeout(() => {
        toast({
          title: "Welcome to Avilasha",
          description: "Your comprehensive crypto portfolio tracker",
        });
        localStorage.setItem('welcomed', 'true');
      }, 1000);
    }

    // Show splash cursor effect for 5 seconds on page change
    setShowSplashCursor(true);
    const timer = setTimeout(() => {
      setShowSplashCursor(false);
    }, 5000);

    return () => clearTimeout(timer);
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
        {showSplashCursor && <SplashCursor />}
        <Header onTrackWallet={() => setTrackWalletOpen(true)} />
        <div className="absolute top-3 right-8 z-50 flex items-center gap-2">
          <ThemeSwitcher />
          <NotificationBell />
        </div>
        <Sidebar />
        
        <main className={`transition-all duration-300 ml-60 pt-16 min-h-screen`}>
          <div className="container py-6 px-4 lg:px-6 mx-auto max-w-6xl">
            <Breadcrumbs />
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
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