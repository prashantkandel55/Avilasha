import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense, useRef } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Plus, Lock, Unlock, Mic, MicOff } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { web3Service } from '@/services/web3';
import { securityService } from '@/services/security';
import { sessionTimeoutService } from '@/services/session-timeout';
import { voiceService } from '@/services/voice';
import { walletManager } from '@/services/wallet-manager'; // Import walletManager
import { walletService } from '@/services/wallet.service';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import TopCryptos from '@/components/TopCryptos';
import TrackWalletModal from '@/components/TrackWalletModal';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import WalletActivityFeed from '@/components/WalletActivityFeed';
import { useNotification } from '@/context/NotificationContext';
import CustomAlertRulesModal, { AlertRule } from '@/components/CustomAlertRulesModal';
import { requestNotificationPermission, showBrowserNotification, playNotificationSound, vibrateNotification } from '@/utils/notificationUtils';
import { fetchTokenPrices } from '@/utils/priceApi';
import { AuthService } from '@/services/authService';

// Lazy load heavy components

const getTransactionIcon = (type: string) => {
  if (type === "Received") {
    return <ArrowDownLeft className="text-green-500" />;
  } else if (type === "Sent") {
    return <ArrowUpRight className="text-red-500" />;
  } else {
    return <RefreshCw className="text-blue-500" />;
  }
};

const Wallets = React.memo(() => {
  const { toast } = useToast();
  const [trackWalletOpen, setTrackWalletOpen] = useState(false);
  const [connectedWallets, setConnectedWallets] = useState<string[]>([]);
  const [isWalletLocked, setIsWalletLocked] = useState(securityService.isWalletLocked());
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [removingWallet, setRemovingWallet] = useState<string | null>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('custom_alert_rules') || '[]');
    } catch {
      return [];
    }
  });
  const { addNotification } = useNotification();
  const [lastTxIds, setLastTxIds] = useState<Set<string>>(new Set());

  // Memoize fetchWallets
  const fetchWallets = useCallback(async () => {
    const allWallets = await walletService.getAllWallets?.() || [];
    setWallets(allWallets);
    setLoading(false);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
    interval = setInterval(fetchWallets, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function initialize() {
      // Initialize auto-lock timer
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
            variant: 'destructive'
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
    }
    initialize();
  }, []);

  // Memoize lock/unlock handlers
  const handleLockWallet = useCallback(() => {
    securityService.lockWallet();
    setIsWalletLocked(true);
  }, []);

  const handleUnlockWallet = useCallback(() => {
    securityService.unlockWallet();
    setIsWalletLocked(false);
  }, []);

  const toggleVoiceCommands = useCallback(() => {
    if (isVoiceEnabled) {
      voiceService.stopListening();
      setIsVoiceEnabled(false);
    } else {
      voiceService.startListening();
      setIsVoiceEnabled(true);
    }
  }, [isVoiceEnabled]);

  const handleConnectWallet = useCallback(async () => {
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
  }, [connectedWallets, isWalletLocked]);

  // Handler: Start renaming
  const handleStartRename = (address: string) => {
    setEditingWallet(address);
    setRenameValue('');
    setTimeout(() => renameInputRef.current?.focus(), 100);
  };

  // Handler: Confirm rename
  const handleConfirmRename = async (address: string) => {
    try {
      await walletService.renameWallet(address, renameValue);
      toast({ title: 'Wallet Renamed', description: 'Wallet renamed successfully.' });
      setEditingWallet(null);
      fetchWallets();
    } catch (error) {
      toast({ title: 'Rename Failed', description: error.message, variant: 'destructive' });
    }
  };

  // Handler: Remove wallet
  const handleRemoveWallet = async (address: string) => {
    setRemovingWallet(address);
    try {
      await walletService.removeWallet(address);
      toast({ title: 'Wallet Removed', description: 'Wallet removed successfully.' });
      setRemovingWallet(null);
      fetchWallets();
    } catch (error) {
      toast({ title: 'Remove Failed', description: error.message, variant: 'destructive' });
      setRemovingWallet(null);
    }
  };

  // Memoize derived data
  const walletCount = useMemo(() => wallets.length, [wallets]);

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

  useEffect(() => {
    localStorage.setItem('custom_alert_rules', JSON.stringify(alertRules));
  }, [alertRules]);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      connectedWallets.forEach(address => {
        const txs = walletManager.getTransactionHistory(address, 5);
        txs.forEach(tx => {
          if (!lastTxIds.has(tx.id)) {
            // --- In-app notification ---
            addNotification({
              type: 'transaction',
              title: `New ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`,
              description: `${tx.amount} ${tx.token} ${tx.type === 'send' ? 'to' : 'from'} ${tx.type === 'send' ? tx.to : tx.from}`,
              data: tx,
            });
            toast({
              title: `New ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`,
              description: `${tx.amount} ${tx.token} ${tx.type === 'send' ? 'to' : 'from'} ${tx.type === 'send' ? tx.to : tx.from}`,
            });
            // --- Browser notification ---
            showBrowserNotification(`New ${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} Transaction`, {
              body: `${tx.amount} ${tx.token} ${tx.type === 'send' ? 'to' : 'from'} ${tx.type === 'send' ? tx.to : tx.from}`
            });
            // --- Sound/vibration ---
            playNotificationSound();
            vibrateNotification();
            // --- Custom Alert Rules ---
            alertRules.filter(r => r.enabled).forEach(rule => {
              if ((rule.type === 'any' || rule.type === tx.type)
                && (!rule.token || rule.token.toLowerCase() === tx.token.toLowerCase())
                && (rule.minAmount === undefined || tx.amount >= rule.minAmount)
                && (rule.maxAmount === undefined || tx.amount <= rule.maxAmount)) {
                addNotification({
                  type: 'alert',
                  title: `Custom Alert: ${rule.type}`,
                  description: `Matched rule for ${tx.amount} ${tx.token} (${tx.type})`,
                  data: tx,
                });
                toast({
                  title: `Custom Alert: ${rule.type}`,
                  description: `Matched rule for ${tx.amount} ${tx.token} (${tx.type})`,
                });
                showBrowserNotification(`Custom Alert: ${rule.type}`, {
                  body: `Matched rule for ${tx.amount} ${tx.token} (${tx.type})`
                });
                playNotificationSound();
                vibrateNotification();
              }
            });
          }
        });
        setLastTxIds(prev => new Set([...prev, ...txs.map(tx => tx.id)]));
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [connectedWallets, alertRules, addNotification, toast, lastTxIds]);

  useEffect(() => {
    // --- Price Alert Polling ---
    const interval = setInterval(async () => {
      const priceRules = alertRules.filter(r => r.enabled && r.type === 'price' && r.token);
      if (priceRules.length === 0) return;
      const tokens = Array.from(new Set(priceRules.map(r => r.token!.toUpperCase())));
      try {
        const prices = await fetchTokenPrices(tokens);
        priceRules.forEach(rule => {
          const price = prices[rule.token!.toUpperCase()];
          if (!price) return;
          if ((rule.priceAbove !== undefined && price > rule.priceAbove) ||
              (rule.priceBelow !== undefined && price < rule.priceBelow)) {
            addNotification({
              type: 'price',
              title: `Price Alert: ${rule.token}`,
              description: `${rule.token} is now $${price}`,
              data: { price, token: rule.token },
            });
            toast({
              title: `Price Alert: ${rule.token}`,
              description: `${rule.token} is now $${price}`,
            });
            showBrowserNotification(`Price Alert: ${rule.token}`, {
              body: `${rule.token} is now $${price}`
            });
            playNotificationSound();
            vibrateNotification();
          }
        });
      } catch (e) {
        // Ignore errors
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [alertRules, addNotification, toast]);

  useEffect(() => {
    // --- Security Alert Detection ---
    const interval = setInterval(() => {
      alertRules.filter(r => r.enabled && r.type === 'security').forEach(rule => {
        if (rule.securityType === 'large_withdrawal') {
          connectedWallets.forEach(address => {
            const txs = walletManager.getTransactionHistory(address, 5);
            txs.forEach(tx => {
              if (tx.type === 'send' && tx.amount > 10000) { // Large withdrawal threshold (customize as needed)
                addNotification({
                  type: 'security',
                  title: 'Security Alert: Large Withdrawal',
                  description: `Sent ${tx.amount} ${tx.token} from ${address}`,
                  data: tx,
                });
                toast({
                  title: 'Security Alert: Large Withdrawal',
                  description: `Sent ${tx.amount} ${tx.token} from ${address}`,
                });
                showBrowserNotification('Security Alert: Large Withdrawal', {
                  body: `Sent ${tx.amount} ${tx.token} from ${address}`
                });
                playNotificationSound();
                vibrateNotification();
              }
            });
          });
        } else if (rule.securityType === 'rapid_transfers') {
          connectedWallets.forEach(address => {
            const txs = walletManager.getTransactionHistory(address, 10);
            const sendTxs = txs.filter(tx => tx.type === 'send');
            if (sendTxs.length >= 5) { // Rapid transfer threshold
              addNotification({
                type: 'security',
                title: 'Security Alert: Rapid Transfers',
                description: `5+ transfers from ${address} in short time`,
                data: sendTxs,
              });
              toast({
                title: 'Security Alert: Rapid Transfers',
                description: `5+ transfers from ${address} in short time`,
              });
              showBrowserNotification('Security Alert: Rapid Transfers', {
                body: `5+ transfers from ${address} in short time`
              });
              playNotificationSound();
              vibrateNotification();
            }
          });
        } else if (rule.securityType === 'failed_login') {
          // For demo: assume current user's email is in localStorage under 'currentUserEmail'
          const email = localStorage.getItem('currentUserEmail');
          if (!email) return;
          const failedAttempts = AuthService.getRecentFailedLoginAttempts(email);
          if (failedAttempts > 2) {
            addNotification({
              type: 'security',
              title: 'Security Alert: Failed Logins',
              description: `There have been ${failedAttempts} failed login attempts recently.`,
            });
            toast({
              title: 'Security Alert: Failed Logins',
              description: `There have been ${failedAttempts} failed login attempts recently.`,
            });
            showBrowserNotification('Security Alert: Failed Logins', {
              body: `There have been ${failedAttempts} failed login attempts recently.`
            });
            playNotificationSound();
            vibrateNotification();
          }
        }
      });
    }, 20000);
    return () => clearInterval(interval);
  }, [alertRules, connectedWallets, addNotification, toast]);

  if (loading) {
    return <div className="text-center p-10">Loading wallets...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to manage your wallets.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal 
            onConnect={() => {
              setShowWalletModal(false);
              fetchWallets();
            }}
            onClose={() => setShowWalletModal(false)}
          />
        )}
      </div>
    );
  }

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
            <Button onClick={() => setShowWalletModal(true)} className="gap-2" disabled={isWalletLocked}>
              <Plus size={16} />
              Connect Wallet
            </Button>
            {showWalletModal && (
              <WalletConnectModal 
                onConnect={() => {
                  setShowWalletModal(false);
                  fetchWallets();
                }}
                onClose={() => setShowWalletModal(false)}
              />
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end mb-4">
        <button className="border rounded px-3 py-1 text-xs hover:bg-muted" onClick={() => setAlertModalOpen(true)}>Manage Custom Alerts</button>
      </div>
      <CustomAlertRulesModal open={alertModalOpen} onClose={() => setAlertModalOpen(false)} rules={alertRules} setRules={setAlertRules} />
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
                  <div className="flex gap-2 mb-2">
                    {editingWallet === address ? (
                      <>
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={e => setRenameValue(e.target.value)}
                          className="border rounded px-2 py-1 text-sm"
                          placeholder="New wallet name"
                        />
                        <Button size="sm" onClick={() => handleConfirmRename(address)} disabled={!renameValue}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingWallet(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleStartRename(address)}>Rename</Button>
                        <Button size="sm" variant="destructive" disabled={removingWallet === address} onClick={() => handleRemoveWallet(address)}>
                          {removingWallet === address ? (
                            <span className="flex items-center gap-1"><svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path></svg>Removing...</span>
                          ) : 'Remove'}
                        </Button>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    {/* ...transactions... */}
                  </div>
                  <WalletActivityFeed walletId={address} limit={5} />
                </div>
              ))
            )}
          </div>
        </div>
        <div className="lg:col-span-1">
          <TopCryptos />
        </div>
      </div>
      {trackWalletOpen && (
        <TrackWalletModal open={trackWalletOpen} onClose={() => setTrackWalletOpen(false)} />
      )}
    </div>
  );
});

export default Wallets;
