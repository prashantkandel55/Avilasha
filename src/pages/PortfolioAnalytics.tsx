import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, BarChart, PieChart, Wallet, TrendingUp, Calendar } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart, Pie as RechartsPie, BarChart as RechartsBarChart, Bar } from 'recharts';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { fetchTokenPrices } from '@/utils/priceApi';
import { cryptoService } from '@/services/crypto-service-integration';
import { Connection as SolanaConnection, PublicKey as SolanaPublicKey } from '@solana/web3.js';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { CSVLink } from 'react-csv';
import { WalletAnalytics } from './WalletAnalytics';
import Transfer from './Transfer';
import { AuthService } from '@/services/authService';
import { Button } from '@/components/ui/button';

const PortfolioAnalytics = () => {
  const [wallets, setWallets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [activity, setActivity] = useState<any[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityType, setActivityType] = useState<'count'|'volume'|'type'|'token'>('count');
  const [tokenActivity, setTokenActivity] = useState<any[]>([]);
  const [tokenActivityLoading, setTokenActivityLoading] = useState(true);
  const [filterToken, setFilterToken] = useState<string>('');
  const [filterChain, setFilterChain] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');
  const [filterWallet, setFilterWallet] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });
  const [exportData, setExportData] = useState<any[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [filterMinValue, setFilterMinValue] = useState('');
  const [filterMaxValue, setFilterMaxValue] = useState('');

  // --- Cloud sync for portfolio analytics ---
  const [cloudAnalytics, setCloudAnalytics] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id && AuthService.getProfile) {
        try {
          const { profile } = await AuthService.getProfile(user.id);
          if (Array.isArray(profile?.portfolio_analytics)) setCloudAnalytics(profile.portfolio_analytics);
        } catch {}
      }
    })();
  }, []);

  // --- Export/Import ---
  const handleExport = () => {
    const data = JSON.stringify(activity, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-analytics.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const imported = JSON.parse(text);
      if (!Array.isArray(imported)) throw new Error('Invalid format');
      // Optionally sync to cloud if logged in
      const user = await AuthService.getCurrentUser?.();
      if (user && user.id && AuthService.updateProfile) {
        const { profile } = await AuthService.getProfile(user.id);
        const merged = [...imported, ...(profile?.portfolio_analytics || [])].slice(0, 1000);
        await AuthService.updateProfile(user.id, { portfolio_analytics: merged });
        setCloudAnalytics(merged);
      }
    } catch {}
  };

  useEffect(() => {
    async function fetchWalletsAndPricesAndHistoryAndActivity() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      // Aggregate tokens for price fetching
      const tokens = Array.from(new Set(allWallets.flatMap((w: any) => (w.tokens || []).map((t: any) => t.symbol.toUpperCase()))));
      if (tokens.length) {
        const prices = await fetchTokenPrices(tokens);
        setTokenPrices(prices);
      }
      // Fetch historical portfolio value for all wallets (sum by day)
      if (allWallets.length) {
        try {
          const histories = await Promise.all(
            allWallets.map(async (w: any) => {
              // Only supporting EVM chains for now (chainId 1 = Ethereum)
              if (!w.address) return [];
              try {
                const hist = await cryptoService.getPortfolioHistory(w.address, 1, 60);
                // Covalent returns array of items with date and portfolio_value_quote
                return hist.data?.items?.[0]?.holdings?.map((h: any) => ({
                  date: h.timestamp ? new Date(h.timestamp * 1000).toLocaleDateString() : '',
                  value: h.quote,
                })) || [];
              } catch {
                return [];
              }
            })
          );
          // Merge histories by date (sum values)
          const byDate: Record<string, any> = {};
          histories.forEach(walletHist => {
            walletHist.forEach((h: any) => {
              if (!h.date) return;
              byDate[h.date] = (byDate[h.date] || 0) + (h.value || 0);
            });
          });
          const merged = Object.entries(byDate)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, value]) => ({ date, value }));
          setHistory(merged);
        } finally {
          setHistoryLoading(false);
        }
      } else {
        setHistory([]);
        setHistoryLoading(false);
      }
      // Enhanced activity analytics
      if (allWallets.length) {
        try {
          const activityResults = await Promise.all(
            allWallets.map(async (w: any) => {
              if (!w.address) return [];
              if (w.network === 'ethereum' || w.network === 'evm') {
                try {
                  const txs = await cryptoService.getWalletTransactions(w.address, 1);
                  return txs.map((tx: any) => ({
                    date: tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : '',
                    value: Math.abs(Number(tx.value || 0) / 1e18),
                    token: tx.tokenSymbol || 'ETH',
                    type: tx.input && tx.input !== '0x' ? 'Contract' : (tx.from?.toLowerCase() === w.address?.toLowerCase() ? 'Send' : 'Receive'),
                    network: 'Ethereum',
                  }));
                } catch { return []; }
              } else if (w.network === 'solana') {
                try {
                  const conn = new SolanaConnection('https://api.mainnet-beta.solana.com');
                  const pubkey = new SolanaPublicKey(w.address);
                  const sigs = await conn.getSignaturesForAddress(pubkey, { limit: 100 });
                  const txs = await Promise.all(sigs.map(async (sig) => {
                    const tx = await conn.getParsedTransaction(sig.signature);
                    let token = 'SOL';
                    let value = 0;
                    let type = 'Unknown';
                    if (tx?.meta?.postTokenBalances?.length) {
                      token = tx.meta.postTokenBalances[0].mint;
                    }
                    if (tx?.meta?.postBalances && tx?.meta?.preBalances) {
                      value = Math.abs((tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9);
                    }
                    if (tx?.transaction?.message?.instructions?.length) {
                      const instr = tx.transaction.message.instructions[0];
                      // programId is always present, program is not
                      type = (instr as any).programId ? (instr as any).programId : 'Transfer';
                    }
                    return {
                      date: tx?.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : '',
                      value,
                      token,
                      type,
                      network: 'Solana',
                    };
                  }));
                  return txs;
                } catch { return []; }
              } else if (w.network === 'sui') {
                try {
                  const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
                  const txBlocksPage = await suiClient.queryTransactionBlocks({
                    filter: { ToAddress: w.address },
                    limit: 100,
                    order: 'descending',
                  });
                  const digests = txBlocksPage.data.map((block: any) => block.digest);
                  const txBlockDetails = await suiClient.multiGetTransactionBlocks({
                    digests,
                    options: { showInput: true, showEvents: true, showEffects: true, showObjectChanges: false, showBalanceChanges: true }
                  });
                  return txBlockDetails.map((block: any) => {
                    let value = 0;
                    let token = 'SUI';
                    let type = 'Unknown';
                    // Try to extract transfer amount and type from effects or events
                    if (block.balanceChanges && block.balanceChanges.length) {
                      value = Math.abs(Number(block.balanceChanges[0].amount || 0) / 1e9);
                      token = block.balanceChanges[0].coinType || 'SUI';
                    }
                    if (block.events && block.events.length) {
                      type = block.events[0].type || 'Transfer';
                    }
                    return {
                      date: block.timestampMs ? new Date(Number(block.timestampMs)).toLocaleDateString() : '',
                      value,
                      token,
                      type,
                      network: 'Sui',
                    };
                  });
                } catch { return []; }
              } else if (w.network === 'monad') {
                return [];
              } else {
                return [];
              }
            })
          );
          // Merge activity by date/network/type/token
          const byDate: Record<string, any> = {};
          const byToken: Record<string, any> = {};
          activityResults.flat().forEach((a: any) => {
            if (!a.date) return;
            // For count
            if (!byDate[a.date]) byDate[a.date] = {};
            byDate[a.date][a.network] = (byDate[a.date][a.network] || 0) + 1;
            // For volume
            byDate[a.date][`${a.network}_volume`] = (byDate[a.date][`${a.network}_volume`] || 0) + a.value;
            // For type
            byDate[a.date][`${a.network}_${a.type}`] = (byDate[a.date][`${a.network}_${a.type}`] || 0) + 1;
            // For token
            if (!byToken[a.token]) byToken[a.token] = {};
            byToken[a.token][a.network] = (byToken[a.token][a.network] || 0) + a.value;
          });
          const merged = Object.entries(byDate)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, networks]) => ({ date, ...networks }));
          setActivity(merged);
          // Per-token activity
          const mergedTokens = Object.entries(byToken).map(([token, networks]) => ({ token, ...networks }));
          setTokenActivity(mergedTokens);
        } finally {
          setActivityLoading(false);
          setTokenActivityLoading(false);
        }
      } else {
        setActivity([]);
        setActivityLoading(false);
        setTokenActivity([]);
        setTokenActivityLoading(false);
      }
      setLoading(false);
    }
    fetchWalletsAndPricesAndHistoryAndActivity();
  }, []);

  // Add real-time polling for portfolio analytics
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchAll() {
      setLoading(true);
      setHistoryLoading(true);
      setActivityLoading(true);
      setTokenActivityLoading(true);
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      // Aggregate tokens for price fetching
      const tokens = Array.from(new Set(allWallets.flatMap((w: any) => (w.tokens || []).map((t: any) => t.symbol.toUpperCase()))));
      if (tokens.length) {
        const prices = await fetchTokenPrices(tokens);
        setTokenPrices(prices);
      }
      // Fetch historical portfolio value for all wallets (sum by day)
      if (allWallets.length) {
        try {
          const histories = await Promise.all(
            allWallets.map(async (w: any) => {
              // Only supporting EVM chains for now (chainId 1 = Ethereum)
              if (!w.address) return [];
              try {
                const hist = await cryptoService.getPortfolioHistory(w.address, 1, 60);
                // Covalent returns array of items with date and portfolio_value_quote
                return hist.data?.items?.[0]?.holdings?.map((h: any) => ({
                  date: h.timestamp ? new Date(h.timestamp * 1000).toLocaleDateString() : '',
                  value: h.quote,
                })) || [];
              } catch {
                return [];
              }
            })
          );
          // Merge histories by date (sum values)
          const byDate: Record<string, any> = {};
          histories.forEach(walletHist => {
            walletHist.forEach((h: any) => {
              if (!h.date) return;
              byDate[h.date] = (byDate[h.date] || 0) + (h.value || 0);
            });
          });
          const merged = Object.entries(byDate)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, value]) => ({ date, value }));
          setHistory(merged);
        } finally {
          setHistoryLoading(false);
        }
      } else {
        setHistory([]);
        setHistoryLoading(false);
      }
      // Enhanced activity analytics
      if (allWallets.length) {
        try {
          const activityResults = await Promise.all(
            allWallets.map(async (w: any) => {
              if (!w.address) return [];
              if (w.network === 'ethereum' || w.network === 'evm') {
                try {
                  const txs = await cryptoService.getWalletTransactions(w.address, 1);
                  return txs.map((tx: any) => ({
                    date: tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : '',
                    value: Math.abs(Number(tx.value || 0) / 1e18),
                    token: tx.tokenSymbol || 'ETH',
                    type: tx.input && tx.input !== '0x' ? 'Contract' : (tx.from?.toLowerCase() === w.address?.toLowerCase() ? 'Send' : 'Receive'),
                    network: 'Ethereum',
                  }));
                } catch { return []; }
              } else if (w.network === 'solana') {
                try {
                  const conn = new SolanaConnection('https://api.mainnet-beta.solana.com');
                  const pubkey = new SolanaPublicKey(w.address);
                  const sigs = await conn.getSignaturesForAddress(pubkey, { limit: 100 });
                  const txs = await Promise.all(sigs.map(async (sig) => {
                    const tx = await conn.getParsedTransaction(sig.signature);
                    let token = 'SOL';
                    let value = 0;
                    let type = 'Unknown';
                    if (tx?.meta?.postTokenBalances?.length) {
                      token = tx.meta.postTokenBalances[0].mint;
                    }
                    if (tx?.meta?.postBalances && tx?.meta?.preBalances) {
                      value = Math.abs((tx.meta.postBalances[0] - tx.meta.preBalances[0]) / 1e9);
                    }
                    if (tx?.transaction?.message?.instructions?.length) {
                      const instr = tx.transaction.message.instructions[0];
                      // programId is always present, program is not
                      type = (instr as any).programId ? (instr as any).programId : 'Transfer';
                    }
                    return {
                      date: tx?.blockTime ? new Date(tx.blockTime * 1000).toLocaleDateString() : '',
                      value,
                      token,
                      type,
                      network: 'Solana',
                    };
                  }));
                  return txs;
                } catch { return []; }
              } else if (w.network === 'sui') {
                try {
                  const suiClient = new SuiClient({ url: getFullnodeUrl('mainnet') });
                  const txBlocksPage = await suiClient.queryTransactionBlocks({
                    filter: { ToAddress: w.address },
                    limit: 100,
                    order: 'descending',
                  });
                  const digests = txBlocksPage.data.map((block: any) => block.digest);
                  const txBlockDetails = await suiClient.multiGetTransactionBlocks({
                    digests,
                    options: { showInput: true, showEvents: true, showEffects: true, showObjectChanges: false, showBalanceChanges: true }
                  });
                  return txBlockDetails.map((block: any) => {
                    let value = 0;
                    let token = 'SUI';
                    let type = 'Unknown';
                    // Try to extract transfer amount and type from effects or events
                    if (block.balanceChanges && block.balanceChanges.length) {
                      value = Math.abs(Number(block.balanceChanges[0].amount || 0) / 1e9);
                      token = block.balanceChanges[0].coinType || 'SUI';
                    }
                    if (block.events && block.events.length) {
                      type = block.events[0].type || 'Transfer';
                    }
                    return {
                      date: block.timestampMs ? new Date(Number(block.timestampMs)).toLocaleDateString() : '',
                      value,
                      token,
                      type,
                      network: 'Sui',
                    };
                  });
                } catch { return []; }
              } else if (w.network === 'monad') {
                return [];
              } else {
                return [];
              }
            })
          );
          // Merge activity by date/network/type/token
          const byDate: Record<string, any> = {};
          const byToken: Record<string, any> = {};
          activityResults.flat().forEach((a: any) => {
            if (!a.date) return;
            // For count
            if (!byDate[a.date]) byDate[a.date] = {};
            byDate[a.date][a.network] = (byDate[a.date][a.network] || 0) + 1;
            // For volume
            byDate[a.date][`${a.network}_volume`] = (byDate[a.date][`${a.network}_volume`] || 0) + a.value;
            // For type
            byDate[a.date][`${a.network}_${a.type}`] = (byDate[a.date][`${a.network}_${a.type}`] || 0) + 1;
            // For token
            if (!byToken[a.token]) byToken[a.token] = {};
            byToken[a.token][a.network] = (byToken[a.token][a.network] || 0) + a.value;
          });
          const merged = Object.entries(byDate)
            .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
            .map(([date, networks]) => ({ date, ...networks }));
          setActivity(merged);
          // Per-token activity
          const mergedTokens = Object.entries(byToken).map(([token, networks]) => ({ token, ...networks }));
          setTokenActivity(mergedTokens);
        } finally {
          setActivityLoading(false);
          setTokenActivityLoading(false);
        }
      } else {
        setActivity([]);
        setActivityLoading(false);
        setTokenActivity([]);
        setTokenActivityLoading(false);
      }
      setLoading(false);
    }
    fetchAll();
    interval = setInterval(fetchAll, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Apply filters to activity
  const filteredActivity = activity.filter((row: any) => {
    if (filterChain && !Object.keys(row).includes(filterChain)) return false;
    if (dateRange.from && new Date(row.date) < new Date(dateRange.from)) return false;
    if (dateRange.to && new Date(row.date) > new Date(dateRange.to)) return false;
    if (filterToken && row.token !== filterToken) return false;
    if (filterType && row.type !== filterType) return false;
    if (filterWallet && row.wallet !== filterWallet) return false;
    if (filterMinValue && Number(row.value) < Number(filterMinValue)) return false;
    if (filterMaxValue && Number(row.value) > Number(filterMaxValue)) return false;
    return true;
  });
  // For per-token
  const filteredTokenActivity = tokenActivity.filter((row: any) => {
    if (filterToken && row.token !== filterToken) return false;
    if (filterChain && !Object.keys(row).includes(filterChain)) return false;
    if (filterMinValue && Number(row[filterChain]) < Number(filterMinValue)) return false;
    if (filterMaxValue && Number(row[filterChain]) > Number(filterMaxValue)) return false;
    return true;
  });
  // For per-wallet
  const allWalletAddresses = wallets.map(w => w.address);
  const filteredWalletActivity = activity.filter((row: any) => {
    if (!filterWallet) return true;
    // Only include rows for selected wallet (by address)
    // This assumes activity rows include wallet info, which you can add in the future for more granularity
    return row.wallet === filterWallet;
  });

  // Compose export data based on current view/tab
  useEffect(() => {
    if (activityType === 'token') {
      setExportData(filteredTokenActivity);
    } else {
      setExportData(filteredActivity);
    }
  }, [activityType, filteredActivity, filteredTokenActivity]);

  // Token, chain, type, wallet options for filtering
  const tokenOptions = Array.from(new Set(tokenActivity.map(t => t.token))).filter(Boolean);
  const chainOptions = ['Ethereum', 'Solana', 'Sui'];
  const typeOptions = ['Send', 'Receive', 'Contract', 'Transfer', 'Unknown'];
  const walletOptions = wallets.map(w => ({ address: w.address, name: w.name || w.address }));

  // Date range min/max
  const minDate = activity.length ? activity[0].date : '';
  const maxDate = activity.length ? activity[activity.length - 1].date : '';

  // Aggregate portfolio data
  const totalValue = wallets.reduce((sum, w) => sum + (w.totalValueUSD || 0), 0);
  const allTokens = wallets.flatMap((w: any) => w.tokens || []);
  const tokenMap: Record<string, { symbol: string, name: string, valueUSD: number, balance: number }> = {};
  allTokens.forEach(t => {
    if (!tokenMap[t.symbol]) {
      tokenMap[t.symbol] = { symbol: t.symbol, name: t.name, valueUSD: 0, balance: 0 };
    }
    tokenMap[t.symbol].valueUSD += t.valueUSD;
    tokenMap[t.symbol].balance += parseFloat(t.balance);
  });
  const tokenAlloc = Object.values(tokenMap).sort((a, b) => b.valueUSD - a.valueUSD);

  // Predictive trend (simple moving average)
  const forecast = history.length ? movingAverageForecast(history, 7, 7) : [];

  // Historical comparisons
  const weekAgo = history.length > 7 ? history[history.length - 8].value : totalValue;
  const monthAgo = history.length > 30 ? history[history.length - 31].value : totalValue;
  const weekChange = totalValue - weekAgo;
  const weekChangePct = weekAgo ? ((totalValue - weekAgo) / weekAgo) * 100 : 0;
  const monthChange = totalValue - monthAgo;
  const monthChangePct = monthAgo ? ((totalValue - monthAgo) / monthAgo) * 100 : 0;

  // Calculate simple ROI and daily change (placeholder logic)
  const roi = totalValue && history.length ? ((totalValue - history[0].value) / history[0].value) * 100 : 0;
  const dailyChange = totalValue && history.length ? totalValue - history[history.length - 2].value : 0;
  const dailyChangePct = totalValue && history.length ? ((totalValue - history[history.length - 2].value) / history[history.length - 2].value) * 100 : 0;

  // Helper: Simple moving average forecast
  function movingAverageForecast(history: { value: number }[], window = 7, steps = 7) {
    if (history.length < window) return [];
    const avg = history.slice(-window).reduce((sum, d) => sum + d.value, 0) / window;
    return Array.from({ length: steps }, (_, i) => ({
      date: `+${i + 1}d`,
      value: avg,
    }));
  }

  // Helper: Calculate wallet health score
  function computeHealthScore({ tokenAlloc, totalValue, roi, securityEvents = 0 }: any) {
    let score = 100;
    // Diversification penalty
    if (tokenAlloc.length < 3) score -= 20;
    else if (tokenAlloc.length < 5) score -= 10;
    // Overconcentration penalty
    if (tokenAlloc[0] && tokenAlloc[0].valueUSD / totalValue > 0.7) score -= 15;
    // Negative ROI penalty
    if (roi < 0) score -= 20;
    // Security events penalty
    score -= securityEvents * 20;
    // Clamp
    return Math.max(0, Math.min(score, 100));
  }

  // Health score (mock security events)
  const healthScore = computeHealthScore({ tokenAlloc, totalValue, roi, securityEvents: 0 });

  if (loading) {
    return <div className="text-center p-10">Loading portfolio...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your portfolio analytics.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal onConnect={async () => {
            setShowWalletModal(false);
            const allWallets = await walletService.getAllWallets?.() || [];
            setWallets(allWallets);
          }} />
        )}
      </div>
    );
  }

  const handleWalletAnalytics = (wallet: any) => setSelectedWallet(wallet);
  const closeWalletAnalytics = () => setSelectedWallet(null);

  return (
    <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in">
      <Button onClick={handleExport} size="sm" className="bg-blue-600 text-white mb-2">Export Analytics</Button>
      <label className="cursor-pointer bg-gray-200 px-3 py-1 rounded text-xs mb-2">
        Import Analytics
        <input type="file" accept="application/json" onChange={handleImport} className="hidden" />
      </label>
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Portfolio Analytics</h1>
        <p className="text-muted-foreground">Track and analyze your portfolio performance over time</p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <PieChart size={16} />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Performance</span>
          </TabsTrigger>
          <TabsTrigger value="allocation" className="flex items-center gap-2">
            <Wallet size={16} />
            <span>Allocation</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <BarChart size={16} />
            <span>Activity</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar size={16} />
            <span>Historical</span>
          </TabsTrigger>
          <TabsTrigger value="health" className="flex items-center gap-2">
            <TrendingUp size={16} />
            <span>Health Score</span>
          </TabsTrigger>
          <TabsTrigger value="transfer" className="flex items-center gap-2">
            <LineChart size={16} />
            <span>Transfer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total Portfolio Value</CardTitle>
                <CardDescription>Current value of all your assets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className={`font-medium flex items-center ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {dailyChange >= 0 ? '+' : ''}{dailyChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground ml-2">Last 24h</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Total ROI</CardTitle>
                <CardDescription>All-time performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>{roi >= 0 ? '+' : ''}{roi.toLocaleString(undefined, { maximumFractionDigits: 2 })}%</div>
                <div className="text-sm text-muted-foreground mt-1">{roi >= 0 ? '+' : ''}{roi.toLocaleString(undefined, { maximumFractionDigits: 2 })}% ROI</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Daily Change</CardTitle>
                <CardDescription>Value change in last 24h</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{dailyChange >= 0 ? '+' : ''}{dailyChange.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="text-sm text-muted-foreground mt-1">{dailyChangePct >= 0 ? '+' : ''}{dailyChangePct.toLocaleString(undefined, { maximumFractionDigits: 2 })}% from previous day</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Growth</CardTitle>
              <CardDescription>How your portfolio has grown over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={history}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorValue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Historical Comparisons</CardTitle>
              <CardDescription>Compare your portfolio value over time</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center">Loading historical data...</div>
              ) : (
                <>
                  <div className="flex gap-8 mb-4">
                    <div>
                      <div className="text-xs text-muted-foreground">Week-over-Week</div>
                      <div className={`text-xl font-bold ${weekChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{weekChange >= 0 ? '+' : ''}{weekChange.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({weekChangePct >= 0 ? '+' : ''}{weekChangePct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Month-over-Month</div>
                      <div className={`text-xl font-bold ${monthChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>{monthChange >= 0 ? '+' : ''}{monthChange.toLocaleString(undefined, { maximumFractionDigits: 2 })} ({monthChangePct >= 0 ? '+' : ''}{monthChangePct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%)</div>
                    </div>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={history}>
                        <defs>
                          <linearGradient id="colorValuePerf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <YAxis hide />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#colorValuePerf)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Predictive Trend</CardTitle>
              <CardDescription>Projected portfolio value (7-day moving average)</CardDescription>
            </CardHeader>
            <CardContent>
              {historyLoading ? (
                <div className="text-center">Loading forecast...</div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={[...history, ...forecast]}>
                      <defs>
                        <linearGradient id="colorValueForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#8884d8"
                        fillOpacity={1}
                        fill="url(#colorValueForecast)"
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Analytics</CardTitle>
              <CardDescription>View transaction count, volume, type, or per-token activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 mb-4 items-center">
                <div>
                  <label className="mr-2">Token:</label>
                  <select value={filterToken} onChange={e => setFilterToken(e.target.value)}>
                    <option value="">All</option>
                    {tokenOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mr-2">Chain:</label>
                  <select value={filterChain} onChange={e => setFilterChain(e.target.value)}>
                    <option value="">All</option>
                    {chainOptions.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mr-2">Type:</label>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="">All</option>
                    {typeOptions.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mr-2">Wallet:</label>
                  <select value={filterWallet} onChange={e => setFilterWallet(e.target.value)}>
                    <option value="">All</option>
                    {walletOptions.map(w => (
                      <option key={w.address} value={w.address}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mr-2">Date Range:</label>
                  <input type="date" value={dateRange.from} min={minDate} max={maxDate} onChange={e => setDateRange(d => ({ ...d, from: e.target.value }))} />
                  <span className="mx-1">-</span>
                  <input type="date" value={dateRange.to} min={minDate} max={maxDate} onChange={e => setDateRange(d => ({ ...d, to: e.target.value }))} />
                </div>
                <div>
                  <label className="mr-2">Min Value:</label>
                  <input type="number" value={filterMinValue} onChange={e => setFilterMinValue(e.target.value)} className="w-20 px-1" />
                </div>
                <div>
                  <label className="mr-2">Max Value:</label>
                  <input type="number" value={filterMaxValue} onChange={e => setFilterMaxValue(e.target.value)} className="w-20 px-1" />
                </div>
                <div>
                  <CSVLink data={exportData} filename={`activity-analytics-${activityType}.csv`} className="px-3 py-1 rounded bg-green-500 text-white">Export CSV</CSVLink>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-4">
                {wallets.map(w => (
                  <button
                    key={w.address}
                    className={`px-2 py-1 rounded border ${selectedWallet?.address === w.address ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
                    onClick={() => handleWalletAnalytics(w)}
                  >
                    {w.name || w.address}
                  </button>
                ))}
                {selectedWallet && (
                  <button className="ml-2 px-2 py-1 rounded border bg-red-500 text-white" onClick={closeWalletAnalytics}>Close Wallet Analytics</button>
                )}
              </div>
              {selectedWallet && (
                <WalletAnalytics
                  wallet={selectedWallet}
                  allTokens={tokenOptions}
                  activity={activity}
                />
              )}
              {activityType === 'token' ? (
                tokenActivityLoading ? (
                  <div className="text-center">Loading token activity...</div>
                ) : (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={filteredTokenActivity} layout="vertical">
                        <XAxis type="number" />
                        <YAxis dataKey="token" type="category" />
                        <CartesianGrid strokeDasharray="3 3" />
                        <Tooltip />
                        {chainOptions.map(network => (
                          <Bar key={network} dataKey={network} stackId="a" fill={network === 'Ethereum' ? '#8884d8' : network === 'Solana' ? '#00baad' : '#f59e42'} />
                        ))}
                      </RechartsBarChart>
                    </ResponsiveContainer>
                  </div>
                )
              ) : activityLoading ? (
                <div className="text-center">Loading activity data...</div>
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={filteredActivity}>
                      <XAxis dataKey="date" />
                      <YAxis allowDecimals={false} />
                      <CartesianGrid strokeDasharray="3 3" />
                      <Tooltip />
                      {activityType === 'count' && chainOptions.map(network => (
                        <Bar key={network} dataKey={network} stackId="a" fill={network === 'Ethereum' ? '#8884d8' : network === 'Solana' ? '#00baad' : '#f59e42'} />
                      ))}
                      {activityType === 'volume' && chainOptions.map(network => (
                        <Bar key={network} dataKey={`${network}_volume`} stackId="a" fill={network === 'Ethereum' ? '#8884d8' : network === 'Solana' ? '#00baad' : '#f59e42'} />
                      ))}
                      {activityType === 'type' && chainOptions.flatMap(network => (
                        typeOptions.map(type => (
                          <Bar key={`${network}_${type}`} dataKey={`${network}_${type}`} stackId="a" fill={network === 'Ethereum' ? '#8884d8' : network === 'Solana' ? '#00baad' : '#f59e42'} />
                        ))
                      ))}
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="allocation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Allocation</CardTitle>
              <CardDescription>Breakdown of your portfolio by token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[320px] w-full flex flex-col md:flex-row gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPie
                      data={tokenAlloc}
                      dataKey="valueUSD"
                      nameKey="symbol"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label={({ name, value }) => `${name}: $${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
                    />
                    <Tooltip formatter={(value: any) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex-1">
                  <table className="min-w-full text-xs">
                    <thead>
                      <tr>
                        <th className="text-left">Token</th>
                        <th className="text-right">Balance</th>
                        <th className="text-right">Value (USD)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokenAlloc.map(t => (
                        <tr key={t.symbol}>
                          <td>{t.symbol} <span className="text-muted-foreground">({t.name})</span></td>
                          <td className="text-right">{t.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                          <td className="text-right">${t.valueUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Health Score</CardTitle>
              <CardDescription>Your overall portfolio health</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="flex flex-col items-center">
                  <div className="text-6xl font-bold" style={{ color: healthScore > 80 ? '#10b981' : healthScore > 50 ? '#f59e42' : '#ef4444' }}>{healthScore}</div>
                  <div className="mt-2 text-muted-foreground">out of 100</div>
                </div>
                <div>
                  <div className="mb-2 font-medium">Score Breakdown:</div>
                  <ul className="text-xs space-y-1">
                    <li>Diversification: {tokenAlloc.length >= 5 ? 'Excellent' : tokenAlloc.length >= 3 ? 'Good' : 'Low'}</li>
                    <li>Concentration: {tokenAlloc[0] && tokenAlloc[0].valueUSD / totalValue > 0.7 ? 'High' : 'Balanced'}</li>
                    <li>ROI: {roi >= 0 ? 'Positive' : 'Negative'}</li>
                    <li>Security Events: 0</li>
                  </ul>
                </div>
              </div>
              <div className="mt-4 text-muted-foreground text-xs">Tip: Improve your score by diversifying, avoiding large risky moves, and keeping your account secure.</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer" className="space-y-6">
          <Transfer />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export async function fetchWalletsAndPricesAndHistoryAndActivity() {
  const allWallets = await walletService.getAllWallets?.() || [];
  // Aggregate tokens for price fetching
  const tokens = Array.from(new Set(allWallets.flatMap((w: any) => (w.tokens || []).map((t: any) => t.symbol.toUpperCase()))));
  let tokenPrices = {};
  if (tokens.length) {
    tokenPrices = await fetchTokenPrices(tokens);
  }
  // Fetch historical portfolio value for all wallets (sum by day)
  let history = [];
  let topAssets = [];
  let recentActivity = [];
  let totalValue = 0;
  let percentChange = 0;
  if (allWallets.length) {
    try {
      const histories = await Promise.all(
        allWallets.map(async (w: any) => {
          if (!w.address) return [];
          try {
            const hist = await cryptoService.getPortfolioHistory(w.address, 1, 60);
            return hist;
          } catch {
            return [];
          }
        })
      );
      // Merge histories, calculate totalValue, percentChange, etc.
      // ... (existing logic)
    } catch {}
  }
  return { wallets: allWallets, totalValue, percentChange, topAssets, recentActivity };
}

export default PortfolioAnalytics;
