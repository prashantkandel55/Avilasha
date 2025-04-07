
import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Plus, Lock, Unlock, Mic, MicOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { web3Service } from '@/services/web3';
import { securityService } from '@/services/security';
import { sessionTimeoutService } from '@/services/session-timeout';
import { voiceService } from '@/services/voice';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TopCryptos from '@/components/TopCryptos';
import TrackWalletModal from '@/components/TrackWalletModal';

const getTransactionIcon = (type: string) => {
  if (type === "Received") {
    return <ArrowDownLeft className="text-green-500" />;
  } else if (type === "Sent") {
    return <ArrowUpRight className="text-red-500" />;
  } else {
    return <RefreshCw className="text-blue-500" />;
  }
};

const Wallets = () => {
  const { toast } = useToast();
  const [trackWalletOpen, setTrackWalletOpen] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [isWalletLocked, setIsWalletLocked] = useState(securityService.isWalletLocked());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);

  // Initialize auto-lock timer
  useEffect(() => {
    // Configure and initialize session timeout
    sessionTimeoutService.initialize({
      timeoutMinutes: 5, // Lock wallet after 5 minutes of inactivity
      warningMinutes: 1, // Show warning 1 minute before locking
      onTimeout: () => {
        securityService.lockWallet();
        setIsWalletLocked(true);
      },
      onWarning: () => {
        toast({
          title: 'Auto-Lock Warning',
          description: 'Your wallet will be locked in 1 minute due to inactivity.',
          variant: 'warning'
        });
      }
    });

    // Listen for wallet lock changes
    const handleWalletLockChange = (event: CustomEvent) => {
      setIsWalletLocked(event.detail.isLocked);
    };

    window.addEventListener('wallet-lock-changed', handleWalletLockChange as EventListener);

    // Setup voice commands
    const voiceInitialized = voiceService.initialize();
    if (voiceInitialized) {
      // Register voice commands
      voiceService.registerCommand({
        command: 'lock wallet',
        handler: () => {
          securityService.lockWallet();
          setIsWalletLocked(true);
        },
        description: 'Lock wallet'
      });

      voiceService.registerCommand({
        command: 'unlock wallet',
        handler: () => {
          securityService.unlockWallet();
          setIsWalletLocked(false);
        },
        description: 'Unlock wallet'
      });

      voiceService.registerCommand({
        command: 'show balance',
        handler: () => {
          if (connectedWallets.length > 0) {
            const address = connectedWallets[0];
            const balance = walletBalances?.[address] || '0';
            voiceService.speak(`Your wallet balance is ${Number(balance).toFixed(4)} ETH`);
          } else {
            voiceService.speak('No wallet connected');
          }
        },
        description: 'Show wallet balance'
      });
    }

    // Cleanup on component unmount
    return () => {
      sessionTimeoutService.cleanup();
      window.removeEventListener('wallet-lock-changed', handleWalletLockChange as EventListener);
      if (isVoiceEnabled) {
        voiceService.stopListening();
      }
    };
  }, []);

  const { data: walletBalances, isLoading, error, refetch } = useQuery({
    queryKey: ['walletBalances', connectedWallets],
    queryFn: async () => {
      const balances: Record<string, string> = {};
      for (const address of connectedWallets) {
        try {
          balances[address] = await web3Service.getWalletBalance(address);
        } catch (error) {
          console.error(`Error fetching balance for ${address}:`, error);
          balances[address] = '0';
        }
      }
      return balances;
    },
    enabled: connectedWallets.length > 0,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleConnectWallet = async () => {
    try {
      // Prevent connecting wallet if locked
      if (isWalletLocked) {
        toast({
          title: 'Wallet Locked',
          description: 'Please unlock your wallet first',
          variant: 'destructive',
        });
        return;
      }

      const walletInfo = await web3Service.connectWallet();
      if (!connectedWallets.includes(walletInfo.address)) {
        setConnectedWallets([...connectedWallets, walletInfo.address]);
        toast({
          title: 'Wallet Connected',
          description: `Successfully connected wallet ${walletInfo.address.slice(0, 6)}...${walletInfo.address.slice(-4)}`,
        });
      }
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleLockWallet = () => {
    securityService.lockWallet();
    setIsWalletLocked(true);
  };

  const handleUnlockWallet = () => {
    securityService.unlockWallet();
    setIsWalletLocked(false);
  };

  const toggleVoiceCommands = () => {
    if (isVoiceEnabled) {
      voiceService.stopListening();
      setIsVoiceEnabled(false);
    } else {
      voiceService.startListening();
      setIsVoiceEnabled(true);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="slide-up-animation">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Wallet Management</h1>
            <p className="text-muted-foreground">Manage and track all your connected cryptocurrency wallets</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={toggleVoiceCommands} variant="outline" className="gap-2">
              {isVoiceEnabled ? <MicOff size={16} /> : <Mic size={16} />}
              {isVoiceEnabled ? 'Disable Voice' : 'Enable Voice'}
            </Button>
            {isWalletLocked ? (
              <Button onClick={handleUnlockWallet} variant="outline" className="gap-2">
                <Unlock size={16} />
                Unlock Wallet
              </Button>
            ) : (
              <Button onClick={handleLockWallet} variant="outline" className="gap-2">
                <Lock size={16} />
                Lock Wallet
              </Button>
            )}
            <Button onClick={handleConnectWallet} className="gap-2" disabled={isWalletLocked}>
              <Plus size={16} />
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-animation" style={{animationDelay: "0.2s"}}>
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {isWalletLocked ? (
              <div className="rounded-xl border p-6 transition-all duration-300 hover:shadow-lg border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
                <div className="flex justify-center items-center flex-col h-40">
                  <Lock className="w-16 h-16 text-yellow-500 mb-4" />
                  <h3 className="text-xl font-bold text-center">Wallet Locked</h3>
                  <p className="text-muted-foreground text-center mt-2">Your wallet is locked for security</p>
                  <Button onClick={handleUnlockWallet} variant="outline" className="mt-4 gap-2">
                    <Unlock size={16} />
                    Unlock Wallet
                  </Button>
                </div>
              </div>
            ) : (
              connectedWallets.map((address) => (
          <div 
            key={address} 
            className="rounded-xl border p-6 transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer"
          >
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center float-animation">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width={20} 
                    height={20} 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="text-primary"
                  >
                    <path d="M20 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2Z" />
                    <path d="M14 6V4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2" />
                    <path d="M18 12h.01" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="font-semibold">Connected Wallet</h3>
                  <p className="text-xs text-muted-foreground">{`${address.slice(0, 6)}...${address.slice(-4)}`}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{isLoading ? 'Loading...' : `${Number(walletBalances?.[address] || 0).toFixed(4)} ETH`}</div>
                <span className="text-xs text-muted-foreground">View Transactions</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {['Received', 'Sent', 'Swap'].map((type, index) => (
                <div key={index} className="flex justify-between items-center p-2 rounded-lg bg-background hover:bg-muted/50 transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                      {getTransactionIcon(type)}
                    </div>
                    <div>
                      <div className="font-medium">{type}</div>
                      <div className="text-xs text-muted-foreground">Today, {Math.floor(Math.random() * 12) + 1}:{Math.floor(Math.random() * 50) + 10} {Math.random() > 0.5 ? 'AM' : 'PM'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-medium ${type === 'Received' ? 'text-green-500' : type === 'Sent' ? 'text-red-500' : ''}`}>
                      {type === 'Received' ? '+' : type === 'Sent' ? '-' : ''}
                      0.{Math.floor(Math.random() * 9000) + 1000} ETH
                    </div>
                    <div className="text-xs text-muted-foreground">${Math.floor(Math.random() * 900) + 100}.00</div>
                  </div>
                </div>
              ))}
            )}
            </div>
          </div>
            ))}
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <TopCryptos />
        </div>
      </div>
      <TrackWalletModal
        open={trackWalletOpen}
        onClose={() => setTrackWalletOpen(false)}
      />
    </div>
  );
}

export default Wallets;
