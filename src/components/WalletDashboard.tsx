import React, { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { walletService } from '../services/wallet.service';
import { WALLET_CONFIG, CHART_CONFIG } from '../config/wallet.config';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface WalletDashboardProps {
  className?: string;
}

export function WalletDashboard({ className }: WalletDashboardProps) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState(WALLET_CONFIG.supportedNetworks[0]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchWallets();
    const interval = setInterval(fetchWallets, WALLET_CONFIG.refreshInterval);
    return () => clearInterval(interval);
  }, []);

  const fetchWallets = async () => {
    const walletsData = await walletService.getAllWallets();
    setWallets(walletsData);
  };

  const handleAddWallet = async () => {
    if (!newWalletAddress) return;
    setLoading(true);
    try {
      await walletService.addWallet(newWalletAddress, selectedNetwork);
      setNewWalletAddress('');
      await fetchWallets();
    } catch (error) {
      console.error('Error adding wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">Wallet Tracker</h2>
        
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Enter wallet address"
            value={newWalletAddress}
            onChange={(e) => setNewWalletAddress(e.target.value)}
            className="flex-1"
          />
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            {WALLET_CONFIG.supportedNetworks.map((network) => (
              <option key={network} value={network}>
                {network.charAt(0).toUpperCase() + network.slice(1)}
              </option>
            ))}
          </select>
          <Button
            onClick={handleAddWallet}
            disabled={loading || !newWalletAddress}
          >
            {loading ? 'Adding...' : 'Add Wallet'}
          </Button>
        </div>

        <div className="space-y-4">
          {wallets.map((wallet) => (
            <Card key={wallet.address} className="p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold">{wallet.network}</h3>
                  <p className="text-sm text-muted-foreground">{wallet.address}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    ${wallet.totalValueUSD.toLocaleString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(wallet.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="h-[200px] mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={wallet.tokens}>
                    <XAxis dataKey="symbol" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="valueUSD"
                      stroke={CHART_CONFIG.colors.primary}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {wallet.tokens.map((token: any) => (
                  <div
                    key={token.symbol}
                    className="flex justify-between items-center p-2 hover:bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{token.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.balance} {token.symbol}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ${token.valueUSD.toLocaleString()}
                      </p>
                      <p
                        className={`text-sm ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}
                      >
                        {token.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
}