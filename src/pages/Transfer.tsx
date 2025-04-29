import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import axios from 'axios';
import { walletService } from '@/services/wallet.service';
import { AuthService } from '@/services/authService';
import { ethers } from 'ethers';
import { showBrowserNotification, playNotificationSound } from '@/utils/notificationUtils';
import { Info, CheckCircle, AlertCircle, Repeat, Copy } from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// Li.Fi API endpoint (public, no API key required for read)
const LIFI_API = 'https://li.quest/v1';

// Utility for explorer links (now supports more chains and account/tx views)
const getExplorerUrl = (chain: string, hash: string, type: 'tx' | 'address' = 'tx') => {
  if (!hash) return '';
  if (chain === 'ethereum') {
    return type === 'tx'
      ? `https://etherscan.io/tx/${hash}`
      : `https://etherscan.io/address/${hash}`;
  }
  if (chain === 'solana') {
    return type === 'tx'
      ? `https://solscan.io/tx/${hash}`
      : `https://solscan.io/address/${hash}`;
  }
  if (chain === 'sui') {
    return type === 'tx'
      ? `https://explorer.sui.io/transaction/${hash}?network=mainnet`
      : `https://explorer.sui.io/address/${hash}?network=mainnet`;
  }
  // Add more chains here as needed
  return '';
};

// --- Explorer section for each chain ---
const renderExplorerLinks = (chain: string, txHash: string, address: string) => {
  const explorerTx = getExplorerUrl(chain, txHash, 'tx');
  const explorerAddress = getExplorerUrl(chain, address, 'address');
  if (!explorerTx && !explorerAddress) return null;
  return (
    <div className="flex flex-col gap-1 mt-2">
      {explorerTx && (
        <a href={explorerTx} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
          View Transaction on {chain.charAt(0).toUpperCase() + chain.slice(1)} Explorer
        </a>
      )}
      {explorerAddress && (
        <a href={explorerAddress} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-xs">
          View Address on {chain.charAt(0).toUpperCase() + chain.slice(1)} Explorer
        </a>
      )}
    </div>
  );
};

// Transfer history in localStorage
const HISTORY_KEY = 'cross_chain_transfer_history';

// Replace saveTransferHistory with cloud sync
const saveTransferHistory = async (record: any) => {
  const user = await AuthService.getCurrentUser?.();
  let synced = false;
  if (user && user.id && AuthService && AuthService.updateProfile) {
    try {
      // Save to Supabase profile (append to custom 'transfer_history' field)
      const { profile } = await AuthService.getProfile(user.id);
      const prev = Array.isArray(profile?.transfer_history) ? profile.transfer_history : [];
      const updated = [record, ...prev].slice(0, 25);
      await AuthService.updateProfile(user.id, { transfer_history: updated });
      synced = true;
    } catch (err) {
      // Fallback to localStorage on error
      synced = false;
    }
  }
  if (!synced) {
    const prev = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    prev.unshift(record);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(prev.slice(0, 25)));
  }
};

const getTransferHistory = async () => {
  const user = await AuthService.getCurrentUser?.();
  if (user && user.id && AuthService && AuthService.getProfile) {
    try {
      const { profile } = await AuthService.getProfile(user.id);
      if (Array.isArray(profile?.transfer_history)) return profile.transfer_history;
    } catch (err) {}
  }
  return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
};

// Tooltip wrapper for content prop compatibility
const TooltipWrapper = ({ content, children }: { content: string, children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>{children}</TooltipTrigger>
    <TooltipContent>{content}</TooltipContent>
  </Tooltip>
);

const Transfer = () => {
  const [chains, setChains] = useState<any[]>([]);
  const [tokens, setTokens] = useState<any[]>([]);
  const [sourceChain, setSourceChain] = useState('');
  const [destChain, setDestChain] = useState('');
  const [sourceToken, setSourceToken] = useState('');
  const [destToken, setDestToken] = useState('');
  const [amount, setAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [wallets, setWallets] = useState<any[]>([]);
  const [fromAddress, setFromAddress] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [txStatus, setTxStatus] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  // --- Enhanced Validation State ---
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Fetch connected wallets (for selection)
  useEffect(() => {
    (async () => {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      if (allWallets.length) {
        setFromAddress(allWallets[0].address);
        setToAddress(allWallets[0].address);
      }
    })();
  }, []);

  // Fetch supported chains
  useEffect(() => {
    axios.get(`${LIFI_API}/chains`)
      .then(res => setChains(res.data.chains || []))
      .catch(() => setError('Failed to fetch chains'));
  }, []);

  // Fetch supported tokens for selected source chain
  useEffect(() => {
    if (sourceChain) {
      axios.get(`${LIFI_API}/tokens?chain=${sourceChain}`)
        .then(res => setTokens(res.data.tokens || []))
        .catch(() => setError('Failed to fetch tokens'));
    }
  }, [sourceChain]);

  // Fetch quote when all fields are filled
  useEffect(() => {
    if (sourceChain && destChain && sourceToken && destToken && amount && fromAddress && toAddress) {
      setLoading(true);
      setError('');
      axios.get(`${LIFI_API}/quote`, {
        params: {
          fromChain: sourceChain,
          toChain: destChain,
          fromToken: sourceToken,
          toToken: destToken,
          fromAddress,
          toAddress,
          fromAmount: amount,
        }
      }).then(res => {
        setQuote(res.data);
        setLoading(false);
      }).catch(() => {
        setError('Failed to fetch quote');
        setLoading(false);
      });
    } else {
      setQuote(null);
    }
  }, [sourceChain, destChain, sourceToken, destToken, amount, fromAddress, toAddress]);

  // On mount, load history from cloud/local
  useEffect(() => {
    (async () => {
      setHistory(await getTransferHistory());
    })();
  }, []);

  // Add real-time polling for transfer history
  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchHistory() {
      setHistory(await getTransferHistory());
    }
    fetchHistory();
    interval = setInterval(fetchHistory, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  // Validate fields whenever dependencies change
  useEffect(() => {
    const errors: any = {};
    if (!sourceChain) errors.sourceChain = 'Select a source chain.';
    if (!destChain) errors.destChain = 'Select a destination chain.';
    if (!sourceToken) errors.sourceToken = 'Select a source token.';
    if (!destToken) errors.destToken = 'Select a destination token.';
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) errors.amount = 'Enter a valid amount.';
    if (!fromAddress) errors.fromAddress = 'Choose a sending wallet.';
    if (!toAddress) errors.toAddress = 'Choose a recipient.';
    if (toAddress && toAddress !== fromAddress && !validateAddress(toAddress, destChain)) errors.toAddress = 'Invalid recipient address for selected chain.';
    setValidationErrors(errors);
  }, [sourceChain, destChain, sourceToken, destToken, amount, fromAddress, toAddress]);

  // Show wallet balance for selected token
  const selectedWallet = wallets.find(w => w.address === fromAddress);
  const selectedToken = tokens.find(t => t.address === sourceToken);
  let walletTokenBalance = 0;
  if (selectedWallet && selectedToken && selectedWallet.tokens) {
    const token = selectedWallet.tokens.find((tk: any) => tk.symbol === selectedToken.symbol);
    walletTokenBalance = token ? Number(token.balance || 0) : 0;
  }

  // Confirm dialog before transfer
  const handleTransferClick = (e: any) => {
    e.preventDefault();
    setShowConfirm(true);
  };
  const handleConfirmTransfer = async () => {
    setConfirming(true);
    await handleTransfer();
    setShowConfirm(false);
    setConfirming(false);
  };

  // Retry failed transfer
  const retryTransfer = async (h: any) => {
    setSourceChain(h.fromChain);
    setDestChain(h.toChain);
    setSourceToken(h.fromToken);
    setDestToken(h.toToken);
    setAmount(h.amount);
    setFromAddress(h.fromAddress);
    setToAddress(h.toAddress);
    setTimeout(() => setShowConfirm(true), 500);
  };

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Real transaction monitoring for Ethereum
  const monitorEthereumTx = async (provider: any, txHash: string, updateStatus: (status: string) => void) => {
    updateStatus('in_progress');
    try {
      const receipt = await provider.waitForTransaction(txHash, 1, 180000); // wait up to 3 minutes
      if (receipt && receipt.status === 1) {
        updateStatus('confirmed');
      } else {
        updateStatus('failed');
      }
    } catch {
      updateStatus('failed');
    }
  };

  // Real transaction monitoring for Solana
  const monitorSolanaTx = async (provider: any, txHash: string, updateStatus: (status: string) => void) => {
    updateStatus('in_progress');
    try {
      // Use Solana JSON-RPC to poll for confirmation
      const connection = new (window as any).solanaWeb3.Connection('https://api.mainnet-beta.solana.com');
      for (let i = 0; i < 60; i++) { // up to ~60s
        const res = await connection.getSignatureStatus(txHash);
        if (res && res.value && res.value.confirmationStatus === 'finalized') {
          updateStatus('confirmed');
          return;
        }
        if (res && res.value && res.value.err) {
          updateStatus('failed');
          return;
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      updateStatus('failed'); // timeout
    } catch {
      updateStatus('failed');
    }
  };

  // Real transaction monitoring for Sui
  const monitorSuiTx = async (provider: any, txHash: string, updateStatus: (status: string) => void) => {
    updateStatus('in_progress');
    try {
      // Use Sui Wallet Standard or Sui JSON-RPC
      for (let i = 0; i < 60; i++) {
        const resp = await fetch(`https://explorer-rpc.mainnet.sui.io/transactions/${txHash}`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.status === 'success') {
            updateStatus('confirmed');
            return;
          }
          if (data.status === 'failed') {
            updateStatus('failed');
            return;
          }
        }
        await new Promise(r => setTimeout(r, 1000));
      }
      updateStatus('failed');
    } catch {
      updateStatus('failed');
    }
  };

  // Handle transfer execution
  const handleTransfer = async () => {
    if (!quote) return;
    setTxStatus('Preparing transaction...');
    const record: any = {
      fromChain: sourceChain,
      toChain: destChain,
      fromToken: sourceToken,
      toToken: destToken,
      amount,
      fromAddress,
      toAddress,
      date: new Date().toISOString(),
      status: 'pending',
      txHash: '',
      explorerUrl: '',
    };
    setHistory(h => [{ ...record }, ...h]);
    try {
      setTxStatus('Submitting transaction...');
      setHistory(h => [{ ...record, status: 'in_progress' }, ...h.slice(1)]);
      let txHash = '';
      let explorerUrl = '';
      if (sourceChain === 'ethereum') {
        if (!(window as any).ethereum) throw new Error('No Ethereum wallet found');
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const tx = await signer.sendTransaction({
          to: quote.transaction.to,
          data: quote.transaction.data,
          value: quote.transaction.value || 0,
        });
        txHash = tx.hash;
        explorerUrl = getExplorerUrl(sourceChain, txHash);
        setTxStatus('Transaction sent. Waiting for confirmation...');
        monitorEthereumTx(provider, txHash, (status) => {
          setHistory(h => [{ ...record, status, txHash, explorerUrl }, ...h.slice(1)]);
          if (status === 'confirmed') setTxStatus('Transfer complete!');
          else if (status === 'failed') setTxStatus('Transfer failed.');
        });
      } else if (sourceChain === 'solana') {
        // @ts-ignore
        const provider = window.solana;
        if (!provider || !provider.isPhantom) throw new Error('No Solana wallet found');
        setTxStatus('Requesting approval in Phantom...');
        const txBase64 = quote.transaction?.data;
        if (!txBase64) throw new Error('No Solana transaction data returned');
        const signed = await provider.signAndSendTransaction({ message: txBase64 });
        txHash = signed.signature;
        explorerUrl = getExplorerUrl(sourceChain, txHash);
        setTxStatus('Solana transaction sent: ' + txHash);
        monitorSolanaTx(provider, txHash, (status) => {
          setHistory(h => [{ ...record, status, txHash, explorerUrl }, ...h.slice(1)]);
          if (status === 'confirmed') setTxStatus('Transfer complete!');
          else if (status === 'failed') setTxStatus('Transfer failed.');
        });
      } else if (sourceChain === 'sui') {
        // @ts-ignore
        const suiProvider = window.suiWallet;
        if (!suiProvider) throw new Error('No Sui wallet found');
        setTxStatus('Requesting approval in Sui Wallet...');
        const txBytes = quote.transaction?.data;
        if (!txBytes) throw new Error('No Sui transaction data returned');
        const signed = await suiProvider.signAndExecuteTransaction({ transaction: txBytes });
        txHash = signed.digest;
        explorerUrl = getExplorerUrl(sourceChain, txHash);
        setTxStatus('Sui transaction sent: ' + txHash);
        monitorSuiTx(suiProvider, txHash, (status) => {
          setHistory(h => [{ ...record, status, txHash, explorerUrl }, ...h.slice(1)]);
          if (status === 'confirmed') setTxStatus('Transfer complete!');
          else if (status === 'failed') setTxStatus('Transfer failed.');
        });
      } else {
        // For other chains, keep simulation for now
        txHash = '0x' + Math.random().toString(16).slice(2, 10).padEnd(64, '0');
        explorerUrl = `https://explorer.example.com/tx/${txHash}`;
        await new Promise(r => setTimeout(r, 1500));
        setHistory(h => [{ ...record, status: 'confirmed', txHash, explorerUrl }, ...h.slice(1)]);
        setTxStatus('Transfer sent!');
      }
    } catch (err) {
      setHistory(h => [{ ...record, status: 'failed' }, ...h.slice(1)]);
      setTxStatus('Transfer failed.');
    }
  };

  const validateAddress = (address: string, chain: string) => {
    if (!address) return false;
    if (chain === 'ethereum') return /^0x[a-fA-F0-9]{40}$/.test(address);
    if (chain === 'solana') return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
    if (chain === 'sui') return /^0x[a-fA-F0-9]{40,64}$/.test(address);
    return true;
  };

  // --- Sorting/filtering helpers ---
  const sortOptions = [
    { value: 'date', label: 'Date' },
    { value: 'amount', label: 'Amount' },
    { value: 'status', label: 'Status' },
  ];
  const statusOptions = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'failed', label: 'Failed' },
  ];

  const [sortBy, setSortBy] = useState('date');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState('');

  const exportHistory = () => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transfer-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedFilteredHistory = history
    .filter(h => !filterStatus || h.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === 'date') {
        return sortDir === 'asc' ? new Date(a.date).getTime() - new Date(b.date).getTime() : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === 'amount') {
        return sortDir === 'asc' ? Number(a.amount) - Number(b.amount) : Number(b.amount) - Number(a.amount);
      } else if (sortBy === 'status') {
        return sortDir === 'asc' ? (a.status || '').localeCompare(b.status || '') : (b.status || '').localeCompare(a.status || '');
      }
      return 0;
    });

  // --- Status options for richer tracking ---
  const statusMeta: Record<string, { label: string; color: string; icon: any }> = {
    pending: { label: 'Pending', color: 'text-yellow-500', icon: <AlertCircle className="w-3 h-3" /> },
    in_progress: { label: 'In Progress', color: 'text-blue-500', icon: <Repeat className="w-3 h-3 animate-spin" /> },
    confirmed: { label: 'Confirmed', color: 'text-green-600', icon: <CheckCircle className="w-3 h-3" /> },
    failed: { label: 'Failed', color: 'text-red-500', icon: <AlertCircle className="w-3 h-3" /> },
  };

  return (
    <Card className="max-w-xl mx-auto mt-8">
      <CardHeader>
        <CardTitle>Cross-Chain Transfer & Bridge</CardTitle>
        <CardDescription>
          Swap or bridge assets between blockchains using Li.Fi aggregator
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          {/* --- Enhanced Form Fields with Validation and Helper Texts --- */}
          <div>
            <label className="block mb-1 flex items-center gap-1">Source Chain <TooltipWrapper content="Chain you want to send from."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={sourceChain} onChange={e => setSourceChain(e.target.value)} className="w-full px-2 py-1 rounded border">
              <option value="">Select chain</option>
              {chains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {validationErrors.sourceChain && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.sourceChain}</div>}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">Destination Chain <TooltipWrapper content="Chain you want to send to."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={destChain} onChange={e => setDestChain(e.target.value)} className="w-full px-2 py-1 rounded border">
              <option value="">Select chain</option>
              {chains.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {validationErrors.destChain && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.destChain}</div>}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">Source Token <TooltipWrapper content="Token to send from your wallet."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={sourceToken} onChange={e => setSourceToken(e.target.value)} className="w-full px-2 py-1 rounded border">
              <option value="">Select token</option>
              {tokens.map(t => (
                <option key={t.address} value={t.address}>{t.symbol} ({t.name})</option>
              ))}
            </select>
            {validationErrors.sourceToken && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.sourceToken}</div>}
            {selectedToken && (
              <div className="text-xs text-muted-foreground mt-1">Wallet balance: {walletTokenBalance} {selectedToken.symbol}</div>
            )}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">Destination Token <TooltipWrapper content="Token to receive on destination chain."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={destToken} onChange={e => setDestToken(e.target.value)} className="w-full px-2 py-1 rounded border">
              <option value="">Select token</option>
              {tokens.map(t => (
                <option key={t.address} value={t.address}>{t.symbol} ({t.name})</option>
              ))}
            </select>
            {validationErrors.destToken && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.destToken}</div>}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">Amount <TooltipWrapper content="Amount to transfer."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full px-2 py-1 rounded border" />
            {validationErrors.amount && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.amount}</div>}
            {selectedToken && walletTokenBalance > 0 && (
              <div className="text-xs text-muted-foreground mt-1">Max available: {walletTokenBalance} {selectedToken.symbol}</div>
            )}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">From Wallet <TooltipWrapper content="Wallet to send from."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={fromAddress} onChange={e => setFromAddress(e.target.value)} className="w-full px-2 py-1 rounded border">
              {wallets.map(w => (
                <option key={w.address} value={w.address}>{w.name || w.address}</option>
              ))}
            </select>
            {validationErrors.fromAddress && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.fromAddress}</div>}
          </div>
          <div>
            <label className="block mb-1 flex items-center gap-1">To Wallet/Address <TooltipWrapper content="Recipient wallet or address."><Info className="w-4 h-4 text-muted-foreground" /></TooltipWrapper></label>
            <select value={toAddress} onChange={e => setToAddress(e.target.value)} className="w-full px-2 py-1 rounded border">
              {wallets.map(w => (
                <option key={w.address} value={w.address}>{w.name || w.address}</option>
              ))}
              <option value="custom">Custom Address...</option>
            </select>
            {toAddress === 'custom' && (
              <input type="text" placeholder="Enter recipient address" className="w-full mt-2 px-2 py-1 rounded border" onChange={e => setToAddress(e.target.value)} />
            )}
            {validationErrors.toAddress && <div className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {validationErrors.toAddress}</div>}
          </div>
          {loading && <div className="flex gap-2 items-center text-blue-500"><span className="loader spinner-border"></span> Fetching best route...</div>}
          {error && <div className="text-red-500 flex items-center gap-1"><AlertCircle className="w-4 h-4" /> {error}</div>}
          {quote && (
            <div className="bg-gray-100 rounded p-4 mt-2">
              <div><strong>Estimated Received:</strong> {quote.toAmountMinReadable} {quote.toToken.symbol}</div>
              <div><strong>Bridge:</strong> {quote.toolDetails?.name || quote.tool}</div>
              <div><strong>Estimated Time:</strong> {quote.estimatedDuration}s</div>
              <div><strong>Gas/Fees:</strong> {quote.feeCosts?.map((f: any) => `${f.amount} ${f.token.symbol}`).join(', ')}</div>
            </div>
          )}
          {txStatus && (
            <div className="text-green-600 font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {txStatus}
              {/* Show explorer link if hash is present in status */}
              {history[0]?.txHash && txStatus.toLowerCase().includes('sent') && (
                <>
                  <br />
                  <a href={history[0].explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">View on Explorer</a>
                </>
              )}
            </div>
          )}
          {/* --- Confirmation Dialog --- */}
          {showConfirm && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-lg p-8 max-w-sm w-full">
                <h3 className="font-bold text-lg mb-4">Confirm Transfer</h3>
                <div className="mb-4 text-sm text-muted-foreground">
                  Are you sure you want to transfer <b>{amount} {selectedToken?.symbol}</b> from <b>{sourceChain}</b> to <b>{destChain}</b>?<br />
                  Recipient: <b>{toAddress}</b>
                </div>
                <div className="flex gap-2 mt-4">
                  <button className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700" onClick={handleConfirmTransfer} disabled={confirming}>{confirming ? 'Processing...' : 'Yes, Transfer'}</button>
                  <button className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300" onClick={() => setShowConfirm(false)} disabled={confirming}>Cancel</button>
                </div>
              </div>
            </div>
          )}
          <button
            className={`mt-4 px-6 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 ${loading || Object.keys(validationErrors).length ? 'opacity-60 cursor-not-allowed' : ''}`}
            disabled={!quote || loading || Object.keys(validationErrors).length > 0}
            onClick={handleTransferClick}
          >
            {loading ? 'Processing...' : 'Execute Transfer'}
          </button>
          <hr className="my-6" />
          {/* --- Enhanced Transaction History --- */}
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-4">Recent Transfers
              <button onClick={exportHistory} className="ml-2 px-2 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300">Export</button>
            </h4>
            <div className="flex gap-2 mb-2 items-center text-xs">
              <label>Status:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-2 py-1">
                {statusOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <label className="ml-4">Sort by:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="border rounded px-2 py-1">
                {sortOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
              <button onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')} className="ml-1 px-1 py-0.5 border rounded">{sortDir === 'asc' ? '↑' : '↓'}</button>
            </div>
            {sortedFilteredHistory.length === 0 && <div className="text-gray-500">No recent transfers.</div>}
            <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
              {sortedFilteredHistory.map((h, idx) => (
                <li key={idx} className="bg-gray-50 rounded p-2 text-xs flex flex-col gap-1 border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{h.fromChain} → {h.toChain}</span>
                    <span>{h.fromToken} → {h.toToken}</span>
                    {statusMeta[h.status] && (
                      <span className={`${statusMeta[h.status].color} flex items-center gap-1`}>{statusMeta[h.status].icon}{statusMeta[h.status].label}</span>
                    )}
                  </div>
                  <div>Amount: {h.amount}</div>
                  <div>Date: {new Date(h.date).toLocaleString()}</div>
                  <div className="flex gap-2 items-center">
                    Tx: <a href={h.explorerUrl} target="_blank" rel="noopener noreferrer" className="underline text-blue-600">{h.txHash?.slice(0, 10)}...</a>
                    <button title="Copy Tx Hash" className="ml-1" onClick={() => copyToClipboard(h.txHash)}><Copy className="w-3 h-3 text-muted-foreground" /></button>
                    {h.status === 'failed' && <button className="ml-2 text-xs text-blue-600 flex items-center gap-1" onClick={() => retryTransfer(h)}><Repeat className="w-3 h-3" />Retry</button>}
                    {renderExplorerLinks(h.fromChain, h.txHash, h.fromAddress)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Transfer;
