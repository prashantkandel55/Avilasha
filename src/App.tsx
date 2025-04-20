import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import MainLayout from "./layouts/MainLayout";
import { toast } from "sonner";
import { ThemeProvider } from "next-themes";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthService } from '@/services/authService';

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const PortfolioAnalytics = lazy(() => import("./pages/PortfolioAnalytics"));
const MarketAnalysis = lazy(() => import("./pages/MarketAnalysis"));
const Assets = lazy(() => import("./pages/Assets"));
const Wallets = lazy(() => import("./pages/Wallets"));
const DeFi = lazy(() => import("./pages/DeFi"));
const NFTs = lazy(() => import("./pages/NFTs"));
const History = lazy(() => import("./pages/History"));
const Alerts = lazy(() => import("./pages/Alerts"));
const News = lazy(() => import("./pages/News"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Create query client with defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 300000, // 5 minutes
    },
  },
});

// Define types for Electron bridge
type ElectronBridge = {
  minimize: () => void;
  maximize: () => void;
  close: () => void;
  isMaximized: () => Promise<boolean>;
  onMaximizeChange: (callback: (isMaximized: boolean) => void) => void;
  onUpdateAvailable: (callback: () => void) => void;
  onUpdateDownloaded: (callback: () => void) => void;
  hideToTray: () => void;
  showFromTray: () => void;
  onShowError: (callback: (error: { title: string; message: string }) => void) => void;
}

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial authentication state with Supabase
    AuthService.getCurrentUser().then(user => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    // Listen for Supabase auth state changes
    const { data: listener } = AuthService.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session?.user);
      setIsLoading(false);
    });

    return () => {
      if (listener && typeof listener.subscription?.unsubscribe === 'function') {
        listener.subscription.unsubscribe();
      }
    };
  }, []);

  if (isLoading) {
    return <PageLoader />;
  }

  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/auth" replace />
  );
};

const App = () => {
  // Error handling for Electron messages
  useEffect(() => {
    // Check if Electron bridge is available and has the error handler
    if (typeof window !== 'undefined' && 
        window.electron && 
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        typeof window.electron.onShowError === 'function') {
      
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      const unsubscribe = window.electron.onShowError((error: { title: string; message: string }) => {
        toast.error(error.title, {
          description: error.message,
          duration: 5000,
        });
      });
      
      // Clean up subscription on unmount
      return () => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      };
    }
  }, []);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <HashRouter>
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="portfolio" element={<PortfolioAnalytics />} />
                    <Route path="market" element={<MarketAnalysis />} />
                    <Route path="assets" element={<Assets />} />
                    <Route path="wallets" element={<Wallets />} />
                    <Route path="defi" element={<DeFi />} />
                    <Route path="nfts" element={<NFTs />} />
                    <Route path="history" element={<History />} />
                    <Route path="alerts" element={<Alerts />} />
                    <Route path="news" element={<News />} />
                    <Route path="help" element={<HelpCenter />} />
                    <Route path="settings" element={<Settings />} />
                    <Route path="not-found" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/not-found" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </HashRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
