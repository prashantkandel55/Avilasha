import React, { useState, useEffect } from 'react';
import { ArrowDownLeft, ArrowUpRight, RefreshCw, CircleDot, Calendar, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const getTransactionIcon = (type: string) => {
  if (type === "receive" || type === "claim") {
    return <ArrowDownLeft className="text-green-500" />;
  } else if (type === "send") {
    return <ArrowUpRight className="text-red-500" />;
  } else if (["swap", "approve", "stake", "unstake"].includes(type)) {
    return <RefreshCw className="text-blue-500" />;
  } else {
    return <CircleDot className="text-gray-500" />;
  }
};

const transactionTypes = ['receive', 'send', 'swap', 'approve', 'stake', 'unstake', 'claim'];
const assets = ['ETH', 'BTC', 'SOL', 'AVAX', 'USDC', 'USDT'];

// Generate random transactions for demo
const generateTransactions = (count: number) => {
  return Array.from({ length: count }, (_, i) => {
    const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
    const asset = assets[Math.floor(Math.random() * assets.length)];
    const amount = (Math.random() * 10).toFixed(4);
    const usdValue = (parseFloat(amount) * (asset === 'ETH' ? 2800 : asset === 'BTC' ? 45000 : asset === 'SOL' ? 120 : asset === 'AVAX' ? 35 : 1)).toFixed(2);
    
    // Generate random date within last 30 days
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * 30));
    
    return {
      id: i,
      type,
      asset,
      amount,
      usdValue,
      date: date.toLocaleDateString(),
      time: `${Math.floor(Math.random() * 12) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} ${Math.random() > 0.5 ? 'AM' : 'PM'}`,
      status: Math.random() > 0.9 ? 'pending' : 'confirmed',
      hash: `0x${Math.random().toString(16).substring(2, 34)}`
    };
  });
};

const History = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState(generateTransactions(20));
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    async function fetchWalletsAndHistory() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
      setTransactions(generateTransactions(20));
    }
    fetchWalletsAndHistory();
    interval = setInterval(fetchWalletsAndHistory, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading history...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your transaction history.</p>
        <button
          className="inline-block bg-primary text-white px-6 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          onClick={() => setShowWalletModal(true)}
        >
          Connect Wallet
        </button>
        {showWalletModal && (
          <WalletConnectModal onConnect={() => {
            setShowWalletModal(false);
            (async () => {
              const allWallets = await walletService.getAllWallets?.() || [];
              setWallets(allWallets);
            })();
          }} />
        )}
      </div>
    );
  }

  const handleExport = () => {
    toast({
      title: "Export Started",
      description: "Your transaction history is being exported to CSV",
    });
  };

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6 slide-up-animation">
        <div>
          <h1 className="text-3xl font-bold mb-1">Transaction History</h1>
          <p className="text-muted-foreground">View and export your transaction history across all wallets</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
            <Calendar size={16} />
            <span>Filter Date</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2 transition-all duration-300 hover:bg-primary/10">
            <Filter size={16} />
            <span>Filters</span>
          </Button>
          <Button onClick={handleExport} className="flex items-center gap-2 transition-all duration-300 hover:shadow-md">
            <Download size={16} />
            <span>Export</span>
          </Button>
        </div>
      </div>
      
      <Card className="mb-6 transition-all duration-300 hover:shadow-md fade-in-animation">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Asset</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">USD Value</th>
                  <th className="text-left p-3">Date & Time</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Transaction Hash</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center mr-2">
                          {getTransactionIcon(tx.type)}
                        </div>
                        <span className="capitalize">{tx.type}</span>
                      </div>
                    </td>
                    <td className="p-3 font-medium">{tx.asset}</td>
                    <td className="p-3">
                      <span className={tx.type === 'receive' || tx.type === 'claim' ? 'text-green-500' : tx.type === 'send' ? 'text-red-500' : ''}>
                        {tx.type === 'receive' || tx.type === 'claim' ? '+' : tx.type === 'send' ? '-' : ''}
                        {tx.amount} {tx.asset}
                      </span>
                    </td>
                    <td className="p-3">${tx.usdValue}</td>
                    <td className="p-3">
                      <div>{tx.date}</div>
                      <div className="text-xs text-muted-foreground">{tx.time}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${tx.status === 'confirmed' ? 'bg-green-500/20 text-green-600' : 'bg-yellow-500/20 text-yellow-600'}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center">
                        <span className="text-muted-foreground text-sm truncate max-w-[120px]">{tx.hash}</span>
                        <Button variant="ghost" size="sm" className="ml-2 h-6 w-6 p-0" onClick={() => {
                          navigator.clipboard.writeText(tx.hash);
                          toast({
                            title: "Copied to clipboard",
                            description: "Transaction hash copied to clipboard",
                          });
                        }}>
                          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-3 w-3">
                            <path d="M5 2V1H10V2H5ZM4.75 0C4.33579 0 4 0.335786 4 0.75V1H3.5C2.67157 1 2 1.67157 2 2.5V12.5C2 13.3284 2.67157 14 3.5 14H11.5C12.3284 14 13 13.3284 13 12.5V2.5C13 1.67157 12.3284 1 11.5 1H11V0.75C11 0.335786 10.6642 0 10.25 0H4.75ZM11 2V2.25C11 2.66421 10.6642 3 10.25 3H4.75C4.33579 3 4 2.66421 4 2.25V2H3.5C3.22386 2 3 2.22386 3 2.5V12.5C3 12.7761 3.22386 13 3.5 13H11.5C11.7761 13 12 12.7761 12 12.5V2.5C12 2.22386 11.7761 2 11.5 2H11Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                          </svg>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default History;
