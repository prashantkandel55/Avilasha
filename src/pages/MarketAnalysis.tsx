import React, { useState, useEffect } from 'react';
import { LivePriceCard } from '@/components/LivePriceCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { TrendingUp, TrendingDown, Search, BarChart, LineChart, Percent } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart as RechartsBarChart, Bar } from 'recharts';
import { walletService } from '@/services/wallet.service';
import { WalletConnectModal } from '@/components/WalletConnectModal';

const priceData = [
  { name: 'Jan', value: 35000 },
  { name: 'Feb', value: 38000 },
  { name: 'Mar', value: 42000 },
  { name: 'Apr', value: 58000 },
  { name: 'May', value: 45000 },
  { name: 'Jun', value: 37000 },
  { name: 'Jul', value: 42000 },
];

const volumeData = [
  { name: 'Jan', value: 12 },
  { name: 'Feb', value: 15 },
  { name: 'Mar', value: 18 },
  { name: 'Apr', value: 25 },
  { name: 'May', value: 22 },
  { name: 'Jun', value: 20 },
  { name: 'Jul', value: 22 },
];

const cryptoMarketData = [
  { 
    name: 'Bitcoin', 
    symbol: 'BTC', 
    price: '$42,567.89', 
    change24h: '+2.4%', 
    marketCap: '$825.4B',
    volume24h: '$28.3B',
    supply: '19.5M BTC',
    positive: true 
  },
  { 
    name: 'Ethereum', 
    symbol: 'ETH', 
    price: '$3,245.67', 
    change24h: '+1.2%', 
    marketCap: '$389.2B',
    volume24h: '$15.7B',
    supply: '120.3M ETH',
    positive: true  
  },
  { 
    name: 'Solana', 
    symbol: 'SOL', 
    price: '$136.52', 
    change24h: '+3.8%', 
    marketCap: '$59.4B',
    volume24h: '$4.8B',
    supply: '435.2M SOL',
    positive: true  
  },
  { 
    name: 'Cardano', 
    symbol: 'ADA', 
    price: '$0.52', 
    change24h: '-1.5%', 
    marketCap: '$18.2B',
    volume24h: '$1.3B',
    supply: '35.1B ADA',
    positive: false  
  },
  { 
    name: 'Ripple', 
    symbol: 'XRP', 
    price: '$0.48', 
    change24h: '-0.8%', 
    marketCap: '$25.3B',
    volume24h: '$1.8B',
    supply: '53.2B XRP',
    positive: false  
  },
];

const MarketAnalysis = () => {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);

  const filteredData = cryptoMarketData.filter(
    crypto => crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    async function fetchWallets() {
      const allWallets = await walletService.getAllWallets?.() || [];
      setWallets(allWallets);
      setLoading(false);
    }
    fetchWallets();
  }, []);

  if (loading) {
    return <div className="text-center p-10">Loading market analysis...</div>;
  }

  if (!wallets.length) {
    return (
      <div className="glassmorphism glassmorphism-hover p-8 rounded-2xl shadow-lg animate-fade-in text-center">
        <h2 className="text-2xl font-bold mb-2">No Wallet Connected</h2>
        <p className="mb-4">Connect a wallet to view market analysis.</p>
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

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1">Market Analysis</h1>
        <p className="text-muted-foreground">Monitor market trends and explore opportunities</p>
      </div>
      
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search for cryptocurrencies..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart size={16} />
            <span>Market Overview</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <LineChart size={16} />
            <span>Price Trends</span>
          </TabsTrigger>
          <TabsTrigger value="correlation" className="flex items-center gap-2">
            <Percent size={16} />
            <span>Correlation</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Global Market Cap</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1.89T</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-green-500 font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +2.5%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">24h Trading Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$78.6B</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-red-500 font-medium flex items-center">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    -3.2%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">BTC Dominance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">43.7%</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-green-500 font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +0.8%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Fear & Greed Index</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-500">54</div>
                <div className="flex items-center mt-1 text-sm">
                  <span className="text-amber-500 font-medium">Neutral</span>
                  <span className="text-muted-foreground ml-2">Yesterday: 48 (Fear)</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <LivePriceCard
            symbols={[
              'BTCUSDT',
              'ETHUSDT',
              'BNBUSDT',
              'SOLUSDT',
              'ADAUSDT',
              'XRPUSDT',
              'DOGEUSDT',
              'DOTUSDT',
              'MATICUSDT'
            ]}
            title="Top Cryptocurrencies"
            showDetails={true}
            maxItems={10}
          />
          <Card>
            <CardHeader>
              <CardTitle>Market Overview</CardTitle>
              <CardDescription>Detailed market analysis and trends</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">#</th>
                      <th className="text-left py-3 px-2">Name</th>
                      <th className="text-right py-3 px-2">Price</th>
                      <th className="text-right py-3 px-2">24h %</th>
                      <th className="text-right py-3 px-2">Market Cap</th>
                      <th className="text-right py-3 px-2">Volume (24h)</th>
                      <th className="text-right py-3 px-2">Circulating Supply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((crypto, index) => (
                      <tr key={crypto.symbol} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="py-3 px-2">{index + 1}</td>
                        <td className="py-3 px-2 font-medium">
                          {crypto.name} 
                          <span className="text-muted-foreground ml-1">
                            {crypto.symbol}
                          </span>
                        </td>
                        <td className="text-right py-3 px-2">{crypto.price}</td>
                        <td className={`text-right py-3 px-2 ${crypto.positive ? 'text-green-500' : 'text-red-500'}`}>
                          {crypto.change24h}
                        </td>
                        <td className="text-right py-3 px-2">{crypto.marketCap}</td>
                        <td className="text-right py-3 px-2">{crypto.volume24h}</td>
                        <td className="text-right py-3 px-2">{crypto.supply}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bitcoin Price Chart</CardTitle>
              <CardDescription>BTC/USD Price Movement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                {['1D', '1W', '1M', '3M', 'YTD', '1Y', 'All'].map((period) => (
                  <button
                    key={period}
                    className={`px-3 py-1 text-sm rounded-md ${
                      period === '1M' ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
              
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={priceData}>
                    <defs>
                      <linearGradient id="colorValue3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F7931A" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#F7931A"
                      fillOpacity={1}
                      fill="url(#colorValue3)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Trading Volume</CardTitle>
                <CardDescription>24h volume in billions USD</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={volumeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#8884d8" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Market Sentiment</CardTitle>
                <CardDescription>Based on social media analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="font-medium">Positive Mentions</div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '65%' }}></div>
                    </div>
                    <div className="text-sm text-muted-foreground">65% of mentions</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium">Negative Mentions</div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '35%' }}></div>
                    </div>
                    <div className="text-sm text-muted-foreground">35% of mentions</div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Trending Topics</h4>
                  <div className="flex flex-wrap gap-2">
                    {['#Bitcoin', '#ETH2.0', '#DeFi', '#NFTs', '#Regulation', '#BullMarket', '#Metaverse'].map((tag) => (
                      <span key={tag} className="px-3 py-1 bg-secondary rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="correlation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Correlation Matrix</CardTitle>
              <CardDescription>Relationship between different crypto assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted">
                      <th className="p-2 text-left">Asset</th>
                      <th className="p-2 text-center">BTC</th>
                      <th className="p-2 text-center">ETH</th>
                      <th className="p-2 text-center">SOL</th>
                      <th className="p-2 text-center">ADA</th>
                      <th className="p-2 text-center">XRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">BTC</td>
                      <td className="p-2 text-center bg-green-500/20">1.00</td>
                      <td className="p-2 text-center bg-green-500/20">0.82</td>
                      <td className="p-2 text-center bg-green-300/20">0.68</td>
                      <td className="p-2 text-center bg-green-300/20">0.65</td>
                      <td className="p-2 text-center bg-green-100/20">0.54</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">ETH</td>
                      <td className="p-2 text-center bg-green-500/20">0.82</td>
                      <td className="p-2 text-center bg-green-500/20">1.00</td>
                      <td className="p-2 text-center bg-green-500/20">0.79</td>
                      <td className="p-2 text-center bg-green-300/20">0.67</td>
                      <td className="p-2 text-center bg-green-300/20">0.61</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">SOL</td>
                      <td className="p-2 text-center bg-green-300/20">0.68</td>
                      <td className="p-2 text-center bg-green-500/20">0.79</td>
                      <td className="p-2 text-center bg-green-500/20">1.00</td>
                      <td className="p-2 text-center bg-green-500/20">0.73</td>
                      <td className="p-2 text-center bg-green-300/20">0.63</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">ADA</td>
                      <td className="p-2 text-center bg-green-300/20">0.65</td>
                      <td className="p-2 text-center bg-green-300/20">0.67</td>
                      <td className="p-2 text-center bg-green-500/20">0.73</td>
                      <td className="p-2 text-center bg-green-500/20">1.00</td>
                      <td className="p-2 text-center bg-green-500/20">0.74</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-medium">XRP</td>
                      <td className="p-2 text-center bg-green-100/20">0.54</td>
                      <td className="p-2 text-center bg-green-300/20">0.61</td>
                      <td className="p-2 text-center bg-green-300/20">0.63</td>
                      <td className="p-2 text-center bg-green-500/20">0.74</td>
                      <td className="p-2 text-center bg-green-500/20">1.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Correlation Guide</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500/20 rounded"></div>
                      <span>0.7 - 1.0: Strong Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-300/20 rounded"></div>
                      <span>0.5 - 0.7: Moderate Positive</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-100/20 rounded"></div>
                      <span>0.3 - 0.5: Weak Positive</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Key Takeaways</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>BTC and ETH have strong correlation (0.82)</li>
                    <li>SOL shows stronger ties to ETH than BTC</li>
                    <li>XRP has the most independent movement</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Market Sector Correlations</CardTitle>
              <CardDescription>How different crypto sectors move together</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Layer 1 vs DeFi</span>
                    <span className="text-sm">0.76 (Strong)</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '76%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Layer 1 vs NFTs</span>
                    <span className="text-sm">0.58 (Moderate)</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '58%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">DeFi vs NFTs</span>
                    <span className="text-sm">0.64 (Moderate)</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '64%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Crypto vs Stock Market</span>
                    <span className="text-sm">0.39 (Weak)</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '39%' }}></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">Crypto vs Gold</span>
                    <span className="text-sm">0.21 (Very Weak)</span>
                  </div>
                  <div className="w-full bg-secondary h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '21%' }}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MarketAnalysis;
