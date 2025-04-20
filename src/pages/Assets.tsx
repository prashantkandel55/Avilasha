import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LivePriceCard } from '@/components/LivePriceCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Star, ArrowUpDown, Filter, BarChart, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const cryptoAssets = [
  {
    id: 1,
    name: 'Bitcoin',
    symbol: 'BTC',
    logo: '🔶',
    price: '$42,567.89',
    priceChange: '+2.4%',
    holdings: '0.45 BTC',
    value: '$19,155.55',
    costBasis: '$16,850.00',
    pnl: '+$2,305.55 (+13.7%)',
    positive: true,
    starred: true
  },
  {
    id: 2,
    name: 'Ethereum',
    symbol: 'ETH',
    logo: '💠',
    price: '$3,245.67',
    priceChange: '+1.2%',
    holdings: '3.8 ETH',
    value: '$12,333.55',
    costBasis: '$10,200.00',
    pnl: '+$2,133.55 (+20.9%)',
    positive: true,
    starred: true
  },
  {
    id: 3,
    name: 'Solana',
    symbol: 'SOL',
    logo: '🟣',
    price: '$136.52',
    priceChange: '+3.8%',
    holdings: '18.5 SOL',
    value: '$2,525.62',
    costBasis: '$1,850.00',
    pnl: '+$675.62 (+36.5%)',
    positive: true,
    starred: false
  },
  {
    id: 4,
    name: 'Cardano',
    symbol: 'ADA',
    logo: '🔵',
    price: '$0.52',
    priceChange: '-1.5%',
    holdings: '1250 ADA',
    value: '$650.00',
    costBasis: '$750.00',
    pnl: '-$100.00 (-13.3%)',
    positive: false,
    starred: false
  },
  {
    id: 5,
    name: 'Ripple',
    symbol: 'XRP',
    logo: '⚪',
    price: '$0.48',
    priceChange: '-0.8%',
    holdings: '2500 XRP',
    value: '$1,200.00',
    costBasis: '$1,150.00',
    pnl: '+$50.00 (+4.3%)',
    positive: true,
    starred: false
  },
];

const Assets = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showWalletModal, setShowWalletModal] = useState(false);

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading assets...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view your assets.</p>
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

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };
  
  const filteredAssets = cryptoAssets.filter(
    asset => asset.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
             asset.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Assets</h1>
        <p className="text-muted-foreground">Manage and monitor your cryptocurrency assets</p>
      </div>
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">All Assets</TabsTrigger>
          <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
          <TabsTrigger value="losers">Top Losers</TabsTrigger>
          <TabsTrigger value="starred">Starred</TabsTrigger>
        </TabsList>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search assets..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="tokens">Tokens</SelectItem>
              <SelectItem value="nfts">NFTs</SelectItem>
              <SelectItem value="defi">DeFi</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4" />
            Sort by: Value
          </Button>
        </div>
        
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>My Assets</CardTitle>
                  <CardDescription>All your cryptocurrency holdings</CardDescription>
                </div>
                <Button className="bg-primary hover:bg-primary/90">Add New Asset</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 w-8"></th>
                      <th className="text-left py-3 px-2">Asset</th>
                      <th className="text-right py-3 px-2 cursor-pointer" onClick={() => handleSort('price')}>
                        <div className="flex justify-end items-center">
                          Price
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-right py-3 px-2">24h</th>
                      <th className="text-right py-3 px-2">Holdings</th>
                      <th className="text-right py-3 px-2 cursor-pointer" onClick={() => handleSort('value')}>
                        <div className="flex justify-end items-center">
                          Value
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-right py-3 px-2">Cost Basis</th>
                      <th className="text-right py-3 px-2 cursor-pointer" onClick={() => handleSort('pnl')}>
                        <div className="flex justify-end items-center">
                          P&L
                          <ArrowUpDown className="ml-1 h-3 w-3" />
                        </div>
                      </th>
                      <th className="text-right py-3 px-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Star className={`h-4 w-4 ${asset.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                          </Button>
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center">
                            <div className="mr-2 text-xl">{asset.logo}</div>
                            <div>
                              <div className="font-medium">{asset.name}</div>
                              <div className="text-xs text-muted-foreground">{asset.symbol}</div>
                            </div>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{asset.price}</td>
                        <td className={`text-right py-3 px-2 ${asset.positive ? 'text-green-500' : 'text-red-500'}`}>
                          <div className="flex items-center justify-end">
                            {asset.positive ? <TrendingUp className="mr-1 h-3 w-3" /> : <TrendingDown className="mr-1 h-3 w-3" />}
                            {asset.priceChange}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{asset.holdings}</td>
                        <td className="text-right py-3 px-2 font-medium">{asset.value}</td>
                        <td className="text-right py-3 px-2">{asset.costBasis}</td>
                        <td className={`text-right py-3 px-2 ${asset.pnl.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.pnl}
                        </td>
                        <td className="text-right py-3 px-2">
                          <div className="flex justify-end space-x-1">
                            <Button variant="outline" size="icon" className="h-7 w-7">
                              <BarChart className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3.5 w-3.5" />
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
          
          <div className="grid gap-6 md:grid-cols-2">
            <LivePriceCard
              symbols={['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT']}
              title="Live Market Prices"
            />
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Breakdown of your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Bitcoin (BTC)', percentage: 53, value: '53%', color: 'bg-yellow-500' },
                    { name: 'Ethereum (ETH)', percentage: 34, value: '34%', color: 'bg-blue-500' },
                    { name: 'Solana (SOL)', percentage: 7, value: '7%', color: 'bg-purple-500' },
                    { name: 'Cardano (ADA)', percentage: 2, value: '2%', color: 'bg-blue-300' },
                    { name: 'Ripple (XRP)', percentage: 4, value: '4%', color: 'bg-gray-500' },
                  ].map((asset) => (
                    <div key={asset.name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{asset.name}</span>
                        <span className="font-medium">{asset.value}</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className={`${asset.color} h-2 rounded-full`}
                          style={{ width: asset.value }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Asset Performance</CardTitle>
                <CardDescription>Gain/loss information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="border rounded-md p-4">
                      <div className="text-sm text-muted-foreground">Total Gain/Loss</div>
                      <div className="text-2xl font-bold text-green-500">+$5,064.72</div>
                      <div className="text-sm text-green-500">+17.8%</div>
                    </div>
                    <div className="border rounded-md p-4">
                      <div className="text-sm text-muted-foreground">24h Change</div>
                      <div className="text-2xl font-bold text-green-500">+$835.22</div>
                      <div className="text-sm text-green-500">+2.3%</div>
                    </div>
                    <div className="border rounded-md p-4">
                      <div className="text-sm text-muted-foreground">Best Performer</div>
                      <div className="text-lg font-bold">Solana</div>
                      <div className="text-sm text-green-500">+36.5%</div>
                    </div>
                    <div className="border rounded-md p-4">
                      <div className="text-sm text-muted-foreground">Worst Performer</div>
                      <div className="text-lg font-bold">Cardano</div>
                      <div className="text-sm text-red-500">-13.3%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="gainers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Assets</CardTitle>
              <CardDescription>Your best performing cryptocurrencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoAssets
                  .filter(asset => asset.positive)
                  .sort((a, b) => {
                    const aPercentage = parseFloat(a.pnl.split('(')[1].replace(')', '').replace('%', ''));
                    const bPercentage = parseFloat(b.pnl.split('(')[1].replace(')', '').replace('%', ''));
                    return bPercentage - aPercentage;
                  })
                  .map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <div className="mr-3 text-xl">{asset.logo}</div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.holdings}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.value}</div>
                        <div className="text-sm text-green-500">{asset.pnl.split(' ')[1]}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="losers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Underperforming Assets</CardTitle>
              <CardDescription>Assets that have lost value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoAssets
                  .filter(asset => !asset.positive)
                  .sort((a, b) => {
                    const aPercentage = parseFloat(a.pnl.split('(')[1].replace(')', '').replace('%', ''));
                    const bPercentage = parseFloat(b.pnl.split('(')[1].replace(')', '').replace('%', ''));
                    return aPercentage - bPercentage;
                  })
                  .map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <div className="mr-3 text-xl">{asset.logo}</div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.holdings}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.value}</div>
                        <div className="text-sm text-red-500">{asset.pnl.split(' ')[1]}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="starred" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Starred Assets</CardTitle>
              <CardDescription>Your favorite cryptocurrencies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cryptoAssets
                  .filter(asset => asset.starred)
                  .map(asset => (
                    <div key={asset.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex items-center">
                        <Button variant="ghost" size="icon" className="h-6 w-6 mr-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        </Button>
                        <div className="mr-3 text-xl">{asset.logo}</div>
                        <div>
                          <div className="font-medium">{asset.name}</div>
                          <div className="text-xs text-muted-foreground">{asset.holdings}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.value}</div>
                        <div className={`text-sm ${asset.positive ? 'text-green-500' : 'text-red-500'}`}>
                          {asset.pnl.split(' ')[1]}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Assets;
